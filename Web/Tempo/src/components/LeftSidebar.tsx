import React, { useState } from 'react';
import {
  Library,
  Plus,
  ArrowRight,
  Heart,
  Download,
  ListMusic,
  Compass,
  TrendingUp,
  History,
} from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { useAuthStore } from '../store/authStore';

interface LeftSidebarProps {
  currentView: string;
  onSelectView: (view: string, data?: any) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentView, onSelectView }) => {
  const [filter, setFilter] = useState<'all' | 'playlist' | 'artist'>('all');
  const { likedSongs, playlists, followedArtists, createPlaylist } = useLibraryStore();
  const { user } = useAuthStore();

  const handleCreatePlaylist = () => {
    const name = `Danh sách phát #${playlists.length + 1}`;
    createPlaylist(name);
  };

  return (
    <aside className="w-[320px] bg-[#121212] rounded-lg flex flex-col p-4 select-none flex-shrink-0 overflow-hidden">
      {/* Top Header of Library */}
      <div className="flex items-center justify-between px-2 pb-3">
        <div className="flex items-center gap-2.5 text-text-secondary hover:text-white transition-colors cursor-pointer">
          <Library className="w-6 h-6" />
          <span className="text-base font-bold text-white">Thư viện</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreatePlaylist}
            title="Tạo danh sách phát"
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 px-2 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilter(filter === 'playlist' ? 'all' : 'playlist')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filter === 'playlist'
              ? 'bg-white text-black'
              : 'bg-[#242424] hover:bg-[#2A2A2A] text-white'
          }`}
        >
          Danh sách phát
        </button>
        <button
          onClick={() => setFilter(filter === 'artist' ? 'all' : 'artist')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
            filter === 'artist'
              ? 'bg-white text-black'
              : 'bg-[#242424] hover:bg-[#2A2A2A] text-white'
          }`}
        >
          Nghệ sĩ
        </button>
      </div>

      {/* Discover Quick Links */}
      <div className="flex flex-col gap-0.5 px-1 pb-2 border-b border-white/5">
        <div
          onClick={() => onSelectView('home')}
          className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${
            currentView === 'home' ? 'bg-[#282828]' : 'hover:bg-[#1A1A1A]'
          }`}
        >
          <Compass className={`w-5 h-5 ${currentView === 'home' ? 'text-primary' : 'text-text-secondary'}`} />
          <span className="text-sm font-semibold text-white">Khám phá</span>
        </div>

        <div
          onClick={() => onSelectView('chart')}
          className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${
            currentView === 'chart' ? 'bg-[#282828]' : 'hover:bg-[#1A1A1A]'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${currentView === 'chart' ? 'text-primary' : 'text-text-secondary'}`} />
          <span className="text-sm font-semibold text-white">Bảng xếp hạng</span>
        </div>
      </div>

      {/* Scrollable Library List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pt-2 pr-1 custom-scrollbar">
        {/* 1. Liked Songs Card (Purple Gradient Icon matching Spotify) */}
        {(filter === 'all' || filter === 'playlist') && (
          <div
            onClick={() => onSelectView('liked')}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              currentView === 'liked' ? 'bg-[#282828]' : 'hover:bg-[#1A1A1A]'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#450af5] via-[#8e8ee5] to-[#c4efd9] flex items-center justify-center text-white flex-shrink-0 shadow-md">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={`text-sm font-bold truncate ${currentView === 'liked' ? 'text-primary' : 'text-white'}`}>
                Bài hát đã thích
              </h4>
              <p className="text-xs text-text-secondary truncate mt-0.5">
                Danh sách phát · {likedSongs.length} bài hát
              </p>
            </div>
          </div>
        )}

        {/* 2. History Recent Item */}
        {(filter === 'all' || filter === 'playlist') && (
          <div
            onClick={() => onSelectView('history')}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              currentView === 'history' ? 'bg-[#282828]' : 'hover:bg-[#1A1A1A]'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-[#006450] flex items-center justify-center text-white flex-shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={`text-sm font-bold truncate ${currentView === 'history' ? 'text-primary' : 'text-white'}`}>
                Nghe gần đây
              </h4>
              <p className="text-xs text-text-secondary truncate mt-0.5">
                Lịch sử phát nhạc
              </p>
            </div>
          </div>
        )}

        {/* 3. User Custom Playlists */}
        {(filter === 'all' || filter === 'playlist') &&
          playlists.map((playlist) => {
            const isSelected = currentView === `playlist_${playlist.id}`;
            return (
              <div
                key={playlist.id}
                onClick={() => onSelectView(`playlist_${playlist.id}`, playlist)}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#282828]' : 'hover:bg-[#1A1A1A]'
                }`}
              >
                <div className="w-12 h-12 rounded-md bg-[#242424] flex items-center justify-center text-text-secondary flex-shrink-0">
                  <ListMusic className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-white'}`}>
                    {playlist.name}
                  </h4>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    Danh sách phát · {playlist.songCount || (playlist as any).song_count || 0} bài hát
                  </p>
                </div>
              </div>
            );
          })}

        {/* 4. Followed Artists (Circular Avatars) */}
        {(filter === 'all' || filter === 'artist') &&
          followedArtists.map((artist) => {
            const isSelected = currentView === `artist_${artist.alias || artist.id}`;
            return (
              <div
                key={artist.id}
                onClick={() => onSelectView(`artist_${artist.alias || artist.id}`, artist)}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                  isSelected ? 'bg-[#282828]' : 'hover:bg-[#1A1A1A]'
                }`}
              >
                <img
                  src={artist.thumbnail || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=120'}
                  alt={artist.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-white'}`}>
                    {artist.name}
                  </h4>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    Nghệ sĩ
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </aside>
  );
};
