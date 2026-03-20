# HELLA OPS — Firestore Rules 초원자 설계서

---

# 0. 문서 목적

이 문서는 **HELLA company 업무관리사이트**의 Firestore 보안 규칙을
개발 직전 수준으로 **초원자 단위**까지 분해하여 정의한 최종 설계 문서다.

이 문서의 목적은 다음과 같다.

1. 누가 어떤 컬렉션을 읽을 수 있는지 고정한다.
2. 누가 어떤 필드만 수정할 수 있는지 고정한다.
3. 어떤 상태 전이가 허용되는지 고정한다.
4. 어떤 작업은 반드시 Functions 전용인지 고정한다.
5. 에이전트가 보안 규칙을 임의 완화하지 못하게 막는다.

이 문서는 단순 요약본이 아니라,
**실제 Firestore Rules 구현 전에 그대로 코드화 가능한 수준의 기준 문서**다.

---

# 1. 최상위 보안 철학

## 1.1 핵심 철학

이 시스템의 보안 철학은 아래 3문장으로 요약된다.

- **사원은 입력만 한다.**
- **상태는 서버가 결정한다.**
- **로그는 절대 수정되지 않는다.**

즉,
이 프로젝트는 일반 CRUD 앱처럼 클라이언트가 자유롭게 update 하는 구조가 아니며,
권한, 상태, 로그, 트랜잭션을 Firestore Rules 단계에서 강하게 통제해야 한다.

---

## 1.2 최상위 원칙

### 원칙 A. 인증되지 않은 사용자는 아무것도 못 한다.
- 비로그인 read 금지
- 비로그인 write 금지

### 원칙 B. 비활성 계정은 로그인 후에도 데이터 접근 금지다.
- Firebase Auth 성공만으로 접근 허용 금지
- users/{uid}.isActive = true 확인 필요

### 원칙 C. 클라이언트는 상태를 직접 확정하지 못한다.
- schedules.status 직접 수정 금지
- equipments.status 직접 수정 금지
- schedule_workers.workStatus 직접 확정 금지

### 원칙 D. 교차 컬렉션 정합성이 필요한 작업은 Functions 전용이다.
- 장비 반출/반입
- equipment_logs 생성
- audit_logs 생성
- 일정 상태 재계산
- worker 자동 생성

### 원칙 E. 로그 컬렉션은 증거 데이터다.
- append only
- 수정 금지
- 삭제 금지

---

# 2. 역할 체계 정의

## 2.1 역할 enum

```ts
role: 'EMPLOYEE' | 'LEADER' | 'ADMIN' | 'SUPER_ADMIN'
```

---

## 2.2 역할별 기본 권한

### EMPLOYEE
- 본인 관련 데이터만 읽기 가능
- 본인 입력 데이터 일부만 생성/수정 가능
- 관리자 화면 접근 금지
- 시스템 설정 접근 금지

### LEADER
- EMPLOYEE 권한 포함
- 팀 범위 일부 조회 가능
- 일부 일정 검토 가능
- 전체 관리자 권한은 없음

### ADMIN
- 운영 데이터 전반 접근 가능
- 일정/사원/장비/메뉴얼 관리 가능
- 로그 읽기 가능
- 일부 시스템 설정 수정 가능

### SUPER_ADMIN
- ADMIN 권한 포함
- 시스템 전역 설정 가능
- 숨김 플래그/비상 락다운 등 최고권한 필드 가능

---

# 3. 인증 / 공통 Helper 개념 설계

이 장은 실제 Rules 코드에서 helper 함수로 구현해야 할 개념 정의다.

---

## 3.1 인증 Helper

### isSignedIn()
```ts
request.auth != null
```

### currentUid()
```ts
request.auth.uid
```

---

## 3.2 사용자 프로필 Helper

### currentUserDoc()
현재 로그인 uid 기준 users 문서 조회

### isActiveUser()
현재 users/{uid}.isActive == true

### currentRole()
현재 users/{uid}.role

---

## 3.3 역할 Helper

### isEmployee()
현재 role == EMPLOYEE

### isLeader()
현재 role == LEADER

### isAdmin()
현재 role == ADMIN 또는 SUPER_ADMIN

### isSuperAdmin()
현재 role == SUPER_ADMIN

### isEmployeeOrLeader()
현재 role ∈ {EMPLOYEE, LEADER}

---

## 3.4 소유자 / 본인 Helper

### isSelf(userId)
현재 uid == userId

### isSelfDocumentUser()
문서 경로의 userId와 현재 uid가 동일

---

## 3.5 필드 화이트리스트 Helper

### hasOnlyKeys(allowedKeys)
요청 데이터가 허용된 키만 포함하는지 확인

### changedOnly(allowedKeys)
update 시 변경된 필드가 허용된 키만인지 확인

### unchanged(field)
특정 필드가 변경되지 않았는지 확인

### requiredOnCreate(field)
생성 시 특정 필드 존재 확인

