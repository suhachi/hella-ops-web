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
 * 1. 타입 정의 및 초정밀 검증
 */
const UpdateScheduleSchema = z.object({
  scheduleId: z.string().trim().min(1),
  updates: z.object({
    siteName: z.string().trim().min(1).optional(),
    workerIds: z.array(z.string()).min(1).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    notes: z.string().trim().optional()
  })
}).refine((data) => {
  if (data.updates.startAt && data.updates.endAt) {
    return new Date(data.updates.startAt) < new Date(data.updates.endAt);
  }
  return true;
}, {
  message: "종료 시간은 시작 시간보다 늦어야 합니다.",
  path: ["updates", "endAt"]
});

type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;

/**
 * 일정 및 작업자 목록 수정 엔진 (차집합 처리 보완)
 */
export class UpdateScheduleAndWorkersHandler extends BaseHandler<UpdateScheduleInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
    const token = context.auth?.token as any;
    if (token?.role !== "LEADER" && token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
      throw new functions.https.HttpsError("permission-denied", "일정 수정 권한이 없습니다.");
    }
  }

  protected validateInput(data: any): UpdateScheduleInput {
    const validated = ValidatorUtils.parseSafe(UpdateScheduleSchema, data);
    if (validated.updates.workerIds) {
      validated.updates.workerIds = Array.from(new Set(validated.updates.workerIds));
    }
    return validated;
  }

  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: UpdateScheduleInput
  ): Promise<{ scheduleData: any; toAdd: string[]; toRemove: string[] }> {
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const scheduleSnap = await transaction.get(scheduleRef);
    
    if (!scheduleSnap.exists) throw ErrorUtils.notFound("일정을 찾을 수 없습니다.");
    const scheduleData = scheduleSnap.data();

    let toAdd: string[] = [];
    let toRemove: string[] = [];

    if (data.updates.workerIds) {
      const currentWorkerIds = Array.isArray(scheduleData!.workerIds) ? (scheduleData!.workerIds as string[]) : [];
      const newWorkerIds = data.updates.workerIds;

      const currentSet = new Set(currentWorkerIds);
      const newSet = new Set(newWorkerIds);

      toAdd = newWorkerIds.filter(id => !currentSet.has(id));
      toRemove = currentWorkerIds.filter(id => !newSet.has(id));

      for (const id of toAdd) {
        const userSnap = await transaction.get(FirestoreUtils.user(id));
        if (!userSnap.exists || userSnap.data()?.isActive !== true) {
          throw ErrorUtils.invalidInput(`신규 배정 사원이 비활성 상태입니다: ${id}`);
        }
      }
    }

    return { scheduleData, toAdd, toRemove };
  }

  protected validateTransition(docs: any): void {
    // SSOT: 종료되거나 취소된 일정 수정 금지
    const status = docs.scheduleData.status;
    if (status === "COMPLETED" || status === "CANCELLED") {
      throw ErrorUtils.invalidState(`현재 상태(${status})에서는 일정을 수정할 수 없습니다.`);
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    lookupResult: any,
    data: UpdateScheduleInput
  ): Promise<{ success: boolean }> {
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    // 1. 일정 마스터 업데이트
    transaction.update(scheduleRef, {
      ...data.updates,
      updatedAt: now
    });

    // 2. 신규 배정 (ASSIGNED)
    for (const workerId of lookupResult.toAdd) {
      const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${data.scheduleId}_${workerId}`);
      transaction.set(workerRef, {
        scheduleId: data.scheduleId,
        workerId,
        workStatus: "ASSIGNED", 
        createdAt: now,
        updatedAt: now
      });
    }

    // 3. 배정 제외 (물리 삭제로 동기화 유지)
    for (const workerId of lookupResult.toRemove) {
      const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${data.scheduleId}_${workerId}`);
      transaction.delete(workerRef);
    }

    return { success: true };
  }
}

export const updateScheduleAndWorkers = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new UpdateScheduleAndWorkersHandler().execute(data, context);
  });
