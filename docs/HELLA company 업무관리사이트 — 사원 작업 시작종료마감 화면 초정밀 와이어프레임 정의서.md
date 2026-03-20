HELLA company 업무관리사이트 — 사원 작업 시작/종
료/마감 화면 초정밀 와이어프레임 정의서
문서 ID: WIREFRAME_EMPLOYEE_CLOSING 문서 목적: 사원이 현장 작업의 시작, 종료, 특이사항, 사진 업로드, 최종
마감 제출까지 수행하는 핵심 실행 화면을 초원자 단위로 정의한다.
이 문서는 다음의 기준이 된다. - 현장 실행 화면 UI 구조 - 시작/종료/마감 단계 흐름 - 사진 업로드 UX - 상태값과 예외
처리 - 권한 제약 - API 및 DB 연결 기준 - 모바일 현장 사용성 기준
1. 화면 개요
1-1. 화면명
국문: 사원 작업 시작/종료/마감 화면
영문 식별: Employee Work Closing Screen
Route: /m/closing/:scheduleId
1-2. 화면 목적
이 화면은 사원이 실제 현장에서 작업을 수행하면서 다음 작업을 한 번의 흐름 안에서 처리하도록 설계한다.
핵심 역할 1. 작업 시작 시각 기록 2. 작업 종료 시각 기록 3. 특이사항 입력 4. 비포/애프터 사진 업로드 5. 최종 마감 제
출 6. 관리자 검토를 위한 공식 현장 기록 생성
1-3. 대상 사용자
EMPLOYEE
LEADER
1-4. 진입 경로
사원 일정 화면(/m/calendar)의 상세 패널
사원 홈의 진행중/마감 필요 일정 카드
딥링크(차기 확장)
1-5. 이탈 경로
저장 후 일정 화면 복귀
저장 후 홈 복귀
임시 저장 후 현재 화면 유지
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

2. 화면 전체 UX 목표
2-1. 현장 UX 원칙
장갑 착용/이동 중/서서 입력해도 조작 가능해야 한다.
텍스트 입력은 최소화하고 버튼과 선택 위주로 구성한다.
사진 업로드는 가장 쉽게 되어야 한다.
네트워크가 불안정해도 사용자 입력값이 최대한 유지되어야 한다.
2-2. 흐름 원칙
이 화면은 단순 폼이 아니라 단계형 실행 화면이다.
권장 흐름 1. 일정 요약 확인 2. 시작 처리 3. 작업 진행 4. 종료 처리 5. 특이사항/사진 입력 6. 마감 제출
3. 전체 레이아웃 구조
3-1. 최상위 구조
EmployeeClosingPage
 ├─ MobileHeader
 ├─ ScheduleSummaryCard
 ├─ WorkStatusStepper
 ├─ StartSection
 ├─ EndSection
 ├─ NotesSection
 ├─ BeforePhotoSection
 ├─ AfterPhotoSection
 ├─ DraftInfoBanner
 ├─ ValidationAlertArea
 └─ BottomActionBar
3-2. 세로 배치 순서
상단 헤더
일정 요약 카드
현재 진행 상태 스텝퍼
시작 입력 섹션
종료 입력 섹션
특이사항 입력 섹션
비포 사진 섹션
애프터 사진 섹션
검증/경고 메시지 영역
하단 고정 액션 바
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
7. 
8. 
9. 
10. 
2

4. 상단 헤더
4-1. MobileHeader
목적
현재 사용자가 어떤 일정의 마감 화면에 있는지 즉시 알게 한다.
구성 요소
BackButton
Title: 작업 마감
MoreMenu(선택)
Back 동작 정책
미저장 변경사항이 있으면 확인 모달 표시
변경사항 없으면 즉시 뒤로 이동
5. 일정 요약 카드
5-1. ScheduleSummaryCard
목적
사용자가 지금 어떤 현장을 처리 중인지 잊지 않도록 상단에 고정된 문맥 제공
표시 요소
스케줄 제목
사업분야 / 하위분야
날짜
시작 예정 시간
현장 주소
고객 연락처(권한 및 정책에 따라 노출)
현재 상태 배지
상태 배지 예시
시작전
진행중
종료입력완료
마감제출완료
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

