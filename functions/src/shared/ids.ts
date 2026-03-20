import { v4 as uuidv4 } from "uuid";

/**
 * ID 및 고유 식별자 유틸리티
 */
export const IdUtils = {
  /**
   * UUID 생성
   */
  generateUuid(): string {
    return uuidv4();
  },

  /**
   * 특정 접두사를 가진 ID 생성 (예: SCH_xxx)
   */
  generatePrefixedId(prefix: string): string {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}_${randomPart}`;
  }
};
