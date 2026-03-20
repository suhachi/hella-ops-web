HELLA company 업무관리사이트 — 로그인 화면 초정밀
와이어프레임 정의서
문서 ID: WIREFRAME_LOGIN 문서 목적: HELLA company 업무관리사이트의 로그인 화면 1개만 실제 구현 가능한
수준으로 초원자 단위까지 분해하여 정의한다.
이 문서는 다음의 기준이 된다. - UI 배치 기준 - 컴포넌트 분해 기준 - 상태(state) 정의 기준 - 이벤트(action) 정의 기
준 - API 연결 기준 - 유효성 검사 기준 - 오류 처리 기준 - 접근성 기준 - 반응형 기준
1. 화면 개요
1-1. 화면명
국문: 로그인 화면
영문 식별: Login Screen
Route: /login
1-2. 화면 목적
이 화면은 회사 내부 직원이 HELLA company 업무관리사이트에 진입하기 위한 단일 인증 진입점이다.
이 화면이 수행해야 하는 역할은 아래와 같다. 1. 사용자에게 브랜드를 인지시킨다. 2. 사원 ID와 비밀번호를 입력받는
다. 3. 인증을 수행한다. 4. 계정 상태와 권한을 판별한다. 5. 권한에 따라 관리자 또는 사원 영역으로 분기한다.
1-3. 대상 사용자
EMPLOYEE
LEADER
ADMIN
SUPER_ADMIN
1-4. 진입 경로
브라우저 직접 접속
세션 만료 후 리다이렉트
로그아웃 후 재진입
권한 없는 화면 접근 후 리다이렉트
1-5. 이탈 경로
로그인 성공 → 권한별 홈 이동
로그인 실패 → 현재 화면 유지 + 오류 표시
비활성 계정 → 현재 화면 유지 + 차단 메시지 표시
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

2. 화면 구조 개요
2-1. 최상위 레이아웃
로그인 화면은 아래 3개 레이어로 구성한다.
Layer A. 전체 페이지 배경
역할 - 브랜드 첫 인상 전달 - 업무용 시스템의 안정감 전달
구성 - 브랜드 컬러 기반 배경 - 단색 또는 부드러운 그라데이션 - 과한 장식 금지
Layer B. 중앙 로그인 컨테이너
역할 - 실제 로그인 인터페이스를 담는 핵심 영역
구성 - 로고 영역 - 서비스명 영역 - 안내문 영역 - 입력 폼 영역 - 상태 메시지 영역 - 로그인 버튼 영역
Layer C. 보조 정보 영역
역할 - 필요 시 하단에 저작권 또는 내부 전용 안내 문구 표시
3. 반응형 레이아웃 설계
3-1. 데스크탑 레이아웃
권장 해상도 기준 - 1280px 이상
구조 - 화면 중앙 정렬 - 로그인 카드 너비: 420px ~ 520px - 카드 바깥 여백 충분히 확보 - 세로 정렬 중심
배치 순서 1. 로고 2. 시스템명 3. 안내문 4. ID 입력 5. 비밀번호 입력 6. 오류 메시지 7. 로그인 버튼 8. 하단 보조 문구
3-2. 태블릿 레이아웃
권장 해상도 기준 - 768px ~ 1279px
구조 - 카드 너비: 88% 이내 - 좌우 여백 최소 24px 확보 - 로고와 제목 크기 약간 축소
3-3. 모바일 레이아웃
권장 해상도 기준 - 767px 이하
구조 - 상단 여백 충분히 확보 - 전체 폭 기준 100% 사용하되 카드 느낌은 유지 - 입력창 높이 크게 - 버튼 높이 크게 - 키
보드 노출 시도 UI가 깨지지 않게 세로 스크롤 허용
모바일 우선 UX - 한 손 입력 가능 - 입력 필드 간 간격 12~16px - 버튼 높이 최소 52px 권장
2

