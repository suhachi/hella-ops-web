HELLA company 업무관리사이트 — 관리자 일정관리 화
면 초정밀 와이어프레임 정의서
문서 ID: WIREFRAME_ADMIN_SCHEDULE_MANAGEMENT 문서 목적: 관리자(ADMIN/SUPER_ADMIN)가 일반 현
장 일정을 생성, 조회, 수정, 배정, 상태관리할 수 있도록 일정관리 화면을 초원자 단위로 정의한다.
이 문서는 다음의 기준이 된다. - 관리자 일정관리 메인 화면 구조 - 일정 생성/수정 폼 구조 - 일정 상세 화면 구조 - 사원
배정 UI 구조 - 상태값 및 상태 전이 기준 - 필터/검색/캘린더/리스트 동시 운영 기준 - API 및 DB 연결 기준 - 권한 정책
연동 기준
1. 화면 개요
1-1. 화면명
국문: 관리자 일정관리 화면
영문 식별: Admin Schedule Management Screen
Route 묶음
/app/schedules
/app/schedules/new
/app/schedules/:id
/app/schedules/:id/edit (구현 방식에 따라 동일 폼 재사용 가능)
1-2. 화면 목적
이 화면은 회사의 일반 현장 일정을 운영하는 핵심 관리자 화면이다.
핵심 역할 1. 신규 일정 생성 2. 일정 목록 조회 및 검색 3. 일정 상세 확인 4. 일정 수정 5. 사원 배정 및 변경 6. 일정 상
태 관리 7. 현장 마감 결과 확인으로 연결
1-3. 대상 사용자
ADMIN
SUPER_ADMIN
1-4. 진입 경로
관리자 대시보드의 일정 생성
관리자 대시보드의 오늘 일정 리스트
사이드바 회사 일정관리
일정표 화면의 일정 클릭
1-5. 이탈 경로
일정 생성 완료 → 일정 상세
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
1

상세에서 수정 → 저장 후 상세 유지
상세에서 마감 검토 → 마감 화면 또는 검토 화면 이동
2. 전체 화면 구성 전략
관리자 일정관리는 한 개 화면이 아니라 3개의 핵심 화면군으로 본다.
일정 목록/캘린더 메인 화면
일정 생성/수정 화면
일정 상세 화면
이 3개를 각각 초원자 단위로 정의한다.
3. 일정 목록/캘린더 메인 화면
3-1. 화면 목적
관리자가 일정 전체를 빠르게 탐색하고, 날짜/상태/사업분야/사원 기준으로 필터링하며, 필요한 일정 상세나 생성 화면
으로 이동한다.
3-2. 최상위 레이아웃
AdminScheduleListPage
 ├─ PageHeader
 ├─ ActionBar
 ├─ FilterPanel
 ├─ MainSplitLayout
 │   ├─ CalendarPanel
 │   └─ ScheduleListPanel
 └─ ScheduleQuickDetailDrawer (선택)
3-3. 레이아웃 구조
PageHeader
페이지 제목: 회사 일정관리
보조 설명: 현장 일정을 생성하고 배정 및 상태를 관리합니다.
ActionBar
일정 생성 버튼
오늘 보기 버튼
새로고침 버튼
• 
• 
1. 
2. 
3. 
• 
• 
• 
• 
• 
2

FilterPanel
날짜 범위 필터
사업분야 필터
하위분야 필터
상태 필터
사원 필터
검색창
MainSplitLayout
좌측: 월간 캘린더 우측: 일정 리스트
4. PageHeader
4-1. 구성 요소
Title
Subtitle
Breadcrumb
4-2. 스타일 규칙
제목은 대시보드와 동일 계층
설명은 1줄 이내 유지
5. ActionBar
5-1. 목적
자주 쓰는 핵심 액션을 상단에 고정
5-2. 버튼 목록
일정 생성
Primary 버튼
클릭 → /app/schedules/new
오늘 보기
선택 중인 날짜 범위를 오늘로 변경
새로고침
필터 유지한 채 데이터 재조회
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
3