### isValidEnum(field, allowedValues)
필드가 허용된 enum 값인지 확인

---

## 3.6 시간 / 서버 필드 Helper

### isServerManagedFieldUnchanged()
createdAt, updatedAt, status cache, audit field 등 서버 전용 필드가 클라이언트에서 수정되지 않았는지 확인

### isNotBackdatingDangerousField()
actualStartAt, actualEndAt, submittedAt 같은 민감 시간 필드를 악의적으로 과거 조작하지 못하게 제한하는 개념

---

# 4. 컬렉션 전체 목록

본 프로젝트의 핵심 컬렉션은 아래와 같다.

```ts
users
business_categories
business_subcategories
manuals
schedules
schedule_workers
schedule_closings
schedule_photos
regular_cleaning_sites
regular_cleaning_attendance
equipments
nfc_tag_mappings
equipment_logs
audit_logs
download_logs
settings
```

---

# 5. 컬렉션별 초원자 Rules 설계

이 장은 컬렉션 하나씩 완전히 고정한다.

---

# 5-1. users

## 5-1-1. 문서 목적
사원 프로필, 역할, 활성 상태, 부서, 직급, 권한 판정 기준

---

## 5-1-2. 경로
```ts
users/{userId}
```

---

## 5-1-3. 주요 필드

```ts
uid: string
employeeId: string
displayName: string
phone?: string
profileImageUrl?: string
role: 'EMPLOYEE' | 'LEADER' | 'ADMIN' | 'SUPER_ADMIN'
isActive: boolean
employmentStatus?: string
department?: string
position?: string
managerId?: string
joinedAt?: timestamp
lastLoginAt?: timestamp
monthlyStats?: map
permissionFlags?: map
createdAt: timestamp
updatedAt: timestamp
```

---

## 5-1-4. 읽기 권한

### 허용
- 본인
- ADMIN 이상

### 금지
- 타 사원이 다른 사원 users 문서 읽기
- 비활성 사용자 접근

---

## 5-1-5. 생성 권한

### 허용
- ADMIN 이상
- 또는 Functions 전용 권장

### 필수 필드
- uid
- employeeId
- displayName
- role
- isActive
- createdAt
- updatedAt

### 금지
- EMPLOYEE/LEADER 직접 생성

---

## 5-1-6. 본인 수정 가능 필드

```ts
displayName
phone
profileImageUrl
updatedAt
```

### 선택 확장
```ts
emergencyContact
```

---

## 5-1-7. 본인 수정 금지 필드

```ts
uid
employeeId
role
isActive
employmentStatus
department
position
joinedAt
monthlyStats
createdAt
lastLoginAt
permissionFlags
managerId
```

이유:
- 역할 상승 방지
- 비활성 우회 방지
- 조직 구조 임의 변경 방지
- 집계 위조 방지

---

## 5-1-8. 관리자 수정 가능 필드

```ts
displayName
phone
profileImageUrl
role
isActive
employmentStatus
department
position
joinedAt
managerId
updatedAt
```

---

## 5-1-9. 관리자도 직접 수정하지 않는 필드

```ts
createdAt
uid
authProviderUid(있다면)
monthlyStats 집계 필드
```

이유:
- 불변 식별자 보호
- 서버 재계산 필드 보호

---

## 5-1-10. 삭제 정책

### 물리 삭제
- 금지

### 허용 정책
- soft delete 형태로 isActive=false

---

# 5-2. business_categories

## 5-2-1. 문서 목적
사업분야 대분류 관리

## 5-2-2. 경로
```ts
business_categories/{categoryId}
```

## 5-2-3. 주요 필드
```ts
name: string
description?: string
sortOrder: number
isActive: boolean
createdAt: timestamp
updatedAt: timestamp
```

## 5-2-4. 읽기 권한
- 로그인 + 활성 사용자 전체 허용

## 5-2-5. 쓰기 권한
- ADMIN 이상만 허용

## 5-2-6. 관리자 생성 필수 필드
- name
- sortOrder
- isActive
- createdAt
- updatedAt

## 5-2-7. 관리자 수정 가능 필드
```ts
name
description
sortOrder
isActive
updatedAt
```

## 5-2-8. 금지
- 물리 삭제
- 이미 연결된 일정/메뉴얼 정합성 깨지는 식별자 재정의

---

# 5-3. business_subcategories

## 5-3-1. 문서 목적
사업분야 하위분류 관리

## 5-3-2. 경로
```ts
business_subcategories/{subcategoryId}
```

## 5-3-3. 주요 필드
```ts
categoryId: string
name: string
description?: string
sortOrder: number
isActive: boolean
allowCustomInput?: boolean
createdAt: timestamp
updatedAt: timestamp
```

## 5-3-4. 읽기 권한
- 로그인 + 활성 사용자 전체 허용

## 5-3-5. 쓰기 권한
- ADMIN 이상만 허용

## 5-3-6. 관리자 수정 가능 필드
```ts
categoryId
name
description
sortOrder
isActive
allowCustomInput
updatedAt
```

