const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'hella-ops'
  });
}

const db = admin.firestore();
const auth = admin.auth();

const TARGET_EMAIL = 'eehowon9927@naver.com';
const TEMP_PASSWORD = 'HellaOps1234!'; // 초기 진입용 임시 비밀번호

async function forceSeedAdmin() {
  console.log(`[FORCE-SEED] 시작: ${TARGET_EMAIL} 계정 생성 및 권한 부여를 시도합니다.`);

  let uid;

  try {
    // 1. Auth 사용자 조회
    const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
    uid = userRecord.uid;
    console.log(`[FORCE-SEED] 기존 Auth 사용자 발견: UID = ${uid}`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`[FORCE-SEED] Auth 사용자가 없습니다. 직접 생성을 시작합니다.`);
      // 2. Auth 사용자 강제 생성
      const newUser = await auth.createUser({
        email: TARGET_EMAIL,
        password: TEMP_PASSWORD,
        displayName: '클라이언트 최고관리자',
        emailVerified: true
      });
      uid = newUser.uid;
      console.log(`[FORCE-SEED] Auth 사용자 생성 성공: UID = ${uid}`);
      console.log(`[IMPORTANT] 임시 비밀번호: ${TEMP_PASSWORD}`);
    } else {
      console.error('[FORCE-SEED] 오류 발생:', error.message);
      return;
    }
  }

  // 3. Firestore 프로필 생성/업데이트
  try {
    const userRef = db.collection('users').doc(uid);
    const now = admin.firestore.Timestamp.now();

    await userRef.set({
      email: TARGET_EMAIL,
      displayName: '클라이언트 최고관리자',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    console.log(`[FORCE-SEED] 최종 성공: ${TARGET_EMAIL} (UID: ${uid}) 가 SUPER_ADMIN으로 등록되었습니다.`);
  } catch (fsError) {
    console.error('[FORCE-SEED] Firestore 쓰기 실패:', fsError.message);
  }
}

forceSeedAdmin();
