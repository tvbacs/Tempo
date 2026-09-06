import React, { useEffect, useState } from 'react';
import { TrendingUp, Play, Pause, Shuffle, ChevronLeft } from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { TrackTable } from '../components/TrackTable';

interface ChartScreenProps {
  onBack?: () => void;
}

export const ChartScreen: React.FC<ChartScreenProps> = ({ onBack }) => {
  const [songs, setSongs] = useState<UnifiedSong[]>(() => {
    try {
      const cached = localStorage.getItem('tempo_cached_chart');
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(() => songs.length === 0);
  const { currentSong, isPlaying, playSong, togglePlayPause, isShuffle, toggleShuffle } = usePlayerStore();

  const isCurrentListPlaying =
    isPlaying &&
    Boolean(
      currentSong &&
        songs.some(
          (s) => (s.encodeId || s.id) === (currentSong.encodeId || currentSong.id)
        )
    );

  useEffect(() => {
    let isMounted = true;
    if (songs.length === 0) setIsLoading(true);

    apiClient
      .getChart()
      .then((chartSongs) => {
        if (isMounted) {
          if (chartSongs && chartSongs.length > 0) {
            setSongs(chartSongs);
            try {
              localStorage.setItem('tempo_cached_chart', JSON.stringify(chartSongs));
            } catch (_) {}
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayClick = () => {
    if (songs.length === 0) return;
    if (isCurrentListPlaying) {
      togglePlayPause();
    } else {
      playSong(songs[0], songs);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none bg-[#121212]">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#2d2d38] via-[#1b1b22] to-[#121212] p-4 sm:p-6 md:p-8 flex flex-col gap-4 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            title="Quay lại"
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 flex items-center justify-center text-white transition-all border-none cursor-pointer self-start"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-md bg-gradient-to-br from-[#FC475C] via-[#941A2D] to-[#252530] flex items-center justify-center text-white shadow-2xl flex-shrink-0">
            <TrendingUp className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 stroke-[2.5]" />
          </div>

          <div className="flex flex-col justify-end">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/70 mb-1 sm:mb-2">Bảng Xếp Hạng</span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight mb-2 sm:mb-4">
              Tempo Chart Top 50
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-white/90">
              Cập nhật theo thời gian thực từ Zing MP3 · {songs.length} bài hát hàng đầu
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 flex items-center gap-4 sm:gap-6 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={handlePlayClick}
          disabled={songs.length === 0 || (isLoading && songs.length === 0)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 border-none cursor-pointer"
        >
          {isCurrentListPlaying ? (
            <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black" />
          ) : (
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-black text-black ml-0.5" />
          )}
        </button>

        <button
          onClick={toggleShuffle}
          title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
          className={`transition-colors border-none bg-transparent cursor-pointer p-1 ${
            isShuffle ? 'text-white font-bold scale-110' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Track List */}
      <div className="px-3 sm:px-6 md:px-8 pb-24 md:pb-12">
        {isLoading && songs.length === 0 ? (
          <div className="flex flex-col gap-2.5 pt-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-md bg-white/[0.02] animate-pulse">
                <div className="w-4 h-4 bg-white/10 rounded" />
                <div className="w-10 h-10 bg-white/10 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/10 rounded w-1/3" />
                  <div className="h-2.5 bg-white/5 rounded w-1/5" />
                </div>
                <div className="w-24 h-3 bg-white/5 rounded hidden md:block" />
                <div className="w-10 h-3 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <TrackTable songs={songs} />
        )}
      </div>
    </div>
  );
};
