import React, { useEffect, useState, useMemo } from 'react';
import {
  Play,
  Heart,
  Flame,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Download,
} from 'lucide-react';
import { UnifiedSong } from '../types/music';
import { apiClient } from '../api/client';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';

interface HomeDiscoverViewProps {
  onSelectPlaylist?: (playlist: any) => void;
  onSelectArtist?: (artist: any) => void;
  onSeeAllChart?: () => void;
  onSelectTab?: (tab: string) => void;
}

const deduplicateSongList = (songs: UnifiedSong[]): UnifiedSong[] => {
  const seen = new Set<string>();
  return songs.filter((s) => {
    if (!s) return false;
    const key = (s.encodeId || s.id || s.title || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const makeUsUkFallback = (id: string, title: string, artist: string, thumb: string, dur: number): UnifiedSong => ({
  id,
  rawId: id,
  source: 'youtube' as const,
  title,
  artistsNames: artist,
  thumbnail: thumb,
  duration: dur,
});

const fallbackUsUkSongs: UnifiedSong[] = [
  makeUsUkFallback('us_1', 'Cruel Summer', 'Taylor Swift', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', 178),
  makeUsUkFallback('us_2', 'Blinding Lights', 'The Weeknd', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400', 200),
  makeUsUkFallback('us_3', "we can't be friends", 'Ariana Grande', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400', 228),
  makeUsUkFallback('us_4', 'Die With A Smile', 'Lady Gaga, Bruno Mars', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400', 251),
  makeUsUkFallback('us_5', 'Stay', 'The Kid LAROI, Justin Bieber', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400', 141),
  makeUsUkFallback('us_6', 'Shape of You', 'Ed Sheeran', 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400', 233),
  makeUsUkFallback('us_7', 'Levitating', 'Dua Lipa', 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400', 203),
  makeUsUkFallback('us_8', 'Birds of a Feather', 'Billie Eilish', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400', 198),
];

export const HomeDiscoverView: React.FC<HomeDiscoverViewProps> = ({
  onSelectPlaylist,
  onSelectArtist,
  onSeeAllChart,
  onSelectTab,
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

  const [tiktokSongs, setTiktokSongs] = useState<UnifiedSong[]>([]);
  const [coffeeSongs, setCoffeeSongs] = useState<UnifiedSong[]>([]);
  const [focusSongs, setFocusSongs] = useState<UnifiedSong[]>([]);
  const [driveSongs, setDriveSongs] = useState<UnifiedSong[]>([]);
  const [rainSongs, setRainSongs] = useState<UnifiedSong[]>([]);
  const [usUkSongs, setUsUkSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(() => chartSongs.length === 0);

  const { playSong } = usePlayerStore();
  const { likedSongs, history, downloadedSongs, savedAlbums } = useLibraryStore();

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

    // Tải các mục phụ (TikTok, Acoustic, Focus, Lofi, US-UK) ngầm
    Promise.all([
      apiClient.search('Nhạc Hot TikTok').catch(() => [] as UnifiedSong[]),
      apiClient.search('Cà Phê Sáng Acoustic').catch(() => [] as UnifiedSong[]),
      apiClient.search('Lofi Chill Làm Việc').catch(() => [] as UnifiedSong[]),
      apiClient.search('Lái Xe Thư Giãn Pop Ballad').catch(() => [] as UnifiedSong[]),
      apiClient.search('Nhạc Mưa Piano Sleep').catch(() => [] as UnifiedSong[]),
      apiClient.search('US UK Billboard Hits').catch(() => [] as UnifiedSong[]),
    ]).then(([tiktokRes, coffeeRes, focusRes, driveRes, rainRes, usUkRes]) => {
      if (!isMounted) return;
      if (Array.isArray(tiktokRes) && tiktokRes.length) setTiktokSongs(tiktokRes);
      if (Array.isArray(coffeeRes) && coffeeRes.length) setCoffeeSongs(coffeeRes);
      if (Array.isArray(focusRes) && focusRes.length) setFocusSongs(focusRes);
      if (Array.isArray(driveRes) && driveRes.length) setDriveSongs(driveRes);
      if (Array.isArray(rainRes) && rainRes.length) setRainSongs(rainRes);
      if (Array.isArray(usUkRes) && usUkRes.length) setUsUkSongs(usUkRes);
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Time-Aware Context & Mood Greeting
  const currentHour = new Date().getHours();
  const timeGreeting = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) {
      return { greeting: 'CHÀO BUỔI SÁNG', moodTitle: 'Khởi Đầu Ngày Mới', timeSlot: 'morning' };
    }
    if (currentHour >= 12 && currentHour < 18) {
      return { greeting: 'CHÀO BUỔI CHIỀU', moodTitle: 'Tập Trung Làm Việc', timeSlot: 'afternoon' };
    }
    if (currentHour >= 18 && currentHour < 22) {
      return { greeting: 'CHÀO BUỔI TỐI', moodTitle: 'Thư Giãn Cuối Ngày', timeSlot: 'evening' };
    }
    return { greeting: 'ĐÊM KHUYA', moodTitle: 'Giai Điệu Dễ Ngủ', timeSlot: 'night' };
  }, [currentHour]);

  const allFeaturedPlaylists = useMemo(() => {
    const list: any[] = [];
    (playlists || []).forEach((sec: any) => {
      if (sec.items && Array.isArray(sec.items)) {
        list.push(...sec.items);
      }
    });
    return list;
  }, [playlists]);

  const recentPlayedItem = useMemo(() => {
    if (savedAlbums.length > 0) {
      return { ...savedAlbums[0], badge: 'Album đã lưu' };
    }
    if (allFeaturedPlaylists.length > 0) {
      return { ...allFeaturedPlaylists[0], badge: 'Thịnh hành hôm nay' };
    }
    return null;
  }, [savedAlbums, allFeaturedPlaylists]);

  const suggestedDiscoverItem = useMemo(() => {
    const recentId = recentPlayedItem?.id;
    const candidate = allFeaturedPlaylists.find((item) => item.id !== recentId);
    if (candidate) {
      return { ...candidate, badge: 'Gợi ý khám phá' };
    }
    if (allFeaturedPlaylists.length > 1) {
      return { ...allFeaturedPlaylists[1], badge: 'Gợi ý khám phá' };
    }
    return null;
  }, [recentPlayedItem, allFeaturedPlaylists]);

  // Verified popular Vietnamese artists
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

  // Daily Mixes
  const dailyMixes = useMemo(() => {
    const mix1Songs = deduplicateSongList([
      ...likedSongs,
      ...chartSongs.slice(0, 15),
    ]).slice(0, 25);

    const mix1 = {
      id: 'daily_mix_1',
      title: 'Daily Mix 1 · Ca Sĩ Yêu Thích',
      tag: 'DÀNH CHO BẠN',
      subtitle: 'Sơn Tùng M-TP, Vũ., tlinh, GREY D và hơn thế nữa...',
      gradient: 'from-[#FF5F6D] to-[#A855F7]',
      thumbnail:
        mix1Songs[0]?.thumbnail ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
      songs: mix1Songs,
    };

    let mix2Config = {
      id: 'daily_mix_2',
      title: 'Daily Mix 2 · Khởi Đầu Ngày Mới',
      tag: 'BUỔI SÁNG · ACOUSTIC',
      subtitle: 'Acoustic & Indie tươi tắn cho ngày mới tràn đầy hứng khởi',
      gradient: 'from-[#F59E0B] to-[#F97316]',
      thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80',
      songs: deduplicateSongList([...coffeeSongs, ...chartSongs.slice(0, 15)]),
    };

    if (currentHour >= 11 && currentHour < 17) {
      mix2Config = {
        id: 'daily_mix_2',
        title: 'Daily Mix 2 · Năng Lượng Làm Việc',
        tag: 'BUỔI CHIỀU · FOCUS',
        subtitle: 'Deep Focus & Lofi nhịp nhàng duy trì sự tỉnh táo và hiệu suất',
        gradient: 'from-[#8B5CF6] to-[#3B82F6]',
        thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&q=80',
        songs: deduplicateSongList([...focusSongs, ...chartSongs.slice(5, 20)]),
      };
    } else if (currentHour >= 17 && currentHour < 22) {
      mix2Config = {
        id: 'daily_mix_2',
        title: 'Daily Mix 2 · Thư Giãn Buổi Tối',
        tag: 'BUỔI TỐI · CHILL OUT',
        subtitle: 'Giai điệu Pop, Ballad & R&B nhẹ nhàng giải tỏa căng thẳng cuối ngày',
        gradient: 'from-[#10B981] to-[#0EA5E9]',
        thumbnail: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&q=80',
        songs: deduplicateSongList([...driveSongs, ...chartSongs.slice(10, 25)]),
      };
    } else if (currentHour >= 22 || currentHour < 5) {
      mix2Config = {
        id: 'daily_mix_2',
        title: 'Daily Mix 2 · Giai Điệu Dễ Ngủ',
        tag: 'ĐÊM KHUYA · SLEEP',
        subtitle: 'Nhạc mưa, Piano & Lofi êm dịu vỗ về giấc ngủ ngon',
        gradient: 'from-[#06B6D4] to-[#1E3A8A]',
        thumbnail: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&q=80',
        songs: deduplicateSongList([...rainSongs, ...chartSongs.slice(15, 30)]),
      };
    }

    const mix3Songs = deduplicateSongList([
      ...usUkSongs,
      ...fallbackUsUkSongs,
    ]).slice(0, 25);

    const mix3 = {
      id: 'daily_mix_3',
      title: 'Daily Mix 3 · US-UK Hits',
      tag: 'POP QUỐC TẾ · BILLBOARD',
      subtitle: 'Taylor Swift, The Weeknd, Ariana Grande, Bruno Mars và hơn thế nữa...',
      gradient: 'from-[#6366F1] to-[#A855F7]',
      thumbnail:
        mix3Songs[0]?.thumbnail ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
      songs: mix3Songs,
    };

    const mix4Songs = deduplicateSongList([
      ...tiktokSongs,
      ...newReleases,
      ...chartSongs.slice(5, 25),
    ]).slice(0, 25);

    const mix4 = {
      id: 'daily_mix_4',
      title: 'Daily Mix 4 · Khám Phá Mới',
      tag: 'XU HƯỚNG · THỊNH HÀNH',
      subtitle: 'Giai điệu thịnh hành & bài hát mới nổi bật hôm nay',
      gradient: 'from-[#F59E0B] to-[#EF4444]',
      thumbnail:
        mix4Songs[0]?.thumbnail ||
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
      songs: mix4Songs,
    };

    return [mix1, mix2Config, mix3, mix4];
  }, [likedSongs, chartSongs, coffeeSongs, focusSongs, driveSongs, rainSongs, usUkSongs, tiktokSongs, newReleases, currentHour]);

  // Ambient & Mood Theme Cards
  const activityThemes = useMemo(() => [
    {
      id: 'theme_coffee',
      title: 'Cà phê sáng',
      subtitle: 'Acoustic, Indie & Jazz nhẹ nhàng khởi đầu ngày mới',
      badge: 'ACOUSTIC',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80',
      badgeColor: '#F59E0B',
      songs: coffeeSongs.length > 0 ? coffeeSongs : chartSongs.slice(0, 12),
    },
    {
      id: 'theme_focus',
      title: 'Góc làm việc tập trung',
      subtitle: 'Deep Focus, Lofi Beats & Ambient nâng cao hiệu suất',
      badge: 'DEEP FOCUS',
      image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500&q=80',
      badgeColor: '#8B5CF6',
      songs: focusSongs.length > 0 ? focusSongs : chartSongs.slice(2, 14),
    },
    {
      id: 'theme_drive',
      title: 'Lái xe thư giãn',
      subtitle: 'City Pop, Indie Rock & Night Drive phiêu theo giai điệu',
      badge: 'ROAD TRIP',
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=500&q=80',
      badgeColor: '#EC4899',
      songs: driveSongs.length > 0 ? driveSongs : chartSongs.slice(4, 16),
    },
    {
      id: 'theme_rain',
      title: 'Nhạc mưa chill',
      subtitle: 'Rainy Lofi, Piano & Sleep R&B sâu lắng và êm dịu',
      badge: 'RAINY CHILL',
      image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&q=80',
      badgeColor: '#06B6D4',
      songs: rainSongs.length > 0 ? rainSongs : chartSongs.slice(6, 18),
    },
  ], [coffeeSongs, focusSongs, driveSongs, rainSongs, chartSongs]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '3:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4 sm:p-5 md:p-6 pb-28 select-none space-y-8 bg-[#121212]">
      {/* 1. Header Greeting & Quick Shelf */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
              {timeGreeting.greeting}
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
              {timeGreeting.moodTitle}
            </h1>
          </div>
        </div>

        {/* Quick Shelf: Hero Liked Card + Dual Horizontal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
          {/* Card 1: Hero Liked Songs Card */}
          <div
            onClick={() => onSelectTab ? onSelectTab('liked') : null}
            className="sm:col-span-2 2xl:col-span-1 h-16 sm:h-20 bg-[#1E1E24] hover:bg-[#282830] rounded-xl flex items-center overflow-hidden cursor-pointer transition-all duration-200 group relative shadow-md min-w-0"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#7C3AED] via-[#EC4899] to-[#FC475C] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 fill-white text-white drop-shadow" />
            </div>
            <div className="min-w-0 flex-1 px-3 sm:px-3.5">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                Bài hát đã thích
              </h4>
              <p className="text-[11px] sm:text-xs text-text-secondary truncate mt-0.5">
                {likedSongs.length > 0 ? `${likedSongs.length} bài hát đã lưu` : 'Bộ sưu tập yêu thích'}
              </p>
            </div>
            <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (likedSongs.length > 0) {
                    playSong(likedSongs[0], likedSongs);
                  } else if (onSelectTab) {
                    onSelectTab('liked');
                  }
                }}
                title="Phát ngay"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:scale-110 active:scale-95 text-primary flex items-center justify-center shadow-xl transition-transform border-none cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-primary text-primary ml-0.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Recent / Saved Album / Downloads */}
          <div
            onClick={() => {
              if (recentPlayedItem && onSelectPlaylist) {
                onSelectPlaylist(recentPlayedItem);
              } else if (onSelectTab) {
                onSelectTab('downloads');
              }
            }}
            className="h-16 sm:h-20 bg-[#1E1E24] hover:bg-[#282830] rounded-xl flex items-center overflow-hidden cursor-pointer transition-all duration-200 group relative shadow-md min-w-0"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#282828] flex-shrink-0 overflow-hidden">
              {recentPlayedItem?.thumbnail || (recentPlayedItem as any)?.coverUrl ? (
                <img
                  src={recentPlayedItem?.thumbnail || (recentPlayedItem as any)?.coverUrl}
                  alt={recentPlayedItem?.title || 'Cover'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-[#2A1719] flex items-center justify-center text-primary">
                  <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 px-3 sm:px-3.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-0.5 truncate whitespace-nowrap">
                {recentPlayedItem?.badge || 'Đã tải xuống'}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                {recentPlayedItem?.title || (downloadedSongs.length > 0 ? 'Đã tải xuống' : 'Khám phá bài hát mới')}
              </h4>
              <p className="text-[11px] sm:text-xs text-text-secondary truncate mt-0.5">
                {recentPlayedItem?.artistsNames || (downloadedSongs.length > 0 ? `${downloadedSongs.length} bài hát ngoại tuyến` : 'Nghe chất lượng cao')}
              </p>
            </div>
            <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
              </div>
            </div>
          </div>

          {/* Card 3: Suggested Discover Item */}
          <div
            onClick={() => {
              if (suggestedDiscoverItem && onSelectPlaylist) {
                onSelectPlaylist(suggestedDiscoverItem);
              }
            }}
            className="h-16 sm:h-20 bg-[#1E1E24] hover:bg-[#282830] rounded-xl flex items-center overflow-hidden cursor-pointer transition-all duration-200 group relative shadow-md min-w-0"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#282828] flex-shrink-0 overflow-hidden">
              {suggestedDiscoverItem?.thumbnail ? (
                <img
                  src={suggestedDiscoverItem.thumbnail}
                  alt={suggestedDiscoverItem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-[#1F1A2E] flex items-center justify-center text-[#8B5CF6]">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 px-3 sm:px-3.5">
              <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider block mb-0.5 truncate whitespace-nowrap">
                {suggestedDiscoverItem?.badge || 'Gợi ý khám phá'}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#8B5CF6] transition-colors">
                {suggestedDiscoverItem?.title || 'Tuyển tập đặc sắc'}
              </h4>
              <p className="text-[11px] sm:text-xs text-text-secondary truncate mt-0.5">
                {suggestedDiscoverItem?.artistsNames || 'Âm nhạc dành cho bạn'}
              </p>
            </div>
            <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Tiếp tục nghe (Continue Listening - Asymmetric rounded cards) */}
      {history.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Tiếp tục nghe</span>
            </h2>
            <button
              onClick={() => onSelectTab ? onSelectTab('history') : null}
              className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline border-none bg-transparent cursor-pointer"
            >
              Hiện tất cả
            </button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
            {history.slice(0, 6).map((song) => {
              if (!song) return null;
              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, history)}
                  className="relative h-28 rounded-tl-2xl rounded-tr-md rounded-br-md rounded-bl-md overflow-hidden cursor-pointer group shadow-lg flex flex-col justify-between p-3"
                >
                  <img
                    src={song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
                    alt={song.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                  {/* Top Badge */}
                  <div className="relative z-10 self-start">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white/90 uppercase tracking-wide">
                      Nghe gần đây
                    </span>
                  </div>

                  {/* Bottom Info & Play Button */}
                  <div className="relative z-10 flex items-end justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate drop-shadow">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-white/80 truncate drop-shadow">
                        {song.artistsNames}
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                      <Play className="w-3 h-3 fill-black text-black ml-0.5" />
                    </div>
                  </div>

                  {/* Mini Red Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 z-20">
                    <div className="h-full bg-primary w-2/3" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Section: Dành riêng cho bạn (4 Tuyển tập Daily Mixes) */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-lg sm:text-xl font-bold text-white">Dành riêng cho bạn</h2>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 sm:gap-4">
          {dailyMixes.map((mix) => (
            <div
              key={mix.id}
              onClick={() => {
                if (onSelectPlaylist) {
                  onSelectPlaylist({
                    id: mix.id,
                    title: mix.title,
                    thumbnail: mix.thumbnail,
                    songs: mix.songs,
                    artistsNames: mix.subtitle,
                  });
                } else if (mix.songs.length > 0) {
                  playSong(mix.songs[0], mix.songs);
                }
              }}
              className="bg-[#18181F] hover:bg-[#22222D] p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 group flex flex-col justify-between border-none relative overflow-hidden shadow-lg hover:-translate-y-1"
            >
              {/* Background Ambient Glow */}
              <div className={`absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br ${mix.gradient} opacity-20 rounded-full blur-2xl group-hover:opacity-35 transition-opacity`} />

              <div>
                {/* Cover Image Wrap with Gradient Background & Tag */}
                <div className={`relative aspect-square w-full rounded-lg overflow-hidden mb-2.5 sm:mb-3.5 bg-gradient-to-br ${mix.gradient} p-0.5 shadow-md`}>
                  <img
                    src={mix.thumbnail}
                    alt={mix.title}
                    className="w-full h-full object-cover rounded-[7px] group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Tag Badge */}
                  <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] font-extrabold text-white tracking-wider truncate max-w-[85%]">
                    {mix.tag}
                  </div>
                  {/* Floating Play Button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (mix.songs.length > 0) playSong(mix.songs[0], mix.songs);
                    }}
                    className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                  >
                    <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-black text-black ml-0.5" />
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-primary transition-colors line-clamp-1">
                  {mix.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#a0a0ab] line-clamp-2 mt-0.5 sm:mt-1 leading-relaxed">
                  {mix.subtitle}
                </p>
              </div>

              <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] text-text-muted">
                <span>{mix.songs.length} bài</span>
                <span className="text-white/60 group-hover:text-white flex items-center gap-1 font-semibold transition-colors">
                  Nghe <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Section: Xu hướng TikTok & MXH (Viral TikTok Cards) */}
      {(tiktokSongs.length > 0 || chartSongs.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#EC4899]" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Xu hướng TikTok & MXH</h2>
            </div>
            <button
              onClick={onSeeAllChart}
              className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline border-none bg-transparent cursor-pointer"
            >
              Hiện tất cả
            </button>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
            {(tiktokSongs.length > 0 ? tiktokSongs : chartSongs).slice(0, 6).map((song) => (
              <div
                key={song.encodeId || song.id}
                onClick={() => playSong(song, tiktokSongs.length > 0 ? tiktokSongs : chartSongs)}
                className="bg-[#18181F] hover:bg-[#22222D] p-3 rounded-xl cursor-pointer transition-all duration-200 group flex flex-col relative shadow-md hover:-translate-y-1"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-[#242424]">
                  <img
                    src={song.thumbnailM || song.thumbnail}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {/* Neon TikTok Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-black text-[#EC4899] tracking-wider border border-[#EC4899]/30">
                    TIKTOK
                  </div>
                  {/* Duration Badge */}
                  {song.duration > 0 && (
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white/90">
                      {formatDuration(song.duration)}
                    </div>
                  )}
                  {/* Play Button */}
                  <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                  {song.title}
                </h4>
                <p className="text-xs text-[#a0a0ab] truncate mt-0.5">
                  {song.artistsNames || 'Nghệ sĩ TikTok'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Section: Khám phá theo Chủ đề & Không gian (Ambient & Activity Themes) */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-lg sm:text-xl font-bold text-white">Chủ đề & Không gian</h2>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
          {activityThemes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => {
                if (onSelectPlaylist) {
                  onSelectPlaylist({
                    id: theme.id,
                    title: theme.title,
                    thumbnail: theme.image,
                    songs: theme.songs,
                    artistsNames: theme.subtitle,
                  });
                }
              }}
              className="relative h-44 rounded-xl overflow-hidden cursor-pointer group shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={theme.image}
                alt={theme.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4 flex flex-col justify-between" />

              {/* Content Overlay */}
              <div className="relative z-10 h-full flex flex-col justify-between p-4">
                <div className="self-start">
                  <span
                    style={{ backgroundColor: `${theme.badgeColor}25`, color: theme.badgeColor, borderColor: `${theme.badgeColor}50` }}
                    className="text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border tracking-wider uppercase"
                  >
                    {theme.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white drop-shadow-md group-hover:text-primary transition-colors">
                    {theme.title}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-2 mt-0.5 drop-shadow">
                    {theme.subtitle}
                  </p>
                </div>
              </div>

              {/* Hover Play Button */}
              <div className="absolute right-4 bottom-4 z-20 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Section: Nghệ sĩ phổ biến (Circular Avatars) */}
      <section>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-lg sm:text-xl font-bold text-white">Nghệ sĩ thịnh hành</h2>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4">
          {verifiedVietnameseArtists.map((artist, idx) => (
            <div
              key={artist.id || artist.name}
              onClick={() => {
                if (onSelectArtist) {
                  onSelectArtist({ name: artist.name, thumbnail: artist.artistImg, alias: artist.alias || artist.name.toLowerCase() });
                } else if (chartSongs.length > idx) {
                  playSong(chartSongs[idx], chartSongs);
                }
              }}
              className="bg-[#18181F] hover:bg-[#22222D] p-3.5 rounded-xl flex flex-col items-center text-center cursor-pointer transition-all duration-200 group border-none relative shadow-md hover:-translate-y-1"
            >
              {/* Circular Avatar with Glowing Ring */}
              <div className="relative w-full max-w-[120px] aspect-square rounded-full overflow-hidden mb-3 shadow-lg bg-[#282828] ring-2 ring-transparent group-hover:ring-primary/40 transition-all mx-auto">
                <img
                  src={artist.artistImg}
                  alt={artist.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (chartSongs.length > idx) playSong(chartSongs[idx], chartSongs);
                  }}
                  className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white text-black shadow-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
                </div>
              </div>

              {/* Artist Name & Tag */}
              <h4 className="text-xs font-bold text-white truncate w-full group-hover:text-primary transition-colors">
                {artist.name}
              </h4>
              <span className="text-[11px] text-text-secondary mt-0.5">Nghệ sĩ</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Section: Top Album & Tuyển tập Nổi Bật */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-white">Top Album & Tuyển tập</h2>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
            {playlists.flatMap((sec) => sec.items || []).slice(0, 6).map((p: any) => (
              <div
                key={p.encodeId || p.id}
                onClick={() => onSelectPlaylist && onSelectPlaylist(p)}
                className="bg-[#18181F] hover:bg-[#22222D] p-3 rounded-xl cursor-pointer transition-all duration-200 group flex flex-col relative shadow-md hover:-translate-y-1"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-3 bg-[#242424]">
                  <img
                    src={p.thumbnailM || p.thumbnail}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105">
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{p.title}</h4>
                <p className="text-xs text-[#a0a0ab] truncate mt-0.5">
                  {p.sortDescription || p.artistsNames || 'Tuyển tập đặc sắc'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Section: Bảng xếp hạng V-Pop (Top Chart Songs) */}
      {chartSongs.length > 0 && (
        <section className="pb-10">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Bảng xếp hạng V-Pop</h2>
            </div>
            <button
              onClick={onSeeAllChart}
              className="text-xs font-bold text-[#b3b3b3] hover:text-white hover:underline border-none bg-transparent cursor-pointer"
            >
              Xem toàn bộ BXH
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {chartSongs.slice(0, 8).map((song, i) => (
              <div
                key={song.encodeId || song.id}
                onClick={() => playSong(song, chartSongs)}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#18181F] hover:bg-[#22222D] transition-colors group cursor-pointer"
              >
                <span
                  className={`w-6 text-center text-sm font-black ${
                    i === 0
                      ? 'text-primary'
                      : i === 1
                      ? 'text-amber-400'
                      : i === 2
                      ? 'text-sky-400'
                      : 'text-text-muted'
                  }`}
                >
                  {i + 1}
                </span>
                <img
                  src={song.thumbnail || song.thumbnailM}
                  alt={song.title}
                  className="w-11 h-11 rounded-md object-cover flex-shrink-0 bg-[#242424]"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-text-secondary truncate">{song.artistsNames}</p>
                </div>
                <span className="text-[11px] text-text-muted pr-2 tabular-nums">
                  {formatDuration(song.duration)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
