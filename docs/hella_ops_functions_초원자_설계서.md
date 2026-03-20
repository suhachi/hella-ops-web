# HELLA OPS — Functions 초원자 설계서

---

# 0. 문서 목적

이 문서는 **HELLA company 업무관리사이트**의 Firebase Functions를
개발 직전 수준으로 **초원자 단위**까지 분해하여 정의한 최종 설계 문서다.

이 문서의 목적은 다음과 같다.

1. 어떤 기능을 반드시 서버에서 처리해야 하는지 고정한다.
2. 각 Function의 입력값, 검증, 트랜잭션 범위, 출력값, 실패 케이스를 고정한다.
3. 클라이언트가 직접 상태를 바꾸지 못하도록 서버 중심 상태 전이 구조를 고정한다.
4. 로그 생성, 감사 추적, 동시성 방어, 예외 상태 처리 방식을 고정한다.
5. 실제 Firebase Functions 코드 작성 전에 그대로 실행 설계서로 사용할 수 있게 만든다.

이 문서는 단순한 아이디어 문서가 아니라,
**실제 구현에 바로 들어갈 수 있는 서버 함수 SSOT**로 사용한다.

---

# 1. 최상위 원칙

## 1.1 시스템 철학

이 프로젝트의 서버 함수는 아래 원칙 위에서만 동작한다.

- 사원은 입력만 한다.
- 상태는 서버가 계산한다.
- 중요한 액션은 반드시 로그로 남긴다.
- 교차 문서 정합성이 필요한 작업은 반드시 트랜잭션으로 처리한다.
- 클라이언트 편의 때문에 상태 무결성을 깨지 않는다.

---

## 1.2 Functions가 반드시 필요한 이유

이 시스템은 일반 CRUD 웹앱이 아니다.

다음 작업은 단일 문서 수정이 아니라,
여러 문서의 상태를 함께 판단하고 함께 바꿔야 한다.

- 일정 생성 시 `schedules` + `schedule_workers`
- 작업 시작/종료 시 `schedule_workers` + `schedules`
- 마감 제출 시 `schedule_closings` + `schedule_workers` + `schedules`
- 장비 반출/반입 시 `equipments` + `equipment_logs` + `audit_logs`
- 지연/미반입 판정 시 상태 재계산 + 로그

즉,
**Functions는 선택이 아니라 구조적 필수**다.

---

## 1.3 서버 함수 공통 규칙

### 규칙 A. 모든 함수는 인증 사용자만 호출 가능
- 비로그인 차단
- 비활성 계정 차단
- role 기반 추가 검증 수행

### 규칙 B. 입력값은 절대 신뢰하지 않음
- clientTimestamp는 참고용일 뿐 상태 판정 기준 아님
- userName, role, status 같은 값은 서버에서 다시 조회
- equipmentId, scheduleId, workerId는 서버 재검증 필수

### 규칙 C. 상태 전이는 허용된 흐름만 통과
- `schedules.status`
- `schedule_workers.workStatus`
- `schedule_closings.status`
- `equipments.status`

모두 허용된 전이만 통과한다.

### 규칙 D. 로그는 append only
- `equipment_logs` 수정 금지
- `audit_logs` 수정/삭제 금지
- 필요 시 `download_logs` 생성

### 규칙 E. Functions는 한국어 에러 메시지/코드 체계를 갖는다.
- 사용자용 메시지
- 개발자용 code
- 내부 log payload 분리

---

# 2. Functions 아키텍처 원칙

## 2.1 지역(Region)
- `asia-northeast3` 고정

## 2.2 런타임
- TypeScript
- Firebase Functions v2 권장

## 2.3 계층 구조

권장 구조:

```ts
functions/src/
  index.ts
  shared/
    auth.ts
    errors.ts
    firestore.ts
    logger.ts
    validators.ts
    timestamps.ts
    audit.ts
  domains/
    schedules/
      createScheduleWithWorkers.ts
      updateScheduleAndWorkers.ts
      cancelSchedule.ts
      recordWorkStart.ts
      recordWorkEnd.ts
      submitClosing.ts
      reviewClosing.ts
      recomputeScheduleStatus.ts
      syncSchedulePhotoFlags.ts
    equipments/
      createEquipment.ts
      updateEquipmentMeta.ts
      assignNfcTag.ts
      checkoutEquipment.ts
      checkinEquipment.ts
      forceUpdateEquipmentStatus.ts
      markEquipmentOverdueBatch.ts
    users/
      upsertUserProfile.ts
      setUserActiveState.ts
      setUserRole.ts
    manuals/
      publishManual.ts
    logs/
      appendAuditLog.ts
      createDownloadLog.ts
    maintenance/
      recalcDashboardMetrics.ts
      cleanupDrafts.ts
```

---

## 2.4 호출 방식

