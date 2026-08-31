import React, { useEffect, useRef } from 'react';
import { Mic2, Music2 } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

export const LyricsView: React.FC = () => {
  const { currentSong, positionSec, lyrics, seekTo } = usePlayerStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!currentSong) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center p-8 select-none">
        <Music2 className="w-16 h-16 mb-4 stroke-1 opacity-30" />
        <h3 className="text-lg font-bold text-white mb-1">Chưa chọn bài hát</h3>
        <p className="text-xs text-text-secondary">Hãy phát một bài hát để xem lời karaoke đồng bộ</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden p-10 gap-12 select-none">
      {/* Left Artwork */}
      <div className="w-80 flex flex-col items-center text-center flex-shrink-0">
        <img
          src={currentSong.thumbnailM || currentSong.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'}
          alt={currentSong.title}
          className="w-72 h-72 rounded-xl object-cover shadow-2xl mb-6 bg-[#181818]"
        />
        <h2 className="text-2xl font-black text-white truncate max-w-full mb-1">
          {currentSong.title}
        </h2>
        <p className="text-sm font-semibold text-text-secondary truncate max-w-full">
          {currentSong.artistsNames}
        </p>
      </div>

      {/* Right Synced Karaoke Lines */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-16 pr-6 custom-scrollbar">
        {lyrics.length > 0 ? (
          <div className="space-y-6">
            {lyrics.map((line, idx) => {
              const currentMs = positionSec * 1000;
              const isActive = currentMs >= line.startMs && currentMs <= line.startMs + 4500;
              return (
                <p
                  key={idx}
                  onClick={() => seekTo(line.startMs / 1000)}
                  className={`text-2xl font-extrabold cursor-pointer transition-all duration-300 ${
                    isActive
                      ? 'text-primary text-3xl font-black scale-102 origin-left'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {line.words}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <Mic2 className="w-12 h-12 mb-3 stroke-1 opacity-40" />
            <p className="text-base font-bold text-white mb-1">Chưa có lời bài hát</p>
            <p className="text-xs text-text-secondary">Lời bài hát của bản nhạc này chưa được cập nhật</p>
          </div>
        )}
      </div>
    </div>
  );
};
