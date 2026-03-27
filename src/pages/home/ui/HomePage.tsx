import React from 'react';
import { useAuth } from '@/entities/user/model/useAuth';
import { authService } from '@/features/auth/login/model/authService';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0c10] text-white flex flex-col p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-lg font-bold tracking-tight">HELLA OPS <span className="text-sky-400 text-xs ml-1">FIELD</span></h1>
        <button 
          onClick={() => authService.logout()}
          className="text-slate-400 text-sm"
        >
          로그아웃
        </button>
      </header>

      <main className="flex-1 space-y-6">
        <div className="glass-card p-6 border-sky-500/10">
          <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">반갑습니다</div>
          <div className="text-2xl font-bold">{user?.displayName || '사원'}님</div>
          <div className="mt-2 text-xs text-sky-400 px-2 py-1 bg-sky-500/10 rounded-full inline-block border border-sky-500/20">
            {user?.role}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-300 ml-1">오늘의 작업</h3>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 italic">
            배정된 작업 일정이 없습니다.
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 flex justify-around">
        <div className="text-sky-400 flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-md bg-sky-500/20 border border-sky-500/40" />
          <span className="text-[10px]">홈</span>
        </div>
        <div className="text-slate-500 flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700" />
          <span className="text-[10px]">일정</span>
        </div>
        <div className="text-slate-500 flex flex-col items-center gap-1">
          <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700" />
          <span className="text-[10px]">설정</span>
        </div>
      </nav>
    </div>
  );
};