### Callable Functions
즉시 사용자 상호작용이 필요한 기능
- 작업 시작
- 작업 종료
- 마감 제출
- 장비 반출
- 장비 반입
- NFC 매핑
- 일정 생성/수정/취소

### HTTP / Admin-only Endpoint
운영 배치나 내부 관리용
- 대시보드 재집계
- 미반입 판정 배치
- 데이터 복구성 작업
- 시드/유지보수

### Scheduler / Trigger
자동 판정 작업
- 장비 OVERDUE 배치
- 일정 DELAYED 후보 계산
- 집계 캐시 재생성

---

# 3. 공통 타입 및 Helper 설계

## 3.1 공통 인증 컨텍스트

```ts
interface AuthContextPayload {
  uid: string;
  role: 'EMPLOYEE' | 'LEADER' | 'ADMIN' | 'SUPER_ADMIN';
  displayName: string;
  isActive: boolean;
}
```

서버 함수 진입 시 항상 아래를 수행한다.

1. Firebase Auth 사용자 확인
2. `users/{uid}` 조회
3. `isActive === true` 확인
4. role 확인
5. displayName 확보

---

## 3.2 공통 응답 구조

```ts
interface FunctionSuccess<T> {
  ok: true;
  code: string;
  message: string;
  data: T;
}

interface FunctionFailure {
  ok: false;
  code: string;
  message: string;
  retryable?: boolean;
  fieldErrors?: Record<string, string>;
}
```

---

## 3.3 공통 에러 코드 체계

```ts
AUTH_REQUIRED
ACCOUNT_INACTIVE
ROLE_FORBIDDEN
INVALID_INPUT
NOT_FOUND
STATUS_CONFLICT
ALREADY_PROCESSED
NFC_NOT_SUPPORTED_POLICY
NFC_MAPPING_NOT_FOUND
EQUIPMENT_DISABLED
EQUIPMENT_ALREADY_CHECKED_OUT
EQUIPMENT_ALREADY_AVAILABLE
SCHEDULE_NOT_ASSIGNED
WORK_START_REQUIRED
WORK_END_INVALID
PHOTO_UPLOAD_INCOMPLETE
CLOSING_ALREADY_SUBMITTED
TRANSACTION_CONFLICT
INTERNAL_ERROR
```

---

## 3.4 공통 감사 로그 생성 Helper

```ts
interface AuditLogInput {
  actorUserId: string;
  actorUserName: string;
  actorRole: string;
  targetCollection: string;
  targetDocumentId: string;
  action: string;
  reason?: string;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
}
```

원칙:
- 중요한 상태 변경은 audit log 생성
- before/after 전체를 무조건 넣기보다 핵심 필드만 넣는 전략 허용
- 개인정보 과다 기록 금지

---

## 3.5 공통 시간 처리 원칙

- 서버 기준 시간 = `FieldValue.serverTimestamp()` 또는 서버 시각
- 클라이언트 시간은 보조 참고값일 뿐 최종 기준 아님
- 역시간(end < start) 차단
- 과도한 backdate 입력 차단 정책 적용 가능

---

# 4. 도메인별 Functions 전체 목록

```ts
[인증/사용자]
- upsertUserProfile
- setUserActiveState
- setUserRole

[일정]
- createScheduleWithWorkers
- updateScheduleAndWorkers
- cancelSchedule
- recordWorkStart
- recordWorkEnd
- submitClosing
- reviewClosing
- recomputeScheduleStatus
- syncSchedulePhotoFlags

[정기청소]
- createRegularCleaningAttendanceBatch
- recordRegularCleaningStart
- recordRegularCleaningEnd
- approveRegularCleaningAttendance

[장비/NFC]
- createEquipment
- updateEquipmentMeta
- assignNfcTag
- checkoutEquipment
- checkinEquipment
- forceUpdateEquipmentStatus
- markEquipmentOverdueBatch

[로그/다운로드]
- appendAuditLog
- createDownloadLog

[운영/모니터링]
- recalcDashboardMetrics
- detectDelayedSchedulesBatch
- cleanupDrafts
```

---

# 5. 사용자/권한 도메인 Functions

---

# 5-1. upsertUserProfile

## 목적
- Auth 사용자와 `users` 프로필 문서를 동기화한다.
- 최초 로그인 후 프로필 보정 또는 관리자 생성 계정 초기화에 사용한다.

## 호출 주체
- ADMIN / SUPER_ADMIN
- 또는 Auth 트리거 기반 내부 호출

## 입력
```ts
{
  uid: string;
  employeeId: string;
  displayName: string;
  phone?: string;
  role: 'EMPLOYEE' | 'LEADER' | 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  department?: string;
  position?: string;
  managerId?: string;
}
```

## 검증
- 호출자 관리자 권한 확인
- uid 유효성 확인
- employeeId 중복 여부 확인
- role 허용 enum 검증

