import React, { useEffect, useRef } from 'react';
import { Mic2, Music2, X } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

export const LyricsView: React.FC = () => {
  const { currentSong, positionSec, lyrics, seekTo, setLyricsOpen } = usePlayerStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  // Auto-scroll to active lyric line
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [positionSec]);

  if (!currentSong) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#b3b3b3] text-center p-8 select-none bg-[#121212] relative">
        <button
          onClick={() => setLyricsOpen(false)}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#242424] hover:bg-[#333333] flex items-center justify-center text-white transition-colors border-none cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <Music2 className="w-16 h-16 mb-4 stroke-1 opacity-40 text-white" />
        <h3 className="text-lg font-bold text-white mb-1">Chưa chọn bài hát</h3>
        <p className="text-xs text-[#b3b3b3]">Hãy phát một bài hát để xem lời karaoke đồng bộ</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden p-8 gap-10 select-none bg-[#121212] relative">
      {/* Top Close Button */}
      <button
        onClick={() => setLyricsOpen(false)}
        title="Đóng lời bài hát"
        className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#242424] hover:bg-[#333333] flex items-center justify-center text-white transition-colors border-none cursor-pointer z-20 shadow-md"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Left Artwork & Track Info */}
      <div className="w-80 flex flex-col items-center text-center flex-shrink-0 justify-center">
        <img
          src={
            currentSong.thumbnailM ||
            currentSong.thumbnail ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'
          }
          alt={currentSong.title}
          className="w-72 h-72 rounded-xl object-cover shadow-2xl mb-6 bg-[#181818]"
        />
        <h2 className="text-2xl font-black text-white truncate max-w-full mb-1">
          {currentSong.title}
        </h2>
        <p className="text-sm font-semibold text-[#b3b3b3] truncate max-w-full">
          {currentSong.artistsNames}
        </p>
      </div>

      {/* Right Synced Karaoke Lines */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-24 pr-8 custom-scrollbar">
        {lyrics.length > 0 ? (
          <div className="space-y-7">
            {lyrics.map((line, idx) => {
              const currentMs = positionSec * 1000;
              const isActive = currentMs >= line.startMs && currentMs <= line.startMs + 4500;

              // words có thể là string hoặc array [{startTime, endTime, data}]
              const lineText = Array.isArray((line as any).words)
                ? (line as any).words.map((w: any) => {
                    if (typeof w === 'string') return w;
                    if (typeof w?.data === 'string') return w.data;
                    if (typeof w?.text === 'string') return w.text;
                    return '';
                  }).join(' ')
                : (typeof line.words === 'string' ? line.words : '');

              if (!lineText.trim()) return null;

              return (
                <p
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seekTo(line.startMs / 1000)}
                  className={`text-2xl font-extrabold cursor-pointer transition-all duration-300 ${
                    isActive
                      ? 'text-white text-3xl font-black scale-105 origin-left drop-shadow-md'
                      : 'text-white/35 hover:text-white/70'
                  }`}
                >
                  {lineText}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#b3b3b3]">
            <Mic2 className="w-12 h-12 mb-3 stroke-1 opacity-40 text-white" />
            <p className="text-base font-bold text-white mb-1">Đang tải lời bài hát hoặc chưa có</p>
            <p className="text-xs text-[#b3b3b3]">Lời bài hát sẽ tự động đồng bộ khi phát</p>
          </div>
        )}
      </div>
    </div>
  );
};
