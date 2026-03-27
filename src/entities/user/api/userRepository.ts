import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../shared/lib/firebase';
import { UserProfile } from '../model/types';

export const userRepository = {
  /**
   * UID를 기반으로 Firestore의 사용자 프로필 정보를 가져옵니다.
   */
  async getProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() } as UserProfile;
    }
    return null;
  },

  /**
   * 신규 사용자의 기본 프로필을 생성합니다. (준비용)
   */
  async createInitialProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      role: data.role || 'WORKER',
      isActive: data.isActive || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
};
