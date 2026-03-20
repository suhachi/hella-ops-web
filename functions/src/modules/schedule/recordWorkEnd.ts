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
const RecordWorkEndSchema = z.object({
  scheduleId: z.string().trim().min(1)
});

type RecordWorkEndInput = z.infer<typeof RecordWorkEndSchema>;

/**
 * 업무 종료(퇴근) 기록 엔진
 */
export class RecordWorkEndHandler extends BaseHandler<RecordWorkEndInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): RecordWorkEndInput {
    return ValidatorUtils.parseSafe(RecordWorkEndSchema, data);
  }

  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: RecordWorkEndInput,
    context: functions.https.CallableContext
  ): Promise<{ workerDoc: any; allWorkers: any[] }> {
    const workerId = context.auth!.uid;
    const workerDocId = `${data.scheduleId}_${workerId}`;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(workerDocId);
    
    const [workerSnap, allWorkersSnap, scheduleSnap] = await Promise.all([
      transaction.get(workerRef),
      transaction.get(FirestoreUtils.db.collection("schedule_workers").where("scheduleId", "==", data.scheduleId)),
      transaction.get(FirestoreUtils.schedule(data.scheduleId))
    ]);

    if (!workerSnap.exists) throw ErrorUtils.notFound("배정 정보를 찾을 수 없습니다.");
    if (!scheduleSnap.exists) throw ErrorUtils.notFound("일정 정보를 찾을 수 없습니다.");

    const scheduleData = scheduleSnap.data();
    if (scheduleData?.status === "CANCELLED") {
      throw ErrorUtils.invalidState("이미 취소된 일정은 종료 처리를 할 수 없습니다.");
    }

    return { 
      workerDoc: workerSnap.data(),
      allWorkers: allWorkersSnap.docs.map(d => ({ 
        workerId: (d.data() as any).workerId, 
        workStatus: (d.data() as any).workStatus 
      }))
    };
  }

  // 5. 상태 전이 검증 (STARTED -> ENDED)
  protected validateTransition(docs: any): void {
    if (docs.workerDoc.workStatus !== "STARTED") {
      throw ErrorUtils.invalidState(`업무 종료 불가 상태입니다. (현재: ${docs.workerDoc.workStatus})`);
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: RecordWorkEndInput,
    context: functions.https.CallableContext
  ): Promise<{ success: boolean }> {
    const workerId = context.auth!.uid;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${data.scheduleId}_${workerId}`);
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    // 1. 작업자 상태 업데이트 (SSOT: ENDED)
    transaction.update(workerRef, {
      workStatus: "ENDED",
      actualEndAt: now,
      updatedAt: now
    });

    // 2. 상위 일정 상태 연동 (모든 작업자 퇴근 시 COMPLETED)
    const otherWorkersEndStatus = (docs.allWorkers || [])
      .filter((w: any) => w.workerId !== workerId)
      .every((w: any) => w.workStatus === "ENDED" || w.workStatus === "CANCELLED");

    if (otherWorkersEndStatus) {
      transaction.update(scheduleRef, {
        status: "COMPLETED",
        updatedAt: now
      });
    }

    return { success: true };
  }
}

export const recordWorkEnd = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new RecordWorkEndHandler().execute(data, context);
  });
