import React, { useState } from 'react';
import {
  Download,
  ChevronRight,
  Link,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  Play,
  Heart,
  MoreVertical,
} from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { UnifiedSong } from '../types/music';

interface DownloaderHomeViewProps {
  onViewDownloads?: () => void;
}

export const DownloaderHomeView: React.FC<DownloaderHomeViewProps> = ({ onViewDownloads }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const { playSong } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();

  const handleExtract = async () => {
    if (!youtubeUrl.trim()) return;
    setIsExtracting(true);
    try {
      const res = await fetch('/api/music/extract-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        playSong(json.data);
        setYoutubeUrl('');
      }
    } catch (e) {
      console.error('Extract error:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  const sampleRecommendations: UnifiedSong[] = [
    {
      id: 'rec_1',
      title: 'Đừng Làm Trái Tim Anh Đau',
      artistsNames: 'Sơn Tùng M-TP',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
      duration: 275,
    },
    {
      id: 'rec_2',
      title: 'Không Thể Say',
      artistsNames: 'HIEUTHUHAI',
      thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
      duration: 222,
    },
    {
      id: 'rec_3',
      title: 'Never Gonna Give You Up',
      artistsNames: 'Rick Astley',
      thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400',
      duration: 207,
    },
    {
      id: 'rec_4',
      title: 'Chạy Về Khóc Với Anh',
      artistsNames: 'ERIK',
      thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400',
      duration: 252,
    },
  ];

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6 select-none">
      {/* 1. Top Hero Banner Card */}
      <div className="bg-gradient-to-r from-[#181824] via-[#1A182E] to-[#12121A] rounded-2xl p-7 flex items-center justify-between relative overflow-hidden border-none shadow-xl">
        <div className="flex items-center gap-6 z-10">
          {/* Big Download Icon Square */}
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#EC4899] via-[#8B5CF6] to-[#3B82F6] flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Download className="w-12 h-12" strokeWidth={2.5} />
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-[#EC4899] uppercase tracking-wider mb-1.5">
              NHẠC NGOẠI TUYẾN
            </span>
            <h2 className="text-2xl font-black text-white mb-1.5">Bài hát đã tải xuống</h2>
            <p className="text-xs text-text-secondary mb-4">
              2 bài hát sẵn sàng nghe khi không có mạng
            </p>
            <button
              onClick={onViewDownloads}
              className="self-start flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white rounded-xl text-xs font-extrabold hover:opacity-90 active:scale-98 transition-all border-none"
            >
              <span>Xem ngay</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Decorative Wave Lines SVG Background */}
        <div className="absolute right-0 top-0 bottom-0 w-80 opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 300 200" fill="none">
            <path
              d="M0 100 C 50 150, 100 50, 150 120 C 200 190, 250 80, 300 130"
              stroke="#EC4899"
              strokeWidth="2"
            />
            <path
              d="M0 120 C 60 170, 110 70, 160 140 C 210 210, 260 100, 300 150"
              stroke="#8B5CF6"
              strokeWidth="2"
            />
            <path
              d="M0 80 C 40 130, 90 30, 140 100 C 190 170, 240 60, 300 110"
              stroke="#3B82F6"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* 2. YouTube Converter & Link Extractor Card */}
      <div className="bg-[#181820] rounded-2xl p-6 flex flex-col border-none shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#FC475C] shadow-[0_0_8px_#FC475C]" />
          <span className="text-[11px] font-extrabold text-[#FC475C] uppercase tracking-wider">
            YOUTUBE CONVERTER
          </span>
        </div>

        <h3 className="text-base font-extrabold text-white mb-1">
          Dán link YouTube để trích xuất
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Hỗ trợ MP3 chất lượng cao đến 320kbps
        </p>

        {/* Input & Extract Button Row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 flex items-center bg-[#111117] rounded-xl px-4 h-12 gap-3 border-none focus-within:ring-2 focus-within:ring-[#FC475C]/40">
            <Link className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Dán link YouTube tại đây..."
              className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-text-muted"
            />
          </div>

          <button
            onClick={handleExtract}
            disabled={isExtracting || !youtubeUrl.trim()}
            className="h-12 px-6 bg-gradient-to-r from-[#FC475C] to-[#EC4899] hover:opacity-90 active:scale-98 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all disabled:opacity-40 border-none flex-shrink-0 shadow-md shadow-primary/20"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isExtracting ? 'Đang trích xuất...' : 'Trích xuất'}</span>
          </button>
        </div>

        {/* 3 Features Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 bg-[#121217] p-3 rounded-xl border-none">
            <div className="w-8 h-8 rounded-lg bg-[#FC475C]/15 text-[#FC475C] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white">Chất lượng cao</h5>
              <p className="text-[11px] text-text-muted">MP3 320kbps</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#121217] p-3 rounded-xl border-none">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white">An toàn</h5>
              <p className="text-[11px] text-text-muted">Không lưu dữ liệu</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#121217] p-3 rounded-xl border-none">
            <div className="w-8 h-8 rounded-lg bg-[#EC4899]/15 text-[#EC4899] flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-white">Nhanh chóng</h5>
              <p className="text-[11px] text-text-muted">Trích xuất tức thì</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. "Gợi ý cho bạn" Section */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Gợi ý cho bạn</h3>
          <span className="text-xs font-bold text-text-muted hover:text-white cursor-pointer">
            Xem tất cả
          </span>
        </div>

        {/* 4 Wide Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleRecommendations.map((song) => {
            const liked = isLiked(song.id);
            return (
              <div
                key={song.id}
                onClick={() => playSong(song, sampleRecommendations)}
                className="bg-[#181820] hover:bg-[#22222D] p-3 rounded-2xl cursor-pointer transition-all flex flex-col border-none group"
              >
                {/* Artwork with duration badge */}
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden mb-3 bg-[#111117]">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Duration Badge on bottom right */}
                  <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
                    {formatDuration(song.duration)}
                  </span>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FC475C] transition-colors">
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {song.artistsNames}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      className={`p-1 ${liked ? 'text-[#FC475C]' : 'text-text-muted hover:text-white'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-[#FC475C]' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-text-muted hover:text-white"
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
