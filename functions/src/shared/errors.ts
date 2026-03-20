import * as functions from "firebase-functions";

/**
 * 표준 오류 정의
 */
export const ErrorUtils = {
  notFound(message = "문서를 찾을 수 없습니다.") {
    return new functions.https.HttpsError("not-found", message);
  },
  invalidState(message = "유효하지 않은 상태 전이 시도입니다.") {
    return new functions.https.HttpsError("failed-precondition", message);
  },
  invalidInput(message = "입력 데이터가 유효하지 않습니다.") {
    return new functions.https.HttpsError("invalid-argument", message);
  },
  forbidden(message = "권한이 없습니다.") {
    return new functions.https.HttpsError("permission-denied", message);
  },
  internal(message = "내부 서버 오류가 발생했습니다.") {
    return new functions.https.HttpsError("internal", message);
  }
};
