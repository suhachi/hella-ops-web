import React, { useState } from 'react';
import { AuthLayout } from '@/shared/ui/layout/AuthLayout';
import { LoginForm } from '@/features/auth/login/ui/LoginForm';
import { ResetPasswordForm } from '@/features/auth/reset-password/ui/ResetPasswordForm';

export const LoginPage: React.FC = () => {
  const [view, setView] = useState<'login' | 'reset-password'>('login');

  return (
    <AuthLayout 
      title={view === 'login' ? '환영합니다' : '비밀번호 재설정'}
      subtitle={view === 'login' ? '시스템 접속을 위해 이메일로 로그인하세요.' : '가입하신 이메일로 재설정 링크를 보내드립니다.'}
    >
      {view === 'login' ? (
        <LoginForm 
          onSuccess={() => { /* RouterProvider에서 자동 리다이렉트됨 */ }}
          onForgotPassword={() => setView('reset-password')}
        />
      ) : (
        <ResetPasswordForm 
          onBack={() => setView('login')}
        />
      )}
    </AuthLayout>
  );
};
