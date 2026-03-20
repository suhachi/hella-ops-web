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
 * 1. 타입 정의 (Zod Schema)
 */
const CreateScheduleSchema = z.object({
  siteId: z.string(),
  siteName: z.string(),
  serviceCategory: z.string(),
  workerIds: z.array(z.string()),
  startAt: z.string(), // ISO String
  endAt: z.string(),   // ISO String
  notes: z.string().optional()
});

type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

/**
 * 일정 및 작업자 원자적 생성 엔진
 */
export class CreateScheduleWithWorkersHandler extends BaseHandler<CreateScheduleInput, { scheduleId: string }> {
  
  // 2. 인증 가드
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAdmin(context); // 관리자만 일정 생성 가능
  }

  // 3. 입력 검증
  protected validateInput(data: any): CreateScheduleInput {
    return ValidatorUtils.parseSafe(CreateScheduleSchema, data);
  }

  // 4. 문서 조회 및 사전 검증
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: CreateScheduleInput
  ): Promise<{ inactiveWorkers: string[] }> {
    const inactiveWorkers: string[] = [];

    // 배정된 모든 사원이 활성 상태인지 확인
    for (const workerId of data.workerIds) {
      const userRef = FirestoreUtils.user(workerId);
      const userSnap = await transaction.get(userRef);
      
      if (!userSnap.exists || userSnap.data()?.isActive !== true) {
        inactiveWorkers.push(workerId);
      }
    }

    if (inactiveWorkers.length > 0) {
      throw ErrorUtils.invalidInput(`비활성 또는 존재하지 않는 사원이 포함되어 있습니다: ${inactiveWorkers.join(", ")}`);
    }

    return { inactiveWorkers };
  }

  // 5. 상태 전이 검증 (신규 생성이므로 통과)
  protected validateTransition(): void {}

  // 6. 트랜잭션 (데이터 변경 실행)
  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    lookupResult: any,
    data: CreateScheduleInput,
    context: functions.https.CallableContext
  ): Promise<{ scheduleId: string }> {
    const scheduleId = `SCH_${Date.now()}`; // 간단한 ID 생성 (IdUtils 사용 권장)
    const scheduleRef = FirestoreUtils.db.collection("schedules").doc(scheduleId);

    const now = TimestampUtils.now();

    // 일정 문서 생성
    transaction.set(scheduleRef, {
      ...data,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
      createdBy: context.auth?.uid
    });

    // 작업자 문서 연쇄 생성
    for (const workerId of data.workerIds) {
      const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${scheduleId}_${workerId}`);
      transaction.set(workerRef, {
        scheduleId,
        workerId,
        workStatus: "PENDING",
        actualStartAt: null,
        actualEndAt: null,
        createdAt: now,
        updatedAt: now
      });
    }

    return { scheduleId };
  }
}

// Cloud Function Export
export const createScheduleWithWorkers = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new CreateScheduleWithWorkersHandler().execute(data, context);
  });