## 5-3-7. 금지
- EMPLOYEE/LEADER 쓰기
- 삭제
- 상위 categoryId를 무단 교체해 기존 데이터 정합성 깨는 변경

---

# 5-4. manuals

## 5-4-1. 문서 목적
사업분야/작업유형별 메뉴얼 문서

## 5-4-2. 경로
```ts
manuals/{manualId}
```

## 5-4-3. 주요 필드
```ts
categoryId: string
subcategoryId?: string
title: string
content: string
version: string
isLatest: boolean
isActive: boolean
thumbnailUrl?: string
authorUid: string
createdAt: timestamp
updatedAt: timestamp
```

## 5-4-4. 읽기 권한
- 로그인 + 활성 사용자
- 단, isActive=false는 일반 사원 숨김 정책 가능

## 5-4-5. 생성/수정 권한
- ADMIN 이상

## 5-4-6. 생성 필수 필드
- title
- content
- version
- authorUid
- createdAt
- updatedAt
- isActive

## 5-4-7. 관리자 수정 가능 필드
```ts
categoryId
subcategoryId
title
content
version
isLatest
isActive
updatedAt
thumbnailUrl
```

## 5-4-8. 사원 수정
- 전부 금지

## 5-4-9. 금지
- createdAt 변경
- authorUid 위조
- 이전 버전 문서 덮어쓰기
- 삭제

---

# 5-5. schedules

## 5-5-1. 문서 목적
일정 마스터 문서

## 5-5-2. 경로
```ts
schedules/{scheduleId}
```

## 5-5-3. 주요 필드
```ts
scheduleTitle: string
categoryId: string
subcategoryId?: string
siteAddress: string
siteAddressDetail?: string
scheduleDate: string
startTime: string
expectedEndTime?: string
workerIds: string[]
leaderUserId?: string
customerName?: string
customerPhone?: string
specialNotes?: string
extraMemo?: string
status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED'
assignedWorkerNamesCache?: string[]
hasClosingRecord?: boolean
hasBeforePhotos?: boolean
hasAfterPhotos?: boolean
activeWorkerCount?: number
startedWorkerCount?: number
endedWorkerCount?: number
closingSubmittedCount?: number
needsClosingCount?: number
createdBy: string
createdAt: timestamp
updatedAt: timestamp
cancelledAt?: timestamp
cancelledReason?: string
completedAt?: timestamp
delayedAt?: timestamp
```

---

## 5-5-4. 읽기 권한

### ADMIN 이상
- 전체 읽기 허용

### EMPLOYEE / LEADER
- 본인이 workerIds에 포함되거나
- schedule_workers에서 본인 배정이 존재하는 일정만 허용

### 금지
- 타인 일정 임의 열람

---

## 5-5-5. 생성 권한
- ADMIN 이상만 허용
- 실제로는 createScheduleWithWorkers() Functions 권장

---

## 5-5-6. 관리자 생성 가능 필드
```ts
scheduleTitle
categoryId
subcategoryId
siteAddress
siteAddressDetail
scheduleDate
startTime
expectedEndTime
workerIds
leaderUserId
customerName
customerPhone
specialNotes
extraMemo
status
assignedWorkerNamesCache
hasClosingRecord
hasBeforePhotos
hasAfterPhotos
createdBy
createdAt
updatedAt
cancelledAt
cancelledReason
```

---

## 5-5-7. 관리자 수정 가능 필드
```ts
scheduleTitle
categoryId
subcategoryId
siteAddress
siteAddressDetail
scheduleDate
startTime
expectedEndTime
workerIds
leaderUserId
customerName
customerPhone
specialNotes
extraMemo
status
assignedWorkerNamesCache
hasClosingRecord
hasBeforePhotos
hasAfterPhotos
updatedAt
cancelledAt
cancelledReason
```

주의:
관리자가 수정 가능하다고 해서
클라이언트 화면에서 status를 자유롭게 바꾸는 구조를 허용하는 것은 아니다.
운영 UI에서는 status 변경도 가급적 Functions를 통한 정책 처리로 제한하는 것이 맞다.

---

## 5-5-8. 사원 직접 수정
- 원칙적으로 전부 금지

### 특히 직접 수정 금지 필드
```ts
status
hasClosingRecord
hasBeforePhotos
hasAfterPhotos
activeWorkerCount
startedWorkerCount
endedWorkerCount
closingSubmittedCount
needsClosingCount
delayedAt
completedAt
```

이유:
일정 상태는 개별 사원 입력을 종합해 서버가 계산해야 하므로,
사원이 schedule 문서를 직접 수정하면 무결성이 무너진다.

---

## 5-5-9. 삭제 정책
- 물리 삭제 금지
- 취소는 CANCELLED 상태 사용

---

# 5-6. schedule_workers

## 5-6-1. 문서 목적
사원별 일정 참여 상태 문서

## 5-6-2. 경로
```ts
schedule_workers/{scheduleWorkerId}
```

