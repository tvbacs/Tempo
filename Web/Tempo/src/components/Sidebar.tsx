import React, { useEffect, useState } from 'react';
import {
  Library as LibraryIcon,
  Plus,
  ArrowUpDown,
  Heart,
  Bookmark,
  Music2,
  Pin,
  Search,
} from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { likedSongs, playlists, followedArtists, fetchPlaylists, fetchLikedSongs, fetchFollowedArtists } = useLibraryStore();
  const [filterType, setFilterType] = useState<'all' | 'playlist' | 'artist'>('all');

  useEffect(() => {
    fetchLikedSongs();
    fetchPlaylists();
    fetchFollowedArtists();
  }, []);

  const cleanUserPlaylists = playlists.filter(
    (p) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.includes('active-server') && !p.name.startsWith('__')
  );

  return (
    <aside className="w-80 bg-[#121212] rounded-lg flex flex-col p-3 select-none flex-shrink-0 border-none overflow-hidden">
      {/* 1. Header: Thư viện + Nút Tạo */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <button
          onClick={() => setCurrentTab('library')}
          className="flex items-center gap-3 text-[#b3b3b3] hover:text-white font-bold text-base transition-colors border-none bg-transparent cursor-pointer p-0"
        >
          <LibraryIcon className="w-6 h-6" />
          <span>Thư viện</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentTab('library')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white text-xs font-bold transition-all border-none cursor-pointer hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Pills: Danh sách phát, Nghệ sĩ */}
      <div className="flex items-center gap-2 px-2 mb-3">
        <button
          onClick={() => setFilterType(filterType === 'playlist' ? 'all' : 'playlist')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border-none cursor-pointer ${
            filterType === 'playlist'
              ? 'bg-white text-black font-bold'
              : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Danh sách phát
        </button>
        <button
          onClick={() => setFilterType(filterType === 'artist' ? 'all' : 'artist')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border-none cursor-pointer ${
            filterType === 'artist'
              ? 'bg-white text-black font-bold'
              : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Nghệ sĩ
        </button>
      </div>

      {/* 3. Search & Sort Sub-header */}
      <div className="flex items-center justify-between px-2 py-1 mb-2 text-[#b3b3b3]">
        <button
          title="Tìm trong thư viện"
          className="w-8 h-8 rounded-full hover:bg-[#242424] hover:text-white flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          className="flex items-center gap-1.5 text-xs font-semibold hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1"
        >
          <span>Gần đây</span>
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Playlist & Artist List (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
        {/* Pinned: Bài hát đã thích */}
        {(filterType === 'all' || filterType === 'playlist') && (
          <div
            onClick={() => setCurrentTab('liked')}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              currentTab === 'liked' ? 'bg-[#242424]' : 'hover:bg-[#1a1a1a]'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#491f8f] via-[#5b22b6] to-[#1e3264] flex items-center justify-center flex-shrink-0 shadow-md">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">Bài hát đã thích</h4>
              <p className="text-xs text-[#b3b3b3] truncate flex items-center gap-1.5 mt-0.5">
                <Pin className="w-3 h-3 text-[#1ed760] fill-[#1ed760] flex-shrink-0" />
                <span>Danh sách phát • {likedSongs.length} bài hát</span>
              </p>
            </div>
          </div>
        )}

        {/* Pinned: Tập của bạn */}
        {(filterType === 'all' || filterType === 'playlist') && (
          <div
            onClick={() => setCurrentTab('library')}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              currentTab === 'library' ? 'bg-[#242424]' : 'hover:bg-[#1a1a1a]'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-[#006450] flex items-center justify-center flex-shrink-0 shadow-md">
              <Bookmark className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">Tập của bạn</h4>
              <p className="text-xs text-[#b3b3b3] truncate flex items-center gap-1.5 mt-0.5">
                <Pin className="w-3 h-3 text-[#1ed760] fill-[#1ed760] flex-shrink-0" />
                <span>Danh sách phát • Các tập đã lưu và tải xuống</span>
              </p>
            </div>
          </div>
        )}

        {/* User Playlists */}
        {(filterType === 'all' || filterType === 'playlist') &&
          cleanUserPlaylists.map((p) => (
            <div
              key={p.id}
              onClick={() => setCurrentTab('library')}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer transition-colors"
            >
              {p.coverUrl ? (
                <img
                  src={p.coverUrl}
                  alt={p.name}
                  className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-[#282828]"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-[#282828] flex items-center justify-center flex-shrink-0">
                  <Music2 className="w-5 h-5 text-[#b3b3b3]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                  Danh sách phát • {p.songs?.length || 0} bài hát
                </p>
              </div>
            </div>
          ))}

        {/* Followed Artists */}
        {(filterType === 'all' || filterType === 'artist') &&
          followedArtists.map((artist) => (
            <div
              key={artist.id || artist.name}
              onClick={() => setCurrentTab('library')}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer transition-colors"
            >
              <img
                src={artist.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'}
                alt={artist.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-[#282828]"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{artist.name}</h4>
                <p className="text-xs text-[#b3b3b3] truncate mt-0.5">Nghệ sĩ</p>
              </div>
            </div>
          ))}
      </div>
    </aside>
  );
};
