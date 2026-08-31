import React from 'react';
import { Search, Crown, Bell, User, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchFocus: () => void;
}

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery, onSearchFocus }) => {
  const { user, openAuthModal } = useAuthStore();

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[#0B0B0E] border-none select-none flex-shrink-0">
      {/* Search Input Box */}
      <div className="flex-1 max-w-xl">
        <div className="flex items-center bg-[#181820] rounded-xl px-4 h-11 gap-3 focus-within:ring-2 focus-within:ring-[#FC475C]/40 transition-all border-none">
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
            <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-white p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 ml-6">
        <button
          onClick={() => {}}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FC475C]/20 to-[#C026D3]/20 hover:from-[#FC475C]/30 hover:to-[#C026D3]/30 text-white text-xs font-bold transition-all border-none"
        >
          <Crown className="w-4 h-4 text-[#FC475C]" />
          <span>Nâng cấp Premium</span>
        </button>

        <button className="w-9 h-9 rounded-xl bg-[#181820] hover:bg-[#22222D] flex items-center justify-center text-text-secondary hover:text-white transition-colors border-none">
          <Bell className="w-4 h-4" />
        </button>

        {user ? (
          <div className="flex items-center gap-2 cursor-pointer" onClick={openAuthModal}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#EC4899] flex items-center justify-center text-white text-xs font-extrabold shadow-md">
              {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="w-9 h-9 rounded-xl bg-[#181820] hover:bg-[#22222D] flex items-center justify-center text-text-secondary hover:text-white transition-colors border-none"
          >
            <User className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