4. 화면 섹션 분해
4-1. Brand Header Section
목적
브랜드 식별과 시스템 정체성을 전달한다.
구성 요소
4-1-1. Logo Box
속성 - 회사 로고 이미지 또는 SVG - 중앙 정렬 - 클릭 동작 없음
표시 규칙 - 로고가 없으면 텍스트 로고 fallback 허용 - 깨진 이미지일 경우 fallback 렌더링
4-1-2. Product Title
텍스트 - HELLA company 업무관리사이트
스타일 규칙 - Bold - 중앙 정렬 - 시각적 우선순위 1
4-1-3. Product Subtitle
텍스트 예시 - 내부 직원 전용 운영 시스템
스타일 규칙 - 본문보다 약간 작게 - 회색 계열 보조 텍스트 - 중앙 정렬
4-2. Login Form Section
목적
실제 인증값을 입력받고 제출한다.
구성 요소 순서 1. 사원 ID 입력 필드 2. 비밀번호 입력 필드 3. 비밀번호 보기/숨기기 토글 4. 오류 메시지 영역 5. 로그
인 버튼
3

5. 컴포넌트 초원자 분해
5-1. Employee ID Field
컴포넌트명
LoginEmployeeIdField
역할
사용자의 사원 ID 또는 시스템 로그인 ID 입력
내부 요소
Label
텍스트: 사원 ID
필수 표시: *
Input
속성 - type: text - placeholder: 사원 ID를 입력하세요 - autocomplete: username - inputMode: text
- maxLength: 50 권장
Helper Text
기본: 숨김 가능
오류 시: 하단 오류 문구 표시
상태
default
focused
filled
error
disabled
유효성 검사
공백만 입력 금지
trim 후 빈 문자열 금지
최소 길이 정책은 운영 정책에 따름
이벤트
onChange
onBlur
onFocus
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

onKeyDown(Enter)
에러 메시지 예시
사원 ID를 입력해 주세요.
존재하지 않는 계정입니다.
5-2. Password Field
컴포넌트명
LoginPasswordField
역할
사용자 비밀번호 입력
내부 요소
Label
텍스트: 비밀번호
필수 표시: *
Input
속성  -  type:  password 또는  text(토글  시)  -  placeholder:  비밀번호를 입력하세요 -  autocomplete:
current-password - maxLength: 100 권장
Visibility Toggle Button
역할 - 비밀번호 보기 / 숨기기 전환
아이콘 상태 - 숨김 상태 아이콘 - 표시 상태 아이콘
접근성 - aria-label 필요 - 비밀번호 보기 - 비밀번호 숨기기
상태
default
focused
filled
error
disabled
visible
hidden
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

유효성 검사
공백만 입력 금지
trim 후 빈 문자열 금지
이벤트
onChange
onBlur
onFocus
onToggleVisibility
onKeyDown(Enter)
에러 메시지 예시
비밀번호를 입력해 주세요.
비밀번호가 올바르지 않습니다.
5-3. Inline Error Message Box
컴포넌트명
LoginErrorAlert
역할
폼 제출 실패 또는 계정 상태 문제를 사용자에게 즉시 전달
표시 조건
로그인 실패
계정 비활성
시스템 오류
네트워크 오류
메시지 유형
인증 실패
사원 ID 또는 비밀번호가 올바르지 않습니다.
비활성 계정
현재 사용이 중지된 계정입니다. 관리자에게 문의하세요.
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

권한 없음
이 시스템에 접근 권한이 없습니다.
네트워크 오류
네트워크 연결을 확인한 뒤 다시 시도해 주세요.
서버 오류
로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
스타일
빨간 배경 또는 옅은 붉은 톤
경고 아이콘 포함 가능
입력 필드와 버튼 사이 배치
5-4. Login Submit Button
컴포넌트명
LoginSubmitButton
역할
로그인 요청 실행
텍스트 상태
기본: 로그인
로딩: 로그인 중...
상태
enabled
disabled
loading
disabled 조건
사원 ID 비어 있음
비밀번호 비어 있음
제출 중
이벤트
onClick
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
7