## 5-6-3. 주요 필드
```ts
scheduleId: string
workerId: string
workerName: string
assignedRole?: string
assignmentStatus: 'ASSIGNED' | 'CANCELLED'
workStatus: 'ASSIGNED' | 'STARTED' | 'ENDED' | 'CLOSED' | 'REVIEW_REQUIRED' | 'CANCELLED'
actualStartAt?: timestamp
actualEndAt?: timestamp
participationApproved?: boolean
adminNote?: string
assignedBy: string
createdAt: timestamp
updatedAt: timestamp
```

---

## 5-6-4. 읽기 권한
- ADMIN 이상 전체
- 본인 workerId 문서 허용
- LEADER는 팀 범위 확장 가능하나 MVP에서는 보수적으로 제한 가능

---

## 5-6-5. 생성 권한
- ADMIN 이상
- 또는 createScheduleWithWorkers() Functions 권장

---

## 5-6-6. 사원 본인 수정 가능 필드
```ts
actualStartAt
actualEndAt
updatedAt
```

---

## 5-6-7. 사원 본인 조건부 수정 가능 필드
```ts
workStatus
```

하지만 권장 정책은 다음과 같다.

- 클라이언트가 workStatus를 직접 set하지 않는다.
- recordWorkStart()
- recordWorkEnd()
- submitClosing()

이 3개 서버 함수가 상태를 바꾸는 구조를 사용한다.

즉, Rules 설계상 일부 예외 허용이 가능하더라도,
실제 구현 정책은 **Functions 전용**이 우선이다.

---

## 5-6-8. 사원 본인 수정 금지 필드
```ts
scheduleId
workerId
workerName
assignedRole
assignmentStatus
participationApproved
adminNote
assignedBy
createdAt
```

---

## 5-6-9. 관리자 수정 가능 필드
```ts
assignmentStatus
workStatus
participationApproved
adminNote
assignedRole
updatedAt
```

---

## 5-6-10. 상태 전이 제약

### 생성 기본값
```ts
ASSIGNED
```

### 사원 허용 전이
```ts
ASSIGNED → STARTED
STARTED → ENDED
```

### 관리자 허용 전이
```ts
ENDED → CLOSED
ANY → REVIEW_REQUIRED
ASSIGNED → CANCELLED
STARTED → CANCELLED
```

### 금지 전이
```ts
ASSIGNED → ENDED
STARTED → ASSIGNED
ENDED → STARTED
CLOSED → STARTED
CLOSED → ENDED
```

### 필수 검증
- STARTED 전 actualStartAt 존재
- ENDED 전 actualEndAt 존재
- actualEndAt > actualStartAt
- CLOSED 전 closing record 존재 또는 강제사유 필요

---

# 5-7. schedule_closings

## 5-7-1. 문서 목적
사원의 공식 현장 마감 기록

## 5-7-2. 경로
```ts
schedule_closings/{closingId}
```

## 5-7-3. 주요 필드
```ts
scheduleId: string
workerId: string
startAt: timestamp
endAt: timestamp
notes?: string
status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'FORCE_ADJUSTED'
beforePhotoCount: number
afterPhotoCount: number
submittedAt?: timestamp
reviewStatus?: string
adminReviewNote?: string
approvedBy?: string
approvedAt?: timestamp
forceAdjustedBy?: string
forceAdjustedReason?: string
finalizedAt?: timestamp
createdAt: timestamp
updatedAt: timestamp
```

---

## 5-7-4. 읽기 권한
- 본인 closing
- 관리자

---

## 5-7-5. 생성 권한
- 본인 배정 일정에 한해 허용
- 시작/종료 없이 생성 금지
- 실제 구현은 submitClosing() Functions 권장

---

## 5-7-6. 사원 생성 가능 필드
```ts
scheduleId
workerId
startAt
endAt
notes
submittedAt
status
beforePhotoCount
afterPhotoCount
createdAt
updatedAt
```

---

## 5-7-7. 사원 생성 시 금지 필드
```ts
approvedBy
reviewStatus
adminReviewNote
forceAdjustedBy
forceAdjustedReason
finalizedAt
approvedAt
```

---

## 5-7-8. 사원 수정 정책

### 원칙
- 최종 제출 후 수정 금지

### 제한 허용 가능
- DRAFT 상태에서 notes 정도만 수정

### 권장
- 최종 제출 문서는 사원 수정 금지
- draft 전략 또는 local draft 전략 별도 운영

---

## 5-7-9. 관리자 수정 가능 필드
```ts
reviewStatus
adminReviewNote
approvedBy
approvedAt
forceAdjustedBy
forceAdjustedReason
updatedAt
```

---

## 5-7-10. 상태 전이 제약

### 사원 허용 전이
```ts
없음 또는 DRAFT 생성
DRAFT → SUBMITTED
```

### 관리자 허용 전이
```ts
SUBMITTED → REVIEWED
REVIEWED → APPROVED
REVIEWED → REJECTED
APPROVED → FORCE_ADJUSTED
REJECTED → FORCE_ADJUSTED
```

