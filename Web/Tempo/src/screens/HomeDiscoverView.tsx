import React, { useEffect, useState } from 'react';
import { Play, Heart } from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

interface HomeDiscoverViewProps {
  onSelectPlaylist?: (playlist: any) => void;
  onSeeAllChart?: () => void;
}

export const HomeDiscoverView: React.FC<HomeDiscoverViewProps> = ({ onSelectPlaylist, onSeeAllChart }) => {
  const [chartSongs, setChartSongs] = useState<UnifiedSong[]>([]);
  const [newReleases, setNewReleases] = useState<UnifiedSong[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'music' | 'podcasts'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const { playSong } = usePlayerStore();
  const { likedSongs } = useLibraryStore();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([apiClient.getChart(), apiClient.getHome()])
      .then(([chart, home]) => {
        if (isMounted) {
          setChartSongs(chart || []);
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

  // Radio cards list matching user's Spotify screenshot
  const radioCards = [
    {
      id: 'r1',
      name: 'Dangrangto',
      tag: 'RADIO',
      bgColor: '#8490a7',
      artistImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    },
    {
      id: 'r2',
      name: 'buitruonglinh',
      tag: 'RADIO',
      bgColor: '#6ec6b4',
      artistImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    },
    {
      id: 'r3',
      name: 'tlinh',
      tag: 'RADIO',
      bgColor: '#9d92b8',
      artistImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    },
    {
      id: 'r4',
      name: 'Vũ.',
      tag: 'RADIO',
      bgColor: '#e39768',
      artistImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    },
    {
      id: 'r5',
      name: 'Obito',
      tag: 'RADIO',
      bgColor: '#9580a6',
      artistImg: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#b3b3b3] text-sm">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  // Quick 8 Items for the Top Grid
  const quickItems: Array<{
    id: string;
    title: string;
    thumb?: string;
    isLiked?: boolean;
    onClick: () => void;
  }> = [
    {
      id: 'liked',
      title: 'Bài hát đã thích',
      thumb: 'liked_icon',
      isLiked: true,
      onClick: () => {
        if (likedSongs.length > 0) playSong(likedSongs[0], likedSongs);
      },
    },
    ...chartSongs.slice(0, 7).map((s) => ({
      id: s.encodeId || s.id,
      title: s.title,
      thumb: s.thumbnail || s.thumbnailM,
      isLiked: false,
      onClick: () => {
        playSong(s, chartSongs);
      },
    })),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 select-none space-y-7 bg-[#121212]">
      {/* 1. Filter Chips: Tất cả, Âm nhạc, Podcasts */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all border-none cursor-pointer ${
            filterTab === 'all'
              ? 'bg-white text-black font-bold'
              : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setFilterTab('music')}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all border-none cursor-pointer ${
            filterTab === 'music'
              ? 'bg-white text-black font-bold'
              : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Âm nhạc
        </button>
        <button
          onClick={() => setFilterTab('podcasts')}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all border-none cursor-pointer ${
            filterTab === 'podcasts'
              ? 'bg-white text-black font-bold'
              : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Podcasts
        </button>
      </div>

      {/* 2. Top Quick-Access Grid (2 rows x 4 columns = 8 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {quickItems.slice(0, 8).map((item) => (
          <div
            key={item.id}
            onClick={item.onClick}
            className="group flex items-center bg-[#242424] hover:bg-[#2f2f2f] rounded-md overflow-hidden cursor-pointer transition-colors pr-3 relative"
          >
            {item.isLiked ? (
              <div className="w-12 h-12 bg-gradient-to-br from-[#491f8f] via-[#5b22b6] to-[#1e3264] flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
            ) : (
              <img
                src={item.thumb}
                alt={item.title}
                className="w-12 h-12 object-cover flex-shrink-0 bg-[#282828]"
              />
            )}
            <span className="text-xs font-bold text-white truncate ml-3 flex-1">
              {item.title}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#1ed760] text-black shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 flex-shrink-0">
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Section: Được đề xuất cho hôm nay */}
      {chartSongs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <span className="text-xs text-[#b3b3b3] block mb-0.5">
                Lấy cảm hứng từ hoạt động gần đây của bạn
              </span>
              <h2 className="text-xl font-bold text-white">Được đề xuất cho hôm nay</h2>
            </div>
            <button
              onClick={onSeeAllChart}
              className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline border-none bg-transparent cursor-pointer"
            >
              Hiện tất cả
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {chartSongs.slice(0, 6).map((song) => (
              <div
                key={song.encodeId || song.id}
                onClick={() => playSong(song, chartSongs)}
                className="bg-[#181818] hover:bg-[#282828] p-3 rounded-md cursor-pointer transition-colors group flex flex-col"
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3 bg-[#242424]">
                  <img
                    src={song.thumbnailM || song.thumbnail}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                <p className="text-xs text-[#b3b3b3] truncate mt-1">
                  {song.artistsNames || 'Tempo Artist'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Section: Radio Phổ Biến (Matching Screenshot 1 Pastel Cards) */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xl font-bold text-white">Radio phổ biến</h2>
          <button className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline border-none bg-transparent cursor-pointer">
            Hiện tất cả
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {radioCards.map((r, idx) => (
            <div
              key={r.id}
              onClick={() => {
                if (chartSongs.length > idx) playSong(chartSongs[idx], chartSongs);
              }}
              className="rounded-md p-3.5 cursor-pointer transition-transform hover:scale-[1.02] relative overflow-hidden flex flex-col justify-between aspect-square group shadow-lg"
              style={{ backgroundColor: r.bgColor }}
            >
              {/* Header Label: Logo + RADIO */}
              <div className="flex items-center justify-between text-black/80">
                <span className="text-[10px] font-black tracking-widest">{r.tag}</span>
                <div className="w-2.5 h-2.5 rounded-full bg-black/40" />
              </div>

              {/* Artist Circular Thumbnail */}
              <div className="self-center w-24 h-24 rounded-full overflow-hidden shadow-2xl bg-black/20 my-auto">
                <img
                  src={r.artistImg}
                  alt={r.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Artist Name at Bottom */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-black truncate tracking-tight">
                  {r.name}
                </h3>
                <div className="w-8 h-8 rounded-full bg-[#1ed760] text-black shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105">
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Section: Nhạc Mới Phát Hành */}
      {newReleases.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xl font-bold text-white">Nhạc Mới Phát Hành</h2>
            <button className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline border-none bg-transparent cursor-pointer">
              Hiện tất cả
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {newReleases.slice(0, 6).map((song) => (
              <div
                key={song.encodeId || song.id}
                onClick={() => playSong(song, newReleases)}
                className="bg-[#181818] hover:bg-[#282828] p-3 rounded-md cursor-pointer transition-colors group flex flex-col"
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3 bg-[#242424]">
                  <img
                    src={song.thumbnailM || song.thumbnail}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{song.title}</h4>
                <p className="text-xs text-[#b3b3b3] truncate mt-1">
                  {song.artistsNames || 'Tempo Artist'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Section: Tuyển Tập & Playlist */}
      {playlists.length > 0 && (
        <section className="pb-10">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xl font-bold text-white">Gợi ý Tuyển tập</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.flatMap((sec) => sec.items || []).slice(0, 5).map((p: any) => (
              <div
                key={p.encodeId || p.id}
                onClick={() => onSelectPlaylist && onSelectPlaylist(p)}
                className="bg-[#181818] hover:bg-[#282828] p-3.5 rounded-md cursor-pointer transition-colors group"
              >
                <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3 bg-[#242424]">
                  <img
                    src={p.thumbnailM || p.thumbnail}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{p.title}</h4>
                <p className="text-xs text-[#b3b3b3] truncate mt-1">
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
