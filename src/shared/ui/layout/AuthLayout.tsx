import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0c10] overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md px-4 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/20" />
            <span className="text-2xl font-bold tracking-tight text-white">HELLA OPS</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
          {subtitle && <p className="text-slate-400">{subtitle}</p>}
        </div>

        <div className="glass-card p-8 border border-white/5 shadow-2xl">
          {children}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          &copy; 2026 HELLA Company. 프리미엄 현장 관리 솔루션.
        </p>
      </div>
    </div>
  );
};
