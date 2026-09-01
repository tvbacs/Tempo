import React, { useEffect, useState } from 'react';
import {
  Library as LibraryIcon,
  Heart,
  ArrowDownToLine,
  Music2,
  Disc,
  Pin,
} from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onSelectPlaylist?: (playlist: any) => void;
  onSelectArtist?: (artist: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onSelectPlaylist,
  onSelectArtist,
}) => {
  const {
    likedSongs,
    playlists,
    followedArtists,
    savedAlbums,
    fetchPlaylists,
    fetchLikedSongs,
    fetchFollowedArtists,
    fetchSavedAlbums,
  } = useLibraryStore();

  const [filterType, setFilterType] = useState<'all' | 'playlist' | 'album' | 'artist'>('all');

  useEffect(() => {
    fetchLikedSongs();
    fetchPlaylists();
    fetchFollowedArtists();
    fetchSavedAlbums();
  }, []);

  const cleanUserPlaylists = playlists.filter(
    (p) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.includes('active-server') && !p.name.startsWith('__')
  );

  return (
    <aside className="w-80 bg-[#121212] rounded-lg flex flex-col p-3 select-none flex-shrink-0 border-none overflow-hidden">
      {/* 1. Header: Thư viện (Tối giản) */}
      <div className="flex items-center px-2 py-2 mb-2">
        <button
          onClick={() => setCurrentTab('library')}
          className="flex items-center gap-3 text-[#b3b3b3] hover:text-white font-bold text-base transition-colors border-none bg-transparent cursor-pointer p-0"
        >
          <LibraryIcon className="w-6 h-6" />
          <span>Thư viện</span>
        </button>
      </div>

      {/* 2. Filter Pills: Danh sách phát, Album, Nghệ sĩ */}
      <div className="flex items-center gap-1.5 px-1 mb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterType(filterType === 'playlist' ? 'all' : 'playlist')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border-none cursor-pointer flex-shrink-0 ${
            filterType === 'playlist'
              ? 'bg-white text-black font-bold'
              : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Danh sách phát
        </button>

        <button
          onClick={() => setFilterType(filterType === 'album' ? 'all' : 'album')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border-none cursor-pointer flex-shrink-0 ${
            filterType === 'album'
              ? 'bg-white text-black font-bold'
              : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Album
        </button>

        <button
          onClick={() => setFilterType(filterType === 'artist' ? 'all' : 'artist')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border-none cursor-pointer flex-shrink-0 ${
            filterType === 'artist'
              ? 'bg-white text-black font-bold'
              : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Nghệ sĩ
        </button>
      </div>

      {/* 3. Playlist, Album & Artist List (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
        {/* Pinned: Bài hát đã thích */}
        {(filterType === 'all' || filterType === 'playlist') && (
          <div
            onClick={() => setCurrentTab('liked')}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              currentTab === 'liked' ? 'bg-[#242424]' : 'hover:bg-[#1a1a1a]'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#E03A50] via-[#941A2D] to-[#45101A] flex items-center justify-center flex-shrink-0 shadow-md">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">Bài hát đã thích</h4>
              <p className="text-xs text-[#b3b3b3] truncate flex items-center gap-1.5 mt-0.5">
                <Pin className="w-3 h-3 text-[#b3b3b3] fill-[#b3b3b3] flex-shrink-0" />
                <span>Danh sách phát • {likedSongs.length} bài hát</span>
              </p>
            </div>
          </div>
        )}

        {/* Pinned: Tải xuống */}
        {(filterType === 'all' || filterType === 'playlist') && (
          <div
            onClick={() => setCurrentTab('downloads')}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
              currentTab === 'downloads' ? 'bg-[#242424]' : 'hover:bg-[#1a1a1a]'
            }`}
          >
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#0c4a6e] flex items-center justify-center flex-shrink-0 shadow-md">
              <ArrowDownToLine className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white truncate">Tải xuống</h4>
              <p className="text-xs text-[#b3b3b3] truncate flex items-center gap-1.5 mt-0.5">
                <Pin className="w-3 h-3 text-[#b3b3b3] fill-[#b3b3b3] flex-shrink-0" />
                <span>Tập tin nghe ngoại tuyến</span>
              </p>
            </div>
          </div>
        )}

        {/* User Playlists */}
        {(filterType === 'all' || filterType === 'playlist') &&
          cleanUserPlaylists.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                if (onSelectPlaylist) onSelectPlaylist(p);
                else setCurrentTab('playlist');
              }}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer transition-colors"
            >
              {p.coverUrl || (p as any).thumbnail ? (
                <img
                  src={p.coverUrl || (p as any).thumbnail}
                  alt={p.name}
                  referrerPolicy="no-referrer"
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

        {/* Saved Albums */}
        {(filterType === 'all' || filterType === 'album') &&
          savedAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => {
                if (onSelectPlaylist) onSelectPlaylist(album);
                else setCurrentTab('playlist');
              }}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer transition-colors"
            >
              {album.thumbnail || album.coverUrl ? (
                <img
                  src={album.thumbnail || album.coverUrl}
                  alt={album.title}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-[#282828]"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-[#282828] flex items-center justify-center flex-shrink-0">
                  <Disc className="w-5 h-5 text-[#b3b3b3]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{album.title}</h4>
                <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                  Album • {album.artistsNames || 'Nhiều nghệ sĩ'}
                </p>
              </div>
            </div>
          ))}

        {/* Followed Artists */}
        {(filterType === 'all' || filterType === 'artist') && (
          <>
            {followedArtists.map((artist) => (
              <div
                key={artist.id || artist.alias || artist.name}
                onClick={() => {
                  if (onSelectArtist) onSelectArtist(artist);
                  else setCurrentTab('artist');
                }}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer transition-colors"
              >
                <img
                  src={
                    artist.thumbnail ||
                    'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/5/9/6/9/59696c9dba7a914d587d886049c10df6.jpg'
                  }
                  alt={artist.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-[#282828]"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{artist.name}</h4>
                  <p className="text-xs text-[#b3b3b3] truncate mt-0.5">Nghệ sĩ</p>
                </div>
              </div>
            ))}

            {filterType === 'artist' && followedArtists.length === 0 && (
              <div className="py-12 px-4 text-center text-[#b3b3b3] text-xs flex flex-col items-center">
                <span className="font-semibold text-white mb-1">Chưa theo dõi nghệ sĩ nào</span>
                <span>Khám phá các nghệ sĩ ở Trang chủ và nhấn nút Theo dõi</span>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
