import * as admin from "firebase-admin";

/**
 * 트랜잭션 관련 보조 유틸
 */
export const TransactionUtils = {
  /**
   * 문서 존재 여부 확인 및 데이터 반환 (트랜잭션 내)
   */
  async getOrThrow(
    transaction: admin.firestore.Transaction,
    ref: admin.firestore.DocumentReference,
    message?: string
  ) {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      throw new Error(message || "해당 문서를 찾을 수 없습니다.");
    }
    return snapshot.data()!;
  }
};
