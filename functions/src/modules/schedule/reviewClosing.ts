import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";
import { BaseHandler } from "../../shared/baseHandler";
import { AuthUtils } from "../../shared/auth";
import { ValidatorUtils } from "../../shared/validators";
import { ErrorUtils } from "../../shared/errors";
import { FirestoreUtils } from "../../shared/firestore";
import { TimestampUtils } from "../../shared/timestamps";

/**
 * 1. 타입 정의
 */
const ReviewClosingSchema = z.object({
  scheduleId: z.string().trim().min(1),
  workerId: z.string().trim().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional()
});

type ReviewClosingInput = z.infer<typeof ReviewClosingSchema>;

/**
 * 마감 보고 검토(승인/반려) 엔진 (4차 최종 보완본)
 * - Zero Trust: 모든 문서의 존재 여부(exists)를 명시적으로 가드
 */
export class ReviewClosingHandler extends BaseHandler<ReviewClosingInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
    const token = context.auth?.token as any;
    if (token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
      throw ErrorUtils.forbidden("관리자만 마감을 검토할 수 있습니다.");
    }
  }

  protected validateInput(data: any): ReviewClosingInput {
    const result = ValidatorUtils.parseSafe(ReviewClosingSchema, data);
    if (result.action === "REJECT" && (!result.reason || result.reason.length < 5)) {
      throw ErrorUtils.invalidInput("반려 시에는 5자 이상의 사유를 입력해야 합니다.");
    }
    return result;
  }

  // 4. 문서 조회 및 존재성 전수 검증
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: ReviewClosingInput
  ): Promise<{ workerDoc: any; allWorkers: any[]; closingDoc: any; scheduleDoc: any }> {
    const closingId = `${data.scheduleId}_${data.workerId}`;
    const workerRef = FirestoreUtils.scheduleWorker(closingId);
    const closingRef = FirestoreUtils.scheduleClosing(closingId);
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const scheduleWorkersRef = FirestoreUtils.db.collection("schedule_workers").where("scheduleId", "==", data.scheduleId);
    
    const [workerSnap, closingSnap, scheduleSnap, allWorkersSnap] = await Promise.all([
      transaction.get(workerRef),
      transaction.get(closingRef),
      transaction.get(scheduleRef),
      transaction.get(scheduleWorkersRef)
    ]);

    // Zero Trust: 명시적 존재 가드 (4차 보완 핵심)
    if (!closingSnap.exists) throw ErrorUtils.notFound("해당 마감 제출 문서를 찾을 수 없습니다.");
    if (!workerSnap.exists) throw ErrorUtils.notFound("관련 배정 내역을 찾을 수 없습니다.");
    if (!scheduleSnap.exists) throw ErrorUtils.notFound("상위 일정 정보를 찾을 수 없습니다.");
    
    return { 
      workerDoc: workerSnap.data(),
      closingDoc: closingSnap.data(),
      scheduleDoc: scheduleSnap.data(),
      allWorkers: allWorkersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  }

  // 5. 상태 전이 고차 검증
  protected validateTransition(docs: any): void {
    const closingStatus = docs.closingDoc.status;

    // A. 중복 처리 차단 가드
    if (closingStatus === "APPROVED" || closingStatus === "REJECTED") {
      throw ErrorUtils.invalidState(`이미 검토가 완료된 마감 건입니다. (현재: ${closingStatus})`);
    }

    // B. 마감 문서 상태 기반 판정 (5차 보완: 작업자 상태가 아닌 마감 상태 체크)
    if (closingStatus !== "SUBMITTED") {
      throw ErrorUtils.invalidState(`검토 가능한 제출 상태가 아닙니다. (현재 마감상태: ${closingStatus})`);
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: ReviewClosingInput
  ): Promise<{ success: boolean }> {
    const closingId = `${data.scheduleId}_${data.workerId}`;
    const closingRef = FirestoreUtils.scheduleClosing(closingId);
    const workerRef = FirestoreUtils.scheduleWorker(closingId);
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    const isApprove = data.action === "APPROVE";
    const targetClosingStatus = isApprove ? "APPROVED" : "REJECTED";
    // 5차 보완: 작업자 상태는 승인 시에만 CLOSED로, 반려 시에는 ENDED(수정 가능) 유지
    const targetWorkerStatus = isApprove ? "CLOSED" : "ENDED";

    // 1. 마감 전문 상태 및 검토 정보 서버 확정
    transaction.update(closingRef, {
      status: targetClosingStatus,
      rejectReason: isApprove ? null : data.reason,
      reviewedAt: now,
      updatedAt: now
    });

    // 2. 작업자 상태 확정 (SSOT 표준 준수)
    transaction.update(workerRef, {
      workStatus: targetWorkerStatus,
      updatedAt: now
    });

    // 3. 상위 일정 최종 종결 판정 (schedules)
    if (isApprove) {
      const remainingOthers = docs.allWorkers.filter((w: any) => w.id !== closingId);
      const allDone = remainingOthers.every((w: any) => 
        w.workStatus === "CLOSED" || w.workStatus === "CANCELLED"
      );

      if (allDone) {
        transaction.update(scheduleRef, {
          status: "COMPLETED",
          completedAt: now,
          updatedAt: now
        });
      }
    }

    return { success: true };
  }
}

export const reviewClosing = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new ReviewClosingHandler().execute(data, context);
  });
