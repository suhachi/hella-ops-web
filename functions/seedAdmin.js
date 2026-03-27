const admin = require('firebase-admin');

// 1. 초기화
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'hella-ops'
  });
}

const db = admin.firestore();

// 시딩 대상 목록 (실제 확인된 UID 반영)
const SEED_TARGETS = [
  { 
    uid: '7MfYm88cB6M9VKXOUW4Px27baf52', 
    email: 'admin@hellaops.com', 
    label: '클라이언트 운영용' 
  },
  { 
    uid: 'DEV_UID_HERE', // 사용자 가입 후 UID 기입 필요
    email: 'eehowon9927@naver.com', 
    label: '개발자 점검용' 
  }
];

async function seedWithVerifiedUid() {
  console.log(`[SEED] 시작: 총 ${SEED_TARGETS.length}개 대상 시딩 시도`);

  for (const target of SEED_TARGETS) {
    if (!target.uid || target.uid === 'DEV_UID_HERE') {
      console.log(`\n[WAIT] ${target.label} (${target.email}): Auth 사용자 미확인. 가입 후 진행 가능.`);
      continue;
    }

    console.log(`\n--- [계정: ${target.label} - ${target.email}] ---`);
    
    try {
      const userRef = db.collection('users').doc(target.uid);
      const docSnap = await userRef.get();
      const now = admin.firestore.Timestamp.now();

      const adminData = {
        email: target.email,
        displayName: target.label.includes('클라이언트') ? '최고관리자(운영)' : '개발자(점검)',
        role: 'SUPER_ADMIN',
        isActive: true, // 사후 비활성화 가능
        updatedAt: now,
      };

      if (!docSnap.exists) {
        adminData.createdAt = now;
      }

      await userRef.set(adminData, { merge: true });
      console.log(`[SEED] 성공: UID(${target.uid}) 문서가 SUPER_ADMIN으로 등록되었습니다.`);

    } catch (error) {
      console.error(`[SEED] 오류:`, error.message);
    }
  }
}

seedWithVerifiedUid();
