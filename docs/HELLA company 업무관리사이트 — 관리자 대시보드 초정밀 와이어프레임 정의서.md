HELLA company 업무관리사이트 — 관리자 대시보드 초
정밀 와이어프레임 정의서
문서 ID: WIREFRAME_ADMIN_DASHBOARD 문서 목적: 관리자(ADMIN/SUPER_ADMIN)가 전체 운영 현황을 한 화
면에서 파악하고 즉시 액션을 수행할 수 있도록, 대시보드 화면을 초원자 단위로 정의한다.
0. 확장성/유지보수 원칙 (핵심)
위젯 기반 레이아웃: 카드/차트/리스트를 모듈로 분리
서버 주도 구성(Server-driven UI): 위젯 순서/노출을 서버 설정으로 제어 가능
권한별 가시성: ADMIN/LEADER/SUPER_ADMIN 별 위젯 노출 제어
성능: 초기 페인트 < 2s 목표, 각 위젯은 독립 로딩
interfaceDashboardWidget{
id:string
type:'KPI'|'CHART'|'LIST'|'ALERT'|'QUICK_ACTION'
visible:boolean
order:number
config:Record<string,any>
}
1. 화면 개요
Route: /app/dashboard
대상: ADMIN, SUPER_ADMIN (확장 시 LEADER 일부 위젯 허용)
목적 1) 오늘 운영 상태 즉시 파악 2) 리스크(미마감/미반입) 즉시 식별 3) 주요 액션(일정 생성/사원 배정/장비 관리) 빠
른 진입 4) 기간별 트렌드 확인
2. 전체 레이아웃
AdminDashboardPage
 ├─ AppShell (Sidebar + Header)
 └─ DashboardContent
     ├─ KPISection
     ├─ AlertSection
     ├─ QuickActionSection
     ├─ ChartSection
     ├─ TodayScheduleSection
• 
• 
• 
• 
• 
• 
1

     ├─ EquipmentSection
     └─ ActivitySection
그리드: 12-column (Desktop), Tablet 8, Mobile 4
위젯은 카드(Card) 컨테이너 표준 사용
3. Header (공통 AppShell)
구성  -  Breadcrumb:  대시보드  -  DateRangePicker(선택):  오늘/이번주/이번달/커스텀  -  RefreshButton  -
UserMenu
이벤트 - onChangeDateRange → 모든 위젯 데이터 재조회 - onRefresh → 강제 재조회
4. KPI Section (핵심)
4-1. 목적
가장 중요한 수치를 한눈에 표시
4-2. KPI 카드 목록
오늘 총 일정 수
진행중 일정 수
미마감 건수
미반입 장비 수
4-3. 컴포넌트
KPISection
 ├─ KPICard x4
KPICard 구조
title
value (숫자)
delta(전일 대비, 선택)
icon
colorTheme
clickable(optional)
상태
loading / success / empty / error
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
2

클릭 동작
미마감 → /app/closings?status=NEEDS_CLOSING
미반입 → /app/equipment/outstanding
5. Alert Section (리스크 강조)
5-1. 목적
즉시 처리해야 하는 항목 강조
5-2. 위젯
미마감 Top N
미반입 장비 Top N
5-3. 컴포넌트
AlertSection
 ├─ AlertCard (NeedsClosingList)
 └─ AlertCard (OutstandingEquipmentList)
AlertCard 구조
header(title + count)
list(item)
footer(전체보기)
item 필드
id, title, meta(시간/사원/주소), statusBadge, link
6. Quick Action Section
6-1. 목적
관리자가 자주 사용하는 액션 단축
6-2. 버튼
일정 생성
사원 등록
장비 등록
메뉴얼 등록
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

6-3. 구조
QuickActionSection
 ├─ ActionButton xN
interfaceQuickActionItem{
key:string
label:string
route:string
icon:string
visible:boolean
}
7. Chart Section (트렌드)
7-1. 목적
기간별 성과/활동 흐름 파악
7-2. 차트 구성
일정 생성/완료 추이 (Line)
분야별 비율 (Bar/Stack)
7-3. 구조
ChartSection
 ├─ LineChartCard
 └─ BarChartCard
