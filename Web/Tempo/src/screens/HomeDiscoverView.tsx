import React, { useEffect, useState } from 'react';
import { Play, Heart } from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

interface HomeDiscoverViewProps {
  onSelectPlaylist?: (playlist: any) => void;
  onSelectArtist?: (artist: any) => void;
  onSeeAllChart?: () => void;
}

export const HomeDiscoverView: React.FC<HomeDiscoverViewProps> = ({
  onSelectPlaylist,
  onSelectArtist,
  onSeeAllChart,
}) => {
  const [chartSongs, setChartSongs] = useState<UnifiedSong[]>(() => {
    try {
      const cached = localStorage.getItem('tempo_cached_chart');
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [newReleases, setNewReleases] = useState<UnifiedSong[]>(() => {
    try {
      const cached = localStorage.getItem('tempo_cached_new_releases');
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [playlists, setPlaylists] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('tempo_cached_playlists');
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(() => chartSongs.length === 0);

  const { playSong } = usePlayerStore();
  const { likedSongs } = useLibraryStore();

  useEffect(() => {
    let isMounted = true;
    if (chartSongs.length === 0) setIsLoading(true);

    Promise.all([apiClient.getChart(), apiClient.getHome()])
      .then(([chart, home]) => {
        if (isMounted) {
          if (chart && chart.length > 0) {
            setChartSongs(chart);
            try { localStorage.setItem('tempo_cached_chart', JSON.stringify(chart)); } catch (_) {}
          }
          if (home) {
            if (home.newReleases) {
              setNewReleases(home.newReleases);
              try { localStorage.setItem('tempo_cached_new_releases', JSON.stringify(home.newReleases)); } catch (_) {}
            }
            if (home.featuredPlaylists) {
              setPlaylists(home.featuredPlaylists);
              try { localStorage.setItem('tempo_cached_playlists', JSON.stringify(home.featuredPlaylists)); } catch (_) {}
            }
          }
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

  const verifiedVietnameseArtists = [
    {
      id: 'a1',
      name: 'Sơn Tùng M-TP',
      artistImg: 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/5/9/6/9/59696c9dba7a914d587d886049c10df6.jpg',
      alias: 'son-tung-m-tp',
    },
    {
      id: 'a2',
      name: 'Vũ.',
      artistImg: 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/d/1/7/1/d17181fe947a2c205119a5a774863889.jpg',
      alias: 'vu',
    },
    {
      id: 'a3',
      name: 'tlinh',
      artistImg: 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/1/b/e/7/1be7b0f6f95b88917e86b98f156012b9.jpg',
      alias: 'tlinh',
    },
    {
      id: 'a4',
      name: 'GREY D',
      artistImg: 'https://photo-resize-zmp3.zmdcdn.me/w360_r1x1_jpeg/avatars/6/a/d/4/6ad41e27f0771a45bd43627f60221825.jpg',
      alias: 'grey-d',
    },
    {
      id: 'a5',
      name: 'SOOBIN',
      artistImg: 'https://photo-resize-zmp3.zmdcdn.me/w360_r1x1_jpeg/avatars/a/3/a/b/a3ab763366da3d3df96b55a20177285c.jpg',
      alias: 'soobin',
    },
    {
      id: 'a6',
      name: 'HIEUTHUHAI',
      artistImg: 'https://photo-resize-zmp3.zmdcdn.me/w360_r1x1_jpeg/avatars/c/0/7/4/c0742c35795d4d234bf86cc7258b5077.jpg',
      alias: 'hieuthuhai',
    },
  ];

  const popularArtists = React.useMemo(() => {
    return verifiedVietnameseArtists;
  }, []);

  const fallbackVietnameseSongs: UnifiedSong[] = [
    { id: 'zing_fb_1', rawId: 'fb1', source: 'zing', title: 'Đừng Làm Trái Tim Anh Đau', artistsNames: 'Sơn Tùng M-TP', thumbnail: 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/5/9/6/9/59696c9dba7a914d587d886049c10df6.jpg', duration: 275 },
    { id: 'zing_fb_2', rawId: 'fb2', source: 'zing', title: 'Lạ Lùng', artistsNames: 'Vũ.', thumbnail: 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/d/1/7/1/d17181fe947a2c205119a5a774863889.jpg', duration: 260 },
    { id: 'zing_fb_3', rawId: 'fb3', source: 'zing', title: 'Nếu Lúc Đó', artistsNames: 'tlinh, 2pillz', thumbnail: 'https://photo-resize-zmp3.zmdcdn.me/w600_r1x1_jpeg/avatars/1/b/e/7/1be7b0f6f95b88917e86b98f156012b9.jpg', duration: 234 },
    { id: 'zing_fb_4', rawId: 'fb4', source: 'zing', title: 'Đưa Em Về Nhà', artistsNames: 'GREY D, Chillies', thumbnail: 'https://photo-resize-zmp3.zmdcdn.me/w360_r1x1_jpeg/avatars/6/a/d/4/6ad41e27f0771a45bd43627f60221825.jpg', duration: 242 },
    { id: 'zing_fb_5', rawId: 'fb5', source: 'zing', title: 'Giá Như', artistsNames: 'SOOBIN', thumbnail: 'https://photo-resize-zmp3.zmdcdn.me/w360_r1x1_jpeg/avatars/a/3/a/b/a3ab763366da3d3df96b55a20177285c.jpg', duration: 230 },
    { id: 'zing_fb_6', rawId: 'fb6', source: 'zing', title: 'Không Thể Say', artistsNames: 'HIEUTHUHAI', thumbnail: 'https://photo-resize-zmp3.zmdcdn.me/w360_r1x1_jpeg/avatars/c/0/7/4/c0742c35795d4d234bf86cc7258b5077.jpg', duration: 222 },
  ];

  const displayChart = chartSongs.length > 0 ? chartSongs : (isLoading ? [] : fallbackVietnameseSongs);
  const displayNewReleases = newReleases.length > 0 ? newReleases : (isLoading ? [] : fallbackVietnameseSongs);

  if (isLoading && chartSongs.length === 0) {
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
  }> = displayChart.slice(0, 8).map((s) => ({
    id: s.encodeId || s.id,
    title: s.title,
    thumb: s.thumbnail || s.thumbnailM,
    isLiked: false,
    onClick: () => {
      playSong(s, displayChart);
    },
  }));

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 select-none space-y-7 bg-[#121212]">
      {/* 1. Top Quick-Access Grid (2 rows x 4 columns = 8 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {isLoading && quickItems.length === 0
          ? [...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center bg-[#242424] rounded-md overflow-hidden animate-pulse h-12">
                <div className="w-12 h-12 bg-white/10 flex-shrink-0" />
                <div className="h-3.5 bg-white/10 rounded w-24 ml-3" />
              </div>
            ))
          : quickItems.slice(0, 8).map((item) => (
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
                <div className="w-8 h-8 rounded-full bg-white text-black shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 flex-shrink-0">
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </div>
              </div>
            ))}
      </div>

      {/* 3. Section: Được đề xuất cho hôm nay */}
      {(displayChart.length > 0 || isLoading) && (
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
            {isLoading && displayChart.length === 0
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#181818] p-3 rounded-md animate-pulse flex flex-col space-y-3">
                    <div className="aspect-square w-full rounded-md bg-white/10" />
                    <div className="h-3.5 bg-white/10 rounded w-3/4" />
                    <div className="h-2.5 bg-white/5 rounded w-1/2" />
                  </div>
                ))
              : displayChart.slice(0, 6).map((song) => (
                  <div
                    key={song.encodeId || song.id}
                    onClick={() => playSong(song, displayChart)}
                    className="bg-[#181818] hover:bg-[#282828] p-3 rounded-md cursor-pointer transition-colors group flex flex-col"
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3 bg-[#242424]">
                      <img
                        src={song.thumbnailM || song.thumbnail}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
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

      {/* 4. Section: Nghệ sĩ phổ biến */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-xl font-bold text-white">Nghệ sĩ phổ biến</h2>
          <button className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline border-none bg-transparent cursor-pointer">
            Hiện tất cả
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularArtists.map((artist, idx) => (
            <div
              key={artist.id || artist.name}
              onClick={() => {
                if (onSelectArtist) {
                  onSelectArtist({ name: artist.name, thumbnail: artist.artistImg, alias: artist.alias || artist.name.toLowerCase() });
                } else if (displayChart.length > idx) {
                  playSong(displayChart[idx], displayChart);
                }
              }}
              className="bg-[#181818] hover:bg-[#242424] p-3.5 rounded-lg flex flex-col items-center text-center cursor-pointer transition-all group border-none relative"
            >
              {/* Circular Avatar */}
              <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3 shadow-lg bg-[#282828]">
                <img
                  src={artist.artistImg}
                  alt={artist.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (displayChart.length > idx) playSong(displayChart[idx], displayChart);
                  }}
                  className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white text-black shadow-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                </div>
              </div>

              {/* Artist Name & Tag */}
              <h4 className="text-xs font-bold text-white truncate w-full group-hover:underline">
                {artist.name}
              </h4>
              <span className="text-[11px] text-[#b3b3b3] mt-0.5">Nghệ sĩ</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Section: Nhạc Mới Phát Hành */}
      {(displayNewReleases.length > 0 || isLoading) && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xl font-bold text-white">Nhạc Mới Phát Hành</h2>
            <button className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline border-none bg-transparent cursor-pointer">
              Hiện tất cả
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {isLoading && displayNewReleases.length === 0
              ? [...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#181818] p-3 rounded-md animate-pulse flex flex-col space-y-3">
                    <div className="aspect-square w-full rounded-md bg-white/10" />
                    <div className="h-3.5 bg-white/10 rounded w-3/4" />
                    <div className="h-2.5 bg-white/5 rounded w-1/2" />
                  </div>
                ))
              : displayNewReleases.slice(0, 6).map((song) => (
                  <div
                    key={song.encodeId || song.id}
                    onClick={() => playSong(song, displayNewReleases)}
                    className="bg-[#181818] hover:bg-[#282828] p-3 rounded-md cursor-pointer transition-colors group flex flex-col"
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3 bg-[#242424]">
                      <img
                        src={song.thumbnailM || song.thumbnail}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
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
                  <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
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
