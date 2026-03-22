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
const CheckoutEquipmentSchema = z.object({
  nfcTagId: z.string().trim().min(5, "올바른 NFC 태그 ID가 아닙니다."),
  memo: z.string().optional()
});

type CheckoutEquipmentInput = z.infer<typeof CheckoutEquipmentSchema>;

/**
 * 장비 반출(대출) 엔진
 * - NFC 태그를 통한 장비 식별 및 상태 전이 (AVAILABLE -> CHECKED_OUT)
 */
export class CheckoutEquipmentHandler extends BaseHandler<CheckoutEquipmentInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): CheckoutEquipmentInput {
    return ValidatorUtils.parseSafe(CheckoutEquipmentSchema, data);
  }

  // 4. 문서 조회 및 존재성 검증 (Transaction 내)
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: CheckoutEquipmentInput,
    context: functions.https.CallableContext
  ): Promise<{ equipmentSnap: admin.firestore.DocumentSnapshot; userSnap: admin.firestore.DocumentSnapshot; mappingSnap: admin.firestore.DocumentSnapshot }> {
    const actorId = context.auth!.uid;
    const mappingRef = FirestoreUtils.nfcMapping(data.nfcTagId);
    
    // 1. 태그 매핑 조회
    const mappingSnap = await transaction.get(mappingRef);
    if (!mappingSnap.exists) {
      throw ErrorUtils.notFound("등록되지 않은 NFC 태그입니다.");
    }

    const { equipmentId } = mappingSnap.data() as any;
    if (!equipmentId) {
      throw ErrorUtils.invalidState("태그에 연결된 장비 정보가 없습니다.");
    }

    // 2. 장비 및 대출자(본인) 정보 조회
    const [equipmentSnap, userSnap] = await Promise.all([
      transaction.get(FirestoreUtils.equipment(equipmentId)),
      transaction.get(FirestoreUtils.user(actorId))
    ]);

    if (!equipmentSnap.exists) throw ErrorUtils.notFound("존재하지 않는 장비입니다.");
    
    // 비활성 사용자 체크
    const userData = userSnap.data() as any;
    if (!userSnap.exists || userData?.isActive !== true) {
      throw ErrorUtils.forbidden("비활성 계정은 장비를 반출할 수 없습니다.");
    }

    return { mappingSnap, equipmentSnap, userSnap };
  }

  // 5. 상태 전이 검증 (AVAILABLE 여부 등)
  protected validateTransition(docs: { equipmentSnap: admin.firestore.DocumentSnapshot }): void {
    const equipment = docs.equipmentSnap.data() as any;
    
    // Zero Trust: 서버가 최종 상태를 검증
    if (equipment.status !== "AVAILABLE") {
      throw ErrorUtils.invalidState(`이 장비는 현재 반출 가능한 상태가 아닙니다. (현재: ${equipment.status})`);
    }
  }

  // 6. 트랜잭션 (상태 변경 및 로그 기록 원자적 처리)
  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: CheckoutEquipmentInput,
    context: functions.https.CallableContext
  ): Promise<{ success: boolean }> {
    const actorId = context.auth!.uid;
    const userData = docs.userSnap.data() as any;
    const equipmentId = docs.equipmentSnap.id;
    const equipmentData = docs.equipmentSnap.data() as any;
    const now = TimestampUtils.now();

    // A. 장비 상태 변경
    transaction.update(docs.equipmentSnap.ref, {
      status: "CHECKED_OUT",
      currentHolderUserId: actorId,
      currentHolderName: userData.displayName || "사원",
      lastCheckoutAt: now,
      updatedAt: now
    });

    // B. 장비 로그 기록 (Append-only)
    const logRef = FirestoreUtils.equipmentLogs().doc();
    transaction.set(logRef, {
      equipmentId,
      equipmentName: equipmentData.name || "Unknown",
      action: "CHECKOUT",
      actorUserId: actorId,
      actorName: userData.displayName || "Unknown",
      timestamp: now,
      memo: data.memo || ""
    });

    return { success: true };
  }
}

export const checkoutEquipment = functions
  .region("asia-northeast3")
  .https.onCall((data, context) => new CheckoutEquipmentHandler().execute(data, context));
