import React, { useEffect, useState } from 'react';
import { BadgeCheck, Play, Shuffle, Check, UserPlus } from 'lucide-react';
import { Artist, UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { TrackTable } from '../components/TrackTable';

interface ArtistViewProps {
  artist: Artist | any;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artist }) => {
  const [artistData, setArtistData] = useState<Artist>(artist);
  const [topSongs, setTopSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { playSong } = usePlayerStore();
  const { isArtistFollowed, toggleFollowArtist } = useLibraryStore();

  const isFollowing = isArtistFollowed(artist.alias || artist.id || artist.name);

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

  const handlePlayAll = (shuffle: boolean = false) => {
    if (topSongs.length === 0) return;
    const list = shuffle ? [...topSongs].sort(() => Math.random() - 0.5) : topSongs;
    playSong(list[0], list);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar select-none">
      {/* Artist Hero Header */}
      <div className="relative h-72 bg-[#282828] overflow-hidden flex flex-col justify-end p-8 flex-shrink-0">
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
            <BadgeCheck className="w-4 h-4 text-primary fill-primary text-black" />
            <span>Nghệ sĩ đã xác minh</span>
          </div>
          <h1 className="text-6xl font-black text-white tracking-tight mb-3">
            {artistData.name}
          </h1>
          <p className="text-xs font-semibold text-white/80">
            {artistData.totalFollow
              ? `${artistData.totalFollow.toLocaleString('vi-VN')} người theo dõi`
              : 'Hơn 1.000.000 người nghe hàng tháng'}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="px-8 py-6 flex items-center gap-6 bg-[#121212]/80 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => handlePlayAll(false)}
          disabled={topSongs.length === 0}
          className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-all disabled:opacity-50"
        >
          <Play className="w-6 h-6 fill-black text-black ml-0.5" />
        </button>

        <button
          onClick={() => handlePlayAll(true)}
          title="Trộn bài"
          className="text-text-secondary hover:text-white transition-colors"
        >
          <Shuffle className="w-6 h-6" />
        </button>

        <button
          onClick={() => toggleFollowArtist(artistData)}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
            isFollowing
              ? 'border border-white/40 text-white hover:border-white'
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
          <div className="py-16 text-center text-text-secondary text-sm">Đang tải bài hát...</div>
        ) : (
          <TrackTable songs={topSongs} />
        )}
      </div>
    </div>
  );
};
