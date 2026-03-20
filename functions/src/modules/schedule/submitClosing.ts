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
 * 마감 보고 제출 엔진 (4차 최종 보완본)
 * - Zero Trust: 클라이언트 무시, 서버 독립적 schedule_photos 전수 조사로 HARD BLOCK 판정
 */
export class SubmitClosingHandler extends BaseHandler<SubmitClosingInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): SubmitClosingInput {
    return ValidatorUtils.parseSafe(SubmitClosingSchema, data);
  }

  // 4. 문서 조회 및 사진 정밀 수집 (Atomicity 보장)
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: SubmitClosingInput,
    context: functions.https.CallableContext
  ): Promise<{ 
    workerDoc: any; 
    scheduleDoc: any; 
    photoValidation: { 
      hasIncomplete: boolean; 
      beforeCount: number; 
      afterCount: number; 
      hasMissingMeta: boolean 
    } 
  }> {
    const workerId = context.auth!.uid;
    const workerRef = FirestoreUtils.scheduleWorker(`${data.scheduleId}_${workerId}`);
    
    const [workerSnap, userSnap, scheduleSnap, photosSnap] = await Promise.all([
      transaction.get(workerRef),
      transaction.get(FirestoreUtils.user(workerId)),
      transaction.get(FirestoreUtils.schedule(data.scheduleId)),
      // Zero Trust: 서버가 직접 사진 전수 조회 (uploaderId 기준)
      FirestoreUtils.db.collection("schedule_photos")
        .where("scheduleId", "==", data.scheduleId)
        .where("uploaderId", "==", workerId)
        .get()
    ]);

    if (!workerSnap.exists) throw ErrorUtils.notFound("배정 정보를 찾을 수 없습니다.");
    if (!scheduleSnap.exists) throw ErrorUtils.notFound("상위 일정 정보를 찾을 수 없습니다.");
    
    const userData = userSnap.data() as any;
    if (!userSnap.exists || userData?.isActive !== true) {
      throw ErrorUtils.forbidden("비활성 계정은 마감을 제출할 수 없습니다.");
    }

    // 사진 전수 검증 (Zero Trust 판정 데이터 생성)
    let beforeCount = 0;
    let afterCount = 0;
    let hasIncomplete = false;
    let hasMissingMeta = false;

    photosSnap.docs.forEach(doc => {
      const p = doc.data() as any;
      if (p.status !== "SUCCESS") hasIncomplete = true;
      if (!p.storagePath || !p.fileName || !p.fileSize || !p.uploadedAt) hasMissingMeta = true;
      if (p.photoType === "before") beforeCount++;
      if (p.photoType === "after") afterCount++;
    });

    return { 
      workerDoc: workerSnap.data(),
      scheduleDoc: scheduleSnap.data(),
      photoValidation: { hasIncomplete, beforeCount, afterCount, hasMissingMeta }
    };
  }

  // 5. 상태 전이 및 HARD BLOCK 최종 판정
  protected validateTransition(docs: any): void {
    const workerStatus = docs.workerDoc.workStatus;
    const scheduleStatus = docs.scheduleDoc.status;
    const pv = docs.photoValidation;

    // A. 작업자 상태 가드
    if (!["STARTED", "ENDED", "REJECTED"].includes(workerStatus)) {
      throw ErrorUtils.invalidState(`마감 제출 가능 상태가 아닙니다. (현재: ${workerStatus})`);
    }

    // B. 상위 일정 상태 가드
    if (scheduleStatus === "CANCELLED" || scheduleStatus === "COMPLETED") {
      throw ErrorUtils.invalidState(`이미 ${scheduleStatus === "CANCELLED" ? "취소" : "종료"}된 일정에는 마감을 제출할 수 없습니다.`);
    }

    // C. HARD BLOCK (서버 주도 최종 판정)
    if (pv.hasIncomplete) {
      throw ErrorUtils.invalidInput("서버 확인 결과, 아직 완료되지 않은 사진 업로드 건이 존재합니다. (HARD BLOCK)");
    }
    if (pv.hasMissingMeta) {
      throw ErrorUtils.invalidInput("사진 메타데이터(경로, 크기 등)가 누락된 건이 발견되었습니다. (HARD BLOCK)");
    }
    if (pv.beforeCount === 0 || pv.afterCount === 0) {
      throw ErrorUtils.invalidInput(`필수 사진이 누락되었습니다. (시작전: ${pv.beforeCount}, 종료후: ${pv.afterCount})`);
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
    const closingId = `${scheduleId}_${workerId}`;
    
    const closingRef = FirestoreUtils.scheduleClosing(closingId);
    const workerRef = FirestoreUtils.scheduleWorker(closingId);

    // 1. 전용 컬렉션 저장 (서버 시간 및 개수 강제 확정)
    transaction.set(closingRef, {
      scheduleId,
      workerId,
      status: "SUBMITTED",
      beforePhotos: data.beforePhotos,
      afterPhotos: data.afterPhotos,
      photoCount: docs.photoValidation.beforeCount + docs.photoValidation.afterCount,
      memo: data.memo || "",
      submittedAt: now,
      updatedAt: now
    });

    // 2. 작업자 상태 업데이트
    transaction.update(workerRef, {
      workStatus: "SUBMITTED",
      closingId: closingId,
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
