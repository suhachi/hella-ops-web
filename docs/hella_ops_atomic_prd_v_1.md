# HELLA OPS — Atomic PRD v2 (Full Spec)

---

# 0. 문서 목적
이 문서는 HELLA OPS의 **개발/운영/확장 전체를 커버하는 단일 기준(PRD)**이다.
모든 구현은 본 문서를 기준으로 수행한다.

---

# 1. 시스템 정의

## 1.1 시스템 유형
- 상태 기반 운영 시스템 (State-driven Ops System)

## 1.2 핵심 원칙
- 클라이언트 = 이벤트 트리거
- 서버 = 상태 결정
- DB = 사실 기록

---

# 2. 아키텍처 (FSD)

```
pages → features → services → repositories → Firebase
```

## 금지
- pages → Firebase 직접 호출 금지
- 상태 직접 변경 금지

---

# 3. 역할 (Roles)

| role | 권한 |
|------|------|
| EMPLOYEE | 작업 수행 |
| LEADER | 팀 관리 |
| ADMIN | 전체 관리 |
| SUPER_ADMIN | 시스템 |

---

# 4. Firestore 스키마 (SSOT)

## 4.1 users
```
users/{userId}
- name: string
- role: enum
- teamId: string
- createdAt: timestamp
```

## 4.2 schedules
```
schedules/{scheduleId}
- date: timestamp
- status: PLANNED | IN_PROGRESS | COMPLETED
- assignedTo: userId
- notes: string
- createdAt
```

## 4.3 equipments
```
equipments/{equipmentId}
- name
- status: AVAILABLE | CHECKED_OUT
- nfcTagId
- updatedAt
```

## 4.4 equipment_logs
```
equipment_logs/{logId}
- equipmentId
- action: OUT | IN
- userId
- timestamp
```

## 4.5 audit_logs
```
audit_logs/{logId}
- type
- targetId
- payload
- createdAt
```

---

# 5. API (Cloud Functions)

## 5.1 startWork
```
input: { scheduleId }
process:
- validate
- status → IN_PROGRESS
```

## 5.2 completeWork
```
input: { scheduleId, beforeImg, afterImg }
process:
- 업로드 검증
- 실패 시 reject
- status → COMPLETED
```

## 5.3 checkoutEquipment
```
input: { nfcTagId }
process:
- transaction
- status 변경
- log 생성
```

## 5.4 returnEquipment
```
input: { nfcTagId }
process:
- 상태 복구
- log 기록
```

---

# 6. 상태 전이

## schedules
PLANNED → IN_PROGRESS → COMPLETED

## equipments
AVAILABLE ↔ CHECKED_OUT

---

# 7. 트랜잭션 규칙

- 상태 변경 + 로그 생성 = 반드시 atomic
- 실패 시 rollback

---

# 8. 보안 규칙

- audit_logs 수정 금지
- equipment_logs 클라이언트 작성 금지
- 상태 변경은 function only

---

# 9. UX 규칙

## EMPLOYEE
- 버튼 중심
- 최소 입력

## ADMIN
- 테이블
- 필터

---

# 10. 오프라인 정책

허용:
- notes
- 시간

금지:
- 상태

---

# 11. 에러 정책

- 이미지 실패 → 제출 차단
- 네트워크 실패 → retry UI

---

# 12. 로그 전략

- 모든 상태 변경 = audit_logs 기록
- 삭제 금지

---

# 13. 성능 기준

- API 응답 < 500ms
- 트랜잭션 실패율 < 1%

---

# 14. 확장성

- QR 확장 (future)
- 다중 조직 구조

---

# 15. 개발 단위 (Atomic)

각 기능은 다음 단위로 쪼갠다:
- UI
- Service
- API
- Test

---

# 16. QA 체크리스트

- 상태 전이 검증
- 권한 검증
- 로그 생성 검증

---

# 17. 배포 기준

- Firebase Hosting
- Functions asia-northeast3

---

# 18. KPI 정의 (운영 지표)

## 18.1 작업 KPI
- 작업 시작 지연률 = (지연 시작 건수 / 전체 일정) * 100
- 작업 완료율 = (COMPLETED / 전체 일정)
- 평균 작업 시간 = avg(endAt - startAt)

## 18.2 품질 KPI
- 사진 누락률 = (이미지 실패 건수 / 전체 제출)
- 재작업률 = (재작업 요청 / 전체 작업)

## 18.3 장비 KPI
- 장비 가동률 = (CHECKED_OUT 시간 / 전체 시간)
- 분실/미반납 비율

## 18.4 시스템 KPI
- API 평균 응답 시간(ms)
- 트랜잭션 실패율
- 에러 발생률

---

# 19. 모니터링 설계

## 19.1 실시간 모니터링 대상
- schedules 상태 흐름
- equipments 상태
- audit_logs 생성 여부
- Functions 에러 로그

## 19.2 모니터링 방식
- Firestore Listener 기반 실시간 감지
- Cloud Functions 로그 수집

## 19.3 경고(Alert) 조건
- 작업 미완료 24시간 초과
- 장비 미반납
- 트랜잭션 실패 발생

## 19.4 리포트
- 2시간 단위 자동 리포트
- 관리자 대시보드 시각화

---

# 20. 상세 필드 확장 (Schema 강화)

## schedules (확장)
```
- startAt: timestamp
- endAt: timestamp
- beforeImages: string[]
- afterImages: string[]
- workStatus: enum
```

## equipments (확장)
```
- lastCheckoutAt
- lastReturnAt
- currentUserId
```

## users (확장)
```
- phone
- status: ACTIVE | INACTIVE
- lastLoginAt
```

---

# 21. 에러/장애 대응

## 21.1 장애 유형
- 네트워크 오류
- 업로드 실패
- 권한 오류

## 21.2 대응 정책
- retry 3회
- 실패 시 사용자 알림
- 서버 로그 기록

---

# 22. 테스트 전략

## 22.1 단위 테스트
- service 로직

## 22.2 통합 테스트
- 상태 전이 검증

## 22.3 시나리오 테스트
- 일정 생성 → 작업 → 완료 → 장비 반납

---

# 23. 릴리즈 기준

- 모든 KPI 정상
- 에러율 < 1%
- QA 체크 통과

---

# 24. 최종 선언

이 문서는 HELLA OPS의 절대 기준이다.
모든 개발은 이 문서를 기준으로 진행한다.
이외 설계는 무효이다.

