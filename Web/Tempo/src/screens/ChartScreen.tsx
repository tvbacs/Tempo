import React, { useEffect, useState } from 'react';
import { Play, TrendingUp, Shuffle } from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { TrackTable } from '../components/TrackTable';

export const ChartScreen: React.FC = () => {
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    apiClient.getChart().then((data) => {
      if (isMounted) {
        setSongs(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (songs.length === 0) return;
    const list = shuffle ? [...songs].sort(() => Math.random() - 0.5) : songs;
    playSong(list[0], list);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-[#1E3A8A] via-[#172554] to-[#121212] p-8 flex items-end gap-6 flex-shrink-0">
        <div className="w-52 h-52 rounded-md bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          <TrendingUp className="w-24 h-24" />
        </div>

        <div className="flex flex-col justify-end">
          <span className="text-xs font-bold uppercase tracking-wider text-white mb-2">Bảng Xếp Hạng</span>
          <h1 className="text-5xl font-black text-white tracking-tight mb-4">
            Tempo Chart Top 50
          </h1>
          <p className="text-xs font-semibold text-white/80">
            Cập nhật theo thời gian thực từ Zing MP3 · {songs.length} bài hát hàng đầu
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-6 flex items-center gap-6 bg-[#121212]/80 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => handlePlayAll(false)}
          disabled={songs.length === 0}
          className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-all disabled:opacity-50"
        >
          <Play className="w-6 h-6 fill-black text-black ml-0.5" />
        </button>

        <button
          onClick={() => handlePlayAll(true)}
          title="Trộn bài"
          className="text-text-secondary hover:text-white transition-colors"
        >
          <Shuffle className="w-6 h-6" />
        </button>
      </div>

      {/* Track List */}
      <div className="px-8 pb-12">
        {isLoading ? (
          <div className="py-16 text-center text-text-secondary text-sm">Đang tải bảng xếp hạng...</div>
        ) : (
          <TrackTable songs={songs} />
        )}
      </div>
    </div>
  );
};
