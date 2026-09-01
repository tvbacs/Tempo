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
  const [chartSongs, setChartSongs] = useState<UnifiedSong[]>([]);
  const [newReleases, setNewReleases] = useState<UnifiedSong[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
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
  }> = chartSongs.slice(0, 8).map((s) => ({
    id: s.encodeId || s.id,
    title: s.title,
    thumb: s.thumbnail || s.thumbnailM,
    isLiked: false,
    onClick: () => {
      playSong(s, chartSongs);
    },
  }));

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 select-none space-y-7 bg-[#121212]">
      {/* 1. Top Quick-Access Grid (2 rows x 4 columns = 8 cards) */}
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
            <div className="w-8 h-8 rounded-full bg-white text-black shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105 flex-shrink-0">
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
                } else if (chartSongs.length > idx) {
                  playSong(chartSongs[idx], chartSongs);
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
                    if (chartSongs.length > idx) playSong(chartSongs[idx], chartSongs);
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