추가 표시 요소
내가 시작 입력했는지 여부
내가 종료 입력했는지 여부
비포 사진 수
애프터 사진 수
6. 작업 상태 스텝퍼
6-1. WorkStatusStepper
목적
사용자가 현재 어느 단계까지 진행했는지 한눈에 알게 한다.
단계 정의
시작 전
작업 시작
종료 입력
사진 첨부
마감 제출
시각 규칙
완료 단계: 체크 아이콘
현재 단계: 강조 표시
미완료 단계: 비활성 스타일
데이터 소스
schedule_workers.workStatus
schedule_closings 존재 여부
schedule_photos 첨부 여부
7. 시작 입력 섹션
7-1. StartSection
목적
현장 도착 후 실제 시작 시각을 기록한다.
• 
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
• 
• 
• 
• 
4

구성 요소
Section Header
제목: 작업 시작
설명: 현장 작업을 시작할 때 시간을 기록하세요.
Current Start Status Row
현재 시작 입력 상태
입력 시각 표시
Start Action Buttons
지금 시작하기
시간 직접 입력
Manual Time Input (선택 노출)
DateTime picker 또는 time picker
상태
not_started
starting
started
error
기본 정책
지금 시작하기 클릭 시 현재 시각 자동 기록
이미 시작된 경우 버튼 비활성 또는 시작 수정으로 전환
이벤트
onClickStartNow
onClickManualStart
onConfirmManualStart
제약
일정이 이미 마감 제출된 경우 수정 불가
시작 시간은 1회 입력 후 수정 권한 제한 가능
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
5

8. 종료 입력 섹션
8-1. EndSection
목적
실제 작업 종료 시각을 기록한다.
구성 요소
Section Header
제목: 작업 종료
설명: 작업이 끝났을 때 종료 시간을 기록하세요.
Current End Status Row
종료 입력 여부
입력 시각 표시
End Action Buttons
지금 종료하기
시간 직접 입력
Manual End Time Input
time picker
상태
disabled_before_start
ready_to_end
ending
ended
error
제약
시작 시간 없이는 종료 입력 불가
종료 시간은 시작 시간 이후여야 함
이미 마감 제출된 경우 수정 불가
이벤트
onClickEndNow
onClickManualEnd
onConfirmManualEnd
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
6

9. 특이사항 입력 섹션
9-1. NotesSection
목적
현장 이슈, 고객 요청, 추가 작업, 문제점 등을 기록한다.
구성 요소
Section Header
제목: 특이사항
설명: 현장에서 있었던 내용이나 전달이 필요한 사항을 작성하세요.
Textarea
속성 - placeholder: 예) 고객 요청으로 추가 청소 진행, 출입 문제 없음, 장비 이상 없음 - maxLength: 2000 권
장 - auto resize
Helper Area
글자 수 카운트
저장 안내 문구
상태
empty
typing
filled
error
정책
특이사항은 선택 입력 가능
하지만 문제가 있었던 경우는 필수로 바꿀 수 있도록 차기 정책 확장 가능
10. 비포 사진 섹션
10-1. BeforePhotoSection
목적
작업 전 상태를 기록한다.
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

구성 요소
Section Header
제목: 비포 사진
설명: 작업 전 상태를 촬영하세요.
Upload Controls
사진 촬영
갤러리에서 선택
Uploaded Grid
각 아이템 요소 - 썸네일 - 제목 입력 필드(선택 또는 필수 정책) - 삭제 버튼 - 업로드 상태 표시
Section Summary Row
현재 업로드 수
최소 요구 수 표시
상태
empty
uploading
uploaded_partial
uploaded_complete
upload_error
정책
최소 1장 권장
실제 필수 여부는 설정/정책으로 제어 가능
여러 장 업로드 허용
11. 애프터 사진 섹션
11-1. AfterPhotoSection
목적
작업 후 결과 상태를 기록한다.
구성 요소
비포 사진 섹션과 동일 구조 사용
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
8