Enter 키 제출 연동
스타일 규칙
전체 폭 버튼 권장
높이 52px 이상 권장
브랜드 Primary Color 사용
5-5. Footer Info Block
역할
보조 안내 제공
표시 문구 예시
본 시스템은 내부 직원 전용입니다.
무단 접근이 제한됩니다.
정책
링크/추가 기능은 MVP에서 최소화
비밀번호 찾기 기능은 현재 범위 제외 가능
6. 상태(State) 정의
6-1. 화면 전체 상태
idle
editing
submitting
successRedirecting
error
6-2. 필드 상태
employeeId
value
touched
dirty
error
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
8

password
value
touched
dirty
error
isVisible
6-3. 인증 상태
UNAUTHENTICATED
AUTHENTICATING
AUTHENTICATED
AUTH_FAILED
ACCOUNT_INACTIVE
ACCOUNT_SUSPENDED
NO_ROLE
7. 이벤트(Action) 정의
7-1. 페이지 진입 시
기존 세션 확인
이미 로그인 상태면 권한별 홈으로 즉시 리다이렉트 가능
7-2. employeeId 입력 시
상태 업데이트
기존 에러 초기화
7-3. password 입력 시
상태 업데이트
기존 에러 초기화
7-4. 비밀번호 보기 토글 시
isVisible 반전
7-5. 로그인 버튼 클릭 시
실행 순서 1. 클라이언트 유효성 검사 2. 필드 오류 없으면 submitting 상태 진입 3. 인증 API 호출 4. 사용자 프로필 조
회 5. status, role 검증 6. 권한별 경로 계산 7. 리다이렉트
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

7-6. Enter 키 입력 시
현재 focus가 input이면 submit 실행
8. 유효성 검사(Validation) 상세
8-1. 클라이언트 검증
employeeId
required
trim 처리
빈 문자열 금지
password
required
trim 처리
빈 문자열 금지
8-2. 서버 검증
계정 존재 여부
비밀번호 일치 여부
사용자 status 확인
사용자 role 확인
앱 접근 허용 여부 확인
9. 인증 처리 흐름
9-1. 기본 흐름
사용자 입력
로그인 제출
Firebase Auth 인증
users 컬렉션 프로필 조회
상태 확인
역할 확인
세션 저장
리다이렉트
9-2. 권한별 리다이렉트 규칙
EMPLOYEE → /m/home
LEADER → /m/home 또는 추후 /m/team-home
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
1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
• 
• 
10

ADMIN → /app/dashboard
SUPER_ADMIN → /app/dashboard
9-3. 차단 규칙
status = INACTIVE → 차단
status = SUSPENDED → 차단
role 누락 → 차단
10. API / 서비스 연결 기준
10-1. 사용 서비스
Firebase Auth Sign In
Firestore users/{uid} 조회
10-2. 로그인 처리 함수 예시 역할
signInWithEmployeeCredentials(employeeId, password)
역할 - 인증 수행 - Auth user 반환
fetchUserProfile(uid)
역할 - Firestore profile 조회
resolvePostLoginRoute(role)
역할 - 권한별 이동 경로 결정
11. 오류 처리 정책
11-1. 필드 단위 오류
ID 미입력
비밀번호 미입력
11-2. 폼 단위 오류
인증 실패
계정 상태 차단
권한 누락
시스템 오류
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

11-3. 네트워크 오류
재시도 문구 표시
입력값 유지
11-4. 중복 제출 방지
submitting 중 버튼 비활성
Enter 중복 제출 차단
12. 로딩 처리 정책
12-1. 로그인 요청 중
버튼 로딩 상태
입력 필드 비활성
중복 제출 차단
12-2. 성공 후 이동 중
짧은 로딩 유지 가능
화면 깜빡임 최소화
13. 접근성(Accessibility) 기준
13-1. 필수 요소
모든 input에 label 연결
오류 메시지는 스크린리더 인식 가능하도록 구성
버튼 aria-label 적용
Tab 이동 순서 자연스럽게 유지
13-2. 키보드 사용성
Tab으로 ID → 비밀번호 → 토글 → 로그인 이동 가능
Enter로 제출 가능
13-3. 색상 의존 금지
오류는 색상 + 텍스트 동시 표시
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

