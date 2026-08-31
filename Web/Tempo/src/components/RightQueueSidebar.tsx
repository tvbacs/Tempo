import React, { useState } from 'react';
import { Trash2, Pause, Play, Loader2, Clock, CheckCircle2 } from 'lucide-react';

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  progress: number; // 0..100
  status: 'downloading' | 'processing' | 'queued' | 'completed';
}

export const RightQueueSidebar: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([
    {
      id: 'q1',
      title: 'Em Không Sai, Chúng Ta Sai',
      artist: 'Erik',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
      progress: 75,
      status: 'downloading',
    },
    {
      id: 'q2',
      title: 'Sau Lưng Anh Có Ai Kìa',
      artist: 'Thiều Bảo Trâm',
      thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=120',
      progress: 20,
      status: 'processing',
    },
    {
      id: 'q3',
      title: 'Nơi Này Có Anh',
      artist: 'Sơn Tùng M-TP',
      thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=120',
      progress: 0,
      status: 'queued',
    },
  ]);

  const handleClearAll = () => {
    setQueue([]);
  };

  return (
    <aside className="w-80 bg-[#121217] rounded-lg p-4 flex flex-col select-none flex-shrink-0 border-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Đang chờ xử lý</span>
          <span className="w-5 h-5 rounded-full bg-[#181820] text-text-secondary text-[11px] font-extrabold flex items-center justify-center">
            {queue.length}
          </span>
        </div>
        <span className="text-xs text-text-muted font-bold">{queue.length}</span>
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar pr-1">
        {queue.length > 0 ? (
          queue.map((item) => (
            <div key={item.id} className="bg-[#181820] rounded-md p-2.5 flex flex-col gap-2 border-none">
              <div className="flex items-center gap-2.5">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                  <p className="text-[11px] text-text-muted truncate">{item.artist}</p>
                </div>
                {item.status === 'downloading' && (
                  <button className="text-text-muted hover:text-white p-1">
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
                {item.status === 'processing' && (
                  <Loader2 className="w-3.5 h-3.5 text-[#FC475C] animate-spin" />
                )}
                {item.status === 'queued' && (
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                )}
              </div>

              {/* Progress or Status */}
              {item.status === 'downloading' ? (
                <div className="flex flex-col gap-1">
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FC475C] to-[#FC655A] rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#FC475C] self-start">
                    {item.progress}%
                  </span>
                </div>
              ) : item.status === 'processing' ? (
                <span className="text-[10px] font-bold text-[#FC475C]">Đang xử lý</span>
              ) : (
                <span className="text-[10px] font-bold text-text-muted">Chờ xử lý</span>
              )}
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted text-xs py-16">
            <CheckCircle2 className="w-8 h-8 text-[#FC475C]/40 mb-2" />
            <span>Hàng đợi tải xuống trống</span>
          </div>
        )}
      </div>

      {/* Bottom Clear All Button */}
      {queue.length > 0 && (
        <button
          onClick={handleClearAll}
          className="mt-3 w-full py-2 bg-[#181820] hover:bg-[#22222D] text-text-secondary hover:text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-colors border-none cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa tất cả</span>
        </button>
      )}
    </aside>
  );
};
