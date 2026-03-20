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
 * 1. 입력 스키마 정의 (초정밀 검증)
 */
const CreateScheduleSchema = z.object({
  siteId: z.string().trim().min(1, "현장 ID는 필수입니다."),
  siteName: z.string().trim().min(1, "현장 명칭은 필수입니다."),
  serviceCategory: z.string().trim().min(1, "서비스 카테고리는 필수입니다."),
  workerIds: z.array(z.string()).min(1, "최소 1명 이상의 작업자가 필요합니다."),
  startAt: z.string().datetime({ message: "유효한 ISO8601 일시 형식이 아닙니다." }),
  endAt: z.string().datetime({ message: "유효한 ISO8601 일시 형식이 아닙니다." }),
  notes: z.string().trim().optional()
}).refine((data) => new Date(data.startAt) < new Date(data.endAt), {
  message: "종료 시간은 시작 시간보다 늦어야 합니다.",
  path: ["endAt"]
});

type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

/**
 * 일정 및 작업자 원자적 생성 엔진 (보완본)
 */
export class CreateScheduleWithWorkersHandler extends BaseHandler<CreateScheduleInput, { scheduleId: string }> {
  
  // 2. 인증 가드 (보완: 리더 레벨까지 허용)
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
    const token = context.auth?.token as any;
    // 리더 이상 권한 확인 (shared/roles.ts 연동)
    if (token?.role !== "LEADER" && token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
      throw new functions.https.HttpsError("permission-denied", "일정 생성 권한이 없습니다.");
    }
  }

  // 3. 입력 검증
  protected validateInput(data: any): CreateScheduleInput {
    const validated = ValidatorUtils.parseSafe(CreateScheduleSchema, data);
    // 중복 workerId 제거 로직 강화
    return {
      ...validated,
      workerIds: Array.from(new Set(validated.workerIds))
    };
  }

  // 4. 문서 조회 및 사전 검증 (Zero Trust)
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: CreateScheduleInput
  ): Promise<{ inactiveWorkers: string[] }> {
    const inactiveWorkers: string[] = [];

    for (const workerId of data.workerIds) {
      const userSnap = await transaction.get(FirestoreUtils.user(workerId));
      if (!userSnap.exists || userSnap.data()?.isActive !== true) {
        inactiveWorkers.push(workerId);
      }
    }

    if (inactiveWorkers.length > 0) {
      throw ErrorUtils.invalidInput(`배정 불가(비활성/미존재) 사원이 포함됨: ${inactiveWorkers.join(", ")}`);
    }

    return { inactiveWorkers };
  }

  protected validateTransition(): void {}

  // 6. 트랜잭션 (원자적 처리)
  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    lookupResult: any,
    data: CreateScheduleInput,
    context: functions.https.CallableContext
  ): Promise<{ scheduleId: string }> {
    // 보완: Firestore 표준 ID 생성 전략 사용
    const scheduleRef = FirestoreUtils.db.collection("schedules").doc();
    const scheduleId = scheduleRef.id;

    const now = TimestampUtils.now();

    // 일정 문서 생성 (SSOT: PLANNED)
    transaction.set(scheduleRef, {
      ...data,
      status: "PLANNED", 
      createdAt: now,
      updatedAt: now,
      createdBy: context.auth?.uid
    });

    // 작업자 문서 연쇄 생성 (SSOT: ASSIGNED)
    for (const workerId of data.workerIds) {
      const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${scheduleId}_${workerId}`);
      transaction.set(workerRef, {
        scheduleId,
        workerId,
        workStatus: "ASSIGNED", 
        actualStartAt: null,
        actualEndAt: null,
        createdAt: now,
        updatedAt: now
      });
    }

    return { scheduleId };
  }
}

export const createScheduleWithWorkers = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new CreateScheduleWithWorkersHandler().execute(data, context);
  });