## 처리
1. 기존 users 문서 조회
2. 신규면 생성, 기존이면 허용 필드만 업데이트
3. `updatedAt` 서버시간 기록
4. 감사 로그 생성

## 출력
```ts
{
  userId: string;
  created: boolean;
}
```

## 금지
- 일반 사원 직접 호출 금지
- uid 교체형 업데이트 금지

---

# 5-2. setUserActiveState

## 목적
- 사원 계정 활성/비활성 변경

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  userId: string;
  isActive: boolean;
  reason?: string;
}
```

## 처리
1. 대상 user 조회
2. 존재 여부 확인
3. isActive 변경
4. updatedAt 갱신
5. audit log 생성

## 정책
- 물리 삭제 없음
- 비활성 계정은 로그인 후에도 보호 데이터 접근 불가

---

# 5-3. setUserRole

## 목적
- 사용자 role 변경

## 호출 주체
- SUPER_ADMIN 권장
- ADMIN은 범위 제한 가능

## 입력
```ts
{
  userId: string;
  nextRole: 'EMPLOYEE' | 'LEADER' | 'ADMIN' | 'SUPER_ADMIN';
  reason?: string;
}
```

## 처리
1. 호출자 role 권한 확인
2. 자기 자신 role 하향/승격 정책 확인
3. 대상 user 조회
4. role 업데이트
5. audit log 생성

## 금지
- 일반 ADMIN이 SUPER_ADMIN 승격 처리 금지
- 본인 self-escalation 금지

---

# 6. 일정 도메인 Functions

---

# 6-1. createScheduleWithWorkers

## 목적
- 일정 생성과 동시에 `schedule_workers`를 원자적으로 만든다.

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  scheduleTitle: string;
  categoryId: string;
  subcategoryId?: string;
  siteAddress: string;
  siteAddressDetail?: string;
  scheduleDate: string;
  startTime: string;
  expectedEndTime?: string;
  workerIds: string[];
  leaderUserId?: string;
  customerName?: string;
  customerPhone?: string;
  specialNotes?: string;
  extraMemo?: string;
}
```

## 선행 검증
- 관리자 권한 확인
- 제목/날짜/시작시간/주소 필수값 확인
- 종료예정시간이 시작시간보다 빠르지 않은지 확인
- category/subcategory 활성 상태 확인
- workerIds에 포함된 사용자 존재 및 활성 여부 확인
- 비활성 사원 배정 금지
- leaderUserId가 있다면 workerIds 내부인지 확인

## 트랜잭션 범위
1. `schedules/{scheduleId}` 생성
2. `workerIds` 수만큼 `schedule_workers` 생성
3. 필요 시 `assignedWorkerNamesCache` 생성
4. 초기 상태/카운트 캐시 입력
5. audit log 생성

## 기본 상태
- schedule.status = `PLANNED`
- schedule_worker.assignmentStatus = `ASSIGNED`
- schedule_worker.workStatus = `ASSIGNED`

## 출력
```ts
{
  scheduleId: string;
  workerCount: number;
}
```

## 실패 케이스
- 비활성 사원 포함
- 잘못된 날짜/시간
- 카테고리 비활성
- 트랜잭션 충돌

## 주의
- 클라이언트가 schedules 먼저 만들고 schedule_workers 나중에 만드는 구조 금지

---

# 6-2. updateScheduleAndWorkers

## 목적
- 일정 메타데이터 수정과 배정 인원 변경을 일관되게 처리

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  scheduleId: string;
  scheduleTitle?: string;
  categoryId?: string;
  subcategoryId?: string;
  siteAddress?: string;
  siteAddressDetail?: string;
  scheduleDate?: string;
  startTime?: string;
  expectedEndTime?: string;
  workerIds?: string[];
  leaderUserId?: string | null;
  customerName?: string;
  customerPhone?: string;
  specialNotes?: string;
  extraMemo?: string;
}
```

## 핵심 정책
- 진행 중/완료 일정 수정 범위 제한 가능
- 이미 STARTED 된 worker를 단순 제거하지 않음
- workerIds 변경 시 `schedule_workers` 차집합 계산 필요

## 처리
1. schedule 조회
2. 수정 가능 상태 확인
3. workerIds 변경 여부 판단
4. 추가 인원은 새 `schedule_workers` 생성
5. 제거 인원은 물리 삭제 대신 `assignmentStatus = CANCELLED` 권장
6. schedule cache 재계산
7. audit log 생성

## 금지
- 진행 중 기록을 무시하고 배정 구조 전체 초기화 금지

---

# 6-3. cancelSchedule

## 목적
- 일정을 취소 상태로 전환하고 관련 참여 문서를 정리한다.

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  scheduleId: string;
  reason: string;
}
```

## 검증
- 완료 일정 취소 허용 여부 정책 검토
- 이미 취소된 일정 중복 취소 차단