### 필수 검증
- SUBMITTED 전 startAt 존재
- SUBMITTED 전 endAt 존재
- endAt > startAt
- 정책상 최소 사진 수 조건 충족
- 업로드 실패 사진 남아 있으면 SUBMITTED 차단

### 금지 전이
```ts
APPROVED 이후 사원 수정 금지
SUBMITTED → DRAFT 복귀 금지
REJECTED 문서 임의 삭제 금지
```

---

# 5-8. schedule_photos

## 5-8-1. 문서 목적
비포/애프터 사진 메타데이터

## 5-8-2. 경로
```ts
schedule_photos/{photoId}
```

## 5-8-3. 주요 필드
```ts
scheduleId: string
uploaderId: string
photoType: 'BEFORE' | 'AFTER'
title?: string
storagePath: string
fileName: string
fileSize: number
uploadedAt: timestamp
createdAt: timestamp
updatedAt?: timestamp
moderationStatus?: string
```

---

## 5-8-4. 읽기 권한
- 업로더 본인
- 관리자

---

## 5-8-5. 생성 권한
- 본인만
- 본인 배정 일정에 한해 허용

---

## 5-8-6. 업로더 본인 수정 가능 필드
```ts
title
updatedAt
```

---

## 5-8-7. 업로더 본인 수정 금지 필드
```ts
scheduleId
uploaderId
photoType
storagePath
fileName
fileSize
uploadedAt
createdAt
```

---

## 5-8-8. 관리자 수정 가능 필드
```ts
title
moderationStatus
updatedAt
```

---

## 5-8-9. 삭제 정책
- 업로더 본인 또는 관리자 허용 가능
- 단, 운영 안정성을 위해 soft delete도 검토 가능

---

# 5-9. regular_cleaning_sites

## 5-9-1. 문서 목적
정기청소 장소 마스터

## 5-9-2. 경로
```ts
regular_cleaning_sites/{siteId}
```

## 5-9-3. 주요 필드
```ts
name: string
address: string
defaultNotes?: string
isActive: boolean
assignedDefaultWorkerIds?: string[]
createdAt: timestamp
updatedAt: timestamp
```

## 5-9-4. 읽기 권한
- 로그인 사용자 전체

## 5-9-5. 쓰기 권한
- ADMIN 이상

## 5-9-6. 관리자 수정 가능 필드
```ts
name
address
defaultNotes
isActive
assignedDefaultWorkerIds
updatedAt
```

## 5-9-7. 삭제 정책
- 금지

---

# 5-10. regular_cleaning_attendance

## 5-10-1. 문서 목적
정기청소 참여 기록

## 5-10-2. 경로
```ts
regular_cleaning_attendance/{attendanceId}
```

## 5-10-3. 주요 필드
```ts
siteId: string
dateKey: string
workerId: string
workerName: string
startAt?: timestamp
endAt?: timestamp
participationApproved?: boolean
adminAdjustmentNote?: string
createdAt: timestamp
updatedAt: timestamp
```

## 5-10-4. 읽기 권한
- 본인
- 관리자

## 5-10-5. 생성 권한
- ADMIN

## 5-10-6. 사원 본인 수정 가능 필드
```ts
startAt
endAt
updatedAt
```

## 5-10-7. 사원 수정 금지 필드
```ts
siteId
dateKey
workerId
workerName
participationApproved
createdAt
```

## 5-10-8. 관리자 수정 가능 필드
```ts
participationApproved
adminAdjustmentNote
updatedAt
```

## 5-10-9. 파생 상태 규칙
```ts
ASSIGNED
STARTED
ENDED
APPROVED
MISSED
```

### 검증
- startAt 입력 전 ENDED 금지
- endAt 입력 후 관리자 승인 시 APPROVED
- 입력 없으면 MISSED 판정 가능

---

# 5-11. equipments

## 5-11-1. 문서 목적
장비 현재 상태의 기준 문서

## 5-11-2. 경로
```ts
equipments/{equipmentId}
```

## 5-11-3. 주요 필드
```ts
equipmentCode: string
name: string
serialNumber?: string
category?: string
storageLocation?: string
note?: string
isActive: boolean
status: 'AVAILABLE' | 'CHECKED_OUT' | 'OVERDUE' | 'DISABLED'
nfcTagId?: string
currentHolderUserId?: string
currentHolderName?: string
lastCheckoutAt?: timestamp
lastCheckinAt?: timestamp
createdAt: timestamp
updatedAt: timestamp
```

---

## 5-11-4. 읽기 권한
- 로그인 사용자

## 5-11-5. 생성 권한
- ADMIN 이상

## 5-11-6. 관리자 수동 수정 가능 필드
```ts
equipmentCode
name
serialNumber
category
storageLocation
note
isActive
updatedAt
```

---

## 5-11-7. 관리자도 직접 수정 자제해야 하는 상태 필드
```ts
status
currentHolderUserId
currentHolderName
lastCheckoutAt
lastCheckinAt
```

