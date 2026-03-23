import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../shared/lib/firebase';
import { userRepository } from '../api/userRepository';
import { UserProfile, AuthState } from './types';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          // 1. Firebase Auth 정보와 Firestore 프로필 결합
          const profile = await userRepository.getProfile(fbUser.uid);
          
          if (profile) {
            setAuthState({
              user: profile,
              isLoading: false,
              error: null,
            });
          } else {
            // Firestore에 프로필이 없는 경우 (최초 로그인 또는 데이터 누락)
            setAuthState({
              user: {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                photoURL: fbUser.photoURL,
                role: 'WORKER', // 기본 역할
                isActive: false, // 기본 비활성 (관리자 승인 필요)
              },
              isLoading: false,
              error: '프로필 승인이 필요합니다.',
            });
          }
        } else {
          setAuthState({ user: null, isLoading: false, error: null });
        }
      } catch (err: any) {
        setAuthState({ user: null, isLoading: false, error: err.message });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
};
