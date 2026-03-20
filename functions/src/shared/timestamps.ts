import * as admin from "firebase-admin";

/**
 * 서버 타임스탬프 유틸리티
 */
export const TimestampUtils = {
  now() {
    return admin.firestore.FieldValue.serverTimestamp();
  },
  toDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    return timestamp.toDate();
  }
};
