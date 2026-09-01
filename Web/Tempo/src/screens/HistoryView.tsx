import React from 'react';
import { History, Play, Pause, Shuffle, ChevronLeft } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { TrackTable } from '../components/TrackTable';

interface HistoryViewProps {
  onBack?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBack }) => {
  const { history } = useLibraryStore();
  const { currentSong, isPlaying, playSong, togglePlayPause, isShuffle, toggleShuffle } = usePlayerStore();

  const isCurrentListPlaying =
    isPlaying &&
    Boolean(
      currentSong &&
        history.some(
          (s) => (s.encodeId || s.id) === (currentSong.encodeId || currentSong.id)
        )
    );

  const handlePlayClick = () => {
    if (history.length === 0) return;
    if (isCurrentListPlaying) {
      togglePlayPause();
    } else {
      playSong(history[0], history);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none bg-[#121212]">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#2d2d38] via-[#1b1b22] to-[#121212] p-8 flex flex-col gap-4 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            title="Quay lại"
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 flex items-center justify-center text-white transition-all border-none cursor-pointer self-start"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-end gap-6">
          <div className="w-52 h-52 rounded-md bg-[#242424] flex items-center justify-center text-white shadow-2xl flex-shrink-0">
            <History className="w-24 h-24 stroke-[1.5]" />
          </div>

          <div className="flex flex-col justify-end">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2">Lịch Sử</span>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4">
              Nghe gần đây
            </h1>
            <p className="text-xs font-semibold text-white/90">
              {history.length} bài hát vừa nghe trên các thiết bị của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="px-8 py-5 flex items-center gap-6 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={handlePlayClick}
          disabled={history.length === 0}
          className="w-14 h-14 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 border-none cursor-pointer"
        >
          {isCurrentListPlaying ? (
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

      {/* Track List */}
      <div className="px-8 pb-12">
        <TrackTable songs={history} />
      </div>
    </div>
  );
};