14. 보안 UX 기준
14-1. 비밀번호 표시
기본은 숨김
토글은 명시적 클릭 시만
14-2. 에러 메시지 정책
계정 존재 여부를 과하게 노출하지 않는 방향 권장
기본 메시지: 사원 ID 또는 비밀번호가 올바르지 않습니다.
14-3. 세션 정책
로그인 성공 후 secure session 저장
로그아웃 시 세션 완전 제거
15. 스타일 가이드
15-1. 색상
버튼: 브랜드 Primary
배경: 밝은 중성 배경
오류: Alert Red 계열
안내문: 중성 회색 계열
15-2. 타이포
제목: 24~32px
부제목: 14~16px
입력 라벨: 14px
버튼 텍스트: 15~16px
15-3. spacing
로고 ↔ 제목: 12~16px
제목 ↔ 설명: 8~12px
필드 ↔ 필드: 12~16px
오류 ↔ 버튼: 12px
16. UI 트리 구조 예시
LoginPage
 ├─ LoginBackground
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
13

 ├─ LoginCard
 │   ├─ BrandHeader
 │   │   ├─ LogoBox
 │   │   ├─ ProductTitle
 │   │   └─ ProductSubtitle
 │   ├─ LoginForm
 │   │   ├─ LoginEmployeeIdField
 │   │   ├─ LoginPasswordField
 │   │   ├─ LoginErrorAlert
 │   │   └─ LoginSubmitButton
 │   └─ FooterInfoBlock
17. 프론트 상태 모델 예시
interfaceLoginFormState{
employeeId:string;
password:string;
employeeIdError:string|null;
passwordError:string|null;
submitError:string|null;
isPasswordVisible:boolean;
isSubmitting:boolean;
}
18. 테스트 시나리오
18-1. 정상 시나리오
유효한 사원 ID 입력
유효한 비밀번호 입력
로그인 성공
권한별 홈 이동
18-2. 입력 오류 시나리오
ID 없이 제출
비밀번호 없이 제출
오류 메시지 표시
18-3. 인증 실패 시나리오
잘못된 ID/비밀번호 입력
인증 실패 메시지 표시
입력값 유지
1. 
2. 
3. 
4. 
1. 
2. 
3. 
1. 
2. 
3. 
14

18-4. 비활성 계정 시나리오
Auth 성공
profile status = INACTIVE
접근 차단 메시지
18-5. 중복 제출 시나리오
버튼 연타
1회 요청만 처리
18-6. 모바일 시나리오
키보드 올라와도 버튼 접근 가능
레이아웃 깨짐 없음
19. 구현 우선순위
19-1. 필수 구현
로고 섹션
ID 입력
비밀번호 입력
비밀번호 보기 토글
로그인 버튼
기본 오류 메시지
Firebase Auth 연동
users profile 조회
role 기반 분기
19-2. 후속 개선
자동 로그인 유지
최근 로그인 계정 기억
브랜딩 배경 고도화
20. 최종 정리
이 문서는 HELLA company 업무관리사이트의 로그인 화면을 실제 구현 가능한 수준으로 초정밀 분해한 와이어프레임
정의서이다.
다음 문서는 이와 동일한 방식으로 이어서 작성한다. - 사원 홈 화면 - 사원 일정 화면 - 사원 마감 화면 - 사원 장비 반출/
반입 화면 - 관리자 대시보드 - 관리자 일정관리 화면 - 관리자 장비관리 화면
1. 
2. 
3. 
1. 
2. 
1. 
2. 
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
15

