import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="fixed top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/20" />
          <h1 className="text-xl font-bold tracking-tight text-white">HELLA OPS</h1>
        </div>
        <nav className="flex gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors">대시보드</a>
          <a href="#" className="hover:text-white transition-colors">장비현황</a>
          <a href="#" className="hover:text-white transition-colors">로그조회</a>
        </nav>
      </header>

      <main className="w-full max-w-4xl glass-card p-12 text-center animate-in fade-in zoom-in duration-700">
        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
          Premium Field Ops Management
        </h2>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
          HELLA OPS는 현장 관리의 모든 과정을 데이터 기반으로 혁신합니다.<br />
          보안과 효율을 동시에 잡는 차세대 워크플로우를 경험하세요.
        </p>
        <button className="btn-primary">
          시스템 시작하기
        </button>
      </main>

      <footer className="fixed bottom-0 w-full p-6 text-center text-xs text-slate-600">
        &copy; 2026 HELLA Company. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
