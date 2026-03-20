/**
 * 데이터 필드 마스킹 및 보안 필터 유틸리티
 */
export const FieldMaskUtils = {
  /**
   * 허용된 필드만 남기고 제거 (Whitelist)
   */
  pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as any;
    keys.forEach(key => {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  },

  /**
   * 금지된 필드만 제거 (Blacklist)
   */
  omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj } as any;
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  }
};