차이점 - 제목: 애프터 사진 - 설명: 작업 후 결과 상태를 촬영하세요.
정책
최소 1장 권장
마감 제출 전 애프터 1장 이상을 강하게 권고하는 UX 적용 가능
12. 사진 업로드 아이템 구조
12-1. PhotoUploadItem
구성 요소
thumbnail preview
upload progress bar
photo title input
retry button
remove button
upload success badge
상태
local_pending
uploading
uploaded
failed
이벤트
onRetryUpload
onRemovePhoto
onChangePhotoTitle
데이터 모델 예시
interfaceLocalPhotoDraft{
localId:string;
photoType:'BEFORE'|'AFTER';
file:File|null;
previewUrl:string;
title:string;
uploadStatus:'LOCAL_PENDING'|'UPLOADING'|'UPLOADED'|'FAILED';
uploadedPhotoId?:string;
errorMessage?:string;
}
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

13. 임시 저장 배너
13-1. DraftInfoBanner
목적
입력 중인 내용이 아직 최종 제출되지 않았음을 사용자에게 명확히 알린다.
표시 조건
시작/종료/특이사항/사진 중 하나라도 입력되었으나 마감 제출 전
문구 예시
현재 입력 내용은 임시 상태입니다. 마감 완료를 눌러야 최종 제출됩니다.
14. 검증/경고 메시지 영역
14-1. ValidationAlertArea
목적
제출 전에 누락 항목과 오류를 한 번에 보여준다.
메시지 유형
경고
시작 시간이 아직 입력되지 않았습니다.
종료 시간이 아직 입력되지 않았습니다.
비포 사진이 없습니다.
애프터 사진이 없습니다.
오류
종료 시간이 시작 시간보다 빠릅니다.
사진 업로드 실패가 남아 있습니다.
네트워크 오류로 제출할 수 없습니다.
정책
경고와 오류를 구분
오류는 제출 차단
경고는 정책에 따라 제출 허용 여부 선택 가능
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

15. 하단 고정 액션 바
15-1. BottomActionBar
목적
모바일에서 가장 중요한 액션을 언제나 누를 수 있게 한다.
버튼 구성
좌측 보조 버튼
임시 저장
우측 주 버튼
마감 완료
상태 규칙
임시 저장
시작/종료/특이사항/사진 중 변경사항 있으면 활성
네트워크 불안정 상황에서도 최대한 허용
마감 완료
필수 검증 통과 시 활성
제출 중에는 로딩 상태
버튼 텍스트 상태
기본: 마감 완료
제출 중: 제출 중...
제출 완료: 제출 완료
16. 상태(State) 정의
16-1. 화면 전체 상태
idle
loading_schedule
editing
saving_draft
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

submitting_closing
submitted
error
16-2. 일정 상태
scheduleStatus: PLANNED | IN_PROGRESS | COMPLETED | CANCELLED | DELAYED
16-3. 내 작업 상태
myWorkStatus: BEFORE_START | IN_PROGRESS | END_RECORDED | CLOSING_SUBMITTED 
| COMPLETED
16-4. 입력 상태
startAt: Date | null
endAt: Date | null
notes: string
beforePhotos: LocalPhotoDraft[]
afterPhotos: LocalPhotoDraft[]
validationErrors: string[]
validationWarnings: string[]
hasUnsavedChanges: boolean
17. 이벤트(Action) 정의
17-1. 화면 진입 시
실행 순서 1. scheduleId 확인 2. 해당 일정의 접근 권한 검증 3. 일정 기본 정보 조회 4. 기존 시작/종료/마감/사진 상
태 조회 5. 로컬 편집 상태 초기화
17-2. 시작 버튼 클릭 시
현재 시각 기록 또는 수동 입력 모드 오픈
schedule_workers.actualStartAt 업데이트
workStatus를 IN_PROGRESS로 전환
17-3. 종료 버튼 클릭 시
현재 시각 기록 또는 수동 입력
schedule_workers.actualEndAt 업데이트
workStatus를 END_RECORDED로 전환
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
12

