import React from 'react';
import { Play } from 'lucide-react';
import { UnifiedSong } from '../types/music';

interface SongCardProps {
  song: UnifiedSong;
  index?: number;
  onPlay: (song: UnifiedSong) => void;
  isCurrent?: boolean;
}

export const SongCard: React.FC<SongCardProps> = ({ song, index, onPlay, isCurrent }) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-[#4A90E2]';
    if (rank === 2) return 'text-[#50E3C2]';
    if (rank === 3) return 'text-[#E35050]';
    return 'text-text-muted';
  };

  return (
    <div
      onClick={() => onPlay(song)}
      className={`flex items-center gap-3.5 bg-[#181820] hover:bg-[#22222D] p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5 hover:-translate-y-0.5 group ${
        isCurrent ? 'border-primary/40 bg-[#22222D]' : ''
      }`}
    >
      {typeof index === 'number' && (
        <span className={`text-base font-extrabold w-6 text-center ${getRankColor(index + 1)}`}>
          {index + 1}
        </span>
      )}

      <img
        src={song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}
        alt={song.title}
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>
          {song.title}
        </h4>
        <p className="text-xs text-text-secondary truncate mt-0.5">{song.artistsNames}</p>
      </div>

      {song.duration > 0 && (
        <span className="text-xs text-text-muted mr-2 flex-shrink-0">
          {formatTime(song.duration)}
        </span>
      )}

      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FC475C] to-[#FC655A] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      </div>
    </div>
  );
};
