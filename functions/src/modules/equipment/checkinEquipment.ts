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
const CheckinEquipmentSchema = z.object({
  nfcTagId: z.string().trim().min(5, "올바른 NFC 태그 ID가 아닙니다."),
  memo: z.string().optional()
});

type CheckinEquipmentInput = z.infer<typeof CheckinEquipmentSchema>;

/**
 * 장비 반납 엔진
 * - NFC 태그를 통한 장비 식별 및 상태 원복 (CHECKED_OUT -> AVAILABLE)
 */
export class CheckinEquipmentHandler extends BaseHandler<CheckinEquipmentInput, { success: boolean }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): CheckinEquipmentInput {
    return ValidatorUtils.parseSafe(CheckinEquipmentSchema, data);
  }

  // 4. 문서 조회 및 존재성 검증
  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: CheckinEquipmentInput,
    context: functions.https.CallableContext
  ): Promise<{ equipmentSnap: admin.firestore.DocumentSnapshot; userSnap: admin.firestore.DocumentSnapshot }> {
    const actorId = context.auth!.uid;
    const mappingRef = FirestoreUtils.nfcMapping(data.nfcTagId);
    
    // 1. 태그 매핑 조회
    const mappingSnap = await transaction.get(mappingRef);
    if (!mappingSnap.exists) {
      throw ErrorUtils.notFound("등록되지 않은 NFC 태그입니다.");
    }

    const { equipmentId } = mappingSnap.data() as any;

    // 2. 장비 정보 조회
    const [equipmentSnap, userSnap] = await Promise.all([
      transaction.get(FirestoreUtils.equipment(equipmentId)),
      transaction.get(FirestoreUtils.user(actorId))
    ]);

    if (!equipmentSnap.exists) throw ErrorUtils.notFound("존재하지 않는 장비입니다.");
    
    return { equipmentSnap, userSnap };
  }

  // 5. 권한 및 상태 전이 검증
  protected validateTransition(docs: any, data: CheckinEquipmentInput, context: functions.https.CallableContext): void {
    const equipment = docs.equipmentSnap.data() as any;
    const actorId = context.auth!.uid;
    const token = context.auth?.token as any;
    const isAdmin = token?.role === "ADMIN" || token?.role === "SUPER_ADMIN";

    // A. 상태 가드
    if (equipment.status !== "CHECKED_OUT") {
      throw ErrorUtils.invalidState("이미 반납되었거나 반출 중이 아닌 장비입니다.");
    }

    // B. 소지자 본인 확인 또는 관리자 대리 반납 가드
    if (equipment.currentHolderUserId !== actorId && !isAdmin) {
      throw ErrorUtils.forbidden("타인이 소지 중인 장비는 반납할 수 없으며, 관리자만 대리 반납이 가능합니다.");
    }
  }

  // 6. 트랜잭션 (상태 복구 및 로그 기록)
  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: CheckinEquipmentInput,
    context: functions.https.CallableContext
  ): Promise<{ success: boolean }> {
    const actorId = context.auth!.uid;
    const userData = docs.userSnap.data() as any;
    const equipmentData = docs.equipmentSnap.data() as any;
    const now = TimestampUtils.now();

    // A. 장비 상태 원복
    transaction.update(docs.equipmentSnap.ref, {
      status: "AVAILABLE",
      currentHolderUserId: null,
      currentHolderName: null,
      lastCheckinAt: now,
      updatedAt: now
    });

    // B. 장비 로그 기록
    const logRef = FirestoreUtils.equipmentLogs().doc();
    transaction.set(logRef, {
      equipmentId: docs.equipmentSnap.id,
      equipmentName: equipmentData.name || "Unknown",
      action: "CHECKIN",
      actorUserId: actorId,
      actorName: userData.displayName || "Unknown",
      timestamp: now,
      memo: data.memo || ""
    });

    return { success: true };
  }
}

export const checkinEquipment = functions
  .region("asia-northeast3")
  .https.onCall((data, context) => new CheckinEquipmentHandler().execute(data, context));
