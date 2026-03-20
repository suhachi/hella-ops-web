import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

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
    let validatedData: TInput | undefined;

    try {
      // 1. 타입정의 (TInput 제네릭 및 하위 클래스에서 정의)

      // 2. 인증가드 (수정: 입력검증보다 먼저 실행)
      this.checkAuth(context);

      // 3. 입력검증 (Zod Schema 등을 활용한 하위 클래스 구현)
      validatedData = this.validateInput(data);

      // 4~7단계: 트랜잭션 내에서 원자적 처리
      const result = await this.db.runTransaction(async (transaction) => {
        // 4. 문서조회
        const docs = await this.performLookup(transaction, validatedData!, context);

        // 5. 상태전이검증
        this.validateTransition(docs, validatedData!);

        // 6. 트랜잭션 (데이터 변경 실행)
        const output = await this.performTransaction(transaction, docs, validatedData!, context);

        // 7. 로그 생성 (성공)
        await this.createAuditLog(transaction, "SUCCESS", validatedData!, context);

        return output;
      });

      return result;
    } catch (error: any) {
      console.error(`[BaseHandler Error] ${error.message}`);
      
      // 7. 로그 생성 (실패 케이스 구현 완료)
      // 트랜잭션 밖에서 별도의 쓰기로 실패 증적을 기록
      try {
        await this.createAuditLog(null, "FAILURE", data, context, error.message);
      } catch (logError) {
        console.error(`[Critical] Failed to write failure audit log:`, logError);
      }

      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError("internal", error.message || "Unknown error");
    }
  }

  // 추상 메서드들
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
   * 7. 감사 로그 생성 (audit_logs 컬렉션 원칙 준수)
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
      payload: data || null,
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
