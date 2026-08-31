import React from 'react';
import {
  Activity,
  Home,
  Download,
  FolderClosed,
  Heart,
  History,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { likedSongs, history, playlists } = useLibraryStore();

  const menuItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'downloads', label: 'Tải xuống', icon: Download },
    { id: 'library', label: 'Thư viện', icon: FolderClosed },
    { id: 'liked', label: 'Yêu thích', icon: Heart, badge: likedSongs.length },
    { id: 'history', label: 'Lịch sử', icon: History },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const defaultPlaylists = [
    { id: 'p1', name: 'Nhạc chill', count: 56, thumb: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=100' },
    { id: 'p2', name: 'Workout', count: 32, thumb: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100' },
    { id: 'p3', name: 'Ballad Việt', count: 48, thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100' },
    { id: 'p4', name: 'EDM Gaming', count: 27, thumb: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=100' },
  ];

  return (
    <aside className="w-60 bg-[#121217] flex flex-col p-4 select-none flex-shrink-0 border-none overflow-y-auto custom-scrollbar">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#EC4899] flex items-center justify-center text-white shadow-lg">
          <Activity className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <span className="text-base font-extrabold text-white tracking-wide">Tải xuống</span>
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex flex-col gap-1 mb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left border-none ${
                isActive
                  ? 'bg-gradient-to-r from-[#FC475C]/15 to-transparent text-[#FC475C] font-bold'
                  : 'text-text-secondary hover:bg-[#181820] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FC475C]' : 'text-text-secondary'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#181820] text-text-secondary">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Playlists Section */}
      <div className="mb-6">
        <span className="text-[11px] font-extrabold text-text-muted tracking-wider px-3.5 block mb-3 uppercase">
          PLAYLIST CỦA BẠN
        </span>
        <div className="flex flex-col gap-1.5">
          {defaultPlaylists.map((p) => (
            <div
              key={p.id}
              onClick={() => setCurrentTab(`playlist_${p.id}`)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#181820] cursor-pointer transition-colors group"
            >
              <img src={p.thumb} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                  {p.name}
                </h4>
                <p className="text-[11px] text-text-muted truncate">{p.count} bài hát</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Promo Card (Nâng cấp Premium) */}
      <div className="mt-auto bg-[#181820] rounded-2xl p-4 flex flex-col border-none">
        <div className="flex items-center gap-2 mb-2 text-[#FC475C]">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold text-white">Nâng cấp Premium</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-snug mb-3">
          Tải nhạc chất lượng cao không giới hạn.
        </p>
        <button
          onClick={() => setCurrentTab('upgrade')}
          className="w-full py-2.5 bg-gradient-to-r from-[#FC475C] to-[#C026D3] text-white rounded-xl text-xs font-extrabold hover:opacity-90 active:scale-98 transition-all shadow-md shadow-primary/20 border-none"
        >
          Nâng cấp ngay
        </button>
      </div>
    </aside>
  );
};
