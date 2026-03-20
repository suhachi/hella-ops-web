# 📂 hella-ops-web/ 필수 설정 파일 4종

---

# 1. AGENTS.md

# HELLA Company 업무관리사이트 - 에이전트 헌법

## 🇰🇷 제1원칙: 한국어(Korean) 절대 사용
- 사용자와의 모든 대화, 코드 주석, 커밋 메시지는 100% 한국어

## 🚨 하드 제약 사항
1. 상태 전이는 서버에서만 처리 (클라이언트 set 금지)
2. 권한 우회 접근 금지
3. NFC 장비 상태 변경은 트랜잭션 + 로그 동시 처리
4. TypeScript any 금지

## ✅ 작업 원칙
- 15분 단위 초원자 실행
- 데이터 무결성 > UI

※ 근거: Firestore Rules 및 상태 전이 설계 fileciteturn6file7L5-L13

---

# 2. docs/clone-spec.md

# HELLA OPS - 브랜드 및 UI 매핑서

## 앱 정보
- 이름: HELLA company 업무관리사이트
- 라우팅: /login, /app/*, /m/*

## 디자인 토큰
- Primary: #0F172A
- Accent: #0F766E

## 메뉴 구조
관리자:
- 대시보드
- 회사 일정관리
- 사원관리
- 장비관리

사원:
- 홈 / 일정 / 장비 / 메뉴얼 / 내정보

※ 근거: UI 구조 정의서 fileciteturn6file12L8-L16

---

# 3. docs/backend-states.md

# HELLA OPS - 권한 및 예외 상태

## 역할
- EMPLOYEE
- LEADER
- ADMIN
- SUPER_ADMIN

## 핵심 원칙
- 클라이언트는 입력만
- 상태는 서버 결정

## Boring States
- 일정 없음 → "오늘 일정 없음"
- 장비 없음 → "보유 장비 없음"

## 상태 전이
schedules:
- PLANNED → IN_PROGRESS → COMPLETED

equipments:
- AVAILABLE ↔ CHECKED_OUT

※ 근거: 상태 전이 규칙 fileciteturn6file7L33-L40

---

# 4. .agent/skills/hella-ops-builder/SKILL.md

---
name: hella-ops-builder
---

## 실행 규칙
- 모든 출력 한국어
- STEP 단위 실행

## STEP 1
프로젝트 생성

## STEP 2
라우팅 + 권한 분기

## STEP 3
로그인 UI

## STEP 4
Auth 연결

## STEP 5
레이아웃 분리

## STEP 6
대시보드 + 사원홈

※ 근거: 개발 단계 정의 fileciteturn6file17L84-L92

---

# ✅ 결론
이 4개 파일은 단순 문서가 아니라
- 아키텍처 붕괴 방지 장치
- 에이전트 통제 시스템
- SSOT 기준점

이다.

특히 다음 3가지가 핵심이다:
1. 상태는 서버가 결정
2. 로그는 절대 수정 불가
3. 권한은 절대 우회 불가

※ 핵심 철학: fileciteturn6file7L45-L48

