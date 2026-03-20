HELLA company 업무관리사이트 — 관리자 장비관리 화
면 초정밀 와이어프레임 정의서
문서 ID: WIREFRAME_ADMIN_EQUIPMENT_MANAGEMENT 문서 목적: NFC 기반 장비 등록, 상태 추적, 반출/반입
관리, 미반입 추적까지 관리자 관점에서 완전 통제 가능한 장비관리 화면을 초원자 단위로 정의한다.
1. 화면 개요
Route
/app/equipments
/app/equipments/new
/app/equipments/:id
핵심 목적
장비 등록 (NFC 매핑 포함)
장비 상태 추적
반출/반입 로그 관리
미반입 장비 실시간 식별
장비 이력 조회
2. 전체 구조
AdminEquipmentPage
 ├─ PageHeader
 ├─ ActionBar
 ├─ FilterPanel
 ├─ EquipmentTable
 ├─ EquipmentDetailDrawer
 └─ AlertPanel (미반입 강조)
3. PageHeader
제목: 장비관리
설명: NFC 기반 장비 반출/반입 관리
• 
• 
• 
1. 
2. 
3. 
4. 
5. 
• 
• 
1

4. ActionBar
버튼 - 장비 등록 - 엑셀 다운로드 - NFC 태깅 등록 모드
5. FilterPanel
필터 - 상태 (보유 / 반출 / 미반입) - 장비 유형 - 사원 - 검색 (장비명 / 코드)
6. EquipmentTable
컬럼 - 장비명 - NFC UID - 상태 - 현재 사용자 - 마지막 반출시간 - 마지막 반입시간 - 상세
상태 색상 - 보유: 초록 - 반출: 파랑 - 미반입: 빨강
7. EquipmentDetailDrawer
구성
기본정보
상태
반출/반입 로그
기본정보
장비명
NFC UID
등록일
상태
현재 상태
현재 사용자
로그
반출 시간
반입 시간
사용자
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

8. 장비 등록 화면
필드
장비명
장비 유형
NFC 태그 스캔
NFC 등록 흐름
NFC 태그 접촉
UID 읽기
장비와 매핑
9. 상태 정의
AVAILABLE
CHECKED_OUT
OVERDUE
10. 이벤트
장비 등록
NFC 태그 등록
반출 기록 생성
반입 기록 생성
11. API
createEquipment
assignNfc
checkoutEquipment
returnEquipment
getEquipmentLogs
12. 확장 설계
다지점 관리
가맹점별 장비 분리
QR fallback
• 
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

13. 결론
이 화면은 단순 관리가 아니라 "장비 흐름 추적 시스템"이다.
4

