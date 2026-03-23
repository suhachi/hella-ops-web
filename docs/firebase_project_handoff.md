# Firebase 실프로젝트 생성 및 전환 체크리스트 (인계 문서)

## 1. 초기 프로젝트 생성 및 활성화
- [ ] Firebase Console에서 프로젝트 생성 및 ID 확정.
- [ ] **Authentication**: Email/Password 제공업체 활성화.
- [ ] **Cloud Firestore**: 프로덕션 모드로 시작, 리전 설정 및 `firestore.rules` 배포.
- [ ] **Cloud Functions**: 요금제 업그레이드(Blaze) 및 Node.js 20 런타임 확인.
- [ ] **Cloud Storage**: 기본 버킷 생성 및 리전 설정.

## 2. 로컬 환경 전환 (Emulator -> Production)
- [ ] `.firebaserc` 파일 내 프로젝트 ID 별칭 추가.
- [ ] `firebase use <alias>` 명령으로 대상 프로젝트 선택.
- [ ] 환경 변수(`firebase functions:config:set` 또는 `.env`) 설정 점검.
- [ ] 프론트엔드 `.env` 파일의 API Key 및 Project ID 업데이트.

## 3. 배포 전 최종 체크포인트
- **Rules**: `firestore.rules` 내 Zero Trust 가드가 활성화되어 있는지 재확인.
- **Functions**: 리전이 `asia-northeast3` (대한민국)로 설정되어 있는지 확인.
- **Index**: Firestore 복합 인덱스가 필요한 쿼리(정렬/필터링 등) 반영 여부 확인.
- **Secret**: 민감한 API KEY 등이 프로젝트 시크릿 매니저에 등록되었는지 확인.

## 4. 실프로젝트 생성 후 즉시 검증 항목
- [ ] `npm run deploy` 후 콘솔 로그 상에 에러 발생 여부.
- [ ] 실제 사용자 초대 후 `role` 부여 및 `isActive` 필드 작동 확인.
- [ ] 대용량 파일(사진) 업로드 시 Storage 권한 및 쿼터 발생 여부.