데이터 모델
interfaceTrendPoint{
date:string
created:number
completed:number
}
• 
• 
4

8. Today Schedule Section
8-1. 목적
오늘 일정 빠른 확인 및 이동
8-2. 구성
리스트 (상위 N개)
상태 필터(선택)
8-3. 컴포넌트
TodayScheduleSection
 ├─ SectionHeader
 ├─ ScheduleRow xN
 └─ ViewAllLink
ScheduleRow 필드
scheduleId
title
time
address
status
assignedCount
클릭
/app/schedules/:id
9. Equipment Section
9-1. 목적
장비 상태 모니터링
9-2. 위젯
현재 반출중 장비 수
최근 반출/반입 로그
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

9-3. 구조
EquipmentSection
 ├─ EquipmentKPI
 └─ EquipmentLogList
10. Activity Section (최근 활동)
10-1. 목적
시스템 전반 활동 로그 확인
10-2. 항목
일정 생성/수정
마감 제출
장비 반출/반입
10-3. 구조
ActivitySection
 ├─ ActivityItem xN
ActivityItem 필드
type
message
actorName
timestamp
link(optional)
11. 상태(State) 정의
interfaceDashboardState{
dateRange:{start:string;end:string}
kpis:Record<string,number>
alerts:{
needsClosing:any[]
outstandingEquipments:any[]
}
charts:{
trends:TrendPoint[]
• 
• 
• 
• 
• 
• 
• 
• 
6

categories:any[]
}
todaySchedules:any[]
equipments:any[]
activities:any[]
loadingMap:Record<string,boolean>
errorMap:Record<string,string|null>
}
12. 데이터 로딩 전략
병렬 로딩 (Promise.all)
위젯 단위 실패 허용 (partial render)
캐시: 최근 조회 데이터 1~5분 캐싱
13. API 계약
필요  API  -  getDashboardKpis(range) -  getNeedsClosingList(range) -
getOutstandingEquipments() -  getTrendData(range) -  getTodaySchedules() -
getRecentActivities(limit)
서버 검증 - 권한 필터링 - 데이터 범위 제한
14. 권한 정책 연결
ADMIN: 전체 조회
SUPER_ADMIN: 전체 + 설정 위젯 접근
LEADER(확장): 팀 범위 데이터
15. 오류 처리
위젯 단위 에러 카드 표시
재시도 버튼 제공
전체 실패 시 글로벌 배너
16. 로딩 처리
KPI: 스켈레톤 숫자
리스트: 스켈레톤 row
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

차트: placeholder
17. 접근성
KPI 숫자에 aria-label 제공
차트 요약 텍스트 제공
키보드 포커스 이동 가능
18. 성능 기준
초기 로딩 < 2초
TTI < 3초
위젯 lazy load 가능
19. UI 트리 예시
AdminDashboardPage
 ├─ KPISection
 ├─ AlertSection
 ├─ QuickActionSection
 ├─ ChartSection
 ├─ TodayScheduleSection
 ├─ EquipmentSection
 └─ ActivitySection
20. 테스트 시나리오
정상 - KPI 값 정상 표시 - 일정 클릭 → 상세 이동
오류 - KPI API 실패 → 해당 카드만 오류
권한 - LEADER 로그인 → 제한된 데이터 표시
성능 - 1000건 데이터에서도 UI 정상 유지
21. 구현 우선순위
1차 - KPI - 오늘 일정 - 미마감/미반입 - Quick Action
• 
• 
• 
• 
• 
• 
• 
8

2차 - 차트 - 활동 로그
22. 최종 정리
이 문서는 관리자 대시보드를 실제 개발 가능한 수준으로 분해한 정의서이며, 위젯 기반 구조를 통해 기능 추가/확장이
가능한 설계를 채택한다.
향후 확장 - 가맹점별 대시보드 - 외주팀별 KPI 분리 - 커스텀 위젯 추가
9

