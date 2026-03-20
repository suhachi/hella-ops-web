import * as functions from "firebase-functions";

/**
 * 인증 관련 공통 유틸리티
 */
export const AuthUtils = {
  /**
   * 로그인 여부 확인
   */
  requireAuth(context: functions.https.CallableContext) {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "인증되지 않은 요청입니다."
      );
    }
  },

  /**
   * 최소 관리자 권한 확인
   */
  requireAdmin(context: functions.https.CallableContext) {
    this.requireAuth(context);
    const token = context.auth?.token;
    if (token?.role !== "ADMIN" && token?.role !== "SUPER_ADMIN") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "관리자 권한이 필요합니다."
      );
    }
  }
};
