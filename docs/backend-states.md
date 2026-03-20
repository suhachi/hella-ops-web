# HELLA OPS - 백엔드 상태 및 예외(Boring States) 정의서

## 1. 상태 머신 규칙 (허용된 전이만 통과)
- **일정 (`schedules.status`):** `PLANNED` → `IN_PROGRESS` → `COMPLETED` [15] (또는 `DELAYED`, `CANCELLED`)
- **작업자 (`schedule_workers.workStatus`):** `ASSIGNED` → `STARTED` → `ENDED` → `CLOSED` [16]
- **장비 (`equipments.status`):** `AVAILABLE` ↔ `CHECKED_OUT` [17]

## 2. 예외 상태 (Boring States) 대처법 (Graceful Fallback) [18, 19]
에러를 뿜지 말고 아래 문구를 화면에 렌더링하십시오.
- **사원 홈 일정 0건:** "오늘 일정 없음. 현재 배정된 업무가 없습니다."
- **사원 홈 장비 0건:** "현재 보유 장비 없음. 반출 처리된 장비가 있으면 이곳에 표시됩니다."
- **관리자 대시보드 알림 0건:** "현재 즉시 처리할 항목이 없습니다."
- **마감 시 사진 0장 또는 오류:** "업로드 실패 사진이 존재합니다" (마감 제출 Hard Block 처리) [2]
