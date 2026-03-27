const admin = require('firebase-admin');

// 1. 초기화
try {
  admin.initializeApp({
    projectId: 'hella-ops'
  });
  console.log('[SEED] Firebase Admin 초기화 완료 (hella-ops)');
} catch (e) {
  // 이미 초기화된 경우 무시
}

const db = admin.firestore();
const auth = admin.auth();

const SEED_EMAIL = 'eehowon9927@naver.com';

async function seedAdmin() {
  console.log(`[SEED] 시작: ${SEED_EMAIL} 를 SUPER_ADMIN으로 등록 시도합니다.`);

  try {
    // 2. Auth에서 사용자 검색
    const userRecord = await auth.getUserByEmail(SEED_EMAIL);
    const uid = userRecord.uid;
    console.log(`[SEED] Auth 사용자 확인 완료: UID = ${uid}`);

    // 3. Firestore users 문서 경로 확인
    const userRef = db.collection('users').doc(uid);
    const docSnap = await userRef.get();

    // 4. 데이터 준비
    const now = admin.firestore.Timestamp.now();
    const adminData = {
      email: SEED_EMAIL,
      displayName: userRecord.displayName || '최고관리자',
      photoURL: userRecord.photoURL || null,
      role: 'SUPER_ADMIN',
      isActive: true,
      updatedAt: now,
      lastLoginAt: now
    };

    if (!docSnap.exists) {
      adminData.createdAt = now;
      console.log('[SEED] 새로운 사용자로 생성합니다.');
    } else {
      console.log('[SEED] 기존 사용자의 정보를 업데이트합니다.');
    }

    // 5. 실제 쓰기
    await userRef.set(adminData, { merge: true });
    console.log(`[SEED] 최종 성공: UID(${uid}) 문서가 SUPER_ADMIN으로 활성화되었습니다.`);

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`[SEED] 실패: ${SEED_EMAIL} 를 Auth에서 찾을 수 없습니다.`);
      console.log('>>> 조치사항: 실제 Firebase Console > Auth 메뉴에서 해당 이메일을 먼저 가입시키거나, 사용자가 직접 해당 이메일로 가입한 후 이 스크립트를 다시 실행해야 합니다.');
    } else {
      console.error('[SEED] 알 수 없는 오류:', error.message);
    }
    process.exit(1);
  }
}

seedAdmin();
