import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as z from "zod";
import { BaseHandler } from "../../shared/baseHandler";
import { AuthUtils } from "../../shared/auth";
import { ValidatorUtils } from "../../shared/validator";
import { FirestoreUtils } from "../../shared/firestore";
import { ErrorUtils } from "../../shared/errors";
import { TimestampUtils } from "../../shared/timestamps";

/**
 * 1. 타입 정의
 */
const RegisterNfcTagSchema = z.object({
  nfcTagId: z.string().trim().min(5, "NFC 태그 ID가 너무 짧습니다."),
  equipmentId: z.string().trim().min(1, "장비 ID가 필요합니다."),
  memo: z.string().optional()
});

type RegisterNfcTagInput = z.infer<typeof RegisterNfcTagSchema>;

/**
 * NFC 태그 등록 엔진 (F4 2차 보완)
 * - Zero Trust: Firestore users 문서 기반 role/isActive 관리자 전용 가드
 * - 핵심검증: nfcTagId 중복 차단 + 연결 장비 존재 확인
 */
export class RegisterNfcTagHandler extends BaseHandler<RegisterNfcTagInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): RegisterNfcTagInput {
    return ValidatorUtils.parseSafe(RegisterNfcTagSchema, data);
  }

  // 4. 조회 및 핵심 검증 (Zero Trust 기반)
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: RegisterNfcTagInput,
    context: functions.https.CallableContext
  ): Promise<{ equipmentSnap: admin.firestore.DocumentSnapshot; userSnap: admin.firestore.DocumentSnapshot; existingMappingSnap: admin.firestore.DocumentSnapshot }> {
    const actorId = context.auth!.uid;
    const mappingRef = FirestoreUtils.nfcMapping(data.nfcTagId);
    const equipmentRef = FirestoreUtils.equipment(data.equipmentId);
    const userRef = FirestoreUtils.user(actorId);

    // 1. 매핑, 장비, 관리자 정보 동시 조회
    const [existingMappingSnap, equipmentSnap, userSnap] = await Promise.all([
      transaction.get(mappingRef),
      transaction.get(equipmentRef),
      transaction.get(userRef)
    ]);

    // A. 관리자 권한 및 활성 계정 검증 (Zero Trust)
    const userData = userSnap.data() as any;
    const isAdmin = userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN";
    if (!userSnap.exists || userData?.isActive !== true || !isAdmin) {
      throw ErrorUtils.forbidden("관리자만 NFC 태그를 등록할 수 있습니다.");
    }

    // B. 연결 대상 장비 존재 여부 검증 (핵심 검증 4-4)
    if (!equipmentSnap.exists) {
      throw ErrorUtils.notFound("등록하려는 장비가 존재하지 않습니다. (존재하지 않는 장비 연결 차단)");
    }
    
    return { equipmentSnap, userSnap, existingMappingSnap };
  }

  // 5. 중복 등록 가드
  protected validateTransition(docs: { existingMappingSnap: admin.firestore.DocumentSnapshot }): void {
    // 핵심 검증 4-2, 4-3: 태그 중복 및 재등록 차단
    if (docs.existingMappingSnap.exists) {
      throw ErrorUtils.invalidInput("이미 다른 장비에 등록되었거나 중복된 NFC 태그입니다.");
    }
  }

  // 6. 트랜잭션 (매핑 생성)
  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: RegisterNfcTagInput,
    context: functions.https.CallableContext
  ): Promise<{ success: boolean }> {
    const actorId = context.auth!.uid;
    const now = TimestampUtils.now();
    const mappingRef = FirestoreUtils.nfcMapping(data.nfcTagId);
    const equipmentData = docs.equipmentSnap.data() as any;

    transaction.set(mappingRef, {
      nfcTagId: data.nfcTagId,
      equipmentId: data.equipmentId,
      equipmentName: equipmentData.name || "Unknown",
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      memo: data.memo || ""
    });

    return { success: true };
  }
}

export const registerNfcTag = functions
  .region("asia-northeast3")
  .https.onCall((data, context) => new RegisterNfcTagHandler().execute(data, context));