5-3. 반응형 규칙
태블릿 이하에서는 ActionBar를 2줄 허용
모바일 축소 시 관리자 사용 비중 낮지만 버튼 우선 유지
6. FilterPanel
6-1. 목적
일정을 원하는 조건으로 빠르게 좁힌다.
6-2. 필터 구성
DateRangeFilter
오늘
이번 주
이번 달
직접 선택
CategoryFilter
사업분야 선택
SubcategoryFilter
하위분야 선택
상위분야 선택에 따라 종속 변경
StatusFilter
전체
예정
진행중
완료
취소
마감지연
WorkerFilter
사원 검색/선택
SearchField
제목, 주소, 고객 연락처 일부 검색
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
4

6-3. 상태 모델 예시
interfaceScheduleFilterState{
dateMode:'TODAY'|'WEEK'|'MONTH'|'CUSTOM';
startDate?:string;
endDate?:string;
categoryId?:string;
subcategoryId?:string;
status?:'ALL'|'PLANNED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'|'DELAYED';
workerId?:string;
query?:string;
}
6-4. UX 규칙
필터 변경 즉시 조회 또는 적용 버튼 방식 중 선택
실무상 즉시 반영이 편리하나, 성능상 debounce 필요
7. CalendarPanel
7-1. 목적
일정의 날짜 분포를 한눈에 보고, 날짜 클릭으로 우측 리스트를 좁힌다.
7-2. 구성 요소
MonthHeader
현재 년/월
이전 월 / 다음 월 버튼
WeekdayRow
월 화 수 목 금 토 일
DateCellGrid
각 셀 요소 - 날짜 숫자 - 일정 개수 badge - 상태 요약 점(color dot) 선택 가능 - 오늘 날짜 강조 - 선택 날짜 강조
7-3. 클릭 동작
특정 날짜 클릭 → 우측 리스트를 해당 날짜 일정으로 필터링
날짜 다시 클릭 시 선택 해제 가능 정책 선택
• 
• 
• 
• 
• 
• 
• 
5

7-4. 데이터 모델
interfaceCalendarSummaryMap{
[dateKey:string]:{
count:number;
planned:number;
inProgress:number;
completed:number;
delayed:number;
}
}
8. ScheduleListPanel
8-1. 목적
필터 조건에 맞는 일정 목록을 표 또는 리스트로 보여준다.
8-2. 표시 방식
Desktop
Table 기본
Tablet
압축 Table 또는 Card List
Mobile(관리자 축소 대응)
Card List
8-3. 컬럼 정의
상태
시작시간
스케줄 제목
사업분야
현장 주소
투입 사원 수
마감 여부
상세 버튼
8-4. 정렬 기준
기본 정렬 - 날짜 오름차순 - 시작시간 오름차순
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

추가 정렬 - 상태 우선순위 - 최신 수정순
8-5. 행(Row) 클릭 동작
일정 상세 화면 이동
또는 빠른 상세 Drawer 오픈 (선택)
8-6. 상태 표시 규칙
예정: 파랑
진행중: 초록
완료: 회색/짙은 녹색
취소: 연회색
마감지연: 빨강
9. ScheduleQuickDetailDrawer (선택)
9-1. 목적
목록 화면을 벗어나지 않고 빠르게 핵심 정보 확인
9-2. 표시 정보
제목
날짜/시간
주소
배정 사원
상태
마감 여부
상세 보기 버튼
9-3. 정책
MVP에서 생략 가능하나 생산성 향상 효과 큼
10. 일정 생성/수정 화면
10-1. 화면 목적
관리자가 신규 일정을 만들거나 기존 일정을 편집한다.
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

10-2. 최상위 구조
AdminScheduleFormPage
 ├─ PageHeader
 ├─ FormSectionBasic
 ├─ FormSectionSite
 ├─ FormSectionWorkers
 ├─ FormSectionNotes
 ├─ ValidationSummary
 └─ BottomActionBar
