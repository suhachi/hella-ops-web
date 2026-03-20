# HELLA Company 업무관리사이트 - 에이전트 헌법

## 🇰🇷 제1원칙: 한국어(Korean) 절대 사용
- 사용자와의 모든 대화, 아티팩트 작성, 주석, Git 커밋 메시지는 100% 한국어로만 작성하십시오.

## 🚨 하드 제약 사항 (Critical Constraints)
1. **서버 기반 상태 확정 (Zero Trust):** 클라이언트가 `schedules.status`, `equipments.status`, `workStatus`를 직접 변경(`set`, `update`)하는 로직은 절대 작성하지 마십시오. 사원은 입력만 하며, 최종 상태는 반드시 서버 함수(Functions)가 결정합니다 [5, 6].
2. **함수 구현 8단계 템플릿 강수:** 모든 Firebase Functions는 반드시 `[타입정의 → 인증가드 → 입력검증 → 문서조회 → 상태전이검증 → 트랜잭션 → 로그생성 → 에뮬레이터 테스트]`의 8단계를 거쳐 작성되어야 합니다 [1].
3. **감사 로그(Audit) 무결성:** `audit_logs`와 `equipment_logs`는 Append-only 원칙을 따르며 클라이언트 측의 직접 쓰기, 수정, 삭제를 원천 차단하십시오 [7].
4. **NFC 집중 (QR 제외) 및 예외 처리:** MVP 단계에서는 QR 백업 없이 NFC 태그(`nfcTagId`) 처리에만 100% 집중합니다 [3]. 사진 업로드 실패 건이 남아있을 경우 마감 제출은 'HARD BLOCK(원천 차단)' 되어야 합니다 [2].

## ✅ 아키텍처 규칙
- **FSD 아키텍처:** 프론트엔드는 UI 컴포넌트, Service(오케스트레이션), Repository(Firebase SDK), Type으로 철저히 계층을 분리하십시오 [8]. UI에서 Firebase를 직접 호출하지 마십시오.
