import React from 'react';
import { Music, Search, X, Home, Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface TopNavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onHomeClick: () => void;
  onSearchFocus: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onHomeClick,
  onSearchFocus,
}) => {
  const { user, openAuthModal, signOut } = useAuthStore();

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-[#000000] border-b border-white/5 select-none z-30 flex-shrink-0">
      {/* Left: Spotify-style Logo & Home Button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHomeClick}>
          <Music className="w-8 h-8 text-primary" strokeWidth={2.5} />
          <span className="text-xl font-extrabold tracking-wider text-white hidden md:inline">TEMPO</span>
        </div>

        <button
          onClick={onHomeClick}
          className="w-10 h-10 rounded-full bg-[#1F1F1F] hover:bg-[#2A2A2A] hover:scale-105 transition-all flex items-center justify-center text-white ml-2"
          title="Trang chủ"
        >
          <Home className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-lg mx-4">
        <div className="relative flex items-center bg-[#1F1F1F] hover:bg-[#2A2A2A] focus-within:bg-[#2A2A2A] border border-transparent focus-within:border-white/20 rounded-full h-11 px-4 transition-all group">
          <Search className="w-5 h-5 text-text-secondary group-focus-within:text-white flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onSearchFocus}
            placeholder="Bạn muốn phát nội dung gì?"
            className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-text-secondary px-3"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-secondary hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Auth Profile / Explore */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[#1F1F1F] pl-2 pr-3 py-1 rounded-full border border-white/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#FC475C] to-[#FC655A] flex items-center justify-center text-xs font-bold text-white">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-white max-w-[130px] truncate">
                {user.email}
              </span>
            </div>
            <button
              onClick={signOut}
              title="Đăng xuất"
              className="w-8 h-8 rounded-full bg-[#1F1F1F] hover:bg-red-500/20 hover:text-red-500 text-text-secondary flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="bg-white hover:bg-white/90 text-black font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
};
