HELLA company 업무관리사이트 — 사원 일정 화면 초정
밀 와이어프레임 정의서
문서 ID: WIREFRAME_EMPLOYEE_SCHEDULE 문서 목적: 사원이 자신의 일정을 조회하고, 일정 상세를 확인하며, 작
업 시작/종료/마감 화면으로 자연스럽게 이동할 수 있도록 사원 일정 화면을 초원자 단위로 정의한다.
이 문서는 다음의 기준이 된다. - 사원 일정 화면 UI 구조 - 캘린더/리스트 병행 구조 - 일정 상태 표시 규칙 - 일정 상세
패널 구조 - 작업 시작/종료/마감 연결 흐름 - 반응형 모바일 UX 기준 - 이후 API 연결 기준
1. 화면 개요
1-1. 화면명
국문: 사원 일정 화면
영문 식별: Employee Schedule Screen
Route: /m/calendar
1-2. 화면 목적
이 화면은 사원이 본인에게 배정된 일정만 빠르게 확인하고, 필요한 일정으로 즉시 진입해 작업을 시작하거나 마감할 수
있도록 하는 현장 운영 핵심 화면이다.
핵심 역할 1. 오늘/이번 주/특정 날짜의 일정을 확인한다. 2. 일정 상태를 시각적으로 구분한다. 3. 일정 상세를 열람한
다. 4. 작업 시작/종료/마감 화면으로 이동한다. 5. 본인 일정만 안전하게 노출한다.
1-3. 대상 사용자
EMPLOYEE
LEADER
1-4. 진입 경로
사원 홈(/m/home)의 “오늘 일정 보기” 버튼
하단 탭 일정
푸시/알림 기반 딥링크(차기 확장)
1-5. 이탈 경로
일정 상세 → 작업 시작 화면
일정 상세 → 마감 화면
뒤로가기 → 사원 홈
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
1

2. 화면 목표 UX
2-1. 핵심 UX 원칙
사원은 복잡한 필터보다 오늘 해야 할 일 우선으로 봐야 한다.
일정은 텍스트 목록보다 상태와 시간 중심으로 보여야 한다.
일정 클릭 후 상세 확인은 빠르되, 작업 액션 버튼은 명확히 분리해야 한다.
캘린더는 보조 탐색, 리스트는 주 실행 영역이다.
2-2. 모바일 UX 원칙
상단에서 날짜 범위를 바꾸고
중간에서 일정 목록을 보고
하단에서 상세 액션으로 연결되는 흐름이어야 한다.
3. 전체 레이아웃 구조
3-1. 최상위 구조
EmployeeSchedulePage
 ├─ MobileHeader
 ├─ DateScopeTabs
 ├─ MiniCalendarSection
 ├─ ScheduleFilterBar
 ├─ ScheduleListSection
 ├─ EmptyStateSection
 └─ ScheduleDetailBottomSheet / FullScreenDetail
3-2. 세로 배치 순서
상단 헤더
날짜 범위 탭
미니 캘린더
필터 바
일정 리스트
상세 패널 또는 바텀시트
• 
• 
• 
• 
• 
• 
• 
1. 
2. 
3. 
4. 
5. 
6. 
2

4. 상단 헤더 영역
4-1. MobileHeader
목적
현재 화면의 정체성을 명확히 하고, 사용자가 날짜 문맥을 빠르게 파악하게 한다.
구성 요소
BackButton (선택)
홈에서 들어온 경우 숨김 가능
다른 화면에서 딥링크 진입 시 표시 가능
Title
텍스트: 일정
Right Utility
새로고침 버튼(선택)
알림 아이콘(차기 확장)
상태
기본
로딩 중 (우측 스피너 대체 가능)
5. 날짜 범위 탭 영역
5-1. DateScopeTabs
목적
사용자가 오늘/이번 주/전체 예정 일정 등을 빠르게 전환한다.
권장 탭 구성
오늘
이번 주
전체
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
3

탭별 의미
오늘
오늘 날짜 기준 일정만 표시
기본 탭 권장
이번 주
이번 주 범위 일정 표시
전체
미래 예정 일정 포함한 전체 본인 일정 표시
페이지네이션 또는 점진 로딩 필요
상태
active
inactive
disabled(데이터 없음 시 사용 가능 여부는 선택)
이벤트
탭 클릭 → 범위 상태 변경 → 데이터 재필터링 또는 재조회
6. 미니 캘린더 섹션
6-1. MiniCalendarSection
목적
사용자가 날짜 단위로 일정을 탐색한다.
역할
현재 선택 날짜 표시
날짜별 일정 존재 여부 표시
특정 날짜 클릭 시 해당 날짜 일정 리스트 필터
구성 요소
Month Header
현재 년/월 표시
이전 달 이동 버튼
다음 달 이동 버튼
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
4

