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
  memo: z.string().optional()
});

type SubmitClosingInput = z.infer<typeof SubmitClosingSchema>;

/**
 * 마감 보고 제출 엔진 (5차 최종 완결본)
 * - Zero Trust: 클라이언트 무시, 서버 직접 조회(transaction.get) 데이터로 마감 생성
 * - SSOT: 작업자 상태는 표준(ENDED) 유지, SUBMITTED는 마감 문서에만 기록
 */
export class SubmitClosingHandler extends BaseHandler<SubmitClosingInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): SubmitClosingInput {
    return ValidatorUtils.parseSafe(SubmitClosingSchema, data);
  }

  // 4. 문서 조회 및 트랜잭션 내 사진 전수 수집 (Read Consistency 보장)
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: SubmitClosingInput,
    context: functions.https.CallableContext
  ): Promise<{ 
    workerDoc: any; 
    scheduleDoc: any; 
    photoValidation: { 
      hasIncomplete: boolean; 
      beforePhotos: string[]; 
      afterPhotos: string[]; 
      hasMissingMeta: boolean 
    } 
  }> {
    const workerId = context.auth!.uid;
    const workerRef = FirestoreUtils.scheduleWorker(`${data.scheduleId}_${workerId}`);
    
    // Zero Trust: 서버가 직접 사진 쿼리 (uploaderId 기준)
    const photosQuery = FirestoreUtils.db.collection("schedule_photos")
      .where("scheduleId", "==", data.scheduleId)
      .where("uploaderId", "==", workerId);

    const [workerSnap, userSnap, scheduleSnap, photosSnap] = await Promise.all([
      transaction.get(workerRef),
      transaction.get(FirestoreUtils.user(workerId)),
      transaction.get(FirestoreUtils.schedule(data.scheduleId)),
      transaction.get(photosQuery) // 트랜잭션 내 쿼리 읽기 (5차 보완 핵심)
    ]);

    if (!workerSnap.exists) throw ErrorUtils.notFound("배정 정보를 찾을 수 없습니다.");
    if (!scheduleSnap.exists) throw ErrorUtils.notFound("상위 일정 정보를 찾을 수 없습니다.");
    
    const userData = userSnap.data() as any;
    if (!userSnap.exists || userData?.isActive !== true) {
      throw ErrorUtils.forbidden("비활성 계정은 마감을 제출할 수 없습니다.");
    }

    // 서버 주도 데이터 구성 및 검증
    const beforePhotos: string[] = [];
    const afterPhotos: string[] = [];
    let hasIncomplete = false;
    let hasMissingMeta = false;

    photosSnap.docs.forEach(doc => {
      const p = doc.data() as any;
      // 6차 보완: uploadStatus 필드명 일원화
      if (p.uploadStatus !== "SUCCESS") hasIncomplete = true;
      if (!p.storagePath || !p.fileName || !p.fileSize || !p.uploadedAt) hasMissingMeta = true;
      
      const photoUrl = p.storagePath; // 저장될 경로 데이터
      if (p.photoType === "before") beforePhotos.push(photoUrl);
      if (p.photoType === "after") afterPhotos.push(photoUrl);
    });

    return { 
      workerDoc: workerSnap.data(),
      scheduleDoc: scheduleSnap.data(),
      photoValidation: { hasIncomplete, beforePhotos, afterPhotos, hasMissingMeta }
    };
  }

  // 5. 상태 전이 및 HARD BLOCK 최종 판정
  protected validateTransition(docs: any): void {
    const workerStatus = docs.workerDoc.workStatus;
    const scheduleStatus = docs.scheduleDoc.status;
    const pv = docs.photoValidation;

    // A. 작업자 상태 가드 (6차 보완: ENDED 상태에서만 마감 제출 가능하도록 엄격히 제한)
    if (workerStatus !== "ENDED") {
       throw ErrorUtils.invalidState(`마감 제출은 작업 종료(ENDED) 기록 후 가능합니다. (현재 상태: ${workerStatus})`);
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
    if (pv.beforePhotos.length === 0 || pv.afterPhotos.length === 0) {
      throw ErrorUtils.invalidInput(`필수 사진이 누락되었습니다. (시작전: ${pv.beforePhotos.length}, 종료후: ${pv.afterPhotos.length})`);
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

    // 1. 전용 컬렉션 저장 (서버가 직접 추출한 사진 데이터만 사용)
    transaction.set(closingRef, {
      scheduleId,
      workerId,
      status: "SUBMITTED",
      beforePhotos: docs.photoValidation.beforePhotos,
      afterPhotos: docs.photoValidation.afterPhotos,
      photoCount: docs.photoValidation.beforePhotos.length + docs.photoValidation.afterPhotos.length,
      memo: data.memo || "",
      submittedAt: now,
      updatedAt: now
    });

    // 2. 작업자 상태 정규화 (SSOT: SUBMITTED는 closing에만 존재, worker는 ENDED 유지)
    transaction.update(workerRef, {
      workStatus: "ENDED", // 제출 중에도 ENDED 상태 유지 (또는 CLOSED로 가기 전의 최종 대기)
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
