import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Mic2,
  CheckCircle2,
  Heart,
  ListMusic,
  Maximize2,
  Laptop,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useConnectStore } from '../store/connectStore';

export const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    isLoading,
    positionSec,
    durationSec,
    volume,
    isShuffle,
    isRepeat,
    repeatMode,
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
    activeDeviceId,
    activeDeviceName,
    requestTransferPlayback,
    transferPlaybackToMobile,
  } = useConnectStore();

  const [prevVolume, setPrevVolume] = useState(0.8);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);

  const isRemoteActive = activeDeviceId !== 'web-player-pc' && activeDeviceId !== '';

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPct = durationSec > 0 ? (positionSec / durationSec) * 100 : 0;
  const volumePct = volume * 100;
  const liked = currentSong ? isLiked(currentSong.encodeId || currentSong.id) : false;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    seekTo(pct * durationSec);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.8);
    }
  };

  return (
    <div className="flex flex-col flex-shrink-0 z-50 select-none">
      <footer className="h-20 bg-[#000000] border-none flex items-center justify-between px-4 select-none z-50 flex-shrink-0 relative">
      {/* 1. Left Track Info (56x56 Cover + Title + Artist + Heart) */}
      <div className="flex items-center gap-3.5 w-72 min-w-0">
        <div className="relative w-14 h-14 rounded-md overflow-hidden bg-[#282828] flex-shrink-0 shadow">
          <img
            src={
              currentSong?.thumbnail ||
              currentSong?.thumbnailM ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'
            }
            alt="Thumb"
            className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-white drop-shadow" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">
            {currentSong?.title || 'Chưa chọn bài hát'}
          </h4>
          <p className="text-xs text-[#b3b3b3] truncate mt-0.5 hover:underline hover:text-white cursor-pointer flex items-center gap-1.5">
            <span>{currentSong?.artistsNames || 'Tempo Music'}</span>
            {isLoading && (
              <span className="text-[10px] text-primary font-bold animate-pulse">
                • Đang tải...
              </span>
            )}
          </p>
        </div>
        {currentSong && (
          <button
            onClick={() => toggleLike(currentSong)}
            title={liked ? 'Bỏ lưu khỏi Bài hát đã thích' : 'Lưu vào Bài hát đã thích'}
            className="p-1.5 transition-transform hover:scale-110 border-none bg-transparent cursor-pointer flex-shrink-0"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                liked ? 'fill-[#FC475C] text-[#FC475C]' : 'text-[#b3b3b3] hover:text-white'
              }`}
            />
          </button>
        )}
      </div>

      {/* 2. Center Controls & Scrub Bar */}
      <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5 px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
            className={`p-1.5 transition-colors border-none bg-transparent cursor-pointer relative group ${
              isShuffle ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && (
              <span className="w-1 h-1 bg-[#1ed760] rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
            )}
          </button>

          <button
            onClick={playPrev}
            title="Bài trước"
            className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Solid White Circle Play/Pause/Loading Button */}
          <button
            onClick={togglePlayPause}
            title={isLoading ? 'Đang tải âm thanh...' : isPlaying ? 'Tạm dừng' : 'Phát'}
            className="w-8 h-8 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-transform shadow-md border-none cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            title="Bài kế tiếp"
            className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {repeatMode === 'one' ? (
            <button
              onClick={toggleRepeat}
              title="Lặp lại: 1 bài (Bấm để tắt)"
              className="p-1.5 transition-colors border-none bg-transparent cursor-pointer text-[#1ed760] relative group"
            >
              <Repeat1 className="w-4 h-4 text-[#1ed760]" />
              <span className="w-1 h-1 bg-[#1ed760] rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
            </button>
          ) : repeatMode === 'all' ? (
            <button
              onClick={toggleRepeat}
              title="Lặp lại: Toàn bộ danh sách (Bấm để lặp 1 bài)"
              className="p-1.5 transition-colors border-none bg-transparent cursor-pointer text-[#1ed760] relative group"
            >
              <Repeat className="w-4 h-4 text-[#1ed760]" />
              <span className="w-1 h-1 bg-[#1ed760] rounded-full absolute bottom-0 left-1/2 -translate-x-1/2" />
            </button>
          ) : (
            <button
              onClick={toggleRepeat}
              title="Bật lặp lại toàn bộ"
              className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
            >
              <Repeat className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Seek Bar with Timestamps */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] font-normal text-[#a7a7a7] w-8 text-right tabular-nums">
            {formatTime(positionSec)}
          </span>
          <div
            onClick={handleSeekClick}
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
            className="flex-1 h-3 flex items-center relative cursor-pointer group"
          >
            <div className="w-full h-1 group-hover:h-1.5 bg-[#4d4d4d] rounded-full relative transition-all">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className={`w-3 h-3 rounded-full bg-white absolute top-1/2 -translate-y-1/2 -translate-x-1/2 shadow transition-opacity ${
                  isHoveringProgress ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ left: `${progressPct}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] font-normal text-[#a7a7a7] w-8 tabular-nums">
            {formatTime(durationSec)}
          </span>
        </div>
      </div>

      {/* 3. Right Tools: Lời bài hát, Hàng đợi, Thiết bị, Âm lượng, Toàn màn hình */}
      <div className="flex items-center gap-3 w-72 justify-end">
        {/* Nút chuyển đổi thiết bị Mobile / PC */}
        {isRemoteActive ? (
          <button
            onClick={requestTransferPlayback}
            title="Đang phát trên điện thoại - Bấm để chuyển về PC"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-black text-xs font-bold border-none cursor-pointer hover:scale-105 transition-transform shadow"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>PC</span>
          </button>
        ) : (
          <button
            onClick={transferPlaybackToMobile}
            title="Chuyển phát sang điện thoại"
            className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
          >
            <Laptop className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={toggleLyrics}
          title={isLyricsOpen ? 'Đóng lời bài hát' : 'Xem lời bài hát'}
          className={`p-1.5 transition-colors border-none bg-transparent cursor-pointer rounded-full hover:bg-[#242424] ${
            isLyricsOpen ? 'text-white font-bold bg-[#242424]' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Volume Slider */}
        <div
          className="flex items-center gap-2"
          onMouseEnter={() => setIsHoveringVolume(true)}
          onMouseLeave={() => setIsHoveringVolume(false)}
        >
          <button
            onClick={toggleMute}
            className="p-1 text-[#b3b3b3] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="w-24 h-1 bg-[#4d4d4d] rounded-full relative cursor-pointer">
            <div
              className="h-full rounded-full bg-white transition-colors"
              style={{ width: `${volumePct}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          title="Toàn màn hình"
          className="p-1.5 text-[#b3b3b3] hover:text-white transition-colors border-none bg-transparent cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>

    {/* Thanh trạng thái thiết bị đang nghe (Tempo Connect Bar) */}
    <div className="h-6 bg-[#181818] hover:bg-[#202020] text-white text-[11px] font-medium flex items-center justify-between px-6 transition-colors border-t border-white/5">
      <div className="flex items-center gap-2 text-white/90">
        {isRemoteActive ? (
          <Smartphone className="w-3.5 h-3.5 text-white" />
        ) : (
          <Laptop className="w-3.5 h-3.5 text-white" />
        )}
        <span>
          {isRemoteActive
            ? `Đang phát trên ${activeDeviceName || 'Điện thoại'}`
            : 'Đang phát trên Máy tính (PC)'}
        </span>
      </div>

      <button
        onClick={isRemoteActive ? requestTransferPlayback : transferPlaybackToMobile}
        className="text-[11px] font-bold text-white hover:underline cursor-pointer border-none bg-transparent p-0"
      >
        {isRemoteActive ? 'Chuyển phát về PC' : 'Chuyển phát sang Điện thoại'}
      </button>
    </div>
  </div>
);
};
