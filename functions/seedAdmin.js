const admin = require('firebase-admin');

// 1. 초기화 (프로젝트 아이디 명시)
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'hella-ops'
  });
}

const db = admin.firestore();

/**
 * 시딩 대상 목록 (사용자 제공 UID 기반 정합성 확보)
 * 클라이언트: eehowon9927@naver.com (UID: BBG5dLFNANP2MBXXLEeeUa5i8la2)
 * 개발자: admin@hellaops.com (UID: 7MfYm88cB6M9VKXOUW4Px27baf52)
 */
const SEED_TARGETS = [
  { 
    uid: 'BBG5dLFNANP2MBXXLEeeUa5i8la2', 
    email: 'eehowon9927@naver.com', 
    label: '클라이언트 운영용' 
  },
  { 
    uid: '7MfYm88cB6M9VKXOUW4Px27baf52', 
    email: 'admin@hellaops.com', 
    label: '개발자 점검용' 
  }
];

async function seedFinalAdmins() {
  console.log(`[SEED] 시작: 총 ${SEED_TARGETS.length}개 대상 시딩 시도`);

  for (const target of SEED_TARGETS) {
    if (!target.uid || target.uid.includes('HERE')) {
      console.log(`\n[SKIP] ${target.label} (${target.email}): UID가 미확보 상태입니다.`);
      continue;
    }

    console.log(`\n--- [계정: ${target.label} - ${target.email}] ---`);
    
    try {
      const userRef = db.collection('users').doc(target.uid);
      const docSnap = await userRef.get();
      const now = admin.firestore.Timestamp.now();

      // Zero Trust 원칙 기반 데이터 구조
      const adminData = {
        email: target.email,
        displayName: target.label.includes('클라이언트') ? '최고관리자(운영)' : '개발자(점검)',
        role: 'SUPER_ADMIN',
        isActive: true, // 사후 비활성화/강등 가능 구조
        updatedAt: now,
      };

      if (!docSnap.exists) {
        adminData.createdAt = now;
        console.log('[SEED] 새로운 유저 프로필 생성');
      } else {
        console.log('[SEED] 기존 유저 프로필 권한 갱신 (Merge)');
      }

      // 실제 Firestore 쓰기
      await userRef.set(adminData, { merge: true });
      console.log(`[SEED] 성공: UID(${target.uid}) 문서가 SUPER_ADMIN으로 확정되었습니다.`);

    } catch (error) {
      console.error(`[SEED] 오류:`, error.message);
    }
  }
  
  console.log('\n[SEED] 모든 대상에 대한 작업이 종료되었습니다.');
}

seedFinalAdmins();
