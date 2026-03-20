/**
 * 서버 로깅 유틸리티
 */
export const LoggerUtils = {
  log(action: string, message: string, data?: any) {
    console.log(`[LOG][${action}] ${message}`, data ? JSON.stringify(data) : "");
  },
  error(action: string, error: any) {
    console.error(`[ERROR][${action}]`, error);
  },
  warn(action: string, message: string) {
    console.warn(`[WARN][${action}] ${message}`);
  }
};
