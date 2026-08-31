import React, { useState, useRef, useEffect } from 'react';
import { Search, Crown, Bell, User, X, LogOut, ShieldCheck, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchFocus: () => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, onSearchFocus }) => {
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
    <header className="h-16 flex items-center justify-between px-8 bg-[#0B0B0E] border-none select-none flex-shrink-0 relative z-30">
      {/* Search Input Box */}
      <div className="flex-1 max-w-xl">
        <div className="flex items-center bg-[#181820] rounded-md px-4 h-10 gap-3 focus-within:ring-2 focus-within:ring-[#FC475C]/40 transition-all border-none">
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onSearchFocus}
            placeholder="Tìm bài hát, nghệ sĩ hoặc link YouTube..."
            className="w-full bg-transparent border-none outline-none text-xs font-medium text-white placeholder:text-text-muted"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-white p-1 border-none bg-transparent cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5 ml-6">
        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-gradient-to-r from-[#FC475C]/20 to-[#FC655A]/20 hover:from-[#FC475C]/30 hover:to-[#FC655A]/30 text-white text-xs font-bold transition-all border-none cursor-pointer"
        >
          <Crown className="w-4 h-4 text-[#FC475C]" />
          <span>Nâng cấp Premium</span>
        </button>

        <button className="w-9 h-9 rounded-md bg-[#181820] hover:bg-[#22222D] flex items-center justify-center text-text-secondary hover:text-white transition-colors border-none cursor-pointer">
          <Bell className="w-4 h-4" />
        </button>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 border-none bg-transparent cursor-pointer p-0"
            >
              <div className="w-9 h-9 rounded-md bg-gradient-to-tr from-[#FC475C] to-[#FC655A] flex items-center justify-center text-white text-xs font-black shadow-md shadow-primary/25 hover:opacity-90 transition-opacity">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#181820] rounded-lg shadow-2xl p-3 flex flex-col gap-2 border border-white/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center gap-3 p-2 bg-[#121217] rounded-md">
                  <div className="w-10 h-10 rounded-md bg-gradient-to-tr from-[#FC475C] to-[#FC655A] flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">
                      {user.email ? user.email.split('@')[0] : 'Người dùng'}
                    </h4>
                    <p className="text-[11px] text-text-muted truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-text-muted flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#10B981] bg-[#10B981]/10 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Tài khoản đã xác thực</span>
                </div>

                <div className="h-px bg-white/5 my-1" />

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
            className="w-9 h-9 rounded-md bg-[#181820] hover:bg-[#22222D] flex items-center justify-center text-text-secondary hover:text-white transition-colors border-none cursor-pointer"
          >
            <User className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