17-4. 사진 업로드 버튼 클릭 시
카메라/갤러리 선택
로컬 프리뷰 생성
업로드 시도
성공 시 schedule_photos 문서 생성
17-5. 임시 저장 클릭 시
notes 저장
필요한 상태 캐시 저장
로컬 변경사항 서버 반영 또는 local draft 정책에 따라 저장
17-6. 마감 완료 클릭 시
실행  순서  1.  검증  실행  2.  오류  없으면  제출  시작  3.  schedule_closings 생성  또는  업데이트  4.
schedule_workers.workStatus = CLOSING_SUBMITTED 5. schedules.hasClosingRecord = 
true 6. 성공 시 완료 화면 또는 이전 화면 복귀
17-7. 뒤로가기 클릭 시
미저장 변경사항 있으면 확인 모달 표시
18. 검증 규칙(Validation)
18-1. 필수 검증
시작 시간 존재
종료 시간 존재
종료 > 시작
18-2. 정책 검증
비포 사진 최소 수 충족 여부
애프터 사진 최소 수 충족 여부
업로드 실패 사진 남아 있는지 여부
18-3. 선택 검증
특이사항 글자 수 제한
사진 제목 최대 길이
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
13

검증 결과 타입
BLOCKING_ERROR
WARNING
19. 데이터 연결 기준
19-1. 읽기 데이터
schedules/{scheduleId}
schedule_workers by scheduleId + userId
schedule_closings by scheduleId
schedule_photos by scheduleId
19-2. 쓰기 데이터
시작 처리
schedule_workers.actualStartAt
schedule_workers.workStatus
필요 시 schedules.status
종료 처리
schedule_workers.actualEndAt
schedule_workers.workStatus
마감 제출
schedule_closings
schedule_workers.workStatus
schedules.hasClosingRecord
schedules.hasBeforePhotos
schedules.hasAfterPhotos
사진 업로드
Storage 업로드
schedule_photos 문서 생성
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
14

20. API / 서비스 연결 기준
필요 서비스 함수 예시
getClosingScreenData(scheduleId, userId)
역할 - 화면 초기 렌더용 데이터 집계
recordWorkStart(scheduleId, userId, startAt)
역할 - 시작 기록 저장
recordWorkEnd(scheduleId, userId, endAt)
역할 - 종료 기록 저장
uploadSchedulePhoto(scheduleId, userId, file, photoType, title)
역할 - Storage 업로드 + metadata 저장
saveClosingDraft(scheduleId, userId, notes)
역할 - 임시 저장
submitClosing(scheduleId, userId, payload)
역할 - 최종 마감 제출
21. 권한 정책 연동 포인트
EMPLOYEE
본인 배정 일정만 접근 가능
본인 마감 기록만 작성 가능
제출 후 수정 제한
LEADER
본인 또는 팀 범위 확장 가능
현재 MVP는 본인 입력 우선
ADMIN
직접 이 화면 쓰기보다 검토 화면 중심
필요 시 관리자 대리 입력 확장 가능
• 
• 
• 
• 
• 
• 
• 
15

22. 오류 처리 정책
22-1. 화면 초기 로딩 실패
현장 정보를 불러오지 못했습니다.
재시도 버튼 제공
22-2. 시작/종료 저장 실패
입력값 유지
재시도 가능
토스트 + 인라인 오류 표시
22-3. 사진 업로드 실패
실패 항목만 재시도 가능
다른 입력값 유지
22-4. 마감 제출 실패
제출 중이던 내용 유지
서버 오류 메시지 일반화
중복 제출 방지
22-5. 권한 오류
이 일정의 마감을 처리할 권한이 없습니다.
일정 화면으로 복귀 유도
23. 로딩 처리 정책
23-1. 초기 로딩
스켈레톤 카드 + 입력 placeholder 사용
23-2. 버튼 로딩
시작/종료 버튼 독립 로딩
전체 제출 버튼 로딩 분리
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

