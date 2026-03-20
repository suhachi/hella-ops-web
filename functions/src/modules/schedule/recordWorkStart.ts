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
const RecordWorkStartSchema = z.object({
  scheduleId: z.string().trim().min(1)
});

type RecordWorkStartInput = z.infer<typeof RecordWorkStartSchema>;

/**
 * 업무 개시(출근) 기록 엔진
 */
export class RecordWorkStartHandler extends BaseHandler<RecordWorkStartInput, { success: boolean }> {
  
  // 2. 인증 가드 (로그인 여부 확인)
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  // 3. 입력 검증
  protected validateInput(data: any): RecordWorkStartInput {
    return ValidatorUtils.parseSafe(RecordWorkStartSchema, data);
  }

  // 4. 문서 조회 및 본인/활성 상태 검증
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: RecordWorkStartInput,
    context: functions.https.CallableContext
  ): Promise<{ workerDoc: any; scheduleDoc: any }> {
    const workerId = context.auth!.uid;
    const workerDocId = `${data.scheduleId}_${workerId}`;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(workerDocId);
    
    const [workerSnap, userSnap, scheduleSnap] = await Promise.all([
      transaction.get(workerRef),
      transaction.get(FirestoreUtils.user(workerId)),
      transaction.get(FirestoreUtils.schedule(data.scheduleId))
    ]);

    // 1. 필수 존재 검증 (exists)
    if (!workerSnap.exists) {
      throw ErrorUtils.notFound("본인에게 배정된 일정 정보를 찾을 수 없습니다.");
    }
    if (!scheduleSnap.exists) {
      throw ErrorUtils.notFound("상위 일정 정보가 존재하지 않습니다.");
    }

    // 2. 사원 활성 상태 검증
    const userData = userSnap.data() as any;
    if (!userSnap.exists || userData?.isActive !== true) {
      throw ErrorUtils.forbidden("비활성 계정은 업무를 시작할 수 없습니다.");
    }

    // 3. 상위 일정 상태 가드 (CANCELLED, COMPLETED 차단)
    const scheduleData = scheduleSnap.data();
    if (scheduleData?.status === "CANCELLED" || scheduleData?.status === "COMPLETED") {
      throw ErrorUtils.invalidState(`이미 ${scheduleData.status === "CANCELLED" ? "취소" : "완료"}된 일정입니다. 업무를 시작할 수 없습니다.`);
    }

    return { 
      workerDoc: workerSnap.data(),
      scheduleDoc: scheduleData
    };
  }

  // 5. 상태 전이 검증 (ASSIGNED -> STARTED)
  protected validateTransition(docs: any): void {
    if (docs.workerDoc.workStatus !== "ASSIGNED") {
      throw ErrorUtils.invalidState(`업무 개시 불가 상태입니다. (현재: ${docs.workerDoc.workStatus})`);
    }
  }

  // 6. 트랜잭션 실행
  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: RecordWorkStartInput,
    context: functions.https.CallableContext
  ): Promise<{ success: boolean }> {
    const workerId = context.auth!.uid;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${data.scheduleId}_${workerId}`);
    const scheduleRef = FirestoreUtils.schedule(data.scheduleId);
    const now = TimestampUtils.now();

    // 1. 작업자 상태 업데이트 (SSOT: STARTED)
    transaction.update(workerRef, {
      workStatus: "STARTED",
      actualStartAt: now,
      updatedAt: now
    });

    // 2. 상위 일정 상태 연동 (PLANNED -> IN_PROGRESS)
    if (docs.scheduleDoc.status === "PLANNED") {
      transaction.update(scheduleRef, {
        status: "IN_PROGRESS",
        updatedAt: now
      });
    }

    return { success: true };
  }
}

export const recordWorkStart = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new RecordWorkStartHandler().execute(data, context);
  });
