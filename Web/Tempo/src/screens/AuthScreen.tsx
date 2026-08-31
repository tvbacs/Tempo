import React, { useState } from 'react';
import { ArrowRight, RefreshCw, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AuthScreen: React.FC = () => {
  const { signIn } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await signIn(identifier, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Mật khẩu hoặc tài khoản không chính xác.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0B0B0E] text-white select-none overflow-hidden font-sans">
      {/* Left Column: Brand Story & Sync Showcase */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-[#15151D] via-[#121217] to-[#0B0B0E] relative border-r border-white/5">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Tempo" className="w-10 h-10 rounded-md object-contain drop-shadow-lg" />
          <div className="flex flex-col">
            <span className="text-xl font-black text-white tracking-wide">Tempo</span>
            <span className="text-[10px] font-bold text-[#FC475C] tracking-widest uppercase">Music Player</span>
          </div>
        </div>

        {/* Center Hero Intro */}
        <div className="max-w-md my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FC475C]/15 text-[#FC475C] text-xs font-bold mb-4">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Đồng bộ dữ liệu Web & Mobile</span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight mb-4">
            Trải nghiệm âm nhạc liền mạch trên mọi thiết bị.
          </h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Đăng nhập tài khoản Tempo để đồng bộ toàn bộ bài hát đã thích, danh sách phát, nghệ sĩ theo dõi và lịch sử nghe nhạc giữa máy tính và điện thoại.
          </p>
        </div>

        {/* Footer info */}
        <span className="text-[11px] text-text-muted">
          © 2026 Tempo Music Player. All rights reserved.
        </span>
      </div>

      {/* Right Column: Clean Login Form (Chỉ đăng nhập, không có đăng ký) */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0B0B0E]">
        <div className="w-full max-w-md bg-[#181820] rounded-lg p-8 flex flex-col border-none shadow-2xl">
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6">
            <img src="/logo.png" alt="Tempo" className="w-9 h-9 rounded-md object-contain" />
            <span className="text-xl font-black text-white">Tempo Music</span>
          </div>

          <h2 className="text-xl font-black text-white mb-1.5">
            Đăng nhập vào Tempo
          </h2>
          <p className="text-xs text-text-secondary mb-6">
            Nhập email hoặc tên tài khoản và mật khẩu của bạn.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Email hoặc Tên tài khoản</label>
              <div className="flex items-center bg-[#111117] rounded-md px-3.5 h-11 border border-white/10 focus-within:border-[#FC475C] transition-colors gap-2.5">
                <Mail className="w-4 h-4 text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com hoặc username"
                  className="w-full bg-transparent text-xs text-white outline-none border-none placeholder:text-text-muted"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary">Mật khẩu</label>
              <div className="flex items-center bg-[#111117] rounded-md px-3.5 h-11 border border-white/10 focus-within:border-[#FC475C] transition-colors gap-2.5">
                <Lock className="w-4 h-4 text-text-muted flex-shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-xs text-white outline-none border-none placeholder:text-text-muted"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-md leading-relaxed">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !identifier.trim() || !password.trim()}
              className="w-full py-3 mt-2 bg-gradient-to-r from-[#FC475C] to-[#FC655A] hover:opacity-90 active:scale-98 text-white rounded-md text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 border-none cursor-pointer shadow-lg shadow-primary/20"
            >
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
