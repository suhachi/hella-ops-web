import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as z from "zod";
import { BaseHandler } from "../../shared/baseHandler";
import { AuthUtils } from "../../shared/auth";
import { ValidatorUtils } from "../../shared/validators";
import { FirestoreUtils } from "../../shared/firestore";
import { ErrorUtils } from "../../shared/errors";

/**
 * 1. 타입 정의 및 스키마
 */
const EquipmentBriefLogsSchema = z.object({
  equipmentId: z.string().trim().min(1),
  limit: z.number().min(1).max(50).default(10)
});

const UserAuditBriefSchema = z.object({
  targetUserId: z.string().trim().min(1),
  limit: z.number().min(1).max(50).default(10)
});

type EquipmentBriefLogsInput = z.infer<typeof EquipmentBriefLogsSchema>;
type UserAuditBriefInput = z.infer<typeof UserAuditBriefSchema>;

/**
 * 2. 운영 보조 엔진: 장비 이력 요약 리포트
 */
export class GetEquipmentBriefLogsHandler extends BaseHandler<EquipmentBriefLogsInput, { logs: any[] }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): EquipmentBriefLogsInput {
    // ValidatorUtils.parseSafe의 반환 타입을 명시적으로 캐스팅하여 컴파일러 오류 방지
    return ValidatorUtils.parseSafe(EquipmentBriefLogsSchema, data) as unknown as EquipmentBriefLogsInput;
  }

  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: EquipmentBriefLogsInput,
    context: functions.https.CallableContext
  ): Promise<any[]> {
    const actorId = context.auth!.uid;
    const userSnap = await transaction.get(FirestoreUtils.user(actorId));
    const userData = userSnap.data() as any;
    
    // Zero Trust: DB 문서 기반 관리자 판정
    if (!userSnap.exists || userData?.isActive !== true || (userData?.role !== "ADMIN" && userData?.role !== "SUPER_ADMIN")) {
      throw ErrorUtils.forbidden("관리자만 운영 데이터 조회가 가능합니다.");
    }

    // 장비 이력 쿼리 (최신순)
    const logsQuery = FirestoreUtils.equipmentLogs()
      .where("equipmentId", "==", data.equipmentId)
      .orderBy("timestamp", "desc")
      .limit(data.limit);

    const logsSnap = await transaction.get(logsQuery);
    return logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  protected validateTransition(): void {}

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any[],
    data: EquipmentBriefLogsInput,
    context: functions.https.CallableContext
  ): Promise<{ logs: any[] }> {
    return { logs: docs };
  }
}

/**
 * 3. 운영 보조 엔진: 사용자 감사 로그 요약 리포트
 */
export class GetUserAuditBriefHandler extends BaseHandler<UserAuditBriefInput, { auditLogs: any[] }> {
  
  protected checkAuth(context: functions.https.CallableContext): void {
    AuthUtils.requireAuth(context);
  }

  protected validateInput(data: any): UserAuditBriefInput {
    return ValidatorUtils.parseSafe(UserAuditBriefSchema, data) as unknown as UserAuditBriefInput;
  }

  protected async performLookup(
    transaction: admin.firestore.Transaction,
    data: UserAuditBriefInput,
    context: functions.https.CallableContext
  ): Promise<any[]> {
    const actorId = context.auth!.uid;
    const userSnap = await transaction.get(FirestoreUtils.user(actorId));
    const userData = userSnap.data() as any;

    if (!userSnap.exists || userData?.isActive !== true || (userData?.role !== "ADMIN" && userData?.role !== "SUPER_ADMIN")) {
      throw ErrorUtils.forbidden("관리자만 감사 로그 조회가 가능합니다.");
    }

    // 감사 로그 쿼리
    const auditQuery = FirestoreUtils.db.collection("audit_logs")
      .where("actorUserId", "==", data.targetUserId)
      .orderBy("timestamp", "desc")
      .limit(data.limit);

    const auditSnap = await transaction.get(auditQuery);
    return auditSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  protected validateTransition(): void {}

  protected async performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any[],
    data: UserAuditBriefInput,
    context: functions.https.CallableContext
  ): Promise<{ auditLogs: any[] }> {
    return { auditLogs: docs };
  }
}

export const getEquipmentBriefLogs = functions
  .region("asia-northeast3")
  .https.onCall((data, context) => new GetEquipmentBriefLogsHandler().execute(data, context));

export const getUserAuditBrief = functions
  .region("asia-northeast3")
  .https.onCall((data, context) => new GetUserAuditBriefHandler().execute(data, context));
