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
 * NFC 태그 등록 엔진 (관리자 전용)
 * - 장비와 NFC 태그의 1:1 매핑 생성
 */
export class RegisterNfcTagHandler extends BaseHandler<RegisterNfcTagInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
    const token = context.auth?.token as any;
    if (token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
      throw ErrorUtils.forbidden("관리자만 NFC 태그를 등록할 수 있습니다.");
    }
  }

  protected validateInput(data: any): RegisterNfcTagInput {
    return ValidatorUtils.parseSafe(RegisterNfcTagSchema, data);
  }

  // 4. 조회 및 중복 체크
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: RegisterNfcTagInput
  ): Promise<{ equipmentSnap: admin.firestore.DocumentSnapshot; existingMappingSnap: admin.firestore.DocumentSnapshot }> {
    const mappingRef = FirestoreUtils.nfcMapping(data.nfcTagId);
    const equipmentRef = FirestoreUtils.equipment(data.equipmentId);

    const [existingMappingSnap, equipmentSnap] = await Promise.all([
      transaction.get(mappingRef),
      transaction.get(equipmentRef)
    ]);

    if (!equipmentSnap.exists) throw ErrorUtils.notFound("등록하려는 장비가 존재하지 않습니다.");
    
    return { equipmentSnap, existingMappingSnap };
  }

  // 5. 검증 (중복 등록 등)
  protected validateTransition(docs: { existingMappingSnap: admin.firestore.DocumentSnapshot }): void {
    if (docs.existingMappingSnap.exists) {
      throw ErrorUtils.invalidInput("이미 다른 장비에 등록된 NFC 태그입니다.");
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

    transaction.set(mappingRef, {
      nfcTagId: data.nfcTagId,
      equipmentId: data.equipmentId,
      equipmentName: docs.equipmentSnap.data()?.name || "Unknown",
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
