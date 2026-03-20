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
const UpdateScheduleSchema = z.object({
  scheduleId: z.string(),
  updates: z.object({
    siteName: z.string().optional(),
    workerIds: z.array(z.string()).optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
    notes: z.string().optional()
  })
});

type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;

/**
 * 일정 및 작업자 목록 수정 엔진 (차집합 처리)
 */
export class UpdateScheduleAndWorkersHandler extends BaseHandler<UpdateScheduleInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAdmin(context);
  }

  protected validateInput(data: any): UpdateScheduleInput {
    return ValidatorUtils.parseSafe(UpdateScheduleSchema, data);
  }

  // 4. 문서 조회 및 차집합 계산
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

    const currentWorkerIds = (scheduleData?.workerIds || []) as string[];

    if (data.updates.workerIds) {
      const currentWorkersSet = new Set(currentWorkerIds);
      const newWorkersSet = new Set(data.updates.workerIds);

      toAdd = data.updates.workerIds.filter(id => !currentWorkersSet.has(id));
      toRemove = currentWorkerIds.filter(id => !newWorkersSet.has(id));

      // 신규 사원 활성 상태 검증
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
    if (docs.scheduleData.status === "COMPLETED" || docs.scheduleData.status === "CANCELLED") {
      throw ErrorUtils.invalidState("종료되었거나 취소된 일정은 수정할 수 없습니다.");
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    lookupResult: any,
    data: UpdateScheduleInput
  ): Promise<{ success: boolean }> {
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    // 1. 일정 정보 업데이트
    transaction.update(scheduleRef, {
      ...data.updates,
      updatedAt: now
    });

    // 2. 신규 사원 추가 (schedule_workers 생성)
    for (const workerId of lookupResult.toAdd) {
      const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${data.scheduleId}_${workerId}`);
      transaction.set(workerRef, {
        scheduleId: data.scheduleId,
        workerId,
        workStatus: "PENDING",
        createdAt: now,
        updatedAt: now
      });
    }

    // 3. 제외된 사원 삭제 (물리 삭제 또는 CANCELLED 처리 선택 가능 - 여기서는 물리적 일관성을 위해 삭제 또는 상태변경)
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
