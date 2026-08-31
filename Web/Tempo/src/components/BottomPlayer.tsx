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
  Laptop,
  Maximize2,
  Radio,
} from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useConnectStore } from '../store/connectStore';

export const BottomPlayer: React.FC = () => {
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
  const { activeDeviceName, isOnline, requestTransferPlayback } = useConnectStore();

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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col select-none">
      {/* Main Spotify Player Bar */}
      <footer className="h-20 bg-[#000000] border-t border-white/5 flex items-center justify-between px-6">
        {/* Left Track Info */}
        <div className="flex items-center gap-3.5 w-72">
          <img
            src={
              currentSong?.thumbnail ||
              currentSong?.thumbnailM ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'
            }
            alt="Thumb"
            className="w-14 h-14 rounded-md object-cover bg-[#181818] flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
              {currentSong?.title || 'Chưa chọn bài hát'}
            </h4>
            <p className="text-xs text-text-secondary truncate mt-0.5 hover:underline cursor-pointer">
              {currentSong?.artistsNames || 'Tempo Music'}
            </p>
          </div>
          {currentSong && (
            <button
              onClick={() => toggleLike(currentSong)}
              className={`p-1.5 transition-transform hover:scale-110 ${
                liked ? 'text-primary' : 'text-text-muted hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-primary' : ''}`} />
            </button>
          )}
        </div>

        {/* Center Playback Controls */}
        <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              title="Trộn bài"
              className={`p-1.5 transition-colors hover:text-white ${
                isShuffle ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={playPrev}
              title="Bài trước"
              className="p-1.5 text-text-secondary hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-all shadow-md"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black text-black" />
              ) : (
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              title="Bài kế tiếp"
              className="p-1.5 text-text-secondary hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              title="Lặp lại"
              className={`p-1.5 transition-colors hover:text-white ${
                isRepeat ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Seek Bar */}
          <div className="w-full flex items-center gap-2.5">
            <span className="text-[11px] font-semibold text-text-muted w-8 text-right">
              {formatTime(positionSec)}
            </span>
            <div
              onClick={handleSeekClick}
              className="flex-1 h-1 bg-white/20 rounded-full relative cursor-pointer group"
            >
              <div
                className="h-full bg-white group-hover:bg-primary rounded-full transition-colors"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="w-3 h-3 rounded-full bg-white absolute top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                style={{ left: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-text-muted w-8">
              {formatTime(durationSec)}
            </span>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3.5 w-72 justify-end">
          <button
            onClick={toggleLyrics}
            title="Lời bài hát"
            className={`p-1.5 transition-colors hover:text-white ${
              isLyricsOpen ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          <button
            onClick={requestTransferPlayback}
            title="Thiết bị kết nối"
            className="p-1.5 text-text-secondary hover:text-white transition-colors"
          >
            <Laptop className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-text-secondary" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </footer>

      {/* Bottom Connect Pill Strip (Spotify Style) */}
      {isOnline && (
        <div className="h-6 bg-[#1DB954] text-black text-[11px] font-bold flex items-center justify-end px-6 gap-2">
          <Radio className="w-3.5 h-3.5" />
          <span>Đang đồng bộ với {activeDeviceName}</span>
        </div>
      )}
    </div>
  );
};