10-3. 폼 모드
CREATE
EDIT
모드별 차이
CREATE
빈 값 기본
저장 후 상세로 이동
EDIT
기존 값 로드
변경사항 비교 저장
11. FormSectionBasic
목적
일정의 핵심 기본 속성을 입력
입력 필드
scheduleTitle
텍스트 입력
필수
최대 100자 권장
categoryId
단일 선택
필수
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
8

subcategoryId
단일 선택
선택 또는 필수는 정책에 따름
category에 따라 옵션 동적 변경
scheduleDate
날짜 선택
필수
startTime
시간 선택
필수
expectedEndTime
시간 선택
선택 입력
검증
제목 필수
날짜 필수
시작시간 필수
종료예정시간이 시작보다 빠르면 오류
12. FormSectionSite
목적
현장 관련 정보 입력
입력 필드
siteAddress
주소 입력
필수
siteAddressDetail
상세 주소
선택
customerName
고객명
선택
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

customerPhone
고객 연락처
선택
UX 규칙
주소는 길 수 있으므로 2줄 이상 대응
고객 연락처는 숫자 입력 패턴 가이드 제공
13. FormSectionWorkers
목적
투입 사원을 배정한다.
구성 요소
WorkerMultiSelect
사원 검색
다중 선택
비활성 사원 제외
AssignedWorkerList
선택된 사원 표시
제거 버튼
LeaderSelect (선택)
팀장 지정
선택된 사원 중 1명 지정 권장
필드
workerIds[]
leaderUserId
정책
사원 0명 배정 저장 허용 여부는 선택
초기에는 저장 허용 + 경고 권장
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
10

14. FormSectionNotes
목적
현장 전달 메모 및 특이사항 입력
입력 필드
specialNotes
특이사항
textarea
extraMemo
내부 메모
textarea
차이
특이사항: 현장 수행 시 꼭 봐야 할 내용
내부 메모: 운영 참고용
15. ValidationSummary
목적
폼 하단에서 오류를 한 번에 보여준다.
메시지 유형
제목이 비어 있습니다.
날짜를 선택해 주세요.
시작시간을 입력해 주세요.
종료예정시간이 시작시간보다 빠릅니다.
배정 인원이 없습니다. 그대로 저장할까요? (경고)
규칙
오류는 저장 차단
경고는 저장 허용 가능
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
11

16. BottomActionBar
버튼 구성
좌측
취소
우측
저장
저장 후 상세 보기(선택)
상태
enabled
disabled
saving
17. 일정 상세 화면
17-1. 화면 목적
일정 1개의 모든 운영 정보를 관리자 관점에서 검토하고 관리한다.
17-2. 최상위 구조
AdminScheduleDetailPage
 ├─ DetailHeader
 ├─ SummaryCard
 ├─ TabNavigation
 ├─ TabBasicInfo
 ├─ TabAssignedWorkers
 ├─ TabClosingInfo
 ├─ TabPhotos
 └─ SideActionPanel
17-3. DetailHeader
제목
상태 배지
수정 버튼
취소 처리 버튼
뒤로가기
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
12

17-4. SummaryCard
표시 항목 - 제목 - 사업분야 - 날짜/시간 - 주소 - 고객 연락처 - 생성자 - 마지막 수정 시각
18. TabBasicInfo
표시 내용
특이사항
내부 메모
종료예정시간
리더 지정 여부
마감 필요 여부
19. TabAssignedWorkers
목적
배정된 사원 상태 확인
테이블 컬럼
이름
역할(리더/일반)
시작 여부
종료 여부
마감 제출 여부
현재 workStatus
액션
사원 추가
사원 제거
리더 지정 변경
정책
이미 작업 시작한 사원의 제거는 경고 필요
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
13

