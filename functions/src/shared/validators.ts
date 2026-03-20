import { z } from "zod";
import { ErrorUtils } from "./errors";

/**
 * Zod 기반 공통 검증 유틸
 */
export const ValidatorUtils = {
  /**
   * 스키마 검증 및 예외 처리
   */
  parseSafe<T>(schema: z.ZodSchema<T>, data: any): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error("[Validation Error]", result.error.format());
      throw ErrorUtils.invalidInput("데이터 형식이 올바르지 않습니다.");
    }
    return result.data;
  }
};
