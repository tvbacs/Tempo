import React, { useState } from 'react';
import { X, Lock, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signIn, signUp } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
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
        const res = await signUp(identifier, password);
        if (!res.success) setErrorMsg(res.error || 'Đăng ký thất bại');
      } else {
        const res = await signIn(identifier, password);
        if (!res.success) setErrorMsg(res.error || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 select-none">
      <div className="bg-[#181818] border border-white/10 rounded-2xl p-8 w-full max-w-md relative shadow-2xl animate-in fade-in zoom-in duration-200">
        <button
          onClick={closeAuthModal}
          title="Đóng / Khám phá như khách"
          className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 border-none bg-transparent cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/logo.png"
            alt="Tempo Music"
            className="w-16 h-16 rounded-full object-contain mb-3 drop-shadow-lg"
          />
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isRegister ? 'Tạo tài khoản Tempo' : 'Đăng nhập vào Tempo'}
          </h2>
          <p className="text-xs text-[#b3b3b3] mt-1.5 max-w-xs">
            Đồng bộ danh sách bài hát yêu thích, playlist và chuyển phát trực tiếp giữa các thiết bị
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-[#b3b3b3]">
              {isRegister ? 'Email đăng ký' : 'Tên tài khoản hoặc Email'}
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-[#727272] absolute left-3.5" />
              <input
                type={isRegister ? 'email' : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder={isRegister ? 'Nhập email của bạn...' : 'Nhập username hoặc email...'}
                className="w-full bg-[#121212] border border-white/10 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors placeholder:text-[#555]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-[#b3b3b3]">Mật khẩu</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#727272] absolute left-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu..."
                className="w-full bg-[#121212] border border-white/10 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-white outline-none focus:border-primary transition-colors placeholder:text-[#555]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-2.5 rounded-lg leading-relaxed">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-[#e03a50] text-white font-bold py-3 rounded-lg mt-1 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 border-none cursor-pointer"
          >
            {isLoading ? 'Đang xử lý...' : isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập'}
          </button>

          <div className="flex items-center justify-between text-xs text-[#b3b3b3] mt-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
              }}
              className="text-primary font-bold hover:underline border-none bg-transparent cursor-pointer p-0"
            >
              {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>

            <button
              type="button"
              onClick={closeAuthModal}
              className="text-[#727272] hover:text-white hover:underline border-none bg-transparent cursor-pointer p-0"
            >
              Khám phá như khách
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
