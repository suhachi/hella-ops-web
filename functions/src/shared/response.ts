/**
 * 표준 응답 형식
 */
export const ResponseUtils = {
  success<T>(data: T, message = "성공적으로 처리되었습니다.") {
    return {
      success: true,
      message,
      data
    };
  },
  fail(message: string, code?: string) {
    return {
      success: false,
      message,
      code: code || "ERROR"
    };
  }
};