Weekday Row
월 화 수 목 금 토 일
Date Cell Grid
각 셀 구성 - 날짜 숫자 - 일정 존재 점(dot) 또는 count badge - 오늘 날짜 강조 - 선택 날짜 강조
시각 규칙
오늘: 브랜드 Primary Outline 또는 채움 강조
선택 날짜: 강한 채움
일정 있는 날짜: 작은 점 또는 숫자 뱃지
일정 없는 날짜: 기본 텍스트만
이벤트
날짜 클릭 → selectedDate 변경
달 이동 → 현재 월 일정 존재 여부 재계산
성능 고려
월별 일정 요약은 전체 상세를 다 가져오지 않고 dateKey 기반 lightweight map으로 캐시 가능
7. 필터 바 영역
7-1. ScheduleFilterBar
목적
사원이 너무 많은 일정 중 특정 상태만 빠르게 골라본다.
권장 필터
상태 필터
전체
예정
진행중
완료
마감 필요
정렬 필터
시간순
상태 우선순위순
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
5

구성 요소
StatusFilterChips
가로 스크롤 가능 칩
SortDropdown 또는 Toggle
기본: 시간순
정책
필터는 최소화
검색창은 MVP에서 생략 가능
8. 일정 리스트 섹션
8-1. ScheduleListSection
목적
실제 사용자가 가장 많이 보는 핵심 영역.
리스트 구성 방식
카드형 리스트
시간순 정렬 기본
상태 중요도가 높은 일정(진행중, 마감 필요)은 상단 우선 노출 가능
리스트 데이터 소스
현재 로그인 사용자에게 배정된 schedule_workers
schedules 컬렉션의 표시용 정보 조합
카드 개수 정책
오늘 탭은 전체 노출 가능
전체 탭은 페이지네이션 또는 무한 스크롤 권장
8-2. ScheduleCard
역할
개별 일정 요약 카드
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
6

카드 구성 요소
상단 행
상태 배지
시작시간
우측 Chevron 또는 상세 진입 아이콘
제목 영역
스케줄 제목
부가 정보 영역
현장 주소
사업분야 / 하위분야
투입 사원 수(사원 화면에서는 선택적)
하단 액션 힌트
작업 시작 가능
진행중
마감 필요
완료
상태별 시각 규칙
예정
파랑 계열 배지
액션 문구: 예정
진행중
초록 계열 배지
액션 문구: 진행중
완료
중성 회색/딥그린
액션 문구: 완료
마감 필요
빨강/주황 강조
액션 문구: 마감 필요
카드 클릭 이벤트
바텀시트 또는 전체 화면 상세 열기
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
7

9. 빈 상태 화면
9-1. EmptyStateSection
표시 조건
선택 날짜/필터 조합에 해당 일정 없음
구성 요소
아이콘 또는 일러스트(단순)
메인 메시지
해당 조건의 일정이 없습니다.
보조 메시지
다른 날짜를 선택하거나 필터를 변경해 보세요.
UX 정책
빈 상태에서도 미니 캘린더는 유지
사용자가 곧바로 다른 날짜를 탐색할 수 있어야 함
10. 일정 상세 패널
10-1. 상세 표시 방식
모바일에서는 두 가지 방식 중 하나를 선택할 수 있다.
방식 A. Bottom Sheet
장점 - 리스트 맥락 유지 - 빠른 확인 가능
방식 B. Full Screen Detail
장점 - 정보 밀도 높음 - 액션 버튼 명확
MVP 권장 - Bottom Sheet 우선 - 상세 내용이 길어질 경우 전체 화면 확장 버튼 제공
10-2. ScheduleDetailBottomSheet
목적
선택한 일정의 핵심 정보를 보여주고, 작업 액션으로 이어준다.
• 
• 
• 
• 
• 
• 
• 
• 
8

구성 요소
Header
스케줄 제목
상태 배지
닫기 버튼
정보 섹션 1: 일정 기본 정보
날짜
시작시간
종료예정시간
사업분야
하위분야
정보 섹션 2: 현장 정보
주소
고객 연락처
특이사항
기타 메모
정보 섹션 3: 내 작업 상태
내가 시작했는지 여부
내가 종료했는지 여부
마감 제출 여부
액션 섹션
작업 시작
작업 마감
닫기
버튼 노출 규칙
상태가 예정 + 시작 전
작업 시작 노출
작업 마감 숨김 또는 비활성
상태가 진행중
작업 시작 비활성 또는 숨김
작업 마감 노출
상태가 완료 + 마감 완료
편집 불가 안내
상세 기록 보기만 표시 가능
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
9

