import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/shared/lib/firebase';
import { userRepository } from '@/entities/user/api/userRepository';
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
          const profile = await userRepository.getProfile(fbUser.uid);
          
          if (profile) {
            setAuthState({
              user: profile,
              isLoading: false,
              error: null,
            });
          } else {
            setAuthState({
              user: {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                photoURL: fbUser.photoURL,
                role: 'WORKER',
                isActive: false,
              },
              isLoading: false,
              error: '승인되지 않은 계정입니다.',
            });
          }
        } else {
          setAuthState({ user: null, isLoading: false, error: null });
        }
      } catch (err: any) {
        setAuthState({ user: null, isLoading: false, error: '인증 동기화 실패' });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
};
