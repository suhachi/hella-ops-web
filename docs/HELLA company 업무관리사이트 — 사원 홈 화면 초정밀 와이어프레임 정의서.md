HELLA company 업무관리사이트 — 사원 홈 화면 초정밀
와이어프레임 정의서
문서 ID: WIREFRAME_EMPLOYEE_HOME 문서 목적: 사원이 로그인 후 최초 진입하는 홈 화면을 초원자 단위로 정의
0. 확장성 원칙 (중요)
이 시스템은 반드시 다음을 만족해야 한다.
기능 추가 시 기존 구조를 깨지 않는다
메뉴/카드/위젯 단위로 확장 가능
API 구조 변경 최소화
권한 확장 대응 가능 (가맹점/외주팀)
👉 모든 UI는 "모듈 단위"로 설계한다
1. 화면 개요
Route: /m/home
목적 - 사원의 오늘 업무를 한 화면에서 파악 - 빠른 작업 진입 - 실수 없는 작업 흐름 유도
2. 전체 레이아웃
구조
Header
Today Summary Card
Quick Action Grid
Today Schedule List
Equipment Status
모바일 기준 세로 스크롤
3. Header
구성 - 사용자 이름 - 오늘 날짜 - 알림 아이콘
컴포넌트 - UserGreeting - TodayDate - NotificationIcon
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

4. Today Summary Card
역할 - 오늘 상태 한눈에 표시
표시 항목 - 오늘 일정 수 - 진행중 일정 - 완료 일정
컴포넌트 - SummaryCard - SummaryItem
5. Quick Action Grid
역할 - 핵심 기능 빠른 접근
버튼 - 작업 시작 - 작업 종료 - 장비 반출 - 장비 반입
컴포넌트 - ActionButton
확장성 → 버튼 추가 가능 구조 (config 기반)
6. Today Schedule List
역할 - 오늘 할 일 목록
항목 구성 - 일정 제목 - 주소 - 시간 - 상태
상태 - 예정 - 진행중 - 완료
컴포넌트 - ScheduleCard
이벤트 - 클릭 → 상세 이동
7. Equipment Status
역할 - 현재 장비 상태 확인
표시 - 미반입 장비 - 반출중 장비
컴포넌트 - EquipmentStatusCard
2

8. 상태 정의
schedules
equipments
uiLoading
9. 이벤트 정의
화면 진입 → 오늘 데이터 조회
버튼 클릭 → 해당 기능 이동
일정 클릭 → 상세 이동
10. API
getTodaySchedules(userId)
getEquipmentStatus(userId)
11. 확장 설계 (핵심)
11-1. 카드 구조
모든 카드 컴포넌트는 아래 구조 사용
interfaceHomeWidget{
id:string
type:string
data:any
}
→ 서버에서 위젯 내려주면 UI 자동 구성 가능
11-2. 버튼 구조
interfaceActionItem{
key:string
label:string
route:string
visible:boolean
}
→ 관리자 설정으로 버튼 추가 가능
• 
• 
• 
• 
• 
• 
• 
• 
3

12. 결론
이 화면은 단순 UI가 아니라 "업무 시작 허브"이다.
향후 기능 확장 시 - 위젯 추가 - 버튼 추가 - 상태 카드 추가
구조 변경 없이 확장 가능하도록 설계한다.
4

