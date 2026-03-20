import { ErrorUtils } from "./errors";

/**
 * 비즈니스 로직 상태 전이 가드
 */
export const StatusGuardUtils = {
  /**
   * 허용된 이전 상태인지 검증
   */
  requireStatus(current: string, allowed: string[], message?: string) {
    if (!allowed.includes(current)) {
      throw ErrorUtils.invalidState(
        message || `현재 상태(${current})에서는 이 작업을 수행할 수 없습니다.`
      );
    }
  }
};
