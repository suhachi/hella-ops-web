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
/**
 * 1. 타입 정의
 */
const SubmitClosingSchema = z.object({
  scheduleId: z.string().trim().min(1),
  beforePhotos: z.array(z.string().url()).min(1, "작업 시작 전 사진은 최소 1장 이상 필수입니다."),
  afterPhotos: z.array(z.string().url()).min(1, "작업 종료 후 사진은 최소 1장 이상 필수입니다."),
  hasUploadError: z.boolean().describe("업로드 중 오류 발생 여부 (HARD BLOCK 대상)"),
  memo: z.string().optional()
});

type SubmitClosingInput = z.infer<typeof SubmitClosingSchema>;

/**
 * 마감 보고 제출 엔진 (2차 보완본)
 * - SSOT: 마감 데이터는 schedule_closings 컬렉션에 별도 관리
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
  ): Promise<{ workerDoc: any; scheduleDoc: any }> {
    const workerId = context.auth!.uid;
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(`${data.scheduleId}_${workerId}`);
    
    const [workerSnap, userSnap, scheduleSnap] = await Promise.all([
      transaction.get(workerRef),
      transaction.get(FirestoreUtils.user(workerId)),
      transaction.get(FirestoreUtils.schedule(data.scheduleId))
    ]);

    if (!workerSnap.exists) throw ErrorUtils.notFound("본인에게 배정된 일정 정보를 찾을 수 없습니다.");
    if (!scheduleSnap.exists) throw ErrorUtils.notFound("상위 일정 정보를 찾을 수 없습니다.");
    
    // 사원 활성 상태 검증
    const userData = userSnap.data() as any;
    if (!userSnap.exists || userData?.isActive !== true) {
      throw ErrorUtils.forbidden("비활성 계정은 마감을 제출할 수 없습니다.");
    }

    return { 
      workerDoc: workerSnap.data(),
      scheduleDoc: scheduleSnap.data()
    };
  }

  protected validateTransition(docs: any): void {
    const workerStatus = docs.workerDoc.workStatus;
    const scheduleStatus = docs.scheduleDoc.status;

    // 1. 작업자 상태 가드 (STARTED, ENDED, REJECTED 인 경우만 제출 가능)
    if (!["STARTED", "ENDED", "REJECTED"].includes(workerStatus)) {
      throw ErrorUtils.invalidState(`마감 제출 가능 상태가 아닙니다. (현재: ${workerStatus})`);
    }

    // 2. 상위 일정 상태 가드 (CANCELLED, COMPLETED 인 경우 제출 차단)
    if (scheduleStatus === "CANCELLED" || scheduleStatus === "COMPLETED") {
      throw ErrorUtils.invalidState(`이미 ${scheduleStatus === "CANCELLED" ? "취소" : "종료"}된 일정에는 마감을 제출할 수 없습니다.`);
    }
  }

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: SubmitClosingInput,
    context: functions.https.CallableContext
  ): Promise<{ success: boolean }> {
    const workerId = context.auth!.uid;
    const scheduleId = data.scheduleId;
    const now = TimestampUtils.now();

    // 1. HARD BLOCK 검증 (업로드 오류 건 존재 시 전적 제출 차단)
    if (data.hasUploadError === true) {
       throw ErrorUtils.invalidInput("사진 업로드 실패 건이 존재하여 마감을 완료할 수 없습니다. (HARD BLOCK)");
    }

    const closingId = `${scheduleId}_${workerId}`;
    const closingRef = FirestoreUtils.db.collection("schedule_closings").doc(closingId);
    const workerRef = FirestoreUtils.db.collection("schedule_workers").doc(closingId);

    // 2. 전용 컬렉션(schedule_closings)에 마감 전문 저장
    transaction.set(closingRef, {
      scheduleId,
      workerId,
      status: "SUBMITTED",
      beforePhotos: data.beforePhotos,
      afterPhotos: data.afterPhotos,
      photoCount: data.beforePhotos.length + data.afterPhotos.length,
      memo: data.memo || "",
      submittedAt: now,
      updatedAt: now
    });

    // 3. 작업자 상태 업데이트 및 링크 연동
    transaction.update(workerRef, {
      workStatus: "SUBMITTED",
      closingId: closingId, // 관계 링크
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
