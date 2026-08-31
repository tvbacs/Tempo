import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  Mic2,
  Heart,
  ListMusic,
  Tv,
  Maximize2,
} from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

export const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    positionSec,
    durationSec,
    volume,
    isShuffle,
    isRepeat,
    isLyricsOpen,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleLyrics,
  } = usePlayerStore();

  const { isLiked, toggleLike } = useLibraryStore();

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPct = durationSec > 0 ? (positionSec / durationSec) * 100 : 0;
  const liked = currentSong ? isLiked(currentSong.encodeId || currentSong.id) : false;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    seekTo(pct * durationSec);
  };

  return (
    <footer className="h-20 bg-[#0B0B0E] border-none flex items-center justify-between px-8 select-none z-50 flex-shrink-0">
      {/* Left Track Info */}
      <div className="flex items-center gap-3.5 w-72">
        <img
          src={
            currentSong?.thumbnail ||
            currentSong?.thumbnailM ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'
          }
          alt="Thumb"
          className="w-12 h-12 rounded-xl object-cover bg-[#181820] flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white truncate">
            {currentSong?.title || 'Chưa chọn bài hát'}
          </h4>
          <p className="text-[11px] text-text-muted truncate mt-0.5">
            {currentSong?.artistsNames || 'Tempo Music'}
          </p>
        </div>
        {currentSong && (
          <button
            onClick={() => toggleLike(currentSong)}
            className={`p-1.5 transition-transform hover:scale-110 ${
              liked ? 'text-green-500' : 'text-text-muted hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-green-500 text-green-500' : ''}`} />
          </button>
        )}
      </div>

      {/* Center Controls & Pink Progress Bar */}
      <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            title="Trộn bài"
            className={`p-1 transition-colors ${
              isShuffle ? 'text-[#FC475C]' : 'text-text-muted hover:text-white'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={playPrev}
            title="Bài trước"
            className="p-1 text-text-secondary hover:text-white transition-colors"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FC475C] to-[#EC4899] hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-primary/20"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white text-white" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            title="Bài kế tiếp"
            className="p-1 text-text-secondary hover:text-white transition-colors"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            title="Lặp lại"
            className={`p-1 transition-colors ${
              isRepeat ? 'text-[#FC475C]' : 'text-text-muted hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pink Seek Bar with Timestamps */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] font-semibold text-text-muted w-7 text-right">
            {formatTime(positionSec)}
          </span>
          <div
            onClick={handleSeekClick}
            className="flex-1 h-1 bg-white/10 rounded-full relative cursor-pointer group"
          >
            <div
              className="h-full bg-gradient-to-r from-[#FC475C] to-[#EC4899] rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="w-2.5 h-2.5 rounded-full bg-white absolute top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              style={{ left: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-text-muted w-7">
            {formatTime(durationSec)}
          </span>
        </div>
      </div>

      {/* Right Tools & Volume Slider */}
      <div className="flex items-center gap-3.5 w-72 justify-end">
        <button
          onClick={toggleLyrics}
          title="Lời bài hát"
          className={`p-1.5 transition-colors ${
            isLyricsOpen ? 'text-[#FC475C]' : 'text-text-muted hover:text-white'
          }`}
        >
          <Mic2 className="w-4 h-4" />
        </button>

        <button className="p-1.5 text-text-muted hover:text-white transition-colors">
          <ListMusic className="w-4 h-4" />
        </button>

        <button className="p-1.5 text-text-muted hover:text-white transition-colors">
          <Tv className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-text-muted" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#FC475C]"
          />
        </div>

        <button className="p-1.5 text-text-muted hover:text-white transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
