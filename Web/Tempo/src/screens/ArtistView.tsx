import React, { useEffect, useState } from 'react';
import { BadgeCheck, Play, Pause, Shuffle, Check, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { Artist, UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { TrackTable } from '../components/TrackTable';

interface ArtistViewProps {
  artist: Artist | any;
  onBack?: () => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artist, onBack }) => {
  const [artistData, setArtistData] = useState<Artist>(artist);
  const [topSongs, setTopSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { currentSong, isPlaying, isLoading: isPlayerLoading, playSong, togglePlayPause, isShuffle, toggleShuffle } = usePlayerStore();
  const { isArtistFollowed, toggleFollowArtist } = useLibraryStore();

  const currentArtistObj: Artist = {
    id: artistData.id || artist.id || artistData.alias || artist.alias || artistData.name || artist.name,
    name: artistData.name || artist.name,
    alias: artistData.alias || artist.alias || (artistData as any).link || artist.name,
    thumbnail: artistData.thumbnail || artist.thumbnail || artistData.cover || '',
    totalFollow: artistData.totalFollow || artist.totalFollow || 0,
  };

  const isFollowing =
    isArtistFollowed(currentArtistObj.id) ||
    isArtistFollowed(currentArtistObj.name) ||
    isArtistFollowed(currentArtistObj.alias);

  const isCurrentListPlaying =
    isPlaying &&
    Boolean(
      currentSong &&
        topSongs.some(
          (s) => (s.encodeId || s.id) === (currentSong.encodeId || currentSong.id)
        )
    );

  useEffect(() => {
    setIsLoading(true);
    const alias = artist.alias || artist.link || artist.name?.toLowerCase().replace(/\s+/g, '-');

    apiClient.getArtistInfo(alias).then((data) => {
      if (data) setArtistData(data);
    });

    apiClient.search(artist.name).then((songs) => {
      setTopSongs(songs);
      setIsLoading(false);
    });
  }, [artist]);

  const handlePlayClick = () => {
    if (topSongs.length === 0) return;
    if (isCurrentListPlaying) {
      togglePlayPause();
    } else {
      playSong(topSongs[0], topSongs);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none bg-[#121212]">
      {/* Artist Hero Header */}
      <div className="relative h-72 bg-[#242424] overflow-hidden flex flex-col justify-end p-8 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors border-none cursor-pointer z-20 flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        )}
        {artistData.cover || artistData.thumbnail ? (
          <img
            src={artistData.cover || artistData.thumbnail}
            alt={artistData.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-black/20" />

        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-2">
            <BadgeCheck className="w-4 h-4 text-[#3B82F6] fill-[#3B82F6] text-black" />
            <span>Nghệ sĩ đã xác minh</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tight mb-3">
            {artistData.name}
          </h1>
          <p className="text-xs font-semibold text-white/90">
            {artistData.totalFollow
              ? `${artistData.totalFollow.toLocaleString('vi-VN')} người theo dõi`
              : 'Hơn 1.000.000 người nghe hàng tháng'}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="px-8 py-5 flex items-center gap-6 bg-[#121212]/90 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={handlePlayClick}
          disabled={topSongs.length === 0 || isLoading}
          className="w-14 h-14 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-all disabled:opacity-50 border-none cursor-pointer"
        >
          {isCurrentListPlaying && isPlayerLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-black" />
          ) : isCurrentListPlaying ? (
            <Pause className="w-6 h-6 fill-black text-black" />
          ) : (
            <Play className="w-6 h-6 fill-black text-black ml-0.5" />
          )}
        </button>

        <button
          onClick={toggleShuffle}
          title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
          className={`transition-colors border-none bg-transparent cursor-pointer p-1 ${
            isShuffle ? 'text-white font-bold scale-110' : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Shuffle className="w-6 h-6" />
        </button>

        <button
          onClick={() => toggleFollowArtist(currentArtistObj)}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer bg-transparent ${
            isFollowing
              ? 'border border-white/20 text-[#b3b3b3] hover:border-white hover:text-white'
              : 'border border-white/40 text-white hover:border-white hover:scale-105'
          }`}
        >
          {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </div>

      {/* Top Songs Table */}
      <div className="px-8 pb-12">
        <h3 className="text-xl font-bold text-white mb-4">Bài hát nổi bật</h3>
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-md bg-white/[0.02] animate-pulse">
                <div className="w-4 h-4 bg-white/10 rounded" />
                <div className="w-10 h-10 bg-white/10 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/10 rounded w-1/3" />
                  <div className="h-2.5 bg-white/5 rounded w-1/5" />
                </div>
                <div className="w-10 h-3 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <TrackTable songs={topSongs} />
        )}
      </div>
    </div>
  );
};
