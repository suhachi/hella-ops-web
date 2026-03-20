import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { ZodSchema } from "zod";

/**
 * AGENTS.md에서 규정한 8단계 함수 구현 템플릿을 강제하기 위한 추상 클래스
 * [타입정의 → 인증가드 → 입력검증 → 문서조회 → 상태전이검증 → 트랜잭션 → 로그생성 → 에뮬레이터 테스트]
 */
export abstract class BaseHandler<TInput, TOutput> {
  protected db = admin.firestore();

  /**
   * 8단계를 순차적으로 실행하는 실행기
   */
  async execute(
    data: any,
    context: functions.https.CallableContext
  ): Promise<TOutput> {
    try {
      // 1. 타입정의 및 3. 입력검증 (Zod Schema 활용)
      const validatedData = this.validateInput(data);

      // 2. 인증가드
      this.checkAuth(context);

      // 4. 문서조회 & 5. 상태전이검증 & 6. 트랜잭션 (도메인 로직 내 통합)
      const result = await this.db.runTransaction(async (transaction) => {
        // 4. 문서조회
        const docs = await this.performLookup(transaction, validatedData, context);

        // 5. 상태전이검증
        this.validateTransition(docs, validatedData);

        // 6. 실제 트랜잭션 수행 (데이터 변경)
        const output = await this.performTransaction(transaction, docs, validatedData, context);

        // 7. 로그 생성 준비 (로그는 트랜잭션 성공 후 확정적으로 남기는 것을 지향하거나 트랜잭션 내부에서 병행)
        await this.createAuditLog(transaction, "SUCCESS", validatedData, context);

        return output;
      });

      return result;
    } catch (error: any) {
      console.error(`[BaseHandler Error] ${error.message}`);
      
      // 오류 상황 로그 기록 (트랜잭션 실패 시에도 감사 로그 필요할 시 별도 처리)
      // await this.createAuditLog(null, "FAILURE", data, context, error.message);

      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError("internal", error.message || "Unknown error");
    }
  }

  // 추상 메서드들: 각 함수 모듈에서 반드시 구현해야 함
  protected abstract validateInput(data: any): TInput;
  protected abstract checkAuth(context: functions.https.CallableContext): void;
  protected abstract performLookup(
    transaction: admin.firestore.Transaction,
    data: TInput,
    context: functions.https.CallableContext
  ): Promise<any>;
  protected abstract validateTransition(docs: any, data: TInput): void;
  protected abstract performTransaction(
    transaction: admin.firestore.Transaction,
    docs: any,
    data: TInput,
    context: functions.https.CallableContext
  ): Promise<TOutput>;

  /**
   * 7. 로그 생성 (audit_logs 컬렉션 원칙 준수)
   */
  protected async createAuditLog(
    transaction: admin.firestore.Transaction | null,
    status: "SUCCESS" | "FAILURE",
    data: any,
    context: functions.https.CallableContext,
    errorMessage?: string
  ): Promise<void> {
    const logData = {
      actorUserId: context.auth?.uid || "system",
      action: this.constructor.name,
      status: status,
      payload: data,
      error: errorMessage || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const logRef = this.db.collection("audit_logs").doc();
    if (transaction) {
      transaction.set(logRef, logData);
    } else {
      await logRef.set(logData);
    }
  }
}
