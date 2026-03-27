import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/shared/ui/layout/AuthLayout';
import { LoginForm } from '@/features/auth/login/ui/LoginForm';
import { ResetPasswordForm } from '@/features/auth/reset-password/ui/ResetPasswordForm';
import { HomePage } from '@/pages/home/ui/HomePage';
import { useAuth } from '@/entities/user/model/useAuth';
import { LoginPage } from '@/pages/login/ui/LoginPage';
import { DashboardPage } from '@/pages/dashboard/ui/DashboardPage';

/**
 * 인증 보호 가드
 */
const RequireAuth: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c10] text-slate-400 p-8 text-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">승인 대기 중</h2>
          <p>관리자의 승인이 필요한 계정입니다. 승인 후 다시 시도해 주세요.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="mt-6 text-sky-400 underline"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallBackPath = ['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? '/app/dashboard' : '/m/home';
    return <Navigate to={fallBackPath} replace />;
  }

  return <>{children}</>;
};

export const RouterWrapper: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user?.isActive ? (
            <Navigate to={['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? '/app/dashboard' : '/m/home'} replace />
          ) : (
            <LoginPage />
          )
        } />

        <Route path="/app/*" element={
          <RequireAuth allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <Routes>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </RequireAuth>
        } />

        <Route path="/m/*" element={
          <RequireAuth allowedRoles={['LEADER', 'WORKER']}>
            <Routes>
              <Route path="home" element={<HomePage />} />
              <Route path="*" element={<Navigate to="home" replace />} />
            </Routes>
          </RequireAuth>
        } />

        <Route path="/" element={
          <Navigate to={user ? (['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? '/app/dashboard' : '/m/home') : '/login'} replace />
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
