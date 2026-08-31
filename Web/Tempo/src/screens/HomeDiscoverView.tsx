import React, { useEffect, useState } from 'react';
import { Play, TrendingUp, Sparkles, Disc } from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { SongCard } from '../components/SongCard';

interface HomeDiscoverViewProps {
  onSelectPlaylist?: (playlist: any) => void;
  onSeeAllChart?: () => void;
}

export const HomeDiscoverView: React.FC<HomeDiscoverViewProps> = ({ onSelectPlaylist, onSeeAllChart }) => {
  const [chartSongs, setChartSongs] = useState<UnifiedSong[]>([]);
  const [newReleases, setNewReleases] = useState<UnifiedSong[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { playSong } = usePlayerStore();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([apiClient.getChart(), apiClient.getHome()])
      .then(([chart, home]) => {
        if (isMounted) {
          setChartSongs(chart);
          setNewReleases(home.newReleases || []);
          setPlaylists(home.featuredPlaylists || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
        Đang tải dữ liệu âm nhạc...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8 select-none space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#2A1B28] via-[#1F1626] to-[#121212] rounded-xl p-8 relative overflow-hidden flex flex-col justify-center">
        <span className="text-xs font-extrabold text-primary tracking-widest uppercase mb-2">
          XU HƯỚNG ÂM NHẠC
        </span>
        <h1 className="text-3xl font-black text-white mb-2">Khám Phá Hôm Nay</h1>
        <p className="text-sm text-text-secondary max-w-lg mb-6 leading-relaxed">
          Nghe nhạc trực tiếp chất lượng cao trên máy tính và tự động đồng bộ thời gian thực với điện thoại của bạn
        </p>
        {chartSongs.length > 0 && (
          <button
            onClick={() => playSong(chartSongs[0], chartSongs)}
            className="self-start flex items-center gap-2 bg-gradient-to-r from-[#FC475C] to-[#FC655A] text-white px-6 py-3 rounded-full text-xs font-extrabold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Phát nhạc ngay</span>
          </button>
        )}
      </div>

      {/* ZingChart Top 6 Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white">Bảng Xếp Hạng Thịnh Hành</h2>
          </div>
          {onSeeAllChart && (
            <button
              onClick={onSeeAllChart}
              className="text-xs font-bold text-primary hover:underline"
            >
              Xem tất cả
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {chartSongs.slice(0, 6).map((song, idx) => (
            <SongCard
              key={song.encodeId || song.id}
              song={song}
              index={idx}
              onPlay={() => playSong(song, chartSongs)}
            />
          ))}
        </div>
      </section>

      {/* New Releases Section */}
      {newReleases.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white">Nhạc Mới Phát Hành</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {newReleases.slice(0, 6).map((song, idx) => (
              <SongCard
                key={song.encodeId || song.id}
                song={song}
                onPlay={() => playSong(song, newReleases)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Playlists Carousel */}
      {playlists.length > 0 && (
        <section className="pb-8">
          <div className="flex items-center gap-2 mb-4">
            <Disc className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white">Gợi Ý Tuyển Tập & Playlist</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.flatMap((sec) => sec.items || []).slice(0, 5).map((p: any) => (
              <div
                key={p.encodeId || p.id}
                onClick={() => onSelectPlaylist && onSelectPlaylist(p)}
                className="bg-[#181818] hover:bg-[#242424] p-3.5 rounded-lg cursor-pointer transition-all hover:-translate-y-1 group"
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3 bg-[#111117]">
                  <img
                    src={p.thumbnailM || p.thumbnail}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{p.title}</h4>
                <p className="text-xs text-text-secondary truncate mt-1">
                  {p.sortDescription || 'Tuyển tập đặc sắc'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
