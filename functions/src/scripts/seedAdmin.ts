import * as admin from 'firebase-admin';

// 서비스 계정 키 없이 로컬 인증(ADC)을 사용하거나 
// firebase use로 설정된 프로젝트 설정을 따릅니다.
try {
  admin.initializeApp({
    projectId: 'hella-ops'
  });
} catch (e) {
  // 이미 초기화된 경우 무시
}

const db = admin.firestore();
const auth = admin.auth();

const SEED_EMAIL = 'eehowon9927@naver.com';

async function seedAdmin() {
  console.log(`[SEED] 시작: ${SEED_EMAIL} 를 SUPER_ADMIN으로 등록합니다.`);

  try {
    // 1. Auth에서 사용자 검색
    const userRecord = await auth.getUserByEmail(SEED_EMAIL);
    const uid = userRecord.uid;
    console.log(`[SEED] Auth 사용자 확인 완료: UID = ${uid}`);

    // 2. Firestore users 문서 경로 확인
    const userRef = db.collection('users').doc(uid);
    const docSnap = await userRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (data?.role === 'SUPER_ADMIN') {
        console.log('[SEED] 이미 SUPER_ADMIN으로 등록되어 있습니다. 작업을 중단합니다.');
        return;
      }
      console.log('[SEED] 기존 문서가 존재합니다. role을 SUPER_ADMIN으로 업데이트합니다.');
    }

    // 3. 데이터 적재
    const now = admin.firestore.FieldValue.serverTimestamp();
    await userRef.set({
      email: SEED_EMAIL,
      displayName: userRecord.displayName || '최고관리자',
      photoURL: userRecord.photoURL || null,
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: docSnap.exists ? data?.createdAt : now,
      updatedAt: now,
      lastLoginAt: now
    }, { merge: true });

    console.log(`[SEED] 성공: ${uid} 문서가 SUPER_ADMIN으로 활성화되었습니다.`);

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`[SEED] 실패: ${SEED_EMAIL} 사용자가 Firebase Auth에 가입되어 있지 않습니다.`);
      console.error('사용자님, 먼저 해당 이메일로 가입(또는 콘솔에서 생성) 하신 후에 이 스크립트를 실행해야 합니다.');
    } else {
      console.error('[SEED] 알 수 없는 오류 발생:', error);
    }
    process.exit(1);
  }
}

seedAdmin();
