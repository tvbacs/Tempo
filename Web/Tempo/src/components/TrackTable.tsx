import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Clock,
  Heart,
  MoreHorizontal,
  Plus,
  Download,
  Trash2,
  ListPlus,
  Check,
  Copy,
  Loader2,
} from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

interface TrackTableProps {
  songs: UnifiedSong[];
  showAlbum?: boolean;
  showDateAdded?: boolean;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  songs,
  showAlbum = true,
  showDateAdded = true,
}) => {
  const { currentSong, isPlaying, isLoading, playSong, togglePlayPause } = usePlayerStore();
  const {
    isLiked,
    toggleLike,
    playlists,
    addSongToPlaylist,
    downloadedSongs,
    addDownloadedSong,
    removeDownloadedSong,
    createPlaylist,
  } = useLibraryStore();

  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSongId(null);
        setShowPlaylistSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '2 ngày trước';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch (_) {
      return 'Vừa xong';
    }
  };

  const cleanPlaylists = playlists.filter(
    (p) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.includes('active-server') && !p.name.startsWith('__')
  );

  const isDownloaded = (songId: string) => {
    return downloadedSongs.some((s) => (s.encodeId || s.id) === songId);
  };

  const handleCopyLink = (song: UnifiedSong) => {
    const id = song.encodeId || song.id;
    navigator.clipboard?.writeText?.(`https://tempo.music/track/${id}`);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
      setActiveMenuSongId(null);
    }, 1200);
  };

  if (songs.length === 0) {
    return (
      <div className="py-16 text-center text-[#b3b3b3] text-sm">
        Chưa có bài hát nào trong danh sách này
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Table Header */}
      <div className="grid grid-cols-[16px_1fr_1fr_120px_100px] gap-4 px-4 py-2 border-b border-white/10 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-2">
        <span className="text-center">#</span>
        <span>Tiêu đề</span>
        {showAlbum ? <span>Album</span> : <span />}
        {showDateAdded ? <span>Ngày thêm</span> : <span />}
        <span className="flex justify-end pr-2">
          <Clock className="w-4 h-4" />
        </span>
      </div>

      {/* Table Rows */}
      <div className="flex flex-col gap-0.5">
        {songs.map((song, index) => {
          const songKey = song.encodeId || song.id || String(index);
          const isThisCurrent = (currentSong?.encodeId || currentSong?.id) === (song.encodeId || song.id);
          const isThisLoading = isThisCurrent && isLoading;
          const isThisPlaying = isThisCurrent && isPlaying;
          const liked = isLiked(song.encodeId || song.id);
          const downloaded = isDownloaded(song.encodeId || song.id);
          const isMenuOpen = activeMenuSongId === songKey;

          return (
            <div
              key={songKey}
              onDoubleClick={() => playSong(song, songs)}
              className={`grid grid-cols-[16px_1fr_1fr_120px_100px] gap-4 px-4 py-2 rounded-md hover:bg-[#2a2a2a] items-center transition-colors group cursor-pointer relative ${
                isThisCurrent ? 'bg-[#242424]' : ''
              }`}
            >
              {/* Index / Play Button / Loading Spinner */}
              <div className="flex items-center justify-center">
                {isThisLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <>
                    <span
                      className={`text-sm font-semibold group-hover:hidden ${
                        isThisCurrent ? 'text-primary font-bold' : 'text-[#b3b3b3]'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isThisCurrent) {
                          togglePlayPause();
                        } else {
                          playSong(song, songs);
                        }
                      }}
                      className="hidden group-hover:flex text-white hover:scale-110 transition-transform border-none bg-transparent cursor-pointer p-0"
                    >
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4 fill-white text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white text-white" />
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Title & Artist */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <img
                  src={song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}
                  alt={song.title}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded object-cover flex-shrink-0 bg-[#282828]"
                />
                <div className="min-w-0 flex-1">
                  <h4
                    className={`text-sm font-bold truncate ${
                      isThisCurrent ? 'text-white font-black' : 'text-white'
                    }`}
                  >
                    {song.title}
                  </h4>
                  <p className="text-xs text-[#b3b3b3] truncate mt-0.5 hover:underline hover:text-white cursor-pointer">
                    {song.artistsNames}
                  </p>
                </div>
              </div>

              {/* Album */}
              <div className="min-w-0 truncate text-xs text-[#b3b3b3] hover:underline hover:text-white cursor-pointer">
                {song.album?.title || song.title}
              </div>

              {/* Date Added */}
              <div className="text-xs text-[#b3b3b3] truncate">
                {formatDate(song.addedAt)}
              </div>

              {/* Actions: Heart + Duration + 3-dots Menu */}
              <div className="flex items-center justify-end gap-2.5 text-xs text-[#b3b3b3] font-medium relative">
                {/* Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(song);
                  }}
                  title={liked ? 'Xóa khỏi Bài hát đã thích' : 'Lưu vào Bài hát đã thích'}
                  className="border-none bg-transparent cursor-pointer p-0 transition-transform hover:scale-110"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      liked ? 'fill-[#E03A50] text-[#E03A50]' : 'opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white'
                    }`}
                  />
                </button>

                {/* Duration */}
                <span className="w-9 text-right tabular-nums">{formatTime(song.duration)}</span>

                {/* 3-dots More Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuSongId(isMenuOpen ? null : songKey);
                    setShowPlaylistSubmenu(false);
                  }}
                  title="Tùy chọn khác"
                  className={`border-none bg-transparent cursor-pointer p-1 text-[#b3b3b3] hover:text-white transition-opacity ${
                    isMenuOpen ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* Dropdown Popover */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 w-56 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-1.5 z-50 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Add to Playlist Option */}
                    <div className="relative">
                      <button
                        onClick={() => setShowPlaylistSubmenu(!showPlaylistSubmenu)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#383838] text-white transition-colors border-none bg-transparent cursor-pointer text-left font-medium"
                      >
                        <div className="flex items-center gap-2.5">
                          <ListPlus className="w-4 h-4 text-[#b3b3b3]" />
                          <span>Thêm vào danh sách phát</span>
                        </div>
                        <span className="text-[10px] text-[#b3b3b3]">▶</span>
                      </button>

                      {/* Playlist Submenu */}
                      {showPlaylistSubmenu && (
                        <div className="absolute right-full top-0 mr-1 w-52 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                          <button
                            onClick={() => {
                              const name = prompt('Nhập tên danh sách phát mới:');
                              if (name?.trim()) {
                                createPlaylist(name.trim());
                              }
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#383838] text-white font-bold transition-colors border-none bg-transparent cursor-pointer text-left text-xs"
                          >
                            <Plus className="w-4 h-4 text-white" />
                            <span>Tạo danh sách mới</span>
                          </button>

                          <div className="h-[1px] bg-white/10 my-1" />

                          {cleanPlaylists.length === 0 ? (
                            <span className="px-3 py-1.5 text-[11px] text-[#b3b3b3]">
                              Chưa có danh sách phát nào
                            </span>
                          ) : (
                            cleanPlaylists.map((pl) => (
                              <button
                                key={pl.id}
                                onClick={() => {
                                  addSongToPlaylist(pl.id, song);
                                  setActiveMenuSongId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#383838] text-white transition-colors border-none bg-transparent cursor-pointer text-left text-xs truncate"
                              >
                                <span className="truncate">{pl.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Download / Remove Download Option */}
                    <button
                      onClick={() => {
                        if (downloaded) {
                          removeDownloadedSong(song.encodeId || song.id);
                        } else {
                          addDownloadedSong(song);
                        }
                        setActiveMenuSongId(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-[#383838] text-white transition-colors border-none bg-transparent cursor-pointer text-left font-medium"
                    >
                      {downloaded ? (
                        <>
                          <Trash2 className="w-4 h-4 text-[#FC475C]" />
                          <span>Xóa khỏi Tải xuống</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-[#b3b3b3]" />
                          <span>Tải xuống nghe ngoại tuyến</span>
                        </>
                      )}
                    </button>

                    {/* Like / Unlike Option */}
                    <button
                      onClick={() => {
                        toggleLike(song);
                        setActiveMenuSongId(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-[#383838] text-white transition-colors border-none bg-transparent cursor-pointer text-left font-medium"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          liked ? 'fill-[#E03A50] text-[#E03A50]' : 'text-[#b3b3b3]'
                        }`}
                      />
                      <span>{liked ? 'Xóa khỏi Bài hát đã thích' : 'Lưu vào Bài hát đã thích'}</span>
                    </button>

                    <div className="h-[1px] bg-white/10 my-1" />

                    {/* Copy Link Option */}
                    <button
                      onClick={() => handleCopyLink(song)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-[#383838] text-white transition-colors border-none bg-transparent cursor-pointer text-left font-medium"
                    >
                      {copiedId === (song.encodeId || song.id) ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>Đã sao chép liên kết</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-[#b3b3b3]" />
                          <span>Sao chép liên kết bài hát</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
