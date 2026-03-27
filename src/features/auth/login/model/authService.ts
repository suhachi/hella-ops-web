import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  AuthError
} from 'firebase/auth';
import { auth } from '@/shared/lib/firebase';

export const authService = {
  async login(email: string, pass: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      const authError = error as AuthError;
      let message = '로그인 실패';
      if (authError.code === 'auth/wrong-password') message = '비밀번호 불일치';
      return { user: null, error: message };
    }
  },

  async logout() {
    await signOut(auth);
  },

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: '재설정 이메일 발송 실패' };
    }
  }
};