이 필드들은 반드시 반출/반입 트랜잭션에서만 변경해야 한다.

---

## 5-11-8. 일반 사원 수정
- 전부 금지

---

## 5-11-9. 상태 전이 제약

### 상태 enum
```ts
AVAILABLE
CHECKED_OUT
OVERDUE
DISABLED
```

### 허용 전이
```ts
AVAILABLE → CHECKED_OUT
CHECKED_OUT → AVAILABLE
CHECKED_OUT → OVERDUE
OVERDUE → AVAILABLE
AVAILABLE → DISABLED
CHECKED_OUT → DISABLED
OVERDUE → DISABLED
DISABLED → AVAILABLE
```

### 일반 사용자 금지
- 상태 직접 변경 전부 금지

### 서버 함수 전용
```ts
checkoutEquipment()
checkinEquipment()
markEquipmentOverdue()
forceUpdateEquipmentStatus()
```

### 검증 규칙
- CHECKED_OUT 전 equipment.isActive = true
- CHECKED_OUT 전 ACTIVE nfc_tag_mapping 존재
- CHECKED_OUT 전 status = AVAILABLE
- AVAILABLE 복귀 전 status ∈ {CHECKED_OUT, OVERDUE}
- DISABLED 상태 일반 처리 금지

---

# 5-12. nfc_tag_mappings

## 5-12-1. 문서 목적
NFC 태그와 장비 연결 정보

## 5-12-2. 경로
```ts
nfc_tag_mappings/{mappingId}
```

## 5-12-3. 주요 필드
```ts
nfcTagId: string
equipmentId: string
status: 'ACTIVE' | 'INACTIVE'
mappedAt: timestamp
mappedBy: string
createdAt: timestamp
updatedAt: timestamp
```

## 5-12-4. 읽기 권한
- ADMIN 이상 권장
- 일반 사원 읽기/쓰기 모두 금지 권장

## 5-12-5. 생성 권한
- ADMIN 이상

## 5-12-6. 관리자 수정 가능 필드
```ts
equipmentId
status
updatedAt
```

## 5-12-7. 삭제
- 금지

---

# 5-13. equipment_logs

## 5-13-1. 문서 목적
장비 상태 변화 이력

## 5-13-2. 경로
```ts
equipment_logs/{logId}
```

## 5-13-3. 주요 필드
```ts
equipmentId: string
equipmentCode: string
equipmentName: string
nfcTagId: string
actionType: 'REGISTER' | 'NFC_MAP' | 'CHECK_OUT' | 'CHECK_IN' | 'FORCE_UPDATE' | 'DISABLE'
actorUserId: string
actorUserName: string
reason?: string
useLocation?: string
note?: string
result: string
performedAt: timestamp
previousStatus?: string
nextStatus?: string
currentHolderUserId?: string
createdAt?: timestamp
```

## 5-13-4. 읽기 권한
- 본인 관련 로그
- ADMIN 이상 전체

## 5-13-5. 쓰기 정책
- 클라이언트 create/update/delete 전부 금지
- Functions 전용 생성

## 5-13-6. 수정/삭제
- 전부 금지

---

# 5-14. audit_logs

## 5-14-1. 문서 목적
감사 증거 로그

## 5-14-2. 경로
```ts
audit_logs/{auditLogId}
```

## 5-14-3. 주요 필드
```ts
actorUserId: string
actorUserName: string
actorRole: string
targetCollection: string
targetDocumentId: string
action: string
reason?: string
beforeData?: map
afterData?: map
createdAt: timestamp
```

## 5-14-4. 읽기 권한
- ADMIN 이상

## 5-14-5. 생성 권한
- Functions 전용 권장
- 필요 시 관리자 일부 허용 가능

## 5-14-6. 수정/삭제
- 전부 금지

---

# 5-15. download_logs

## 5-15-1. 문서 목적
엑셀/다운로드 행위 추적

## 5-15-2. 경로
```ts
download_logs/{downloadLogId}
```

## 5-15-3. 주요 필드
```ts
actorUserId: string
actorUserName: string
exportType: string
filterSnapshot?: map
createdAt: timestamp
```

## 5-15-4. 읽기 권한
- ADMIN 이상

## 5-15-5. 생성 권한
- 관리자 또는 Functions

## 5-15-6. 수정/삭제
- 금지

---

# 5-16. settings

## 5-16-1. 문서 목적
시스템 설정

## 5-16-2. 경로
```ts
settings/{settingId}
```

## 5-16-3. 주요 필드
```ts
companyName?: string
companyPhone?: string
companyAddress?: string
supportEmail?: string
loginLogoUrl?: string
headerLogoUrl?: string
defaultNewUserRole?: string
photoPolicy?: map
nfcPolicy?: map
systemFlags?: map
rolePolicy?: map
emergencyLockdown?: boolean
hiddenFeatureToggles?: map
updatedAt: timestamp
createdAt?: timestamp
```