20. TabClosingInfo
목적
현장 마감 기록 확인
표시 내용
실제 시작시간
실제 종료시간
작성자
제출 시각
특이사항
검토 상태
액션
마감 검토 화면 이동
검토 완료 처리(권한 분리 가능)
21. TabPhotos
목적
비포/애프터 사진 확인
구성
Before Gallery
After Gallery
각 이미지 클릭 시 확대
업로더 표시
업로드 시각 표시
정책
관리자 삭제 권한은 정책 선택
기본은 조회 중심
22. SideActionPanel
목적
상세 화면에서 자주 쓰는 관리 액션을 별도 노출
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
14

버튼
일정 수정
일정 취소
마감 검토 보기
일정표에서 보기
23. 상태(State) 정의
interfaceAdminSchedulePageState{
filters:ScheduleFilterState;
calendarSummary:CalendarSummaryMap;
scheduleRows:ScheduleRowViewModel[];
selectedScheduleId:string|null;
isListLoading:boolean;
isCalendarLoading:boolean;
isDetailLoading:boolean;
isSaving:boolean;
errorMessage:string|null;
}
일정 폼 상태
interfaceAdminScheduleFormState{
mode:'CREATE'|'EDIT';
scheduleTitle:string;
categoryId:string;
subcategoryId?:string;
scheduleDate:string;
startTime:string;
expectedEndTime?:string;
siteAddress:string;
siteAddressDetail?:string;
customerName?:string;
customerPhone?:string;
workerIds:string[];
leaderUserId?:string;
specialNotes?:string;
extraMemo?:string;
validationErrors:string[];
validationWarnings:string[];
isDirty:boolean;
}
• 
• 
• 
• 
15

24. 이벤트(Action) 정의
24-1. 목록 화면 이벤트
onClickCreateSchedule
onChangeFilter
onSelectDate
onClickScheduleRow
onRefreshList
24-2. 생성/수정 화면 이벤트
onChangeField
onSelectWorkers
onRemoveWorker
onSelectLeader
onSubmitForm
onCancelForm
24-3. 상세 화면 이벤트
onClickEdit
onClickCancelSchedule
onClickOpenClosingReview
onClickPhotoPreview
25. 상태 전이 규칙
25-1. 일정 상태
PLANNED
IN_PROGRESS
COMPLETED
CANCELLED
DELAYED
25-2. 전이 규칙
생성 시 기본 PLANNED
사원 시작 입력 시 IN_PROGRESS
전체 마감 완료 시 COMPLETED
관리자 취소 시 CANCELLED
마감 지연 규칙 충족 시 DELAYED
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
• 
16

정책
CANCELLED 상태 일정은 일반 수정 제한 권장
COMPLETED 이후 대규모 수정은 관리자만 가능
26. API / 서비스 연결 기준
목록/캘린더
getSchedulesForAdmin(filters)
getScheduleCalendarSummary(filters)
생성/수정
createSchedule(payload)
updateSchedule(scheduleId, payload)
상세
getScheduleDetail(scheduleId)
getScheduleAssignedWorkers(scheduleId)
getScheduleClosingInfo(scheduleId)
getSchedulePhotos(scheduleId)
상태 변경
cancelSchedule(scheduleId, reason)
reassignWorkers(scheduleId, workerIds)
27. DB 연결 포인트
관련 컬렉션 -  schedules -  schedule_workers -  schedule_closings -  schedule_photos -
users - business_categories - business_subcategories
캐시  필드  활용  -  schedules.assignedWorkerNames -  schedules.hasClosingRecord -
schedules.hasBeforePhotos - schedules.hasAfterPhotos
28. 권한 정책 연동
ADMIN
전체 조회/생성/수정 가능
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
17

