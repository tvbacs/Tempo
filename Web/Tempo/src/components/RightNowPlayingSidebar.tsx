import React, { useState, useEffect } from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { apiClient } from '../api/client';
import { Artist } from '../types/music';

export const RightNowPlayingSidebar: React.FC = () => {
  const { currentSong, queue, currentIndex } = usePlayerStore();
  const { isLiked, toggleLike, isArtistFollowed, toggleFollowArtist } = useLibraryStore();
  const [artistDetail, setArtistDetail] = useState<Artist | null>(null);

  const artistName = currentSong?.artistsNames || 'Nghệ sĩ';
  const isFollowed = isArtistFollowed(artistName);
  const liked = currentSong ? isLiked(currentSong.encodeId || currentSong.id) : false;

  // Fetch artist detail when song changes
  useEffect(() => {
    if (!currentSong) return;
    const alias = currentSong.artistsNames?.split(',')[0]?.trim() || '';
    if (alias) {
      apiClient.getArtistInfo(alias).then((data: Artist | null) => {
        if (data) setArtistDetail(data);
      }).catch(() => {});
    }
  }, [currentSong?.encodeId, currentSong?.id, currentSong?.artistsNames]);

  const nextSong = currentIndex >= 0 && currentIndex + 1 < queue.length ? queue[currentIndex + 1] : null;

  return (
    <aside className="w-80 bg-[#121217] rounded-lg p-4 flex flex-col select-none flex-shrink-0 border-none overflow-y-auto custom-scrollbar">
      {/* Top Header: Playlist / Track Context Title */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-xs font-black text-white truncate max-w-[200px]">
          {currentSong?.album?.title || (currentSong ? `${currentSong.title} Radio` : 'Đang phát')}
        </h3>
        <button className="text-text-muted hover:text-white p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Large Track Artwork */}
      <div className="w-full aspect-square rounded-md overflow-hidden bg-[#181820] mb-3.5 relative group shadow-lg">
        <img
          src={
            currentSong?.thumbnailM ||
            currentSong?.thumbnail ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'
          }
          alt={currentSong?.title || 'Cover'}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
        />
      </div>

      {/* Track Title & Artist Names with Heart button */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-white leading-tight truncate">
            {currentSong?.title || 'Chưa chọn bài hát'}
          </h2>
          <p className="text-xs font-medium text-text-secondary truncate mt-1">
            {currentSong?.artistsNames || 'Tempo Music'}
          </p>
        </div>

        {currentSong && (
          <button
            onClick={() => toggleLike(currentSong)}
            className="p-1 text-text-muted hover:text-white transition-transform hover:scale-110 flex-shrink-0 mt-0.5"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-[#FC475C] text-[#FC475C]' : ''}`} />
          </button>
        )}
      </div>

      {/* Credits Section: "Người tham gia thực hiện" (Matching Spotify Reference) */}
      <div className="bg-[#181820] rounded-md p-3.5 mb-3.5 border-none">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-extrabold text-white">Người tham gia thực hiện</h4>
          <span className="text-[10px] font-bold text-text-muted hover:text-white cursor-pointer">
            Hiện tất cả
          </span>
        </div>

        {/* Main Artist Row with Follow Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-white truncate">{artistName}</h5>
            <span className="text-[10px] font-medium text-text-muted">Nghệ Sĩ Chính</span>
          </div>

          <button
            onClick={() => {
              if (currentSong) {
                toggleFollowArtist({
                  id: artistDetail?.id || artistName,
                  name: artistName,
                  alias: artistDetail?.alias || artistName,
                  thumbnail: artistDetail?.thumbnail || currentSong.thumbnail,
                });
              }
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border cursor-pointer ${
              isFollowed
                ? 'bg-transparent border-white/20 text-text-secondary hover:border-white hover:text-white'
                : 'bg-transparent border-white/30 text-white hover:border-white hover:scale-105'
            }`}
          >
            {isFollowed ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
        </div>

        {/* Composer / Producer Row */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          <div className="min-w-0">
            <h6 className="text-[11px] font-semibold text-white truncate">
              {artistDetail?.name || currentSong?.artistsNames || 'Đang cập nhật'}
            </h6>
            <span className="text-[10px] text-text-muted">Người Soạn Nhạc & Lời</span>
          </div>

          <div className="min-w-0">
            <h6 className="text-[11px] font-semibold text-white truncate">Tempo Studio Atmos</h6>
            <span className="text-[10px] text-text-muted">Nhà Sản Xuất & Master 320kbps</span>
          </div>
        </div>
      </div>

      {/* Next in Queue Section (Nếu có bài tiếp theo) */}
      {nextSong && (
        <div className="bg-[#181820] rounded-md p-3.5 border-none">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-extrabold text-white">Tiếp theo trong danh sách</h4>
            <span className="text-[10px] font-bold text-text-muted">Hàng đợi</span>
          </div>

          <div className="flex items-center gap-2.5">
            <img
              src={nextSong.thumbnail}
              alt={nextSong.title}
              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold text-white truncate">{nextSong.title}</h5>
              <p className="text-[10px] text-text-muted truncate">{nextSong.artistsNames}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