## 5-16-4. 읽기 권한
- ADMIN 이상

## 5-16-5. 수정 권한
- ADMIN 이상

## 5-16-6. 생성 권한
- SUPER_ADMIN 권장

## 5-16-7. SUPER_ADMIN 전용 권장 필드
```ts
systemFlags
rolePolicy
emergencyLockdown
hiddenFeatureToggles
```

## 5-16-8. 일반 사원 접근
- 금지

## 5-16-9. 삭제
- 금지

---

# 6. 상태 전이 Rules 레벨 봉쇄 설계

이 장은 문자열 enum을 넘어서,
어떤 상태에서 어떤 상태로 이동 가능한지 완전히 고정한다.

---

# 6-1. schedules 상태 머신

## 상태 enum
```ts
PLANNED
IN_PROGRESS
COMPLETED
CANCELLED
DELAYED
```

## 생성 기본값
```ts
PLANNED
```

## 허용 전이
```ts
PLANNED → IN_PROGRESS
IN_PROGRESS → COMPLETED
PLANNED → CANCELLED
IN_PROGRESS → DELAYED
DELAYED → COMPLETED
DELAYED → CANCELLED
```

## 제한 전이
```ts
COMPLETED → IN_PROGRESS 금지
COMPLETED → PLANNED 금지
CANCELLED → PLANNED 금지
CANCELLED → IN_PROGRESS 금지
```

## 전이 발생 주체
- PLANNED → IN_PROGRESS : 서버 함수가 시작 입력 집계 후 계산
- IN_PROGRESS → COMPLETED : 서버 함수가 종료/마감 제출 기준 충족 후 계산
- PLANNED → CANCELLED : ADMIN 이상
- IN_PROGRESS → DELAYED : 서버 함수 또는 관리자 정책

## 서버 판정 예시
- 하나 이상의 assigned worker가 actualStartAt 입력 → IN_PROGRESS 후보
- 전체 필수 worker가 종료 또는 closing 제출 → COMPLETED 후보
- expectedEndTime 초과 + closing 미제출 → DELAYED 후보

---

# 6-2. schedule_workers 상태 머신

## 상태 enum
```ts
ASSIGNED
STARTED
ENDED
CLOSED
REVIEW_REQUIRED
CANCELLED
```

## 생성 기본값
```ts
ASSIGNED
```

## 사원 허용 전이
```ts
ASSIGNED → STARTED
STARTED → ENDED
```

## 관리자 허용 전이
```ts
ENDED → CLOSED
ANY → REVIEW_REQUIRED
ASSIGNED → CANCELLED
STARTED → CANCELLED
```

## 금지 전이
```ts
ASSIGNED → ENDED 직접 금지
STARTED → ASSIGNED 금지
ENDED → STARTED 금지
CLOSED → STARTED 금지
CLOSED → ENDED 금지
```

## 필수 검증
- STARTED 전 actualStartAt 존재
- ENDED 전 actualEndAt 존재
- actualEndAt > actualStartAt
- CLOSED 전 closing record 존재 또는 관리자 강제사유

---

# 6-3. schedule_closings 상태 머신

## 상태 enum
```ts
DRAFT
SUBMITTED
REVIEWED
APPROVED
REJECTED
FORCE_ADJUSTED
```

## 사원 허용 전이
```ts
없음 또는 DRAFT 생성
DRAFT → SUBMITTED
```

## 관리자 허용 전이
```ts
SUBMITTED → REVIEWED
REVIEWED → APPROVED
REVIEWED → REJECTED
APPROVED → FORCE_ADJUSTED
REJECTED → FORCE_ADJUSTED
```

## 필수 검증
- SUBMITTED 전 startAt 존재
- SUBMITTED 전 endAt 존재
- endAt > startAt
- 최소 사진 수 충족 여부
- 업로드 실패 사진 존재 시 SUBMITTED 차단

## 금지 전이
```ts
APPROVED 이후 사원 수정 금지
SUBMITTED → DRAFT 복귀 금지
REJECTED 문서 삭제 금지
```

---

# 6-4. equipments 상태 머신

## 상태 enum
```ts
AVAILABLE
CHECKED_OUT
OVERDUE
DISABLED
```

## 허용 전이
```ts
AVAILABLE → CHECKED_OUT
CHECKED_OUT → AVAILABLE
CHECKED_OUT → OVERDUE
OVERDUE → AVAILABLE
AVAILABLE → DISABLED
CHECKED_OUT → DISABLED
OVERDUE → DISABLED
DISABLED → AVAILABLE
```

## 금지
- 일반 사원의 상태 직접 변경 전부 금지

## 함수 전용 전이
```ts
checkoutEquipment()
checkinEquipment()
markEquipmentOverdue()
forceUpdateEquipmentStatus()
```

---

# 7. Functions 전용 강제 영역

아래 작업은 Rules만으로 충분하지 않으며,
반드시 Functions 전용으로 고정한다.

