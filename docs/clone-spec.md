# HELLA OPS - 브랜드 및 UI/UX 매핑서

## 1. 디자인 토큰 및 라우팅 구조
- **Primary Color:** `#0F172A` (900), `#1E293B` (800), `#334155` (700) [9]
- **Brand Accent:** `#0F766E`, hover `#115E59` [9]
- **라우팅:** 공통 진입(`/login`), 관리자 앱(`/app/*`), 사원 앱(`/m/*`) [10]
- **핵심 라우트:** 사원 홈(`/m/home`), 사원 마감(`/m/closing/:scheduleId`), 관리자 일정(`/app/schedules`) [11-13]

## 2. 화면별 렌더링 순서 (Strict Ordering)
에이전트는 UI 구현 시 아래의 Section 배치 순서를 반드시 지켜야 합니다.

**[사원 작업 마감 화면 (`EmployeeClosingPage`)]** [14]
1. MobileHeader
2. ScheduleSummaryCard
3. WorkStatusStepper (작업 상태 스텝퍼)
4. StartSection (시작 입력)
5. EndSection (종료 입력)
6. NotesSection (특이사항)
7. BeforePhotoSection (비포 사진)
8. AfterPhotoSection (애프터 사진)
9. ValidationAlertArea (오류/경고 표시 영역)
10. BottomActionBar (임시저장 / 마감완료 버튼)
