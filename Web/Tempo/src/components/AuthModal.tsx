import React, { useState } from 'react';
import { X, Music } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signIn, signUp } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const res = await signUp(email, password);
        if (!res.success) setErrorMsg(res.error || 'Đăng ký thất bại');
      } else {
        const res = await signIn(email, password);
        if (!res.success) setErrorMsg(res.error || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#181818] rounded-xl p-8 w-full max-w-md relative shadow-2xl">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FC475C] to-[#FC655A] flex items-center justify-center text-white mb-3 shadow-lg">
            <Music className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isRegister ? 'Tạo tài khoản Tempo' : 'Đăng nhập vào Tempo'}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Đồng bộ toàn bộ bài hát yêu thích và lịch sử từ điện thoại
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email của bạn..."
              className="bg-[#121212] rounded-md px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-text-secondary">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu..."
              className="bg-[#121212] rounded-md px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs p-2.5 rounded-md">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-[#FC475C] to-[#FC655A] text-white font-bold py-3 rounded-md mt-2 hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted mt-2">
            <span>{isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
              }}
              className="text-primary font-bold hover:underline"
            >
              {isRegister ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
