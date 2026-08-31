import React, { useEffect, useState } from 'react';
import {
  Home,
  Search,
  Download,
  FolderClosed,
  Crown,
  ListMusic,
} from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { apiClient } from '../api/client';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { playlists, fetchPlaylists } = useLibraryStore();
  const [featuredPlaylists, setFeaturedPlaylists] = useState<any[]>([]);

  // 5 Tab chính y như mobile: Trang chủ, Tìm kiếm, Thư viện, Tải xuống, Nâng cấp
  const menuItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'search', label: 'Tìm kiếm', icon: Search },
    { id: 'library', label: 'Thư viện', icon: FolderClosed },
    { id: 'downloads', label: 'Tải xuống', icon: Download },
    { id: 'upgrade', label: 'Nâng cấp', icon: Crown },
  ];

  const defaultPlaylists = [
    { id: 'p1', name: 'Nhạc Chill Việt', count: 45, thumb: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150' },
    { id: 'p2', name: 'Workout Energy', count: 32, thumb: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150' },
    { id: 'p3', name: 'V-Pop Thịnh Hành', count: 50, thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150' },
    { id: 'p4', name: 'Acoustic Cafe', count: 28, thumb: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150' },
    { id: 'p5', name: 'Tâm Trạng Buồn', count: 36, thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150' },
    { id: 'p6', name: 'EDM Sôi Động', count: 42, thumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150' },
  ];

  useEffect(() => {
    fetchPlaylists();
    apiClient.getHome().then((feed) => {
      if (feed?.featuredPlaylists && feed.featuredPlaylists.length > 0) {
        setFeaturedPlaylists(feed.featuredPlaylists.slice(0, 6));
      }
    }).catch(() => {});
  }, []);

  const cleanUserPlaylists = playlists.filter(
    (p) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.includes('active-server') && !p.name.startsWith('__')
  );

  const getPlaylistCover = (p: any, idx: number) => {
    if (p.coverUrl || p.cover_url || p.thumbnail || p.thumbnailM || p.thumb) {
      return p.coverUrl || p.cover_url || p.thumbnail || p.thumbnailM || p.thumb;
    }
    return defaultPlaylists[idx % defaultPlaylists.length].thumb;
  };

  return (
    <aside className="w-60 bg-[#121217] rounded-lg flex flex-col p-3.5 select-none flex-shrink-0 border-none overflow-y-auto custom-scrollbar">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-2.5 mb-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
        <img
          src="/logo.png"
          alt="Tempo Logo"
          className="w-8 h-8 rounded-md object-contain drop-shadow-md"
        />
        <div className="flex flex-col">
          <span className="text-base font-black text-white tracking-wide leading-tight">Tempo</span>
          <span className="text-[10px] font-bold text-[#FC475C] tracking-wider uppercase leading-tight">Music Player</span>
        </div>
      </div>

      {/* Main Navigation Menu (Sleek Gray active bg, reduced radius rounded-md, pure white text) */}
      <nav className="flex flex-col gap-1 mb-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all text-left border-none cursor-pointer ${
                isActive
                  ? 'bg-[#262630] text-white font-bold shadow-sm'
                  : 'text-text-secondary hover:bg-[#181820] hover:text-white font-semibold'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-text-secondary'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Playlists Section (Gợi ý & Playlist người dùng với ảnh bìa luôn hiện rõ) */}
      <div className="flex-1 flex flex-col min-h-0">
        <span className="text-[10px] font-extrabold text-text-muted tracking-wider px-3 block mb-2 uppercase">
          PLAYLIST CỦA BẠN
        </span>
        <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1 pb-8">
          {/* User's custom playlists */}
          {cleanUserPlaylists.map((p, idx) => (
            <div
              key={p.id}
              onClick={() => setCurrentTab('library')}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#181820] cursor-pointer transition-colors group"
            >
              <img
                src={getPlaylistCover(p, idx)}
                alt={p.name}
                className="w-8 h-8 rounded-md object-cover flex-shrink-0 shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-bold text-white group-hover:text-[#FC475C] transition-colors truncate">
                  {p.name}
                </h5>
                <p className="text-[11px] text-text-muted truncate">{p.songCount || p.songs?.length || 0} bài hát</p>
              </div>
            </div>
          ))}

          {/* Featured dynamic recommendations from API */}
          {featuredPlaylists.length > 0
            ? featuredPlaylists.map((pl, idx) => (
                <div
                  key={pl.encodeId || pl.id || idx}
                  onClick={() => setCurrentTab('library')}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#181820] cursor-pointer transition-colors group"
                >
                  <img
                    src={getPlaylistCover(pl, idx)}
                    alt={pl.title}
                    className="w-8 h-8 rounded-md object-cover flex-shrink-0 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white group-hover:text-[#FC475C] transition-colors truncate">
                      {pl.title}
                    </h5>
                    <p className="text-[11px] text-text-muted truncate">{pl.artistsNames || 'Gợi ý cho bạn'}</p>
                  </div>
                </div>
              ))
            : defaultPlaylists.map((p, idx) => (
                <div
                  key={p.id || idx}
                  onClick={() => setCurrentTab('library')}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#181820] cursor-pointer transition-colors group"
                >
                  <img
                    src={p.thumb}
                    alt={p.name}
                    className="w-8 h-8 rounded-md object-cover flex-shrink-0 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white group-hover:text-[#FC475C] transition-colors truncate">
                      {p.name}
                    </h5>
                    <p className="text-[11px] text-text-muted truncate">{p.count} bài hát</p>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </aside>
  );
};