## 트랜잭션 처리
1. schedule 조회
2. status = `CANCELLED`
3. cancelledAt / cancelledReason 기록
4. 아직 시작하지 않은 schedule_workers는 assignmentStatus 또는 workStatus를 `CANCELLED`로 정리
5. audit log 생성

## 출력
```ts
{
  scheduleId: string;
  nextStatus: 'CANCELLED';
}
```

---

# 6-4. recordWorkStart

## 목적
- 사원이 작업 시작을 기록한다.
- `schedule_workers`를 `STARTED`로 전환하고,
- 필요 시 `schedules.status`를 `IN_PROGRESS`로 재계산한다.

## 호출 주체
- EMPLOYEE / LEADER

## 입력
```ts
{
  scheduleId: string;
  startAt?: string;
}
```

## 서버 검증
1. 인증/활성 사용자 확인
2. 해당 schedule_worker가 본인에게 배정되어 있는지 확인
3. schedule 존재 확인
4. schedule 상태가 취소/완료인지 확인
5. 이미 STARTED 또는 그 이후 상태인지 확인
6. 입력 startAt이 있으면 서버 정책 범위 내인지 검증

## 트랜잭션 처리
1. 본인 schedule_worker 문서 조회
2. `actualStartAt` 기록
3. `workStatus = STARTED`
4. 동일 schedule의 started 현황 조회
5. 조건 만족 시 `schedules.status = IN_PROGRESS`
6. `startedWorkerCount`, `activeWorkerCount` 등 캐시 재계산
7. audit log 생성

## 상태 전이
- `ASSIGNED → STARTED`만 허용

## 출력
```ts
{
  scheduleId: string;
  workerId: string;
  workerStatus: 'STARTED';
  scheduleStatus: 'PLANNED' | 'IN_PROGRESS';
  actualStartAt: string;
}
```

## 실패 케이스
- 본인 배정 아님
- 이미 시작됨
- 일정 취소/완료
- 잘못된 시간 입력

---

# 6-5. recordWorkEnd

## 목적
- 사원이 작업 종료를 기록한다.
- `schedule_workers.workStatus`를 `ENDED`로 바꾼다.
- 단, 일정 전체 완료는 이 단계에서 확정하지 않는다.

## 호출 주체
- EMPLOYEE / LEADER

## 입력
```ts
{
  scheduleId: string;
  endAt?: string;
}
```

## 검증
1. 본인 schedule_worker 존재 확인
2. 현재 workStatus가 `STARTED`인지 확인
3. `actualStartAt` 존재 확인
4. endAt > actualStartAt 확인
5. 이미 종료된 문서 중복 종료 차단

## 트랜잭션 처리
1. schedule_worker 조회
2. `actualEndAt` 기록
3. `workStatus = ENDED`
4. schedule 단위 ended 집계 캐시 업데이트
5. audit log 생성

## 출력
```ts
{
  scheduleId: string;
  workerId: string;
  workerStatus: 'ENDED';
  actualEndAt: string;
}
```

## 주의
- `ENDED`는 개인 종료일 뿐,
  `schedules.status = COMPLETED`는 마감 제출/필수 조건 충족 후 서버가 별도로 계산한다.

---

# 6-6. submitClosing

## 목적
- 사원의 공식 마감 기록을 생성/제출한다.
- 사진/시간/특이사항 검증 후 `schedule_closings` 생성 또는 DRAFT→SUBMITTED 전환
- `schedule_workers` 및 `schedules` 상태를 재계산한다.

## 호출 주체
- EMPLOYEE / LEADER

## 입력
```ts
{
  scheduleId: string;
  notes?: string;
  beforePhotoIds: string[];
  afterPhotoIds: string[];
  draftMode?: boolean;
}
```

## 사전 데이터 조회
- 본인 `schedule_worker`
- 해당 schedule
- 본인이 업로드한 `schedule_photos`
- 기존 closing 존재 여부

## 핵심 정책
- before 최소 1장
- after 최소 1장
- 업로드 실패 사진 존재 시 SUBMITTED 차단
- 시작/종료 시간 없으면 제출 차단
- 이미 SUBMITTED 이상이면 중복 제출 차단
- 오프라인 draft는 클라이언트 저장 가능하나,
  서버 공식 기록은 제출 시점에만 생성

## 처리 분기

### A. draftMode = true
권장 정책:
- 서버 DRAFT 저장은 MVP에서 선택사항
- 기본은 클라이언트 local draft 유지
- 서버 DRAFT를 쓸 경우에도 상태 확정 없음

