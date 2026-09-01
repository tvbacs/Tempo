import React, { useState, useEffect } from 'react';
import {
  Heart,
  Download,
  Users,
  Disc,
  Plus,
  Play,
  Trash2,
  ListMusic,
  Search,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { UnifiedSong, Artist } from '../types/music';

interface LibraryViewProps {
  onSelectPlaylist?: (p: any) => void;
  onSelectArtist?: (a: any) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectPlaylist, onSelectArtist }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'liked' | 'downloaded' | 'artists' | 'albums' | 'playlists'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const {
    likedSongs,
    fetchLikedSongs,
    downloadedSongs,
    fetchDownloadedSongs,
    removeDownloadedSong,
    clearDownloadedSongs,
    followedArtists,
    fetchFollowedArtists,
    toggleFollowArtist,
    savedAlbums,
    fetchSavedAlbums,
    playlists,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
    toggleLike,
    isLiked,
  } = useLibraryStore();

  const { currentSong, isPlaying, playSong } = usePlayerStore();

  useEffect(() => {
    fetchLikedSongs();
    fetchDownloadedSongs();
    fetchFollowedArtists();
    fetchSavedAlbums();
    fetchPlaylists();
  }, []);

  const handlePlayAll = (songs: UnifiedSong[]) => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const cleanPlaylists = playlists.filter(
    (p) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.includes('active-server') && !p.name.startsWith('__')
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#121217] overflow-y-auto custom-scrollbar p-6 pb-32 select-none">
      {/* Top Header & Navigation Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-5 border-b border-white/5">
        <div>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-white mb-2 transition-colors border-none bg-transparent cursor-pointer p-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Thư viện</span>
            </button>
          )}

          <h1 className="text-2xl font-black text-white">
            {activeFilter === 'all' && 'Thư viện Âm nhạc'}
            {activeFilter === 'liked' && `Bài hát đã thích (${likedSongs.length})`}
            {activeFilter === 'downloaded' && `Bài hát đã tải (${downloadedSongs.length})`}
            {activeFilter === 'artists' && `Nghệ sĩ đang theo dõi (${followedArtists.length})`}
            {activeFilter === 'albums' && `Album đã lưu (${savedAlbums.length})`}
            {activeFilter === 'playlists' && `Danh sách phát của bạn (${cleanPlaylists.length})`}
          </h1>

          <p className="text-xs text-text-secondary mt-1">
            {likedSongs.length} bài yêu thích · {downloadedSongs.length} bài đã tải · {followedArtists.length} nghệ sĩ theo dõi · {savedAlbums.length} album
          </p>
        </div>

        <button
          onClick={() => setIsCreatingPlaylist(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FC475C] to-[#FC655A] hover:opacity-90 active:scale-98 text-white rounded-md text-xs font-bold transition-all border-none cursor-pointer shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo danh sách phát</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'liked', label: `Bài hát đã thích (${likedSongs.length})` },
            { id: 'downloaded', label: `Đã tải (${downloadedSongs.length})` },
            { id: 'artists', label: `Nghệ sĩ (${followedArtists.length})` },
            { id: 'albums', label: `Album (${savedAlbums.length})` },
            { id: 'playlists', label: `Danh sách phát (${cleanPlaylists.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all border-none cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-white text-[#121217] shadow-sm'
                  : 'bg-[#181820] text-text-secondary hover:bg-[#22222D] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#181820] rounded-md px-3 h-8.5 gap-2 border-none">
          <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc trong thư viện..."
            className="w-44 bg-transparent border-none outline-none text-xs text-white placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MÀN HÌNH TỔNG QUAN (activeFilter === 'all'): Chỉ hiện Preview 4-5 item/row */}
      {/* ========================================================================= */}
      {activeFilter === 'all' && (
        <>
          {/* 4 Quick Action Cards (Bấm vào để mở toàn bộ data) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Card 1: Bài hát đã thích */}
            <div
              onClick={() => setActiveFilter('liked')}
              className="bg-[#181820] hover:bg-[#20202B] rounded-lg p-4 flex items-center gap-3.5 cursor-pointer transition-all border-none group"
            >
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#FC475C] to-[#FC655A] flex items-center justify-center text-white shadow-md shadow-primary/25 flex-shrink-0">
                <Heart className="w-6 h-6 fill-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-[#FC475C] transition-colors truncate">
                  Bài hát đã thích
                </h3>
                <p className="text-[11px] text-text-muted">{likedSongs.length} bài hát</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
            </div>

            {/* Card 2: Đã tải xuống */}
            <div
              onClick={() => setActiveFilter('downloaded')}
              className="bg-[#181820] hover:bg-[#20202B] rounded-lg p-4 flex items-center gap-3.5 cursor-pointer transition-all border-none group"
            >
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-[#10B981] transition-colors truncate">
                  Bài hát đã tải
                </h3>
                <p className="text-[11px] text-text-muted">{downloadedSongs.length} bài hát</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
            </div>

            {/* Card 3: Nghệ sĩ theo dõi */}
            <div
              onClick={() => setActiveFilter('artists')}
              className="bg-[#181820] hover:bg-[#20202B] rounded-lg p-4 flex items-center gap-3.5 cursor-pointer transition-all border-none group"
            >
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-md shadow-amber-500/20 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-[#F59E0B] transition-colors truncate">
                  Nghệ sĩ theo dõi
                </h3>
                <p className="text-[11px] text-text-muted">{followedArtists.length} nghệ sĩ</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
            </div>

            {/* Card 4: Album đã lưu */}
            <div
              onClick={() => setActiveFilter('albums')}
              className="bg-[#181820] hover:bg-[#20202B] rounded-lg p-4 flex items-center gap-3.5 cursor-pointer transition-all border-none group"
            >
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
                <Disc className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white group-hover:text-[#3B82F6] transition-colors truncate">
                  Album đã lưu
                </h3>
                <p className="text-[11px] text-text-muted">{savedAlbums.length} album</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-white transition-colors" />
            </div>
          </div>

          {/* Row 1 Preview: Bài hát đã thích (Top 4 bài) */}
          {likedSongs.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-white">
                  Bài hát đã thích ({likedSongs.length})
                </h2>
                <button
                  onClick={() => setActiveFilter('liked')}
                  className="text-xs font-bold text-[#FC475C] hover:underline border-none bg-transparent cursor-pointer"
                >
                  Xem tất cả ({likedSongs.length})
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {likedSongs.slice(0, 4).map((song, idx) => {
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;
                  return (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#181820] transition-colors group cursor-pointer"
                      onClick={() => playSong(song, likedSongs)}
                    >
                      <span className="text-xs font-bold text-text-muted w-5 text-center">{idx + 1}</span>
                      <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#FC475C]' : 'text-white group-hover:text-[#FC475C]'}`}>
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-text-muted truncate">{song.artistsNames}</p>
                      </div>
                      <span className="text-[11px] text-text-muted">{formatDuration(song.duration)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        className="p-1.5 text-text-muted hover:text-white border-none bg-transparent cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-[#FC475C] text-[#FC475C]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 2 Preview: Đã tải xuống (Top 4 bài) */}
          {downloadedSongs.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-white">
                  Đã tải xuống offline ({downloadedSongs.length})
                </h2>
                <button
                  onClick={() => setActiveFilter('downloaded')}
                  className="text-xs font-bold text-[#10B981] hover:underline border-none bg-transparent cursor-pointer"
                >
                  Xem tất cả ({downloadedSongs.length})
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                {downloadedSongs.slice(0, 4).map((song, idx) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#181820] transition-colors group cursor-pointer"
                    onClick={() => playSong(song, downloadedSongs)}
                  >
                    <span className="text-xs font-bold text-text-muted w-5 text-center">{idx + 1}</span>
                    <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white group-hover:text-[#10B981] truncate">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-text-muted truncate">{song.artistsNames}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-full">
                      320kbps
                    </span>
                    <span className="text-[11px] text-text-muted">{formatDuration(song.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 3 Preview: Nghệ sĩ theo dõi (Top 6 nghệ sĩ) */}
          {followedArtists.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-white">
                  Nghệ sĩ đang theo dõi ({followedArtists.length})
                </h2>
                <button
                  onClick={() => setActiveFilter('artists')}
                  className="text-xs font-bold text-[#F59E0B] hover:underline border-none bg-transparent cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {followedArtists.slice(0, 6).map((artist) => (
                  <div
                    key={artist.id || artist.name}
                    onClick={() => {
                      if (onSelectArtist) onSelectArtist(artist);
                    }}
                    className="bg-[#181820] hover:bg-[#20202B] p-3.5 rounded-lg flex flex-col items-center text-center transition-all group border-none cursor-pointer"
                  >
                    <img
                      src={artist.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                      alt={artist.name}
                      className="w-20 h-20 rounded-full object-cover mb-2.5 shadow-md group-hover:scale-105 transition-transform"
                    />
                    <h4 className="text-xs font-bold text-white truncate w-full group-hover:text-[#FC475C]">
                      {artist.name}
                    </h4>
                    <span className="text-[10px] text-text-muted mb-2">Nghệ sĩ</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 4 Preview: Album đã lưu (Top 5 album) */}
          {savedAlbums.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-white">
                  Album đã lưu ({savedAlbums.length})
                </h2>
                <button
                  onClick={() => setActiveFilter('albums')}
                  className="text-xs font-bold text-[#3B82F6] hover:underline border-none bg-transparent cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {savedAlbums.slice(0, 5).map((album) => (
                  <div
                    key={album.id}
                    onClick={() => {
                      if (onSelectPlaylist) onSelectPlaylist(album);
                    }}
                    className="bg-[#181820] hover:bg-[#20202B] p-3.5 rounded-lg flex flex-col transition-all group border-none cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-md overflow-hidden mb-2.5 shadow-md bg-[#252530]">
                      <img
                        src={album.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FC475C]">
                      {album.title}
                    </h4>
                    <p className="text-[11px] text-text-muted truncate">{album.artistsNames || 'Nhiều nghệ sĩ'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 5 Preview: Danh sách phát (Top 4 playlist) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-white">
                Danh sách phát của bạn ({cleanPlaylists.length})
              </h2>
              {cleanPlaylists.length > 4 && (
                <button
                  onClick={() => setActiveFilter('playlists')}
                  className="text-xs font-bold text-[#FC475C] hover:underline border-none bg-transparent cursor-pointer"
                >
                  Xem tất cả ({cleanPlaylists.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Create Playlist Tile */}
              <div
                onClick={() => setIsCreatingPlaylist(true)}
                className="bg-[#181820]/60 hover:bg-[#181820] border-2 border-dashed border-white/10 hover:border-[#FC475C]/40 p-4 rounded-lg flex flex-col items-center justify-center min-h-[160px] cursor-pointer transition-all text-center group"
              >
                <div className="w-11 h-11 rounded-full bg-[#FC475C]/15 group-hover:bg-[#FC475C] text-[#FC475C] group-hover:text-white flex items-center justify-center mb-2 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-[#FC475C] transition-colors">
                  Tạo playlist mới
                </span>
              </div>

              {cleanPlaylists.slice(0, 4).map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => {
                    if (onSelectPlaylist) onSelectPlaylist(pl);
                  }}
                  className="bg-[#181820] hover:bg-[#20202B] p-3.5 rounded-lg flex flex-col transition-all group border-none relative cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-md bg-[#252530] overflow-hidden mb-2.5 flex items-center justify-center shadow-md">
                    <img
                      src={
                        pl.coverUrl ||
                        (pl as any).cover_url ||
                        (pl as any).thumbnail ||
                        'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200'
                      }
                      alt={pl.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FC475C]">
                    {pl.name}
                  </h4>
                  <p className="text-[11px] text-text-muted truncate">{pl.songCount || pl.songs?.length || 0} bài hát</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. MÀN HÌNH CHI TIẾT KHI NHẤN VÀO CARD (activeFilter !== 'all'): Hiện FULL DATA */}
      {/* ========================================================================= */}

      {/* Full Liked Songs */}
      {activeFilter === 'liked' && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-white">Tất cả bài hát đã thích</h3>
            {likedSongs.length > 0 && (
              <button
                onClick={() => handlePlayAll(likedSongs)}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-[#FC475C] to-[#FC655A] text-white text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer shadow-md shadow-primary/20"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Phát toàn bộ</span>
              </button>
            )}
          </div>

          {likedSongs.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {likedSongs
                .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artistsNames.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((song, idx) => {
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;
                  return (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#181820] transition-colors group cursor-pointer"
                      onClick={() => playSong(song, likedSongs)}
                    >
                      <span className="text-xs font-bold text-text-muted w-6 text-center">{idx + 1}</span>
                      <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#FC475C]' : 'text-white group-hover:text-[#FC475C]'}`}>
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-text-muted truncate">{song.artistsNames}</p>
                      </div>
                      <span className="text-[11px] text-text-muted">{formatDuration(song.duration)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        className="p-1.5 text-text-muted hover:text-white border-none bg-transparent cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-[#FC475C] text-[#FC475C]" />
                      </button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#181820]/40 rounded-lg text-text-muted text-xs">
              Chưa có bài hát nào trong mục yêu thích.
            </div>
          )}
        </div>
      )}

      {/* Full Downloaded Songs */}
      {activeFilter === 'downloaded' && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-white">Tất cả bài hát đã tải offline</h3>
            {downloadedSongs.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa sạch toàn bộ danh sách bài hát đã tải ngoại tuyến?')) {
                      clearDownloadedSongs();
                    }
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#242424] hover:bg-[#333333] text-[#b3b3b3] hover:text-white text-xs font-bold transition-colors border-none cursor-pointer"
                >
                  Xóa tất cả
                </button>
                <button
                  onClick={() => handlePlayAll(downloadedSongs)}
                  className="px-4 py-2 rounded-md bg-white hover:scale-105 active:scale-95 text-black text-xs font-bold flex items-center gap-1.5 border-none cursor-pointer shadow-md transition-transform"
                >
                  <Play className="w-3.5 h-3.5 fill-black text-black" />
                  <span>Phát toàn bộ</span>
                </button>
              </div>
            )}
          </div>

          {downloadedSongs.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {downloadedSongs
                .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artistsNames.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((song, idx) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#181820] transition-colors group cursor-pointer"
                    onClick={() => playSong(song, downloadedSongs)}
                  >
                    <span className="text-xs font-bold text-text-muted w-6 text-center">{idx + 1}</span>
                    <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white group-hover:text-[#10B981] truncate">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-text-muted truncate">{song.artistsNames}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-full">
                      320kbps
                    </span>
                    <span className="text-[11px] text-text-muted">{formatDuration(song.duration)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDownloadedSong(song.id);
                      }}
                      className="p-1.5 text-text-muted hover:text-red-400 border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#181820]/40 rounded-lg text-text-muted text-xs">
              Chưa có bài hát nào được tải về.
            </div>
          )}
        </div>
      )}

      {/* Full Followed Artists */}
      {activeFilter === 'artists' && (
        <div className="flex flex-col">
          <h3 className="text-sm font-extrabold text-white mb-4">Tất cả nghệ sĩ bạn đang theo dõi</h3>
          {followedArtists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {followedArtists.map((artist) => (
                <div
                  key={artist.id || artist.name}
                  onClick={() => {
                    if (onSelectArtist) onSelectArtist(artist);
                  }}
                  className="bg-[#181820] hover:bg-[#20202B] p-4 rounded-lg flex flex-col items-center text-center transition-all group border-none cursor-pointer"
                >
                  <img
                    src={artist.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                    alt={artist.name}
                    className="w-24 h-24 rounded-full object-cover mb-3 shadow-md group-hover:scale-105 transition-transform"
                  />
                  <h4 className="text-xs font-bold text-white truncate w-full group-hover:text-[#FC475C]">
                    {artist.name}
                  </h4>
                  <span className="text-[10px] text-text-muted mb-3">Nghệ sĩ</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollowArtist(artist);
                    }}
                    className="px-3.5 py-1 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer transition-colors"
                  >
                    Đang theo dõi
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#181820]/40 rounded-lg text-text-muted text-xs">
              Bạn chưa theo dõi nghệ sĩ nào.
            </div>
          )}
        </div>
      )}

      {/* Full Saved Albums */}
      {activeFilter === 'albums' && (
        <div className="flex flex-col">
          <h3 className="text-sm font-extrabold text-white mb-4">Tất cả album đã lưu</h3>
          {savedAlbums.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {savedAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => {
                    if (onSelectPlaylist) onSelectPlaylist(album);
                  }}
                  className="bg-[#181820] hover:bg-[#20202B] p-3.5 rounded-lg flex flex-col transition-all group border-none cursor-pointer"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden mb-2.5 shadow-md bg-[#252530]">
                    <img
                      src={album.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FC475C]">
                    {album.title}
                  </h4>
                  <p className="text-[11px] text-text-muted truncate">{album.artistsNames || 'Nhiều nghệ sĩ'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#181820]/40 rounded-lg text-text-muted text-xs">
              Chưa có album nào được lưu trong thư viện.
            </div>
          )}
        </div>
      )}

      {/* Full Playlists */}
      {activeFilter === 'playlists' && (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-white">Tất cả danh sách phát của bạn</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Create Playlist Tile */}
            <div
              onClick={() => setIsCreatingPlaylist(true)}
              className="bg-[#181820]/60 hover:bg-[#181820] border-2 border-dashed border-white/10 hover:border-[#FC475C]/40 p-4 rounded-lg flex flex-col items-center justify-center min-h-[160px] cursor-pointer transition-all text-center group"
            >
              <div className="w-11 h-11 rounded-full bg-[#FC475C]/15 group-hover:bg-[#FC475C] text-[#FC475C] group-hover:text-white flex items-center justify-center mb-2 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-[#FC475C] transition-colors">
                Tạo playlist mới
              </span>
            </div>

            {cleanPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  if (onSelectPlaylist) onSelectPlaylist(pl);
                }}
                className="bg-[#181820] hover:bg-[#20202B] p-3.5 rounded-lg flex flex-col transition-all group border-none relative cursor-pointer"
              >
                <div className="w-full aspect-square rounded-md bg-[#252530] overflow-hidden mb-2.5 flex items-center justify-center shadow-md">
                  <img
                    src={
                      pl.coverUrl ||
                      (pl as any).cover_url ||
                      (pl as any).thumbnail ||
                      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200'
                    }
                    alt={pl.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FC475C]">
                  {pl.name}
                </h4>
                <p className="text-[11px] text-text-muted truncate">{pl.songCount || pl.songs?.length || 0} bài hát</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlaylist(pl.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 hover:bg-black text-text-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {isCreatingPlaylist && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreatePlaylistSubmit}
            className="bg-[#181820] rounded-lg p-6 w-full max-w-sm flex flex-col gap-4 border-none shadow-2xl"
          >
            <h3 className="text-base font-extrabold text-white">Tạo danh sách phát mới</h3>
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Tên danh sách phát..."
              className="w-full bg-[#111117] border border-white/10 rounded-md px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#FC475C]"
            />
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingPlaylist(false)}
                className="px-4 py-2 rounded-md bg-transparent hover:bg-white/5 text-text-secondary hover:text-white text-xs font-bold border-none cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 rounded-md bg-gradient-to-r from-[#FC475C] to-[#FC655A] text-white text-xs font-bold disabled:opacity-40 border-none cursor-pointer"
              >
                Tạo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
