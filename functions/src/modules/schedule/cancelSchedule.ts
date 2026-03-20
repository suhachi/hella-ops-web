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
  scheduleId: z.string(),
  reason: z.string().optional()
});

type CancelScheduleInput = z.infer<typeof CancelScheduleSchema>;

/**
 * 일정 취소 엔진 (동시 상태 보호)
 */
export class CancelScheduleHandler extends BaseHandler<CancelScheduleInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAdmin(context);
  }

  protected validateInput(data: any): CancelScheduleInput {
    return ValidatorUtils.parseSafe(CancelScheduleSchema, data);
  }

  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: CancelScheduleInput
  ): Promise<{ scheduleData: any }> {
    const snapshot = await transaction.get(FirestoreUtils.schedule(data.scheduleId));
    if (!snapshot.exists) throw ErrorUtils.notFound();
    return { scheduleData: snapshot.data() };
  }

  protected validateTransition(docs: any): void {
    if (docs.scheduleData.status === "COMPLETED") {
      throw ErrorUtils.invalidState("이미 완료된 일정은 취소할 수 없습니다.");
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: CancelScheduleInput
  ): Promise<{ success: boolean }> {
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    // 1. 일정 상태 변경
    transaction.update(scheduleRef, {
      status: "CANCELLED",
      cancelReason: data.reason || "관리자 취소",
      updatedAt: now
    });

    // 2. 배정된 모든 작업자 상태를 CANCELLED로 변경
    const workersSnap = await transaction.get(
      FirestoreUtils.db.collection("schedule_workers").where("scheduleId", "==", data.scheduleId)
    );

    workersSnap.docs.forEach(doc => {
      transaction.update(doc.ref, {
        workStatus: "CANCELLED",
        updatedAt: now
      });
    });

    return { success: true };
  }
}

export const cancelSchedule = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new CancelScheduleHandler().execute(data, context);
  });
