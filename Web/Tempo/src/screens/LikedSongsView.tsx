import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Heart,
  Play,
  Pause,
  Shuffle,
  Download,
  Search,
  ArrowUpDown,
  X,
  Check,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useAuthStore } from '../store/authStore';
import { TrackTable } from '../components/TrackTable';

interface LikedSongsViewProps {
  onBack?: () => void;
}

export const LikedSongsView: React.FC<LikedSongsViewProps> = ({ onBack }) => {
  const { likedSongs, addDownloadedSong } = useLibraryStore();
  const { currentSong, isPlaying, isLoading, playSong, togglePlayPause, isShuffle, toggleShuffle } = usePlayerStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist' | 'duration'>('recent');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and sort liked songs
  const processedSongs = useMemo(() => {
    let result = [...likedSongs];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.artistsNames && s.artistsNames.toLowerCase().includes(q)) ||
          (s.album?.title && s.album.title.toLowerCase().includes(q))
      );
    }

    // 2. Sorting
    switch (sortBy) {
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
        break;
      case 'artist':
        result.sort((a, b) => (a.artistsNames || '').localeCompare(b.artistsNames || '', 'vi'));
        break;
      case 'duration':
        result.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'recent':
      default:
        // Default order is recently added
        break;
    }

    return result;
  }, [likedSongs, searchQuery, sortBy]);

  const isCurrentListPlaying =
    isPlaying &&
    Boolean(
      currentSong &&
        processedSongs.some(
          (s) => (s.encodeId || s.id) === (currentSong.encodeId || currentSong.id)
        )
    );

  const totalDurationSec = likedSongs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = Math.floor(totalDurationSec / 3600);
  const totalMins = Math.floor((totalDurationSec % 3600) / 60);

  const durationLabel = totalHours > 0
    ? `khoảng ${totalHours} giờ`
    : `${totalMins} phút`;

  const handlePlayClick = () => {
    if (processedSongs.length === 0) return;
    if (isCurrentListPlaying) {
      togglePlayPause();
    } else {
      playSong(processedSongs[0], processedSongs);
    }
  };

  const handleDownloadAll = () => {
    if (likedSongs.length === 0) return;
    setIsDownloading(true);
    likedSongs.forEach((song) => {
      addDownloadedSong(song);
    });
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 800);
  };

  const sortLabels: Record<string, string> = {
    recent: 'Gần đây',
    title: 'Tiêu đề A-Z',
    artist: 'Nghệ sĩ A-Z',
    duration: 'Thời lượng',
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none bg-[#121212]">
      {/* Subtle Deep Crimson Gradient Header */}
      <div className="bg-gradient-to-b from-[#341119] via-[#1c0a0e] to-[#121212] p-8 pb-6 flex items-end gap-6 flex-shrink-0 relative">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors border-none cursor-pointer z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col justify-end">
          <span className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Danh sách phát</span>
          <h1 className="text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
            Bài hát đã thích
          </h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <div className="w-6 h-6 rounded-full bg-[#535353] flex items-center justify-center text-white text-[10px] font-bold">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="font-bold text-white">{user?.email?.split('@')[0] || 'Tempo User'}</span>
            <span>•</span>
            <span>{likedSongs.length} bài hát</span>
            {likedSongs.length > 0 && (
              <>
                <span>,</span>
                <span>{durationLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-[#121212]/90 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePlayClick}
            disabled={processedSongs.length === 0}
            className="w-14 h-14 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 border-none cursor-pointer"
          >
            {isCurrentListPlaying && isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-black" />
            ) : isCurrentListPlaying ? (
              <Pause className="w-6 h-6 fill-black text-black" />
            ) : (
              <Play className="w-6 h-6 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleShuffle}
            title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
            className={`transition-colors border-none bg-transparent cursor-pointer p-1 ${
              isShuffle ? 'text-white font-bold scale-110' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            <Shuffle className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3 text-[#b3b3b3]">
          {/* Expandable Search Input */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center bg-[#242424] rounded-full px-3 py-1.5 gap-2 animate-in fade-in zoom-in-95 duration-150">
                <Search className="w-4 h-4 text-[#b3b3b3] flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm trong danh sách..."
                  className="bg-transparent border-none outline-none text-xs text-white placeholder:text-[#b3b3b3] w-44"
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="p-0.5 text-[#b3b3b3] hover:text-white border-none bg-transparent cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                title="Tìm kiếm trong danh sách"
                className="w-8 h-8 rounded-full hover:bg-[#242424] hover:text-white flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Menu Dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1.5 rounded hover:bg-[#242424]"
            >
              <span>{sortLabels[sortBy]}</span>
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            {isSortMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-[#282828] rounded-md shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 border-none">
                <span className="text-[10px] font-bold text-[#b3b3b3] px-3 py-1 uppercase tracking-wider">
                  Sắp xếp theo
                </span>
                {(['recent', 'title', 'artist', 'duration'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setIsSortMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-xs rounded text-left transition-colors border-none cursor-pointer ${
                      sortBy === opt
                        ? 'text-white font-bold bg-[#383838]'
                        : 'text-[#b3b3b3] hover:text-white hover:bg-[#333333]'
                    }`}
                  >
                    <span>{sortLabels[opt]}</span>
                    {sortBy === opt && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Track Table */}
      <div className="px-8 pb-16">
        {processedSongs.length === 0 ? (
          <div className="py-16 text-center text-[#b3b3b3] text-sm">
            {searchQuery ? `Không tìm thấy bài hát nào khớp với "${searchQuery}"` : 'Chưa có bài hát nào'}
          </div>
        ) : (
          <TrackTable songs={processedSongs} />
        )}
      </div>
    </div>
  );
};
