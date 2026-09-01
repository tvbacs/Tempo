import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, LogOut, ShieldCheck, Mail, Home, Download, Folder } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchFocus: () => void;
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchFocus,
  currentTab = 'home',
  setCurrentTab,
}) => {
  const { user, signOut, openAuthModal } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut();
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-[#000000] border-none select-none flex-shrink-0 relative z-30">
      {/* 1. Left Logo */}
      <div
        onClick={() => setCurrentTab && setCurrentTab('home')}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <img
          src="/logo.png"
          alt="Tempo Logo"
          className="w-8 h-8 rounded-full object-contain drop-shadow"
        />
      </div>

      {/* 2. Center Search & Home Button (Spotify Pill Style) */}
      <div className="flex items-center gap-2 max-w-lg w-full">
        {/* Home Circle Button */}
        <button
          onClick={() => setCurrentTab && setCurrentTab('home')}
          title="Trang chủ"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-none cursor-pointer flex-shrink-0 ${
            currentTab === 'home'
              ? 'bg-[#1f1f1f] text-white hover:scale-105'
              : 'bg-[#1f1f1f] text-[#b3b3b3] hover:text-white hover:scale-105'
          }`}
        >
          <Home className="w-5 h-5 fill-current" />
        </button>

        {/* Search Bar with Browse Folder Icon on Right */}
        <div className="flex-1 flex items-center bg-[#1f1f1f] hover:bg-[#2a2a2a] focus-within:bg-[#2a2a2a] focus-within:ring-2 focus-within:ring-white rounded-full px-4 h-12 gap-3 transition-all border-none">
          <Search className="w-5 h-5 text-[#b3b3b3] flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onSearchFocus}
            placeholder="Tìm nhạc, ca sĩ"
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-[#b3b3b3]"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#b3b3b3] hover:text-white p-1 border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentTab && setCurrentTab('library')}
              title="Duyệt thư viện"
              className="text-[#b3b3b3] hover:text-white p-1 border-none bg-transparent cursor-pointer"
            >
              <Folder className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Right Controls */}
      <div className="flex items-center gap-3">
        <button
          title="Thông báo"
          className="w-9 h-9 rounded-full bg-[#1f1f1f] hover:scale-105 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-all border-none cursor-pointer"
        >
          <Bell className="w-4 h-4" />
        </button>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-full bg-[#535353] hover:scale-105 flex items-center justify-center text-white text-xs font-bold border-none cursor-pointer p-0 transition-transform"
            >
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#282828] rounded-lg shadow-2xl p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-100 border-none">
                <div className="flex items-center gap-3 p-2 bg-[#1f1f1f] rounded-md">
                  <div className="w-9 h-9 rounded-full bg-[#535353] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">
                      {user.email ? user.email.split('@')[0] : 'Người dùng'}
                    </h4>
                    <p className="text-[11px] text-[#b3b3b3] truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-[#b3b3b3] flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#1ed760] bg-[#1ed760]/10 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Tài khoản đã xác thực</span>
                </div>

                <div className="h-px bg-white/10 my-1" />

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-none bg-transparent cursor-pointer w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-4 py-1.5 rounded-full bg-white hover:scale-105 text-black text-xs font-bold transition-transform border-none cursor-pointer"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
};