### B. 최종 제출
1. 본인 schedule_worker가 `ENDED`인지 확인 또는 최소 start/end 존재 확인
2. before/after 사진 메타데이터 검증
3. 실패 사진 여부 검증
4. `schedule_closings` 생성 또는 update
5. status = `SUBMITTED`
6. `beforePhotoCount`, `afterPhotoCount`, `submittedAt` 기록
7. schedule_worker를 `CLOSED` 또는 제출완료 후보 상태로 갱신
8. schedule의 `hasClosingRecord`, `hasBeforePhotos`, `hasAfterPhotos` 갱신
9. 전체 worker 완료 조건 충족 시 `schedules.status = COMPLETED`
10. completedAt 기록 가능
11. audit log 생성

## 출력
```ts
{
  scheduleId: string;
  closingId: string;
  closingStatus: 'SUBMITTED';
  beforePhotoCount: number;
  afterPhotoCount: number;
  scheduleStatus: 'IN_PROGRESS' | 'COMPLETED';
}
```

## 실패 케이스
- startAt 없음
- endAt 없음
- endAt <= startAt
- before/after 부족
- 사진 업로드 실패 존재
- 중복 제출
- 본인 배정 아님

---

# 6-7. reviewClosing

## 목적
- 관리자가 제출된 마감을 검토/승인/반려/강제조정한다.

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  closingId: string;
  action: 'REVIEW' | 'APPROVE' | 'REJECT' | 'FORCE_ADJUST';
  adminReviewNote?: string;
  reason?: string;
}
```

## 상태 전이
- `SUBMITTED → REVIEWED`
- `REVIEWED → APPROVED`
- `REVIEWED → REJECTED`
- `APPROVED/REJECTED → FORCE_ADJUSTED`

## 처리
1. closing 조회
2. 상태 전이 허용 여부 검증
3. reviewStatus / adminReviewNote / approvedBy / approvedAt 등 기록
4. 필요 시 schedule_worker.review 상태 반영
5. audit log 생성

## 출력
```ts
{
  closingId: string;
  nextStatus: string;
}
```

---

# 6-8. recomputeScheduleStatus

## 목적
- 일정 상태를 서버 기준으로 재계산한다.
- 개별 함수 내부 호출용이며 외부 호출은 관리자용 재동기화로 제한한다.

## 호출 주체
- 내부 함수
- ADMIN 재동기화 요청 가능

## 입력
```ts
{
  scheduleId: string;
}
```

## 계산 기준
- 하나 이상의 worker STARTED → `IN_PROGRESS` 후보
- 모든 필수 worker가 종료/마감 제출 완료 → `COMPLETED` 후보
- expectedEndTime 초과 + 미마감 → `DELAYED` 후보
- 취소면 `CANCELLED` 유지

## 처리
1. schedule 조회
2. 관련 schedule_workers / closings 집계
3. nextStatus 계산
4. 변경 필요 시 schedule 업데이트
5. cache 필드 재계산

## 출력
```ts
{
  scheduleId: string;
  previousStatus: string;
  nextStatus: string;
}
```

---

# 6-9. syncSchedulePhotoFlags

## 목적
- schedule의 `hasBeforePhotos`, `hasAfterPhotos` 캐시를 재계산한다.

## 호출 주체
- 내부 호출
- 관리자 복구성 호출 가능

## 입력
```ts
{
  scheduleId: string;
}
```

## 처리
1. 해당 schedule의 photo metadata 조회
2. BEFORE/AFTER 존재 여부 계산
3. schedule flag 갱신

---

# 7. 정기청소 도메인 Functions

---

# 7-1. createRegularCleaningAttendanceBatch

## 목적
- 특정 날짜 정기청소 장소에 대해 배정 인원 attendance 문서를 생성한다.

## 호출 주체
- ADMIN

## 입력
```ts
{
  siteId: string;
  dateKey: string;
  workerIds: string[];
}
```

## 처리
1. 장소 존재/활성 검증
2. 사원 활성 검증
3. 중복 attendance 존재 여부 확인
4. 각 worker별 attendance 생성
5. audit log 생성

---

# 7-2. recordRegularCleaningStart

## 목적
- 사원이 정기청소 시작시간 기록

## 호출 주체
- EMPLOYEE / LEADER

## 입력
```ts
{
  attendanceId: string;
  startAt?: string;
}
```

## 처리
- 본인 attendance 확인
- startAt 기록
- 파생 상태 STARTED 후보 계산

---

# 7-3. recordRegularCleaningEnd

## 목적
- 사원이 정기청소 종료시간 기록

## 처리
- 본인 attendance 확인
- endAt > startAt 확인
- endAt 기록

---

# 7-4. approveRegularCleaningAttendance

## 목적
- 관리자 참여 인정/보정

## 호출 주체
- ADMIN

## 입력
```ts
{
  attendanceId: string;
  participationApproved: boolean;
  adminAdjustmentNote?: string;
}
```

## 처리
- 관리자 검증
- approval 상태 갱신
- 통계 재집계 후보 enqueue 가능

---

# 8. 장비 / NFC 도메인 Functions

---

# 8-1. createEquipment

## 목적
- 관리자 장비 등록

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  equipmentCode: string;
  name: string;
  serialNumber?: string;
  category?: string;
  storageLocation?: string;
  note?: string;
  isActive?: boolean;
}
```

