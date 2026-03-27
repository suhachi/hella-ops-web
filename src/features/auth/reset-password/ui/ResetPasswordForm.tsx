import React, { useState } from 'react';
import { authService } from '../../login/model/authService';

interface ResetPasswordFormProps {
  onBack: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: '이메일을 입력해 주세요.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { success, error } = await authService.resetPassword(email);

    setIsLoading(false);
    if (success) {
      setMessage({ type: 'success', text: '재설정 이메일이 발송되었습니다. 메일함을 확인해 주세요.' });
    } else {
      setMessage({ type: 'error', text: error as string });
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg border text-sm leading-relaxed ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {!message?.type || message.type === 'error' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">가입 시 사용한 이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hellaops.com"
              disabled={isLoading}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '재설정 메일 발송'
            )}
          </button>
        </form>
      ) : null}

      <button
        onClick={onBack}
        className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors py-2"
      >
        로그인으로 돌아가기
      </button>
    </div>
  );
};