취소 가능
배정 변경 가능
SUPER_ADMIN
ADMIN과 동일 + 정책상 추가 설정 가능
LEADER / EMPLOYEE
관리자 라우트 접근 불가
29. 오류 처리 정책
29-1. 목록 조회 실패
에러 배너 표시
재시도 버튼
29-2. 일정 생성 실패
입력값 유지
인라인 에러 + 요약 에러 표시
29-3. 사원 배정 실패
실패 이유 표시
재시도 가능
29-4. 취소 실패
상태 롤백
토스트 표시
30. 로딩 처리 정책
30-1. 목록 로딩
캘린더 부분 skeleton
리스트 table row skeleton
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
18

30-2. 상세 로딩
탭 영역 skeleton
30-3. 폼 저장 로딩
저장 버튼 loading
중복 제출 차단
31. 접근성 기준
모든 필터 label 제공
테이블 헤더 scope 명확화
상태 색상 + 텍스트 병행
Drawer/모달 포커스 트랩 적용
날짜 선택기 키보드 접근성 확보
32. 성능/확장성 고려
32-1. 성능
필터 debounce
캘린더 요약 데이터 별도 조회
목록 페이지네이션
32-2. 확장성
향후 팀장용 제한 일정관리 화면 파생 가능
향후 가맹점별 일정 분리 가능
향후 반복 일정/템플릿 일정 확장 가능
33. UI 트리 구조 예시
AdminScheduleListPage
 ├─ PageHeader
 ├─ ActionBar
 ├─ FilterPanel
 ├─ MainSplitLayout
 │   ├─ CalendarPanel
 │   └─ ScheduleListPanel
 └─ ScheduleQuickDetailDrawer
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
19

AdminScheduleFormPage
 ├─ PageHeader
 ├─ FormSectionBasic
 ├─ FormSectionSite
 ├─ FormSectionWorkers
 ├─ FormSectionNotes
 ├─ ValidationSummary
 └─ BottomActionBar
AdminScheduleDetailPage
 ├─ DetailHeader
 ├─ SummaryCard
 ├─ TabNavigation
 ├─ TabBasicInfo
 ├─ TabAssignedWorkers
 ├─ TabClosingInfo
 ├─ TabPhotos
 └─ SideActionPanel
34. 테스트 시나리오
34-1. 정상 생성 시나리오
일정 생성 버튼 클릭
필수값 입력
사원 2명 배정
저장
상세 화면 이동
34-2. 검증 오류 시나리오
제목 없이 저장
인라인 오류 표시
저장 차단
34-3. 일정 취소 시나리오
상세 화면 진입
취소 버튼 클릭
사유 입력(선택 정책)
상태 CANCELLED
1. 
2. 
3. 
4. 
5. 
1. 
2. 
3. 
1. 
2. 
3. 
4. 
20

34-4. 배정 변경 시나리오
상세 > 배정 탭
사원 추가/제거
저장 후 반영
34-5. 완료 일정 검토 시나리오
마감 완료 일정 열기
TabClosingInfo 확인
TabPhotos 확인
35. 구현 우선순위
35-1. 1차 필수
일정 목록/필터
일정 생성 폼
일정 상세
사원 배정
상태 표시
35-2. 2차 개선
빠른 상세 Drawer
고급 검색
필터 저장
반복 일정 확장
36. 최종 정리
이 문서는 HELLA company 업무관리사이트의 관리자 일정관리 화면을 실제 구현 가능한 수준으로 초원자 단위까지
분해한 와이어프레임 정의서이다.
이 문서를 기준으로 다음 작업을 바로 진행할 수 있다. 1. 관리자 일정관리 React 화면 구현 2. 일정 CRUD API 명세 작
성 3. 배정 로직 구현 4. 상태 전이 로직 구현 5. 캘린더 요약 데이터 구현
다음 문서로 가장 자연스럽게 이어질 것은 - HELLA company 업무관리사이트 — 관리자 장비관리 화면 초정밀 와이
어프레임 정의서 또는 - HELLA company 업무관리사이트 — Firestore Rules 설계서
1. 
2. 
3. 
1. 
2. 
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
21

