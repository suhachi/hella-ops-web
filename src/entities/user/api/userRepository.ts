import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../shared/lib/firebase';
import { UserProfile } from '../model/types';

export const userRepository = {
  /**
   * UID를 기반으로 Firestore의 사용자 프로필 정보를 조회합니다.
   */
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { uid, ...userSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }
};
