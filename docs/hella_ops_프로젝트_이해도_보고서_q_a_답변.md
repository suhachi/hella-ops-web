# HELLA OPS 프로젝트 이해도 보고서 + 사전 질문 답변

---

# 1. 프로젝트 정체성 재정의 (정확한 해석)

이 시스템은 단순한 업무관리 툴이 아니라 다음 6개 흐름이 결합된 **운영 시스템(Operations System)**이다.

## 핵심 구성 축
1. 일정 생성 및 배정 (관리자 중심)
2. 현장 실행 (사원 입력 중심)
3. 작업 증빙 (사진 + 기록)
4. 상태 계산 (서버 기반)
5. 장비 흐름 (NFC 기반 트랜잭션)
6. 감사 및 로그 시스템

즉, 이 시스템은 **"입력 시스템"이 아니라 "상태 기반 운영 시스템"**이다.

→ 모든 상태는 서버에서 결정되며, 클라이언트는 이벤트만 발생시킨다.

(근거: 상태 전이 및 서버 판정 구조) fileciteturn1file15

---

# 2. UX 전략 해석 (개발 시 반드시 반영해야 하는 구조)

## 관리자 UX (Control Layer)
- 데이터 중심 (Table / Filter / KPI)
- 다중 조건 탐색
- Excel 다운로드 및 통제

## 사원 UX (Execution Layer)
- 입력 최소화
- 버튼 기반 실행
- 오프라인/현장 대응

## 구조적 핵심
- 관리자 = 상태를 "관리"
- 사원 = 데이터를 "입력"
- 서버 = 상태를 "판정"

---

# 3. 아키텍처 핵심 요약 (FSD + Firebase)

## 절대 구조
pages → features → service → repository → Firebase

### 금지 사항
- pages에서 Firebase 직접 호출 ❌
- 상태 직접 업데이트 ❌

### 이유
상태 무결성 유지 + 트랜잭션 보장

(근거: 계층 분리 및 상태 통제 원칙) fileciteturn1file16

---

# 4. 시스템 철학 핵심 요약 (절대 변경 금지 영역)

## 4-1. 상태 통제
- schedules.status → 서버만 변경
- equipments.status → 서버만 변경
- workStatus → 함수 통해서만 변경

## 4-2. 트랜잭션 원칙
- 장비 반출/반입 = 단일 트랜잭션
- 상태 변경 + 로그 생성 = 반드시 동시 처리

## 4-3. 보안 원칙
- audit_logs 수정/삭제 금지
- equipment_logs 클라이언트 작성 금지

## 4-4. UX 방어
- Empty State 필수
- 로딩/0건 대응 필수

---

# 5. Q&A — 핵심 의사결정 (초정밀 기준)

---

## Q1. NFC + QR fallback (DB 설계 선반영 여부)

### 결론: ❌ MVP에서는 제외 (nfcTagId 100% 집중)

### 이유
1. 현재 설계 문서에서 NFC 기반 흐름이 핵심
2. nfc_tag_mappings 구조가 이미 고정됨
3. QR 도입 시 상태 검증 로직 이중화 발생

→ QR까지 포함하면
- validation 복잡도 증가
- 트랜잭션 분기 증가
- 테스트 범위 폭증

### 권장 전략
- 현재: nfcTagId ONLY
- 확장 시: 별도 mapping collection 추가

```ts
// 미래 확장 구조 (지금 구현 금지)
qr_tag_mappings
```

---

## Q2. 오프라인 임시 저장 (Zustand persist)

### 결론: ⭕ MVP부터 적용 (단, 제한적으로)

### 적용 범위
- notes (특이사항)
- startAt / endAt (입력값)

### 적용 금지
- 상태값 (workStatus 등)
- 제출 상태

### 이유
- 현장 네트워크 불안정 대응 필요
- UX 리스크가 매우 큼

### 구조
```ts
persistedDraft
- scheduleId
- notes
- startAt
- endAt
```

### 주의
- 서버 제출 성공 시 반드시 삭제

---

## Q3. 사진 업로드 실패 시 정책

### 결론: ⛔ HARD BLOCK (제출 차단)

### 근거 (매우 중요)
문서 기준:
→ "업로드 실패 사진 존재 시 SUBMITTED 차단" fileciteturn1file15

### 이유
1. 사진은 "증빙 데이터"
2. 누락 시 운영 무결성 붕괴
3. 관리자 검토 불가능 상태 발생

### 정책
- before 1장 필수
- after 1장 필수
- 실패 상태 존재 시 제출 불가

### UX 처리
- 실패 이미지 retry 버튼 제공
- 실패 상태 명확 표시

---

## Q4. Seed Script (더미 데이터)

### 결론: ⭕ 반드시 작성 (초기 필수)

### 대상
- users
- business_categories
- equipments
- schedules (샘플)

### 이유
1. UI 개발 불가 (데이터 없으면)
2. 상태 전이 테스트 불가
3. 권한 분기 테스트 불가

### 구조
```ts
scripts/seed.ts
```

### 주의
- production 실행 금지
- dev only

---

# 6. 최종 결론 (개발 진입 기준)

## 반드시 고정된 결정

1. NFC only (QR 미포함)
2. 오프라인 draft 제한 적용
3. 사진 실패 = 제출 차단
4. seed script 필수

---

# 7. 개발 시작 전 체크리스트

- [ ] 상태 전이 서버 전용 구조 확인
- [ ] Firestore Rules 화이트리스트 적용
- [ ] Functions 트랜잭션 구조 설계
- [ ] UI → service → repository 분리
- [ ] audit_logs 생성 흐름 포함

---

# 8. 핵심 한 줄 정의

이 프로젝트는

👉 "사원이 입력하면 서버가 상태를 확정하고,
그 모든 흐름이 로그로 남는 운영 시스템"이다.

---

(이 문서는 구현 기준 SSOT 보조 문서로 사용 가능)