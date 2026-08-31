import React from 'react';
import { History, Play, Shuffle } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { TrackTable } from '../components/TrackTable';

export const HistoryView: React.FC = () => {
  const { history } = useLibraryStore();
  const { playSong } = usePlayerStore();

  const handlePlayAll = (shuffle: boolean = false) => {
    if (history.length === 0) return;
    const list = shuffle ? [...history].sort(() => Math.random() - 0.5) : history;
    playSong(list[0], list);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#065F46] via-[#064E3B] to-[#121212] p-8 flex items-end gap-6 flex-shrink-0">
        <div className="w-52 h-52 rounded-md bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center text-white shadow-2xl flex-shrink-0">
          <History className="w-24 h-24" />
        </div>

        <div className="flex flex-col justify-end">
          <span className="text-xs font-bold uppercase tracking-wider text-white mb-2">Lịch Sử</span>
          <h1 className="text-5xl font-black text-white tracking-tight mb-4">
            Nghe gần đây
          </h1>
          <p className="text-xs font-semibold text-white/80">
            {history.length} bài hát vừa nghe trên các thiết bị của bạn
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="px-8 py-6 flex items-center gap-6 bg-[#121212]/80 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => handlePlayAll(false)}
          disabled={history.length === 0}
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
        <TrackTable songs={history} />
      </div>
    </div>
  );
};
