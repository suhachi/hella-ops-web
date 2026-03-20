import { UserRole } from "./types";

/**
 * 역할 계층 및 권한 확인 유틸리티
 */
export const RoleUtils = {
  /**
   * 역할별 가중치 (계층 구조)
   */
  weights: {
    "EMPLOYEE": 1,
    "LEADER": 2,
    "ADMIN": 3,
    "SUPER_ADMIN": 4
  } as Record<UserRole, number>,

  /**
   * 최소 요구 역할 충족 여부 확인
   */
  hasMinimumRole(current: UserRole, required: UserRole): boolean {
    return this.weights[current] >= this.weights[required];
  },

  /**
   * 관리자 레벨인지 확인
   */
  isAdmin(role: UserRole): boolean {
    return role === "ADMIN" || role === "SUPER_ADMIN";
  }
};
