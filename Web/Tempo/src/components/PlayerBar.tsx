import React, { useState, useEffect } from 'react';
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
  Radio,
  Laptop,
  Smartphone,
} from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useConnectStore } from '../store/connectStore';

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
  const {
    isOnline,
    activeDeviceId,
    activeDeviceName,
    requestTransferPlayback,
    transferPlaybackToMobile,
  } = useConnectStore();

  const [showTooltip, setShowTooltip] = useState(false);
  const isRemoteActive = activeDeviceId !== 'web-player-pc' && activeDeviceId !== '';

  useEffect(() => {
    if (isRemoteActive && isPlaying && currentSong) {
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [isRemoteActive, isPlaying, currentSong, activeDeviceName]);

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
      {/* Floating Tooltip Speech Bubble above Connect icon */}
      {showTooltip && (
        <div className="absolute right-36 bottom-24 bg-white text-black rounded-lg px-3 py-1.5 shadow-2xl flex items-center gap-2.5 z-50 border-none">
          <Radio className="w-3.5 h-3.5 text-black flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider leading-tight">Đang nghe trên</span>
            <span className="text-[11px] font-bold text-black leading-tight">
              {activeDeviceName || 'Điện thoại'}
            </span>
          </div>
          <button
            onClick={requestTransferPlayback}
            className="text-[11px] font-extrabold text-[#FC475C] hover:underline ml-1.5 flex-shrink-0 border-none bg-transparent cursor-pointer"
          >
            Chuyển về PC
          </button>
          {/* Arrow pointing down */}
          <div className="absolute right-8 -bottom-1 w-2.5 h-2.5 bg-white rotate-45" />
        </div>
      )}

      {/* Main Bottom Player Bar */}
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
              className={`p-1.5 transition-transform hover:scale-110 border-none bg-transparent cursor-pointer ${
                liked ? 'text-[#FC475C]' : 'text-text-muted hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-[#FC475C] text-[#FC475C]' : ''}`} />
            </button>
          )}
        </div>

        {/* Center Controls & Pink Progress Bar */}
        <div className="flex-1 max-w-xl flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              title={isShuffle ? "Tắt trộn bài" : "Bật trộn bài"}
              className={`p-1 transition-colors border-none bg-transparent cursor-pointer ${
                isShuffle ? 'text-[#FC475C]' : 'text-text-muted hover:text-white'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={playPrev}
              title="Bài trước"
              className="p-1 text-text-secondary hover:text-white transition-colors border-none bg-transparent cursor-pointer"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FC475C] to-[#FC655A] hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-primary/20 border-none cursor-pointer"
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
              className="p-1 text-text-secondary hover:text-white transition-colors border-none bg-transparent cursor-pointer"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              title={isRepeat ? "Tắt lặp lại" : "Bật lặp lại"}
              className={`p-1 transition-colors border-none bg-transparent cursor-pointer ${
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
                className="h-full bg-gradient-to-r from-[#FC475C] to-[#FC655A] rounded-full transition-all"
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

        {/* Right Tools: Nút Chuyển đổi Thiết bị + Lời bài hát + Thanh Âm Lượng */}
        <div className="flex items-center gap-3.5 min-w-[310px] justify-end flex-shrink-0">
          {/* Nút chuyển đổi thiết bị Mobile / PC */}
          <button
            onClick={() => {
              if (isRemoteActive) {
                requestTransferPlayback();
              } else {
                transferPlaybackToMobile();
              }
            }}
            title={isRemoteActive ? "Chuyển phát về Máy tính này" : "Chuyển phát sang Điện thoại"}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border-none cursor-pointer shadow-sm whitespace-nowrap flex-shrink-0 ${
              isRemoteActive
                ? "bg-[#FC475C] text-white hover:opacity-90 shadow-[#FC475C]/20"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {isRemoteActive ? (
              <>
                <Smartphone className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Chuyển về PC</span>
              </>
            ) : (
              <>
                <Laptop className="w-4 h-4 text-[#FC475C] flex-shrink-0" />
                <span className="whitespace-nowrap">Chuyển sang ĐT</span>
              </>
            )}
          </button>

          <button
            onClick={toggleLyrics}
            title="Lời bài hát"
            className={`p-1.5 transition-colors border-none bg-transparent cursor-pointer ${
              isLyricsOpen ? 'text-[#FC475C]' : 'text-text-muted hover:text-white'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-text-muted flex-shrink-0" />
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
        </div>
      </footer>

      {/* Tempo Signature Neon Connect Bar at Bottom (Chỉ hiện khi đang nghe từ xa qua điện thoại) */}
      {isRemoteActive && currentSong && (
        <div
          onClick={requestTransferPlayback}
          className="h-6 bg-gradient-to-r from-[#FC475C] to-[#FC655A] text-white text-[10px] font-bold flex items-center justify-end px-8 gap-2 select-none cursor-pointer hover:opacity-95 transition-opacity shadow-md"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Đang phát trên {activeDeviceName || 'Điện thoại'} · Nhấn để chuyển phát về máy tính này</span>
        </div>
      )}
    </div>
  );
};