23-3. 사진 업로드 로딩
사진별 progress 표시
전체 화면 차단 금지
24. 접근성 기준
24-1. 버튼
시작/종료/마감 버튼에 명확한 label
disabled 상태 이유는 보조 문구로 설명 가능
24-2. 사진 업로드
업로드 버튼에 대체 텍스트 제공
썸네일은 제목 또는 파일 상태 설명 포함
24-3. 오류 메시지
스크린리더 읽기 가능하도록 aria-live 영역 권장
25. 모바일 스타일 가이드
25-1. 버튼
높이 최소 52px
하단 액션 바 여백 충분히 확보
25-2. 입력 요소
Textarea는 4~6줄 기본 높이
Time input은 카드형 버튼 스타일 가능
25-3. 사진 그리드
2열 썸네일 그리드 권장
썸네일 터치 영역 충분히 확보
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

26. UI 트리 구조 예시
EmployeeClosingPage
 ├─ MobileHeader
 ├─ ScheduleSummaryCard
 ├─ WorkStatusStepper
 ├─ StartSection
 │   ├─ StartStatusRow
 │   ├─ StartNowButton
 │   └─ ManualStartPicker
 ├─ EndSection
 │   ├─ EndStatusRow
 │   ├─ EndNowButton
 │   └─ ManualEndPicker
 ├─ NotesSection
 │   ├─ NotesTextarea
 │   └─ CharacterCounter
 ├─ BeforePhotoSection
 │   ├─ PhotoUploadActions
 │   └─ UploadedPhotoGrid
 ├─ AfterPhotoSection
 │   ├─ PhotoUploadActions
 │   └─ UploadedPhotoGrid
 ├─ DraftInfoBanner
 ├─ ValidationAlertArea
 └─ BottomActionBar
     ├─ SaveDraftButton
     └─ SubmitClosingButton
27. 상태 모델 예시
interfaceEmployeeClosingState{
scheduleId:string;
startAt:Date|null;
endAt:Date|null;
notes:string;
beforePhotos:LocalPhotoDraft[];
afterPhotos:LocalPhotoDraft[];
validationErrors:string[];
validationWarnings:string[];
isLoading:boolean;
isSavingDraft:boolean;
isSubmitting:boolean;
18

hasUnsavedChanges:boolean;
}
28. 테스트 시나리오
28-1. 정상 시나리오
일정 진입
시작 시간 기록
종료 시간 기록
비포 1장 업로드
애프터 1장 업로드
특이사항 입력
마감 완료
성공 처리
28-2. 종료 선입력 오류
시작 없이 종료 시도
오류 표시
저장 차단
28-3. 사진 업로드 실패 시나리오
사진 2장 중 1장 업로드 실패
실패 아이템 retry 버튼 노출
다른 입력값 유지
28-4. 제출 차단 시나리오
종료 시간이 시작보다 빠름
검증 오류 표시
제출 차단
28-5. 마감 후 재진입 시나리오
이미 제출 완료된 일정 재진입
읽기 전용 또는 관리자 수정 필요 안내
1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
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
19

29. 확장 설계 포인트
29-1. 오프라인 임시 저장
향후 네트워크 불안정 환경을 위해 local draft 저장 구조 확장 가능
29-2. 음성 입력 확장
특이사항 입력을 음성 텍스트로 확장 가능
29-3. 사진 품질 자동화
비포/애프터 이미지 최적화, 워터마크, 촬영 가이드 확장 가능
29-4. 대리 입력 정책
관리자/팀장 대리 마감 구조 확장 가능
30. 구현 우선순위
30-1. 1차 필수 구현
일정 요약 카드
시작 기록
종료 기록
특이사항 입력
비포/애프터 업로드
마감 제출
검증/오류 처리
30-2. 2차 개선
임시 저장 로직 고도화
업로드 progress UX 강화
사진 제목 정책 강화
오프라인 draft 확장
31. 최종 정리
이 문서는 HELLA company 업무관리사이트의 사원 작업 시작/종료/마감 화면을 실제 구현 가능한 수준으로 초원자 단
위까지 분해한 와이어프레임 정의서이다.
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
20

다음 문서로 가장 자연스럽게 이어질 것은 - HELLA company 업무관리사이트 — 관리자 대시보드 초정밀 와이어프레
임 정의서 또는 - HELLA company 업무관리사이트 — 관리자 일정관리 화면 초정밀 와이어프레임 정의서
21