11. 상태(State) 정의
11-1. 화면 전체 상태
idle
loading
loaded
error
11-2. 날짜 관련 상태
selectedScope: TODAY | WEEK | ALL
selectedDate: string
visibleMonth: string
11-3. 필터 상태
selectedStatusFilter: ALL | PLANNED | IN_PROGRESS | COMPLETED | 
NEEDS_CLOSING
sortMode: TIME | STATUS_PRIORITY
11-4. 상세 패널 상태
selectedScheduleId: string | null
isDetailOpen: boolean
11-5. 데이터 상태
scheduleCards: ScheduleCardViewModel[]
calendarMarks: Record<string, number>
isRefreshing: boolean
12. 데이터 뷰모델 정의
12-1. ScheduleCardViewModel
interfaceScheduleCardViewModel{
scheduleId:string;
title:string;
categoryName:string;
subcategoryName?:string;
siteAddress:string;
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
10

scheduleDate:string;
startTime:string;
expectedEndTime?:string;
status:'PLANNED'|'IN_PROGRESS'|'COMPLETED'|'DELAYED';
myWorkStatus:'BEFORE_START'|'IN_PROGRESS'|'END_RECORDED'|'CLOSING_SUBMITTED'|
'COMPLETED';
needsClosing:boolean;
specialNotes?:string;
customerPhone?:string;
}
12-2. CalendarMarkMap
interfaceCalendarMarkMap{
[dateKey:string]:number;// 해당 날짜 일정 개수
}
13. 이벤트(Action) 정의
13-1. 화면 진입 시
실행 순서 1. 현재 사용자 uid 확인 2. 기본 scope = TODAY 설정 3. 오늘 날짜 selectedDate 설정 4. 오늘 기준 일정
조회 5. 캘린더 마크 데이터 조회 또는 계산
13-2. 탭 변경 시
selectedScope 변경
현재 표시 리스트 재계산 또는 API 재조회
13-3. 날짜 클릭 시
selectedDate 변경
해당 날짜 일정만 리스트 표시
13-4. 상태 필터 클릭 시
selectedStatusFilter 변경
리스트 재필터링
13-5. 일정 카드 클릭 시
selectedScheduleId 설정
• 
• 
• 
• 
• 
• 
• 
11

상세 패널 오픈
13-6. 작업 시작 버튼 클릭 시
/m/closing/:scheduleId 또는 /m/work/start/:scheduleId 로 이동 정책 선택
현재 구조상 마감 화면 내부 시작 처리 또는 별도 시작 화면 연동 가능
13-7. 작업 마감 버튼 클릭 시
/m/closing/:scheduleId 이동
13-8. 새로고침 시
화면 데이터 전체 재조회
14. 상태 머신 관점 일정 상태 정의
14-1. 일정 상태
PLANNED
IN_PROGRESS
COMPLETED
CANCELLED
DELAYED
14-2. 내 작업 상태
BEFORE_START
IN_PROGRESS
END_RECORDED
CLOSING_SUBMITTED
COMPLETED
14-3. 화면 표시 규칙
카드 우선 표시 값
내 작업 상태 우선
없으면 일정 상태 보조
예시  -  schedule.status  =  IN_PROGRESS  이고  myWorkStatus  =  BEFORE_START  인  경우  -  카드  문구는
작업 시작 필요
schedule.status = COMPLETED 이고 myWorkStatus = CLOSING_SUBMITTED 인 경우
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
1. 
2. 
• 
12

카드 문구는 마감 제출 완료
15. API / 데이터 연결 기준
15-1. 필요 서비스
getEmployeeSchedulesByScope(userId, scope, dateOrRange)
역할 - 본인 배정 일정만 반환
getEmployeeCalendarMarks(userId, visibleMonth)
역할 - 월별 날짜별 일정 개수 반환
getScheduleDetailForEmployee(scheduleId, userId)
역할 - 사원이 볼 수 있는 범위로 일정 상세 반환
15-2. 서버 검증 필수
해당 userId가 실제 배정된 일정인지 확인
비활성 계정 접근 차단
취소된 일정 표시 정책 적용
16. 권한 정책 연동 포인트
EMPLOYEE
본인 배정 일정만 조회 가능
다른 사원 일정 접근 불가
LEADER
팀 범위 일정 조회 가능하도록 확장 가능
현재 MVP는 본인 중심 우선
ADMIN
사원 화면 직접 사용은 가능하나 필수 아님
• 
• 
• 
• 
• 
• 
• 
• 
• 
13

