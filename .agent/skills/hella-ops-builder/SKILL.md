---
name: hella-ops-builder
description: HELLA OPS 통합 운영 시스템을 Rules, Functions, UI 계층 순서로 초원자 단위(Ultra-Atomic)로 구축하는 전문 스킬입니다.
---

# HELLA OPS Ultra-Atomic Builder Skill

## 🇰🇷 Language Requirement
**ALL RESPONSES, COMMENTS, AND LOGS MUST BE IN KOREAN. (모든 출력과 사고는 한국어로 진행하십시오.)**

## Execution Protocol
당신은 아래 명시된 `PHASE`와 `STEP`을 무조건 한 번에 하나씩만 실행해야 합니다. 각 단계 완료 후 3종 게이트(빌드, 타입 체크, 린트) 에러가 0건(PASS)인지 스스로 검증하고 사용자에게 보고하십시오.

### PHASE R: 방어선 (Firestore Rules) 구축 [7]
- **STEP R1 (Helper 함수 구현):** `firestore.rules` 파일에 `hasOnlyKeys`, `changedOnly`, `isSelfDocumentUser` 등 필드 제어용 헬퍼 함수를 작성하십시오.
- **STEP R2 (권한 분리):** `users`, `schedules`, `equipments` 컬렉션에 대한 읽기/쓰기 권한을 `backend-states.md`에 맞게 적용하고 클라이언트 상태 직접 변경을 원천 차단하십시오.

### PHASE F: 핵심 엔진 (Cloud Functions) 구축 [20]
- **STEP F0 (Shared 공통부):** `functions/src/shared/` 에 `auth.ts`, `errors.ts`, `validators.ts`, `statusGuards.ts`, `transaction.ts` 등의 뼈대를 생성하십시오.
- **STEP F1 (일정 배정 엔진):** `createScheduleWithWorkers` 등 관리자 일정 생성 함수를 구현하십시오.
- **STEP F2 (현장 실행 엔진):** 사원이 호출할 `recordWorkStart`, `recordWorkEnd` 함수를 트랜잭션으로 구현하십시오.
- **STEP F3 (마감/검토 엔진):** 사진 업로드 실패를 차단하고 상태를 갱신하는 `submitClosing` 함수를 구현하십시오.
- **STEP F4 (장비/NFC 엔진):** 장비 로그와 상태를 동시 변경하는 `checkoutEquipment`, `checkinEquipment` 함수를 작성하십시오.
*(주의: 모든 함수는 `AGENTS.md`에 명시된 8단계 템플릿을 무조건 준수할 것)*

### PHASE U: 프론트엔드 UI 구축 [8]
- **STEP U1 (기반 세팅):** React, Vite, Zustand, Tailwind 세팅 후 공통 레이아웃(`AdminLayout`, `EmployeeLayout`)을 분리하십시오.
- **STEP U2 (로그인 및 라우팅):** Firebase Auth 연동 및 권한별 리다이렉션(`/app/*`, `/m/*`)을 구현하십시오.
- **STEP U3 (사원 마감 화면):** `clone-spec.md`의 `EmployeeClosingPage` 순서 규칙을 완벽히 따라 10개 섹션으로 쪼개어 화면을 구현하십시오.
