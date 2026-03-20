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
const SubmitClosingSchema = z.object({
  scheduleId: z.string().trim().min(1),
  beforePhotos: z.array(z.string().url()).min(1, "작업 시작 전 사진은 최소 1장 이상 필수입니다."),
  afterPhotos: z.array(z.string().url()).min(1, "작업 종료 후 사진은 최소 1장 이상 필수입니다."),
  memo: z.string().optional()
});

type SubmitClosingInput = z.infer<typeof SubmitClosingSchema>;

/**
 * 마감 보고 제출 엔진
 */
export class SubmitClosingHandler extends BaseHandler<SubmitClosingInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): SubmitClosingInput {
    return ValidatorUtils.parseSafe(SubmitClosingSchema, data);
  }

  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: SubmitClosingInput,
    context: functions.https.CallableContext
  ): Promise<{ workerDoc: any }> {
    const workerId = context.auth!.uid;
    const workerDocId = `${data.scheduleId}_${workerId}`;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(workerDocId);
    
    const [workerSnap, userSnap] = await Promise.all([
      transaction.get(workerRef),
      transaction.get(FirestoreUtils.user(workerId))
    ]);

    if (!workerSnap.exists) throw ErrorUtils.notFound("본인에게 배정된 일정 정보를 찾을 수 없습니다.");
    
    // 사원 활성 상태 검증
    const userData = userSnap.data() as any;
    if (!userSnap.exists || userData?.isActive !== true) {
      throw ErrorUtils.forbidden("비활성 계정은 마감을 제출할 수 없습니다.");
    }

    return { workerDoc: workerSnap.data() };
  }

  // 5. 상태 전이 검증 (STARTED 또는 ENDED 인 경우만 제출 가능)
  protected validateTransition(docs: any): void {
    const status = docs.workerDoc.workStatus;
    if (status !== "STARTED" && status !== "ENDED" && status !== "REJECTED") {
      throw ErrorUtils.invalidState(`마감 제출 가능 상태가 아닙니다. (현재: ${status})`);
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: SubmitClosingInput,
    context: functions.https.CallableContext
  ): Promise<{ success: boolean }> {
    const workerId = context.auth!.uid;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${data.scheduleId}_${workerId}`);
    const now = TimestampUtils.now();

    // 1. HARD BLOCK 검증 (사진 유무 및 무결성 재확인)
    // - UI에서 이미 검증하지만 서버에서 최종 차단
    if (data.beforePhotos.length === 0 || data.afterPhotos.length === 0) {
       throw ErrorUtils.invalidInput("필수 사진이 누락되었습니다. (HARD BLOCK)");
    }

    // 2. 서버 기반 상태 확정
    transaction.update(workerRef, {
      workStatus: "SUBMITTED",
      submittedAt: now,
      beforePhotos: data.beforePhotos,
      afterPhotos: data.afterPhotos,
      photoCount: data.beforePhotos.length + data.afterPhotos.length,
      memo: data.memo || "",
      updatedAt: now
    });

    return { success: true };
  }
}

export const submitClosing = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    return new SubmitClosingHandler().execute(data, context);
  });