## 처리
1. 장비 코드 중복 확인
2. equipment 생성
3. 기본 상태 = `AVAILABLE`
4. audit log 생성

## 출력
```ts
{
  equipmentId: string;
  status: 'AVAILABLE';
}
```

---

# 8-2. updateEquipmentMeta

## 목적
- 장비 메타정보 수정
- 상태 필드는 여기서 수정하지 않는다.

## 호출 주체
- ADMIN / SUPER_ADMIN

## 수정 허용 필드
- equipmentCode
- name
- serialNumber
- category
- storageLocation
- note
- isActive

## 금지
- status
- currentHolderUserId
- currentHolderName
- lastCheckoutAt
- lastCheckinAt

---

# 8-3. assignNfcTag

## 목적
- NFC 태그를 장비에 1:1 매핑한다.

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  equipmentId: string;
  nfcTagId: string;
}
```

## 핵심 정책
- 1장비 ↔ 1태그 1:1
- ACTIVE 중복 매핑 금지
- 기존 ACTIVE 매핑이 있으면 비활성 전환/교체 정책 필요

## 트랜잭션 처리
1. equipment 조회
2. 기존 ACTIVE mapping 조회
3. 같은 nfcTagId의 중복 ACTIVE mapping 확인
4. `nfc_tag_mappings` 생성 또는 전환
5. equipment.nfcTagId 반영
6. `equipment_logs`에 `NFC_MAP` 타입 로그 생성 가능
7. audit log 생성

## 실패 케이스
- 이미 다른 장비에 ACTIVE 매핑됨
- 비활성 장비
- 장비 없음

---

# 8-4. checkoutEquipment

## 목적
- NFC 반출 엔진 핵심 함수
- 장비 상태 변경과 로그 생성을 원자적으로 처리

## 호출 주체
- EMPLOYEE / LEADER
- ADMIN도 사용 가능

## 입력
```ts
{
  nfcTagId: string;
  reason?: string;
  useLocation?: string;
  note?: string;
  clientTimestamp?: string;
}
```

## 사전 검증
1. 호출자 인증/활성 확인
2. `nfc_tag_mappings`에서 ACTIVE mapping 조회
3. equipment 존재 확인
4. equipment.isActive = true 확인
5. equipment.status = `AVAILABLE` 확인
6. equipment.nfcTagId와 mapping 일치 확인
7. 동시 처리 충돌 대비 재조회 준비

## 트랜잭션 처리
1. equipment 문서 재조회
2. 최신 status가 AVAILABLE인지 재확인
3. `status = CHECKED_OUT`
4. `currentHolderUserId = actor.uid`
5. `currentHolderName = actor.displayName`
6. `lastCheckoutAt = serverTimestamp`
7. `equipment_logs` 생성
   - actionType = `CHECK_OUT`
   - previousStatus = `AVAILABLE`
   - nextStatus = `CHECKED_OUT`
8. `audit_logs` 생성
9. 커밋

## 출력
```ts
{
  equipmentId: string;
  equipmentName: string;
  status: 'CHECKED_OUT';
  checkedOutAt: string;
  holderUserId: string;
  holderName: string;
}
```

## 실패 케이스
- 태그 미등록
- 장비 비활성
- 이미 반출중
- 상태 충돌
- 중복 ACTIVE 매핑

## 절대 금지
- UI에서 status만 바꾸는 처리
- 로그 나중 생성
- holder 나중 설정

---

# 8-5. checkinEquipment

## 목적
- NFC 반입 엔진 핵심 함수

## 호출 주체
- EMPLOYEE / LEADER
- ADMIN도 가능

## 입력
```ts
{
  nfcTagId: string;
  note?: string;
  clientTimestamp?: string;
}
```

## 검증
1. 호출자 인증/활성 확인
2. mapping 조회
3. equipment 조회
4. equipment.status ∈ {`CHECKED_OUT`, `OVERDUE`} 확인
5. nfcTagId 일치 확인

## 정책 선택 포인트
- 본인만 반입 가능하게 제한할지
- 타인이 대리 반입 허용할지

MVP 권장:
- 기본은 허용하되 로그에 actor를 정확히 남김
- 필요 시 본인 반출 장비만 반입 가능 정책으로 강화 가능

## 트랜잭션 처리
1. equipment 재조회
2. status가 CHECKED_OUT 또는 OVERDUE인지 확인
3. `status = AVAILABLE`
4. currentHolderUserId / currentHolderName 제거
5. `lastCheckinAt = serverTimestamp`
6. `equipment_logs` 생성
   - actionType = `CHECK_IN`
   - previousStatus = 기존 상태
   - nextStatus = `AVAILABLE`
7. `audit_logs` 생성
8. 커밋

## 출력
```ts
{
  equipmentId: string;
  equipmentName: string;
  status: 'AVAILABLE';
  checkedInAt: string;
}
```

---

# 8-6. forceUpdateEquipmentStatus

## 목적
- 관리자 예외 처리용 상태 강제 변경
- 분실/고장/관리자 강제 해제 등 예외 상황 대응

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  equipmentId: string;
  nextStatus: 'AVAILABLE' | 'DISABLED';
  reason: string;
}
```

