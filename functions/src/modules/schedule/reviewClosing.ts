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
 * 마감 보고 검토(승인/반려) 엔진
 */
export class ReviewClosingHandler extends BaseHandler<ReviewClosingInput, { success: boolean }> {
  
  // 2. 인증 가드 (관리자만 가능)
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
  ): Promise<{ workerDoc: any }> {
    const workerDocId = `${data.scheduleId}_${data.workerId}`;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(workerDocId);
    const snap = await transaction.get(workerRef);
    if (!snap.exists) throw ErrorUtils.notFound("해당 마감 제출 내역을 찾을 수 없습니다.");
    return { workerDoc: snap.data() };
  }

  // 5. 상태 전이 검증 (SUBMITTED 상태일 때만 검토 가능)
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
    const workerDocId = `${data.scheduleId}_${data.workerId}`;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(workerDocId);
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    if (data.action === "APPROVE") {
      // 1. 승인 시: CLOSED 상태로 확정
      transaction.update(workerRef, {
        workStatus: "CLOSED",
        reviewedAt: now,
        updatedAt: now
      });
      
      // 2. 일정 상태 재확인 (필요 시 COMPLETED 유지)
      // (일반적으로 recordWorkEnd에서 COMPLETED로 변경되지만, 마감 승인이 최종 종결 시그널)
    } else {
      // 3. 반려 시: REJECTED 상태로 변경
      transaction.update(workerRef, {
        workStatus: "REJECTED",
        rejectReason: data.reason,
        reviewedAt: now,
        updatedAt: now
      });
    }

    return { success: true };
  }
}

export const reviewClosing = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new ReviewClosingHandler().execute(data, context);
  });
