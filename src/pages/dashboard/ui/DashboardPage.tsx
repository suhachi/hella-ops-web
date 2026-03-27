import React from 'react';
import { useAuth } from '@/entities/user/model/useAuth';
import { authService } from '@/features/auth/login/model/authService';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white p-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500 shadow-lg shadow-sky-500/20" />
          <h1 className="text-xl font-bold">HELLA OPS ADMIN</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.email} ({user?.role})</span>
          <button 
            onClick={() => authService.logout()}
            className="px-4 py-2 rounded-lg bg-slate-800 text-sm hover:bg-slate-700 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="glass-card p-12 text-center border-sky-500/20">
        <h2 className="text-3xl font-bold mb-4">관리자 대시보드 (준비 중)</h2>
        <p className="text-slate-400 mb-8">인증 및 권한 라우팅이 정상적으로 작동하고 있습니다.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-sky-400 text-sm mb-2">오늘의 일정</div>
            <div className="text-2xl font-bold">12 건</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-emerald-400 text-sm mb-2">활성 장비</div>
            <div className="text-2xl font-bold">45 대</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-amber-400 text-sm mb-2">미검토 마감</div>
            <div className="text-2xl font-bold">3 건</div>
          </div>
        </div>
      </main>
    </div>
  );
};
