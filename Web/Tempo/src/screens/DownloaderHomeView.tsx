import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Link as LinkIcon,
  Zap,
  Play,
  Pause,
  Heart,
  Download,
  Check,
  MoreVertical,
} from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';

interface DownloaderHomeViewProps {
  onViewDownloads?: () => void;
  onBack?: () => void;
}

export const DownloaderHomeView: React.FC<DownloaderHomeViewProps> = ({ onViewDownloads, onBack }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSong, setExtractedSong] = useState<UnifiedSong | null>(null);
  const [recentExtracts, setRecentExtracts] = useState<UnifiedSong[]>([]);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [recommendations, setRecommendations] = useState<UnifiedSong[]>([]);

  const { currentSong, isPlaying, playSong, togglePlayPause } = usePlayerStore();
  const { downloadedSongs, isLiked, toggleLike, addDownloadedSong } = useLibraryStore();

  const curatedSuggestions: (UnifiedSong & { url?: string })[] = [
    {
      id: 'sug_1',
      title: 'Đừng Làm Trái Tim Anh Đau',
      artistsNames: 'Sơn Tùng M-TP',
      thumbnail: 'https://i.ytimg.com/vi/abPmZCZZrFA/hqdefault.jpg',
      duration: 275,
      url: 'https://www.youtube.com/watch?v=abPmZCZZrFA',
    },
    {
      id: 'sug_2',
      title: 'Không Thể Say',
      artistsNames: 'HIEUTHUHAI',
      thumbnail: 'https://i.ytimg.com/vi/i0nd3NPJ4MI/hqdefault.jpg',
      duration: 222,
      url: 'https://www.youtube.com/watch?v=i0nd3NPJ4MI',
    },
    {
      id: 'sug_3',
      title: 'Nâng Chén Tiêu Sầu',
      artistsNames: 'Bích Phương',
      thumbnail: 'https://i.ytimg.com/vi/sU8G7Q4rUA4/hqdefault.jpg',
      duration: 215,
      url: 'https://www.youtube.com/watch?v=sU8G7Q4rUA4',
    },
    {
      id: 'sug_4',
      title: 'Never Gonna Give You Up',
      artistsNames: 'Rick Astley',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      duration: 212,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
  ];

  useEffect(() => {
    apiClient.getChart().then((chartSongs) => {
      if (chartSongs && chartSongs.length > 0) {
        setRecommendations(chartSongs.slice(0, 8));
      } else {
        apiClient.getHome().then((feed) => {
          if (feed?.globalTrending && feed.globalTrending.length > 0) {
            setRecommendations(feed.globalTrending.slice(0, 8));
          } else if (feed?.newReleases && feed.newReleases.length > 0) {
            setRecommendations(feed.newReleases.slice(0, 8));
          } else {
            setRecommendations(curatedSuggestions);
          }
        }).catch(() => {
          setRecommendations(curatedSuggestions);
        });
      }
    }).catch(() => {
      setRecommendations(curatedSuggestions);
    });
  }, []);

  const handleExtract = async (targetUrl?: string) => {
    const urlToExtract = (targetUrl || inputUrl).trim();
    if (!urlToExtract) return;

    setIsExtracting(true);
    setDownloadSuccess(false);

    try {
      const song = await apiClient.extractYouTube(urlToExtract);
      if (song) {
        setExtractedSong(song);
        setRecentExtracts((prev) => [song, ...prev.filter((s) => s.id !== song.id)].slice(0, 5));
        setInputUrl('');
      }
    } catch (e) {
      console.error('Extraction error:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadExtracted = () => {
    if (!extractedSong) return;
    addDownloadedSong(extractedSong);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const formatDuration = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isExtractedPlaying =
    extractedSong &&
    currentSong &&
    (currentSong.id === extractedSong.id || currentSong.encodeId === extractedSong.id) &&
    isPlaying;

  const displayList = recommendations.length > 0 ? recommendations : curatedSuggestions;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6 select-none pb-28 bg-[#121212]">
      {onBack && (
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            title="Quay lại"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all border-none cursor-pointer p-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 1. Top Hero Banner Card (Nhạc ngoại tuyến trên PC) */}
      <div className="bg-gradient-to-r from-[#17263c] via-[#151c27] to-[#181818] hover:from-[#1e3250] hover:to-[#222222] transition-all rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-none shadow-md">
        <div className="flex flex-col">
          <h2 className="text-base font-extrabold bg-gradient-to-r from-[#34D399] via-[#6EE7B7] to-[#60A5FA] bg-clip-text text-transparent">
            Bài hát đã tải xuống
          </h2>
          <p className="text-xs text-[#b3b3b3] mt-1">
            {downloadedSongs.length > 0
              ? `${downloadedSongs.length} bài hát sẵn sàng nghe ngoại tuyến trên máy tính`
              : 'Chưa có bài hát nào được tải trên máy tính này'}
          </p>
        </div>

        <button
          onClick={onViewDownloads}
          className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-full text-xs font-bold transition-all border-none cursor-pointer"
        >
          <span>Xem danh sách</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Link Extractor Card */}
      <div className="bg-[#181818] rounded-lg p-5 flex flex-col border-none shadow-lg">
        <h3 className="text-base font-extrabold bg-gradient-to-r from-[#FC475C] via-[#FF6B6B] to-[#FCA5A5] bg-clip-text text-transparent mb-1">
          Dán link để trích xuất nhạc
        </h3>
        <p className="text-xs text-[#b3b3b3] mb-4">
          Hỗ trợ trích xuất chất lượng cao từ YouTube, SoundCloud & TikTok (MP3 đến 320kbps)
        </p>

        {/* Input & Extract Button Row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-[#121212] rounded-md px-4 h-11 gap-3 border-none focus-within:ring-1 focus-within:ring-[#FC475C]/60">
            <LinkIcon className="w-4 h-4 text-[#FC475C] flex-shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
              placeholder="Dán link YouTube, SoundCloud hoặc TikTok tại đây..."
              className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-[#b3b3b3]"
            />
          </div>

          <button
            onClick={() => handleExtract()}
            disabled={isExtracting || !inputUrl.trim()}
            className="h-11 px-6 bg-gradient-to-r from-[#FC475C] to-[#FC655A] hover:brightness-110 active:scale-98 text-white rounded-md text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40 border-none flex-shrink-0 shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white text-white" />
            <span>{isExtracting ? 'Đang trích xuất...' : 'Trích xuất'}</span>
          </button>
        </div>
      </div>

      {/* 3. CARD TRÍCH XUẤT THÀNH CÔNG (Hiển thị bài vừa trích xuất) */}
      {extractedSong && (
        <div className="bg-[#181818] rounded-xl p-5 border border-white/10 shadow-xl flex flex-col gap-4 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
                TRÍCH XUẤT THÀNH CÔNG
              </span>
              {extractedSong.source && (
                <span className="px-2 py-0.5 rounded bg-white/5 text-[#b3b3b3] text-[10px] font-semibold uppercase tracking-wider">
                  {extractedSong.source}
                </span>
              )}
            </div>
            <button
              onClick={() => setExtractedSong(null)}
              className="text-[#b3b3b3] hover:text-white text-xs border-none bg-transparent cursor-pointer"
            >
              Đóng
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left Track Info */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#242424] flex-shrink-0 shadow-md">
                <img
                  src={
                    extractedSong.thumbnail ||
                    extractedSong.thumbnailM ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'
                  }
                  alt={extractedSong.title}
                  className="w-full h-full object-cover"
                />
                {extractedSong.duration > 0 && (
                  <span className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.2 rounded text-[9px] font-bold text-white">
                    {formatDuration(extractedSong.duration)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate mb-0.5">
                  {extractedSong.title}
                </h4>
                <p className="text-xs text-[#b3b3b3] truncate mb-2">
                  {extractedSong.artistsNames || 'Nghệ sĩ'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold">
                    MP3 HQ
                  </span>
                  <span className="text-[11px] text-[#b3b3b3] font-medium">
                    {formatDuration(extractedSong.duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Play / Download / Like */}
            <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
              {/* Play / Nghe thử */}
              <button
                onClick={() => {
                  if (isExtractedPlaying) {
                    togglePlayPause();
                  } else {
                    playSong(extractedSong, [extractedSong, ...recentExtracts]);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 active:scale-95 text-black rounded-md text-xs font-bold transition-all border-none shadow-md cursor-pointer"
              >
                {isExtractedPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-black text-black" />
                    <span>Tạm dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
                    <span>Nghe thử</span>
                  </>
                )}
              </button>

              {/* Tải xuống máy tính */}
              <button
                onClick={() => handleDownloadExtracted()}
                disabled={downloadSuccess}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all border-none cursor-pointer ${
                  downloadSuccess
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20 active:scale-95 text-white'
                }`}
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã lưu</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về PC</span>
                  </>
                )}
              </button>

              {/* Like */}
              <button
                onClick={() => toggleLike(extractedSong)}
                className={`p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors border-none cursor-pointer ${
                  isLiked(extractedSong.id) ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked(extractedSong.id) ? 'fill-white' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Gợi ý cho bạn (Trending Recommendations) */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Gợi ý cho bạn</h3>
        </div>

        {/* Grid Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayList.map((song) => {
            const liked = isLiked(song.id);
            const thumbUrl = song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
            return (
              <div
                key={song.id}
                onClick={() => playSong(song, displayList)}
                className="bg-[#181818] hover:bg-[#242424] p-3 rounded-lg cursor-pointer transition-all flex flex-col border-none group"
              >
                {/* Artwork with duration badge */}
                <div className="relative aspect-[4/3] w-full rounded-md overflow-hidden mb-3 bg-[#242424] shadow-sm">
                  <img
                    src={thumbUrl}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {/* Duration Badge on bottom right */}
                  {song.duration > 0 && (
                    <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
                      {formatDuration(song.duration)}
                    </span>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-xs font-bold text-white truncate group-hover:underline transition-colors">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
                      {song.artistsNames}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      className={`p-1 border-none bg-transparent cursor-pointer ${liked ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-white' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-[#b3b3b3] hover:text-white border-none bg-transparent cursor-pointer"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
