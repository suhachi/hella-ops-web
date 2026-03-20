HELLA company 업무관리사이트 — 화면별 와이어프레
임 + UI 구조 정의서
문서 ID: WIREFRAME_UI 문서 목적: 실제 화면 구현을 위한 UI 구조 / 컴포넌트 / 사용자 인터랙션 기준 정의
1. 문서 개요
이 문서는 HELLA OPS 시스템의 모든 화면을 초원자 단위 UI 컴포넌트 기준으로 분해한 문서이다.
이 문서를 기준으로 - 프론트엔드 컴포넌트 설계 - 화면 개발 단위 분리 - 상태관리 구조 설계
가 진행된다.
2. 공통 레이아웃 구조
2-1. 관리자 레이아웃 (/app)
구성 - Sidebar - 로고 - 메뉴 리스트 - Header - 사용자 정보 - 알림 - Main Content
컴포넌트 구조 - SidebarItem - HeaderProfile - NotificationIcon - ContentWrapper
2-2. 사원 레이아웃 (/m)
구성 - Header (간단) - Content - Bottom Tab
탭 구성 - 홈 - 일정 - 장비 - 메뉴얼 - 내정보
3. 로그인 화면
UI 구조
Logo
Input: employeeId
Input: password
Button: login
Error Message
• 
• 
• 
• 
• 
1

상태
loading
error
4. 관리자 대시보드
UI 구조
KPI 카드
오늘 일정 수
진행중
미마감
미반입 장비
최근 활동 리스트
빠른 액션 버튼
컴포넌트
StatCard
ActivityList
QuickActionButton
5. 일정관리 화면
목록 화면
필터
날짜
카테고리
일정 리스트
상세 화면
일정 정보
배정 사원 리스트
상태
생성 화면
입력폼
제목
주소
날짜
시간
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
2

사원 선택
6. 마감 화면 (사원)
UI 구조
시작시간 입력
종료시간 입력
특이사항 입력
사진 업로드
제출 버튼
상태
draft
submitted
7. 장비 반출/반입 화면
반출
NFC 스캔 버튼
장비 정보 표시
반출 버튼
반입
NFC 스캔 버튼
반입 버튼
8. 장비관리 (관리자)
목록
장비 리스트
상태 표시
상세
장비 정보
이력
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
3

등록
장비 정보 입력
9. 사원관리
목록
사원 리스트
상세
프로필
참여 기록
등록
입력폼
10. 메뉴얼
목록
카테고리 필터
리스트
상세
본문
작성
에디터
11. 정기청소
장소 목록
리스트
상세
일정
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

참여 입력
시작/종료 입력
12. 공통 컴포넌트
Button
Input
Modal
Toast
ImageUploader
TimePicker
13. 상태관리 구조
user
schedules
equipments
manuals
uiState
14. 결론
이 문서는 - UI 설계 기준 - 프론트 개발 기준
으로 사용된다.
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

