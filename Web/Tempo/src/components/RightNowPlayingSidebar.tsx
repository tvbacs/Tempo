import React, { useState, useEffect } from 'react';
import { CheckCircle2, Heart, MoreHorizontal, Download } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { apiClient } from '../api/client';
import { Artist, UnifiedSong } from '../types/music';

export const RightNowPlayingSidebar: React.FC = () => {
  const { currentSong, queue, shuffledQueue, currentIndex, repeatMode, isShuffle, playSong } = usePlayerStore();
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

  let nextSong: UnifiedSong | null = null;
  let nextLabel = 'Tiếp theo trong danh sách';

  if (repeatMode === 'one') {
    nextSong = currentSong;
    nextLabel = 'Tiếp theo (Lặp lại 1 bài)';
  } else if (isShuffle) {
    nextLabel = 'Tiếp theo (Trộn ngẫu nhiên)';
    const activeQueue = shuffledQueue && shuffledQueue.length > 0 ? shuffledQueue : queue;
    const curIdx = activeQueue.findIndex(
      (s) => (s.encodeId || s.id) === (currentSong?.encodeId || currentSong?.id)
    );
    if (curIdx >= 0 && curIdx + 1 < activeQueue.length) {
      nextSong = activeQueue[curIdx + 1];
    } else if (repeatMode === 'all' && activeQueue.length > 0) {
      nextSong = activeQueue[0];
    }
  } else if (currentIndex >= 0 && currentIndex + 1 < queue.length) {
    nextSong = queue[currentIndex + 1];
  } else if (repeatMode === 'all' && queue.length > 0) {
    nextSong = queue[0];
    nextLabel = 'Tiếp theo (Lặp lại danh sách)';
  }

  // If no song is playing, show the Spotify Windows App promo card matching Screenshot 1
  if (!currentSong) {
    return (
      <aside className="w-80 bg-[#121212] rounded-lg p-5 flex flex-col justify-between select-none flex-shrink-0 border-none">
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-video rounded-md bg-[#181818] overflow-hidden flex items-center justify-center p-4">
            <img
              src="/logo.png"
              alt="Tempo App Preview"
              className="w-16 h-16 object-contain drop-shadow"
            />
          </div>
          <div>
            <h3 className="text-lg font-black text-white leading-snug">
              Tải Tempo xuống cho Windows & Điện thoại
            </h3>
            <p className="text-xs text-[#b3b3b3] mt-2 leading-relaxed">
              Tận hưởng âm thanh chất lượng cao, trải nghiệm nghe nhạc ngoại tuyến không cần kết nối mạng và bảng tin bạn bè sống động.
            </p>
          </div>
        </div>

        <button
          onClick={() => {}}
          className="w-full py-3 rounded-full bg-white hover:scale-105 active:scale-95 text-black font-bold text-sm transition-all border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg"
        >
          <Download className="w-4 h-4 text-black" />
          <span>Tải ứng dụng miễn phí</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-[#121212] rounded-lg p-4 flex flex-col select-none flex-shrink-0 border-none overflow-y-auto custom-scrollbar">
      {/* 1. Header: Context Title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white truncate max-w-[220px]">
          {currentSong.album?.title || 'Bài hát đang phát'}
        </h3>
        <button className="text-[#b3b3b3] hover:text-white p-1 border-none bg-transparent cursor-pointer">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Large Track Artwork */}
      <div className="w-full aspect-square rounded-md overflow-hidden bg-[#181818] mb-3.5 relative group shadow-2xl">
        <img
          src={
            currentSong.thumbnailM ||
            currentSong.thumbnail ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'
          }
          alt={currentSong.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* 3. Title & Artist with Heart */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-white leading-tight truncate hover:underline cursor-pointer">
            {currentSong.title}
          </h2>
          <p className="text-xs font-medium text-[#b3b3b3] truncate mt-1 hover:underline hover:text-white cursor-pointer">
            {currentSong.artistsNames}
          </p>
        </div>

        <button
          onClick={() => toggleLike(currentSong)}
          className="p-1 border-none bg-transparent cursor-pointer flex-shrink-0 transition-transform hover:scale-110"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              liked ? 'fill-[#FC475C] text-[#FC475C]' : 'text-[#b3b3b3] hover:text-white'
            }`}
          />
        </button>
      </div>

      {/* 4. "Giới thiệu về nghệ sĩ" Section matching Screenshot 2 */}
      <div className="bg-[#242424] rounded-lg overflow-hidden mb-3 relative group">
        <div className="w-full h-44 relative bg-[#181818]">
          <img
            src={
              artistDetail?.thumbnail ||
              currentSong.thumbnailM ||
              currentSong.thumbnail ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'
            }
            alt={artistName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#242424] via-transparent to-black/30 p-3 flex flex-col justify-between">
            <span className="text-xs font-bold text-white shadow-sm">Giới thiệu về nghệ sĩ</span>
            <div>
              <h4 className="text-sm font-black text-white">{artistName}</h4>
              <span className="text-[11px] text-[#b3b3b3]">
                {artistDetail?.totalFollow ? `${(artistDetail.totalFollow / 1000).toFixed(0)}k người nghe hàng tháng` : 'Nghệ sĩ nổi bật'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 pt-2 flex items-center justify-between">
          <p className="text-xs text-[#b3b3b3] line-clamp-2 leading-relaxed flex-1 pr-2">
            Theo dõi {artistName} để nhận thông báo khi có bài hát mới phát hành.
          </p>
          <button
            onClick={() => {
              toggleFollowArtist({
                id: artistDetail?.id || artistName,
                name: artistName,
                alias: artistDetail?.alias || artistName,
                thumbnail: artistDetail?.thumbnail || currentSong.thumbnail,
              });
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer flex-shrink-0 ${
              isFollowed
                ? 'bg-transparent border-white/20 text-[#b3b3b3] hover:border-white hover:text-white'
                : 'bg-transparent border-white/30 text-white hover:border-white hover:scale-105'
            }`}
          >
            {isFollowed ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
        </div>
      </div>

      {/* 5. Next in Queue Card */}
      {nextSong && (
        <div
          onClick={() => playSong(nextSong, queue)}
          title={`Phát tiếp theo: ${nextSong.title}`}
          className="bg-[#242424] hover:bg-[#2e2e2e] rounded-lg p-3 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors">
              {nextLabel}
            </h4>
            <span className="text-[10px] font-bold text-[#b3b3b3]">Hàng đợi</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-md overflow-hidden bg-[#181818] flex-shrink-0">
              <img
                src={nextSong.thumbnail}
                alt={nextSong.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-bold text-white truncate group-hover:underline">
                {nextSong.title}
              </h5>
              <p className="text-[11px] text-[#b3b3b3] truncate">{nextSong.artistsNames}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
