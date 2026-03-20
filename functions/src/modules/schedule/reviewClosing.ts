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
 * 마감 보고 검토(승인/반려) 엔진 (2차 보완본)
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

  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: ReviewClosingInput
  ): Promise<{ workerDoc: any; allWorkers: any[] }> {
    const closingId = `${data.scheduleId}_${data.workerId}`;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(closingId);
    const scheduleWorkersRef = FirestoreUtils.db.collection("schedule_workers").where("scheduleId", "==", data.scheduleId);
    
    const [workerSnap, allWorkersSnap] = await Promise.all([
      transaction.get(workerRef),
      transaction.get(scheduleWorkersRef)
    ]);

    if (!workerSnap.exists) throw ErrorUtils.notFound("해당 마감 배정 내역을 찾을 수 없습니다.");
    
    return { 
      workerDoc: workerSnap.data(),
      allWorkers: allWorkersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
  }

  protected validateTransition(docs: any): void {
    if (docs.workerDoc.workStatus !== "SUBMITTED") {
      throw ErrorUtils.invalidState(`검토 가능한 상태가 아닙니다. (현재: ${docs.workerDoc.workStatus})`);
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: ReviewClosingInput
  ): Promise<{ success: boolean }> {
    const closingId = `${data.scheduleId}_${data.workerId}`;
    const closingRef = FirestoreUtils.db.collection("schedule_closings").doc(closingId);
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(closingId);
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    const isApprove = data.action === "APPROVE";
    const targetStatus = isApprove ? "APPROVED" : "REJECTED";
    const targetWorkStatus = isApprove ? "CLOSED" : "REJECTED";

    // 1. 마감 전문 상태 확정 (schedule_closings)
    transaction.update(closingRef, {
      status: targetStatus,
      rejectReason: isApprove ? null : data.reason,
      reviewedAt: now,
      updatedAt: now
    });

    // 2. 작업자 상태 확정 (schedule_workers)
    transaction.update(workerRef, {
      workStatus: targetWorkStatus,
      updatedAt: now
    });

    // 3. 상위 일정 최종 종결 판정 (schedules)
    // 이번 승인 건을 포함하여 모든 작업자가 CLOSED/CANCELLED 인지 확인
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
