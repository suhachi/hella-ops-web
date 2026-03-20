import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

/**
 * 감사 로그 전용 모듈
 */
export const AuditUtils = {
  db: admin.firestore(),

  /**
   * 명시적 감사 로그 기록
   */
  async record(
    context: functions.https.CallableContext,
    action: string,
    status: "SUCCESS" | "FAILURE",
    payload: any,
    error?: string
  ) {
    const logData = {
      actorUserId: context.auth?.uid || "system",
      action,
      status,
      payload,
      error: error || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await this.db.collection("audit_logs").add(logData);
  }
};