## 처리
1. 관리자 권한 확인
2. 기존 상태 조회
3. 허용된 예외 전이인지 확인
4. 상태 변경
5. 필요 시 holder 제거
6. equipment_logs 생성 (`FORCE_UPDATE` 또는 `DISABLE`)
7. audit log 생성

## 주의
- 일반 반출/반입 함수와 분리 유지
- 반드시 사유 입력

---

# 8-7. markEquipmentOverdueBatch

## 목적
- 미반입 장비 자동 판정

## 호출 주체
- Scheduler
- 또는 관리자 수동 실행

## 입력
```ts
{
  thresholdHours?: number;
}
```

## 기본 정책
- `lastCheckoutAt` 기준 24시간 초과 시 OVERDUE 후보
- 장비 유형별 threshold 분기 확장 가능

## 처리
1. CHECKED_OUT 상태 장비 조회
2. threshold 초과 여부 판정
3. `status = OVERDUE` 갱신
4. 필요 시 equipment_logs 생성
5. 필요 시 경고 알림용 집계 갱신

## 출력
```ts
{
  scannedCount: number;
  markedOverdueCount: number;
}
```

---

# 9. 로그 / 다운로드 도메인 Functions

---

# 9-1. appendAuditLog

## 목적
- 다른 함수에서 공통적으로 호출하는 내부 Helper 또는 보조 함수

## 원칙
- 외부 공개 callable로 두기보다 shared helper 권장
- 로그 실패가 본 트랜잭션 전체 실패를 유발할지 여부 정책 필요

권장:
- 장비 반출/반입 같이 감사 중요도가 높은 작업은 동일 트랜잭션 내 처리
- 부수적 읽기 액션 로그는 비동기 허용 가능

---

# 9-2. createDownloadLog

## 목적
- 관리자 엑셀/CSV 다운로드 행위를 기록

## 호출 주체
- ADMIN / SUPER_ADMIN

## 입력
```ts
{
  exportType: string;
  filterSnapshot?: Record<string, any>;
}
```

## 처리
1. 관리자 권한 확인
2. `download_logs` 생성
3. 필요 시 audit log 생성

---

# 10. 운영 / 모니터링 도메인 Functions

---

# 10-1. recalcDashboardMetrics

## 목적
- 관리자 대시보드 KPI/위젯용 캐시 재계산

## 호출 주체
- Scheduler
- ADMIN 수동 실행 가능

## 계산 대상 예시
- 오늘 전체 일정 수
- 진행중 일정 수
- 미마감 건수
- 미반입 장비 수
- 최근 활동 목록용 캐시

## 처리
- 조회 기반 즉시 계산 또는 cache collection 저장
- 무거운 쿼리는 배치 캐시로 분리 가능

---

# 10-2. detectDelayedSchedulesBatch

## 목적
- 일정 지연 자동 판정

## 기준 예시
- expectedEndTime 초과
- 완료/마감 미충족
- 취소 아님

## 처리
1. 진행 중 또는 예정 일정 조회
2. 지연 후보 판정
3. `schedules.status = DELAYED` 반영
4. audit log 생성 가능

---

# 10-3. cleanupDrafts

## 목적
- 서버 DRAFT 전략을 사용할 경우 오래된 draft 정리

## 주의
- 현재 MVP는 클라이언트 local draft 우선이므로,
  이 함수는 확장 옵션으로 분류한다.

---

# 11. 함수별 트랜잭션 정책 정리

## 반드시 트랜잭션
- createScheduleWithWorkers
- updateScheduleAndWorkers (배정 변경 포함 시)
- cancelSchedule
- recordWorkStart (schedule cache 동시 갱신 시)
- recordWorkEnd (cache 갱신 시)
- submitClosing
- assignNfcTag
- checkoutEquipment
- checkinEquipment
- forceUpdateEquipmentStatus

## 배치/조건부 트랜잭션
- markEquipmentOverdueBatch
- detectDelayedSchedulesBatch
- recalcDashboardMetrics

## 단순 write 가능
- createDownloadLog

---

# 12. 상태 전이별 Function 책임표