## 7.1 일정 도메인
- createScheduleWithWorkers
- updateScheduleAndWorkers
- cancelSchedule
- recomputeScheduleStatus
- recordWorkStart
- recordWorkEnd
- submitClosing
- approveClosing
- syncSchedulePhotoFlags

## 7.2 장비 도메인
- assignNfcTag
- checkoutEquipment
- checkinEquipment
- forceUpdateEquipmentStatus
- markEquipmentOverdueBatch

## 7.3 로그 도메인
- appendAuditLog
- createDownloadLog

## 7.4 집계 도메인
- recomputeDashboardMetrics
- 참여 인정 계산

---

# 8. 금지사항 총정리

## 8.1 절대 금지
- 클라이언트가 schedules.status 직접 수정
- 클라이언트가 equipments.status 직접 수정
- 클라이언트가 equipment_logs 생성
- 클라이언트가 audit_logs 수정/삭제
- 본인이 role 변경
- 본인이 isActive 변경
- 교차 문서 상태를 클라이언트에서 동시 조작

## 8.2 운영 범위 금지
- Rules 완화로 문제 해결
- Storage 공개형 완화
- 로그 삭제 허용
- 상태 전이 검증 제거

---

# 9. Boring States / 예외 상태 방어와 Rules 연계

Rules는 UI 문서는 아니지만,
보안 규칙과 운영 예외 상태는 함께 고려되어야 한다.

## 9.1 예외 상태 원칙
- 데이터가 0건이어도 read 자체는 정상 허용
- 권한 없는 경우는 빈 화면이 아니라 명확한 권한 차단 처리
- 비활성 계정은 로그인 성공 후에도 데이터 접근 차단

## 9.2 대표 예외 상태
- 오늘 일정 없음
- 등록된 장비 없음
- 본인 배정 일정 없음
- 태그 미등록 장비
- 업로드 실패 사진 존재
- 미반입 장비 없음

Rules 관점에서는
“존재하지 않는 데이터”와 “권한이 없는 데이터”를 혼동하지 않도록 설계해야 한다.

---

# 10. 테스트 체크리스트

이 장은 Rules 적용 후 반드시 검증해야 하는 항목이다.

## 10.1 인증
- 비로그인 users read 차단
- 비로그인 schedules read 차단
- 비로그인 writes 전부 차단

## 10.2 사용자 문서
- 본인 users 읽기 허용
- 타 사원 users 읽기 차단
- 본인 role 변경 차단
- 본인 isActive 변경 차단

## 10.3 일정
- 사원이 타인 schedule 읽기 차단
- 사원이 schedule 직접 update 차단
- ADMIN schedule 생성 허용
- 취소 상태 전이 예외 검증

## 10.4 schedule_workers
- 본인 actualStartAt 수정 허용
- 본인 workerId 변경 차단
- 잘못된 workStatus 전이 차단
- endAt < startAt 차단

## 10.5 schedule_closings
- start/end 없이 제출 차단
- 업로드 실패 사진 남아 있을 때 제출 차단
- 제출 후 사원 재수정 차단

## 10.6 장비
- 사원이 equipments.status 직접 변경 차단
- ADMIN 수동 상태 변경도 제한 필드 검증
- nfc_tag_mappings 일반 사원 접근 차단
- equipment_logs 클라이언트 생성 차단

## 10.7 로그
- audit_logs 수정/삭제 차단
- equipment_logs 수정/삭제 차단
- download_logs 수정/삭제 차단

## 10.8 비활성 사용자
- isActive=false 사용자의 모든 보호 데이터 접근 차단

---

# 11. 실제 Rules 코드화 우선순위

Firestore Rules를 구현할 때는 아래 순서가 가장 안전하다.

## STEP R1
공통 helper 구현
- isSignedIn
- isActiveUser
- currentRole
- isAdmin
- isSuperAdmin
- isSelf
- hasOnlyKeys
- changedOnly

## STEP R2
users 규칙 구현

## STEP R3
business_categories / subcategories / manuals 구현

## STEP R4
schedules / schedule_workers / schedule_closings / schedule_photos 구현

## STEP R5
regular_cleaning_sites / regular_cleaning_attendance 구현

## STEP R6
equipments / nfc_tag_mappings / equipment_logs 구현

## STEP R7
audit_logs / download_logs / settings 구현

## STEP R8
상태 전이 helper 및 테스트 케이스 강화

---

# 12. 최종 선언

이 문서는 HELLA OPS의 **Firestore Rules 단일 기준 문서**다.

앞으로 실제 Rules 코드를 작성할 때,
다음은 절대 허용되지 않는다.

- 문서에 없는 임의 완화
- 상태 전이 검증 생략
- 로그 수정 허용
- 클라이언트 직접 상태 변경 허용
- 권한 우회 허용

즉,
이 Rules 설계의 목표는 단순 접근 차단이 아니라,
**현장 운영 시스템의 상태 무결성과 감사 가능성을 끝까지 지키는 것**이다.

