HELLA company 업무관리사이트 — 전체 화면 구조도
(Screen Map)
이 문서는 HELLA OPS의 모든 화면을 원자 단위로 분해한 Screen Map(화면 구조도) 이다. 각 화면은 실제 라우트(페
이지), 진입 경로, 사용자, 주요 컴포넌트, 액션을 기준으로 정의한다.
표기 규칙 - [A] 관리자 전용 - [E] 사원 전용 - [C] 공통 - → : 화면 이동 - (Modal) : 모달 - (Drawer) : 사이드 패널
0. 라우팅 최상위
/ (루트) → /login → /app (권한 분기)
1. 인증 영역
1-1. 로그인 [C]
Route: /login 구성 - 회사 로고 - 사원ID 입력 - 비밀번호 입력 - 로그인 버튼 - 오류 메시지 액션 - 로그인 → /app/
dashboard (권한 분기)
2. 공통 앱 레이아웃
2-1. 관리자 레이아웃 [A]
Route: /app/* 구성 - 좌측 사이드바 - 상단 헤더 - 알림 영역 - 콘텐츠 영역
2-2. 사원 레이아웃 [E]
Route: /m/* 구성 - 상단 간단 헤더 - 하단 탭바 (홈/일정/장비/메뉴얼/내정보) - 콘텐츠 영역
3. 대시보드
3-1. 관리자 대시보드 [A]
Route: /app/dashboard 컴포넌트 - KPI 카드 (오늘 일정/진행중/미마감/미반입) - 최근 활동 리스트 - 빠른 액션 버튼
액션 - 카드 클릭 → 해당 리스트 화면
1

3-2. 사원 대시보드 [E]
Route: /m/home 컴포넌트 - 오늘 내 일정 카드 - 진행중 현장 카드 - 마감 필요 카드 - 내 장비 카드 액션 - 카드 클릭
→ 상세/마감/장비 화면
4. 사업분야 관리
4-1. 사업분야 목록 [A]
Route: /app/business 구성 - 대분류 리스트 - 하위분류 트리 - 생성 버튼 액션 - 생성 → (Modal) 생성폼 - 수정 →
(Modal) 수정폼
4-2. 사업분야 생성/수정 [A]
Modal 필드 - 이름/설명/정렬/활성
5. 메뉴얼 관리
5-1. 메뉴얼 목록 [A]
Route: /app/manuals - 필터(사업분야) - 리스트
5-2. 메뉴얼 상세 [A/E]
Route: /app/manuals/:id - 본문 - 버전
5-3. 메뉴얼 작성 [A]
Route: /app/manuals/new - 에디터 - 저장
6. 정기청소 관리
6-1. 장소 목록 [A]
Route: /app/regular-sites - 장소 리스트
6-2. 장소 상세 [A]
Route: /app/regular-sites/:id - 일정 캘린더 - 참여 통계
2

6-3. 참여 입력 [E]
Route: /m/regular/:id - 시작/종료 입력
7. 일정관리
7-1. 일정 캘린더 [A]
Route: /app/schedules - 월간 캘린더
7-2. 일정 생성 [A]
Route: /app/schedules/new - 입력폼
7-3. 일정 상세 [A]
Route: /app/schedules/:id - 상세 정보 - 사원 리스트
8. 스케줄별 일정표
8-1. 일정표 [A/E]
Route: /app/calendar | /m/calendar - 월/주 보기
8-2. 날짜 상세 [A/E]
(Drawer) - 해당 날짜 일정 리스트
9. 스케줄 마감
9-1. 마감 입력 [E]
Route: /m/closing/:scheduleId 구성 - 시작시간 - 종료시간 - 특이사항 - 사진 업로드 액션 - 저장 → 완료
9-2. 마감 검토 [A]
Route: /app/closings - 리스트 - 상세 검토
3

10. 사원관리
10-1. 사원 목록 [A]
Route: /app/users - 테이블
10-2. 사원 상세 [A]
Route: /app/users/:id - 프로필 - 참여기록
10-3. 사원 등록 [A]
Route: /app/users/new - 입력폼
11. NFC 장비관리
11-1. 장비 목록 [A]
Route: /app/equipments - 리스트
11-2. 장비 상세 [A]
Route: /app/equipments/:id - 정보 - 이력
11-3. 장비 등록 [A]
Route: /app/equipments/new
11-4. NFC 등록 [A]
Route: /app/equipments/:id/nfc - 태그 스캔
11-5. 반출 [E]
Route: /m/equipment/out - 스캔
11-6. 반입 [E]
Route: /m/equipment/in
11-7. 미반입 목록 [A]
Route: /app/equipment/outstanding
4

11-8. 이력 조회 [A]
Route: /app/equipment/logs
12. 설정
12-1. 설정 메인 [A]
Route: /app/settings
12-2. 회사 정보 [A]
Route: /app/settings/company
12-3. 로고 설정 [A]
Route: /app/settings/logo
13. 공통 서브 컴포넌트
이미지 업로더
시간 선택기
캘린더 컴포넌트
NFC 스캔 모듈
알림 토스트
14. 핵심 흐름 (User Flow)
사원 로그인 → 홈 → 일정 확인 → 시작 → 작업 → 사진 → 마감
관리자 로그인 → 대시보드 → 일정 생성 → 사원 배정 → 마감 검토 → 장비 관리
15. 총 화면 수 (MVP 기준)
관리자 약 20~25개 사원 약 10~15개 공통 포함 약 35~45개 화면
16. 결론
이 Screen Map은 - UI 설계 기준 - 라우팅 기준 - 개발 작업 단위 기준
• 
• 
• 
• 
• 
5

으로 사용된다.
이 문서를 기준으로 다음 단계는 → 와이어프레임 → 컴포넌트 설계 → API 설계
로 진행한다.
6