17. 오류 처리 정책
17-1. 리스트 조회 실패
표시 - 일정을 불러오지 못했습니다. - 재시도 버튼
17-2. 상세 조회 실패
표시 - 바텀시트 내부 오류 문구 - 닫기 / 다시 시도 버튼
17-3. 권한 오류
표시 - 해당 일정에 접근할 수 없습니다. - 리스트 화면 유지
17-4. 네트워크 오류
기존 리스트 캐시가 있으면 유지
토스트 또는 인라인 배너 표시
18. 로딩 처리 정책
18-1. 초기 진입 로딩
스켈레톤 카드 3~4개 표시 권장
18-2. 탭 전환 로딩
전체 화면 스피너보다 리스트 부분 스켈레톤 권장
18-3. 상세 패널 로딩
바텀시트 내부 스켈레톤 사용
19. 접근성 기준
19-1. 탭 접근성
탭 버튼 role/tablist 구조
활성 탭 aria-selected 적용
• 
• 
• 
• 
• 
• 
• 
14

19-2. 일정 카드 접근성
카드 전체를 버튼/링크 역할로 처리
상태 텍스트를 색상 외 텍스트로도 명시
19-3. 바텀시트 접근성
닫기 버튼 명확히 제공
스크린리더 제목 연결
20. 스타일 가이드
20-1. 색상 사용 규칙
예정: 브랜드 블루 계열
진행중: 초록 계열
완료: 회색/딥그린
마감 필요: 주황/빨강 강조
20-2. 카드 스타일
모서리 둥글게
그림자 약하게
상태 배지는 좌상단 또는 우상단 고정 위치
20-3. 타이포
카드 제목: 16~18px Bold
주소/부가정보: 13~14px
상태/시간: 12~14px
21. UI 트리 구조 예시
EmployeeSchedulePage
 ├─ MobileHeader
 ├─ DateScopeTabs
 ├─ MiniCalendarSection
 │   ├─ MonthHeader
 │   ├─ WeekdayRow
 │   └─ DateCellGrid
 ├─ ScheduleFilterBar
 │   ├─ StatusFilterChips
 │   └─ SortControl
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
15

 ├─ ScheduleListSection
 │   ├─ ScheduleCard
 │   ├─ ScheduleCard
 │   └─ EmptyStateSection
 └─ ScheduleDetailBottomSheet
     ├─ DetailHeader
     ├─ ScheduleBasicInfo
     ├─ SiteInfo
     ├─ MyWorkStatusBlock
     └─ DetailActionButtons
22. 테스트 시나리오
22-1. 정상 시나리오
사원이 로그인
/m/calendar 진입
오늘 일정 3건 표시
일정 하나 클릭
상세 열림
작업 시작 버튼 클릭
22-2. 일정 없음 시나리오
특정 날짜 클릭
일정 없음
EmptyState 표시
22-3. 마감 필요 시나리오
내 작업 상태가 END_RECORDED
카드에 마감 필요 강조
상세에서 작업 마감 CTA 표시
22-4. 권한 오류 시나리오
본인 배정이 아닌 scheduleId 직접 접근 시도
상세 차단
오류 메시지 표시
22-5. 모바일 성능 시나리오
일정 20건 이상
부드럽게 스크롤 가능
1. 
2. 
3. 
4. 
5. 
6. 
1. 
2. 
3. 
1. 
2. 
3. 
1. 
2. 
3. 
1. 
2. 
16

이미지 없이도 카드 렌더링 빠름
23. 확장 설계 포인트
23-1. 홈 위젯 연결
사원 홈의 오늘 일정 카드와 이 화면은 같은 데이터 소스를 공유할 수 있어야 한다.
23-2. 추후 팀장 확장
LEADER용으로 팀원 일정 보기 탭 추가 가능하도록 scope 확장 구조 고려
23-3. 추후 알림 확장
일정 임박 알림, 마감 필요 알림과 연결 가능
23-4. 추후 오프라인 확장
최근 일정 캐시 기반 read-only 접근 가능 구조 고려
24. 구현 우선순위
24-1. 1차 필수
상단 헤더
오늘/이번 주/전체 탭
미니 캘린더
일정 카드 리스트
상세 바텀시트
작업 시작/마감 연결 CTA
24-2. 2차 개선
상태 필터 칩
정렬 컨트롤
새로고침 액션
skeleton loading 고도화
3. 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
17

25. 최종 정리
이 문서는 HELLA company 업무관리사이트의 사원 일정 화면을 실제 구현 가능한 수준으로 초원자 단위까지 분해한
와이어프레임 정의서이다.
이 문서를 기준으로 다음 작업을 바로 진행할 수 있다. 1. 일정 화면 React 컴포넌트 설계 2. 일정 API 명세 작성 3. 상태
관리 store 설계 4. 일정 상세 바텀시트 구현 5. 작업 시작/마감 화면 연결
다음 문서로 이어질 가장 자연스러운 문서는 - HELLA company 업무관리사이트 — 사원 작업 시작/종료/마감 화면 초
정밀 와이어프레임 정의서 또는 - HELLA company 업무관리사이트 — 관리자 대시보드 초정밀 와이어프레임 정의서
18