| 상태 대상 | 직접 변경 금지 | 상태 변경 담당 Function |
|---|---|---|
| schedules.status | 클라이언트 | recordWorkStart / submitClosing / recomputeScheduleStatus / cancelSchedule / detectDelayedSchedulesBatch |
| schedule_workers.workStatus | 클라이언트 직접 set 금지 권장 | recordWorkStart / recordWorkEnd / submitClosing / reviewClosing |
| schedule_closings.status | 사원 제출 이후 직접 수정 금지 | submitClosing / reviewClosing |
| equipments.status | 클라이언트 | checkoutEquipment / checkinEquipment / markEquipmentOverdueBatch / forceUpdateEquipmentStatus |

---

# 13. 보안 체크리스트

각 Function은 최소 아래를 만족해야 한다.

## 13.1 인증
- [ ] request.auth 확인
- [ ] users 문서 조회
- [ ] isActive 확인
- [ ] role 확인

## 13.2 입력 검증
- [ ] 필수값 검증
- [ ] enum 검증
- [ ] 문자열 trim
- [ ] 시간 역전 검증
- [ ] 참조 문서 존재 확인

## 13.3 상태 검증
- [ ] 이전 상태 확인
- [ ] 허용 전이만 통과
- [ ] 중복 처리 차단

## 13.4 정합성
- [ ] 관련 문서 재조회
- [ ] 트랜잭션 처리 여부 확인
- [ ] 로그 생성 포함

## 13.5 출력
- [ ] 사용자용 message
- [ ] code 반환
- [ ] 클라이언트 후속 UI 처리가 가능한 최소 데이터 반환

---

# 14. 함수 테스트 전략

## 14.1 단위 테스트
- validator 테스트
- 상태 전이 helper 테스트
- 시간 검증 테스트

## 14.2 통합 테스트 (Emulator 권장)
- 관리자 일정 생성 → workers 자동 생성
- 사원 작업 시작 → schedule IN_PROGRESS 전이
- 사원 종료 → worker ENDED
- 사진 업로드 완료 후 마감 제출 → schedule COMPLETED 전이
- 장비 반출 → CHECKED_OUT + log 생성
- 장비 반입 → AVAILABLE + log 생성
- OVERDUE 배치 전환

## 14.3 보안 테스트
- 비활성 계정 호출 차단
- 타인 scheduleId로 작업 시작 시 차단
- 잘못된 nfcTagId 반출 차단
- 이미 반출 장비 중복 반출 차단
- 이미 제출된 closing 재제출 차단

---

# 15. 클라이언트 연동 규칙

## 15.1 클라이언트가 보내는 것은 “명령”이 아니라 “입력”이다.

예를 들어:

### 잘못된 방식
```ts
updateDoc(scheduleRef, { status: 'COMPLETED' })
```

### 올바른 방식
```ts
callFunction('submitClosing', {
  scheduleId,
  beforePhotoIds,
  afterPhotoIds,
  notes,
})
```

서버가 검증 후 상태를 결정한다.

---

## 15.2 UI는 Function 결과를 그대로 신뢰하지 말고 재조회 전략을 함께 쓴다.

권장:
- 성공 후 해당 상세 쿼리 invalidate
- 대시보드 카드 invalidate
- 일정 상세 / 장비 목록 재조회

---

# 16. 초원자 구현 순서

가장 안전한 구현 순서는 아래와 같다.

## STEP F1
공통 shared helper 구현
- auth
- error
- logger
- validator
- audit helper

## STEP F2
일정 생성/배정
- createScheduleWithWorkers
- updateScheduleAndWorkers
- cancelSchedule

## STEP F3
사원 작업 흐름
- recordWorkStart
- recordWorkEnd
- submitClosing
- recomputeScheduleStatus
- syncSchedulePhotoFlags

## STEP F4
마감 관리자 검토
- reviewClosing

## STEP F5
장비 메타 + NFC 매핑
- createEquipment
- updateEquipmentMeta
- assignNfcTag

## STEP F6
장비 반출/반입 엔진
- checkoutEquipment
- checkinEquipment
- forceUpdateEquipmentStatus

## STEP F7
배치/운영 함수
- markEquipmentOverdueBatch
- detectDelayedSchedulesBatch
- recalcDashboardMetrics
- createDownloadLog

---

# 17. 최종 선언

이 문서는 HELLA OPS의 **Firebase Functions 단일 기준 문서**다.

앞으로 실제 Functions 코드를 작성할 때,
다음은 절대 허용되지 않는다.

- 클라이언트 직접 상태 변경 전제 구현
- 로그 없는 상태 변경
- 트랜잭션이 필요한 작업의 분리 커밋
- 상태 전이 검증 생략
- 인증/활성/권한 검증 생략
- NFC 반출/반입을 단순 UI 토글처럼 처리
- 마감 제출을 사진/시간 검증 없이 통과

즉,
이 Functions 설계의 목표는 단순 API 구현이 아니라,
**현장 운영 시스템의 상태 무결성, 감사 가능성, 동시성 안정성을 끝까지 지키는 것**이다.

