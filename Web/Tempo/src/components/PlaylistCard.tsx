import React from 'react';
import { Play } from 'lucide-react';

interface PlaylistCardProps {
  title: string;
  thumbnail: string;
  subTitle?: string;
  onClick: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  title,
  thumbnail,
  subTitle,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-[#181820] hover:bg-[#22222D] p-3.5 rounded-xl cursor-pointer transition-all hover:-translate-y-1 group relative flex flex-col"
    >
      <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-[#111117]">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FC475C] to-[#FC655A] text-white flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>
      <h4 className="text-sm font-bold text-white truncate">{title}</h4>
      {subTitle && <p className="text-xs text-text-secondary truncate mt-1">{subTitle}</p>}
    </div>
  );
};
