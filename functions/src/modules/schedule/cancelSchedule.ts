import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";
import { BaseHandler } from "../../shared/baseHandler";
import { AuthUtils } from "../../shared/auth";
import { ValidatorUtils } from "../../shared/validators";
import { ErrorUtils } from "../../shared/errors";
import { FirestoreUtils } from "../../shared/firestore";
import { TimestampUtils } from "../../shared/timestamps";

const CancelScheduleSchema = z.object({
  scheduleId: z.string().trim().min(1),
  reason: z.string().trim().min(5, "취소 사유는 최소 5자 이상 입력해야 합니다.").optional()
});

type CancelScheduleInput = z.infer<typeof CancelScheduleSchema>;

/**
 * 일정 취소 엔진 (보완본)
 */
export class CancelScheduleHandler extends BaseHandler<CancelScheduleInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
    const token = context.auth?.token as any;
    if (token?.role !== "LEADER" && token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
      throw new functions.https.HttpsError("permission-denied", "일정 취소 권한이 없습니다.");
    }
  }

  protected validateInput(data: any): CancelScheduleInput {
    return ValidatorUtils.parseSafe(CancelScheduleSchema, data);
  }

  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: CancelScheduleInput
  ): Promise<{ scheduleData: any }> {
    const snapshot = await transaction.get(FirestoreUtils.schedule(data.scheduleId));
    if (!snapshot.exists) throw ErrorUtils.notFound("존재하지 않는 일정입니다.");
    return { scheduleData: snapshot.data() };
  }

  protected validateTransition(docs: any): void {
    const status = docs.scheduleData.status;
    // SSOT: COMPLETED 상태는 취소 불가
    if (status === "COMPLETED") {
      throw ErrorUtils.invalidState("이미 완료된 일정은 취소할 수 없습니다.");
    }
    if (status === "CANCELLED") {
      throw ErrorUtils.invalidState("이미 취소된 일정입니다.");
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: CancelScheduleInput
  ): Promise<{ success: boolean }> {
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    // 1. 일정 마스터 취소 처리 (SSOT: CANCELLED)
    transaction.update(scheduleRef, {
      status: "CANCELLED",
      cancelReason: data.reason || "관리자(리더)에 의한 취소",
      updatedAt: now
    });

    // 2. 배정된 작업자 중 ASSIGNED, STARTED 상태인 경우만 CANCELLED로 변경
    const workersSnap = await transaction.get(
      FirestoreUtils.db.collection("schedule_workers").where("scheduleId", "==", data.scheduleId)
    );

    workersSnap.docs.forEach(doc => {
      const workerData = doc.data();
      const currentStatus = workerData.workStatus;
      
      // ASSIGNED 또는 STARTED 인 경우만 취소 처리 (ENDED, CLOSED 보존)
      if (currentStatus === "ASSIGNED" || currentStatus === "STARTED") {
        transaction.update(doc.ref, {
          workStatus: "CANCELLED",
          updatedAt: now
        });
      }
    });

    return { success: true };
  }
}

export const cancelSchedule = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new CancelScheduleHandler().execute(data, context);
  });
