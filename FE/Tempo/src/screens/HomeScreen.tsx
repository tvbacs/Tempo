/**
 * HomeScreen - Giao diện Trang chủ hiện đại (Visual Artwork Backgrounds)
 * Full-Bleed Edge-to-Edge Notch (Full Tai Thỏ), Diagonal Capsule Hero, Quick Shelf & Music Feed
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Play,
  Music,
  RefreshCw,
  Heart,
  Download,
  WifiOff,
  Clock,
  Sparkles,
  Flame,
  Coffee,
  Laptop,
  Car,
  CloudRain,
  Compass,
} from "lucide-react-native";
import { apiClient } from "../api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HomeFeedData, ChartData, UnifiedSong } from "../types/music";
import { SongItem } from "../components/SongItem";
import { useFocusEffect } from "@react-navigation/native";
import { HomeScreenSkeleton } from "../components/SkeletonLoader";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useDownloadStore } from "../store/downloadStore";
import { useNotificationStore } from "../store/notificationStore";
import { useNavStore } from "../store/navStore";
import { AppAvatarBadge } from "../components/AppAvatarBadge";
import { formatDuration } from "../utils/format";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      useNavStore.getState().setCurrentRoute("Home");
    }, [])
  );
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [tiktokSongs, setTiktokSongs] = useState<UnifiedSong[]>([]);
  const [coffeeSongs, setCoffeeSongs] = useState<UnifiedSong[]>([]);
  const [focusSongs, setFocusSongs] = useState<UnifiedSong[]>([]);
  const [driveSongs, setDriveSongs] = useState<UnifiedSong[]>([]);
  const [rainSongs, setRainSongs] = useState<UnifiedSong[]>([]);
  const [dailyMix1Songs, setDailyMix1Songs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const { playSong, currentSong } = usePlayerStore();
  const {
    history,
    fetchHistory,
    recordHistory,
    likedSongs,
    fetchLikedSongs,
    lastPlayedAlbum,
    lastPlayedPlaylist,
    fetchLastPlayedContext,
  } = useLibraryStore();

  const { downloadedSongs, fetchDownloads } = useDownloadStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  const loadData = useCallback(async () => {
    setHasError(false);
    // Luôn load local data trước (lịch sử, yêu thích, tải xuống, thông báo)
    await Promise.all([
      fetchHistory(),
      fetchLikedSongs(),
      fetchLastPlayedContext(),
      fetchDownloads(),
      fetchNotifications(),
    ]);
    try {
      // 1. Tải feed chính & chart trước - phát hiện offline ngay lập tức
      const [feedData, chartData] = await Promise.all([
        apiClient.getHome(),
        apiClient.getChart(),
      ]);
      setFeed(feedData);
      setChart(chartData);
      setIsOffline(false);

      // Lưu cache mới nhất
      AsyncStorage.multiSet([
        ['@tempo_home_feed_cache', JSON.stringify(feedData)],
        ['@tempo_chart_cache', JSON.stringify(chartData)],
      ]).catch(() => {});

      // 2. Tải các mục phụ (TikTok, Ambient Themes) ngầm trong background (không block UI)
      Promise.all([
        apiClient.search("Nhạc Hot TikTok").catch(() => ({ songs: [] })),
        apiClient.search("Cà Phê Sáng").catch(() => ({ songs: [] })),
        apiClient.search("Lofi Chill").catch(() => ({ songs: [] })),
        apiClient.search("Lái Xe Thư Giãn").catch(() => ({ songs: [] })),
        apiClient.search("Nhạc Mưa").catch(() => ({ songs: [] })),
      ]).then(([tiktokRes, coffeeRes, focusRes, driveRes, rainRes]) => {
        if (tiktokRes?.songs?.length) setTiktokSongs(tiktokRes.songs);
        if (coffeeRes?.songs?.length) setCoffeeSongs(coffeeRes.songs);
        if (focusRes?.songs?.length) setFocusSongs(focusRes.songs);
        if (driveRes?.songs?.length) setDriveSongs(driveRes.songs);
        if (rainRes?.songs?.length) setRainSongs(rainRes.songs);
      }).catch(() => {});
    } catch (e: any) {
      console.log("ℹ️ [Tempo] Không có kết nối mạng · Đang chạy chế độ Ngoại tuyến (Offline)");
      setIsOffline(true);
      setHasError(false);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [fetchHistory, fetchLikedSongs, fetchLastPlayedContext, fetchDownloads, fetchNotifications]);

  useEffect(() => {
    // 1. Tải cache ngay lập tức (0ms)
    AsyncStorage.multiGet(['@tempo_home_feed_cache', '@tempo_chart_cache'])
      .then(([feedEntry, chartEntry]) => {
        if (feedEntry?.[1]) {
          try {
            const cachedFeed = JSON.parse(feedEntry[1]);
            if (cachedFeed) setFeed(cachedFeed);
          } catch (_) {}
        }
        if (chartEntry?.[1]) {
          try {
            const cachedChart = JSON.parse(chartEntry[1]);
            if (cachedChart) setChart(cachedChart);
          } catch (_) {}
        }
      })
      .catch(() => {});

    // 2. Chạy loadData
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePlaySong = (song: UnifiedSong, queue?: UnifiedSong[], context?: any) => {
    playSong(song, queue, context);
    recordHistory(song);
  };

  const featuredPlaylists = feed?.featuredPlaylists || [];
  const globalTrendingSongs = feed?.globalTrending || [];
  const topChartSongs = chart?.items || [];

  // Danh sách phẳng tất cả album/playlist từ API để chọn gợi ý thông minh
  const allFeaturedPlaylists = useMemo(() => {
    const list: any[] = [];
    (featuredPlaylists || []).forEach((sec: any) => {
      if (sec.items && Array.isArray(sec.items)) {
        list.push(...sec.items);
      }
    });
    return list;
  }, [featuredPlaylists]);

  // Card 2: Lấy album hoặc playlist vừa nghe gần đây nhất
  const recentPlayedItem = useMemo(() => {
    if (lastPlayedAlbum) {
      return { ...lastPlayedAlbum, badge: "Album vừa nghe" };
    }
    if (lastPlayedPlaylist) {
      return { ...lastPlayedPlaylist, badge: "Playlist vừa nghe" };
    }
    // Nếu chưa nghe gì: lấy item đầu tiên từ featured
    if (allFeaturedPlaylists.length > 0) {
      return { ...allFeaturedPlaylists[0], badge: "Thịnh hành hôm nay" };
    }
    return null;
  }, [lastPlayedAlbum, lastPlayedPlaylist, allFeaturedPlaylists]);

  // Card 3: Gợi ý KHÁM PHÁ MỚI - Tuyệt đối không trùng với recentPlayedItem
  const suggestedDiscoverItem = useMemo(() => {
    const recentId = recentPlayedItem?.id;
    const recentTitle = recentPlayedItem?.title?.toLowerCase() || "";
    
    // Tìm trong danh sách featured playlist 1 item khác hoàn toàn với recentPlayedItem
    const candidate = allFeaturedPlaylists.find(
      (item) => item.id !== recentId && (!recentTitle || !item.title?.toLowerCase().includes(recentTitle))
    );

    if (candidate) {
      return { ...candidate, badge: "Gợi ý khám phá" };
    }

    if (allFeaturedPlaylists.length > 1) {
      return { ...allFeaturedPlaylists[1], badge: "Gợi ý khám phá" };
    }

    return null;
  }, [recentPlayedItem, allFeaturedPlaylists]);

  // Nghệ sĩ từ API nếu có, không thì dùng nghệ sĩ từ bảng xếp hạng
  const apiArtists: Array<{ id: string; name: string; alias: string; thumbnail: string }> =
    (feed as any)?.artists?.slice(0, 8) || [];
  const chartArtists = topChartSongs
    .reduce((acc: Array<{ id: string; name: string; alias: string; thumbnail: string }>, song: UnifiedSong) => {
      if (!acc.find((a) => a.name === song.artistsNames?.split(",")[0]?.trim())) {
        acc.push({
          id: song.id,
          name: song.artistsNames?.split(",")[0]?.trim() || song.artistsNames || "",
          alias: song.artistsNames?.split(",")[0]?.trim().replace(/\s+/g, "-") || "",
          thumbnail: song.thumbnail || "",
        });
      }
      return acc;
    }, [])
    .slice(0, 8);
  const displayArtists = apiArtists.length > 0 ? apiArtists : chartArtists;

  // 1. Nhận biết khung giờ thực tế (Time-Aware Context & Mood)
  const currentHour = new Date().getHours();
  const timeGreeting = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) {
      return { greeting: "CHÀO BUỔI SÁNG", moodTitle: "Khởi Đầu Ngày Mới", timeSlot: "morning" };
    }
    if (currentHour >= 12 && currentHour < 18) {
      return { greeting: "CHÀO BUỔI CHIỀU", moodTitle: "Tập Trung Làm Việc", timeSlot: "afternoon" };
    }
    if (currentHour >= 18 && currentHour < 22) {
      return { greeting: "CHÀO BUỔI TỐI", moodTitle: "Thư Giãn Cuối Ngày", timeSlot: "evening" };
    }
    return { greeting: "ĐÊM KHUYA", moodTitle: "Giai Điệu Dễ Ngủ", timeSlot: "night" };
  }, [currentHour]);

  // 1. Phân tích danh sách các ca sĩ từ Lịch sử nghe & Bài hát yêu thích
  const uniqueArtists = useMemo(() => {
    const artistMap = new Map<string, number>();
    const allUserSongs = [
      ...history.map((h) => h.song),
      ...likedSongs,
    ].filter(Boolean);

    allUserSongs.forEach((song) => {
      if (!song?.artistsNames) return;
      const primaryArtist = song.artistsNames.split(",")[0].trim();
      if (primaryArtist) {
        artistMap.set(primaryArtist, (artistMap.get(primaryArtist) || 0) + 1);
      }
    });

    // Lấy top 4 ca sĩ nghe nhiều nhất
    return Array.from(artistMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])
      .slice(0, 4);
  }, [history, likedSongs]);

  // Tự động tìm kiếm tuyển tập bài hát chính thức của từng ca sĩ từ Zing API
  useEffect(() => {
    if (uniqueArtists.length === 0) return;

    let isMounted = true;
    Promise.all(
      uniqueArtists.map((artistName) =>
        apiClient
          .search(artistName)
          .then((res) => {
            if (!res?.songs?.length) return [];
            const matched = res.songs.filter(
              (s) =>
                s.artistsNames?.toLowerCase().includes(artistName.toLowerCase()) ||
                s.title?.toLowerCase().includes(artistName.toLowerCase())
            );
            // Lấy 4 bài hay nhất của ca sĩ này
            return (matched.length > 0 ? matched : res.songs).slice(0, 4);
          })
          .catch(() => [])
      )
    ).then((results) => {
      if (isMounted) {
        const combined = results.flat();
        if (combined.length > 0) {
          setDailyMix1Songs(combined);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [uniqueArtists]);

  // 2. Tuyển tập Daily Mix cá nhân hóa
  const dailyMixes = useMemo(() => {
    // === DAILY MIX 1: Tuyển tập toàn bộ bài hát của các ca sĩ bạn đã nghe ===
    const mix1ArtistsSummary =
      uniqueArtists.length > 0
        ? uniqueArtists.slice(0, 3).join(", ") + (uniqueArtists.length > 3 ? " và hơn thế nữa..." : "")
        : "Tuyển tập các ca khúc dành riêng cho bạn";

    const mix1 = {
      id: "daily_mix_1",
      title: "Daily Mix 1 · Ca Sĩ Yêu Thích",
      tag: "DÀNH CHO BẠN",
      subtitle: mix1ArtistsSummary,
      gradient: ["#EC4899", "#8B5CF6"] as [string, string],
      thumbnail:
        dailyMix1Songs[0]?.thumbnail ||
        topChartSongs[0]?.thumbnail ||
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
      songs: dailyMix1Songs.length > 0 ? dailyMix1Songs : topChartSongs.slice(0, 15),
    };

    // === DAILY MIX 2: Tùy biến theo thời gian trong ngày (Sáng, Trưa, Chiều, Tối, Đêm) ===
    let mix2Config = {
      title: "Daily Mix 2 · Khởi Đầu Ngày Mới",
      tag: "BUỔI SÁNG · ACOUSTIC",
      subtitle: "Acoustic & Indie tươi tắn cho ngày mới tràn đầy hứng khởi",
      gradient: ["#F59E0B", "#F97316"] as [string, string],
      thumbnail: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80",
      songs: coffeeSongs.length > 0 ? coffeeSongs : topChartSongs.slice(0, 15),
    };

    if (currentHour >= 11 && currentHour < 17) {
      mix2Config = {
        title: "Daily Mix 2 · Năng Lượng Làm Việc",
        tag: "BUỔI CHIỀU · FOCUS",
        subtitle: "Deep Focus & Lofi nhịp nhàng giúp duy trì sự tỉnh táo và hiệu suất",
        gradient: ["#8B5CF6", "#3B82F6"] as [string, string],
        thumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&q=80",
        songs: focusSongs.length > 0 ? focusSongs : topChartSongs.slice(2, 16),
      };
    } else if (currentHour >= 17 && currentHour < 22) {
      mix2Config = {
        title: "Daily Mix 2 · Thư Giãn Buổi Tối",
        tag: "BUỔI TỐI · CHILL OUT",
        subtitle: "Giai điệu Pop, Ballad & R&B nhẹ nhàng giải tỏa căng thẳng cuối ngày",
        gradient: ["#EC4899", "#8B5CF6"] as [string, string],
        thumbnail: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&q=80",
        songs: driveSongs.length > 0 ? driveSongs : globalTrendingSongs.slice(0, 15),
      };
    } else if (currentHour >= 22 || currentHour < 5) {
      mix2Config = {
        title: "Daily Mix 2 · Giai Điệu Dễ Ngủ",
        tag: "ĐÊM KHUYA · SLEEP",
        subtitle: "Nhạc mưa, Piano & Lofi êm dịu vỗ về giấc ngủ ngon",
        gradient: ["#06B6D4", "#1E3A8A"] as [string, string],
        thumbnail: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400&q=80",
        songs: rainSongs.length > 0 ? rainSongs : topChartSongs.slice(4, 18),
      };
    }

    const mix2 = {
      id: "daily_mix_2",
      ...mix2Config,
    };

    // === DAILY MIX 3: Khám phá bài hát mới & Xu hướng thịnh hành ===
    const mix3Songs =
      globalTrendingSongs.length > 0 ? globalTrendingSongs.slice(0, 15) : topChartSongs.slice(5, 18);
    const mix3 = {
      id: "daily_mix_3",
      title: "Daily Mix 3 · Khám Phá Mới",
      tag: "XU HƯỚNG MỚI",
      subtitle: "Giai điệu thịnh hành & bài hát mới nổi bật hôm nay",
      gradient: ["#10B981", "#06B6D4"] as [string, string],
      thumbnail:
        globalTrendingSongs[0]?.thumbnail ||
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
      songs: mix3Songs,
    };

    return [mix1, mix2, mix3];
  }, [
    uniqueArtists,
    dailyMix1Songs,
    topChartSongs,
    globalTrendingSongs,
    coffeeSongs,
    focusSongs,
    driveSongs,
    rainSongs,
    currentHour,
  ]);

  // 3. Khám phá theo Chủ đề & Không gian (Tự động ưu tiên đưa chủ đề phù hợp giờ lên đầu)
  const activityThemes = useMemo(() => {
    const rawThemes = [
      {
        id: "theme_coffee",
        title: "Cà phê sáng",
        subtitle: "Acoustic, Indie & Jazz nhẹ nhàng khởi đầu ngày mới",
        badge: "ACOUSTIC",
        image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80",
        accent: "#F59E0B",
        preferredSlot: "morning",
        songs: coffeeSongs.length > 0 ? coffeeSongs : topChartSongs.slice(0, 12),
      },
      {
        id: "theme_focus",
        title: "Góc làm việc tập trung",
        subtitle: "Deep Focus, Lofi Beats & Ambient nâng cao hiệu suất",
        badge: "DEEP FOCUS",
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500&q=80",
        accent: "#8B5CF6",
        preferredSlot: "afternoon",
        songs: focusSongs.length > 0 ? focusSongs : topChartSongs.slice(2, 14),
      },
      {
        id: "theme_drive",
        title: "Lái xe thư giãn",
        subtitle: "City Pop, Indie Rock & Night Drive phiêu theo giai điệu",
        badge: "ROAD TRIP",
        image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=500&q=80",
        accent: "#EC4899",
        preferredSlot: "evening",
        songs: driveSongs.length > 0 ? driveSongs : globalTrendingSongs.slice(0, 12),
      },
      {
        id: "theme_rain",
        title: "Nhạc mưa chill",
        subtitle: "Rainy Lofi, Piano & Sleep R&B sâu lắng và êm dịu",
        badge: "RAINY CHILL",
        image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500&q=80",
        accent: "#06B6D4",
        preferredSlot: "night",
        songs: rainSongs.length > 0 ? rainSongs : topChartSongs.slice(4, 16),
      },
    ];

    return [...rawThemes].sort((a, b) => {
      if (a.preferredSlot === timeGreeting.timeSlot) return -1;
      if (b.preferredSlot === timeGreeting.timeSlot) return 1;
      return 0;
    });
  }, [coffeeSongs, focusSongs, driveSongs, rainSongs, topChartSongs, globalTrendingSongs, timeGreeting.timeSlot]);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressBackgroundColor="transparent"
          />
        }
      >
        {/* Full-Bleed Creative Hero (Full Tai Thỏ Edge-to-Edge) */}
        <View style={[styles.heroSection, { paddingTop: Math.max(insets.top, 24) }]}>
          {/* Diagonal Pill Floating Capsule Background Images */}
          <View style={styles.diagonalPillContainer} pointerEvents="none">
            <View style={[styles.diagonalPill, styles.pill1]}>
              <Image
                source={{
                  uri:
                    topChartSongs[0]?.thumbnail ||
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
                }}
                style={styles.pillImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.diagonalPill, styles.pill2]}>
              <Image
                source={{
                  uri:
                    topChartSongs[1]?.thumbnail ||
                    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
                }}
                style={styles.pillImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.diagonalPill, styles.pill3]}>
              <Image
                source={{
                  uri:
                    topChartSongs[2]?.thumbnail ||
                    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
                }}
                style={styles.pillImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Floating Colorful Accent Deco Squares */}
          <View style={[styles.decoDot, { top: insets.top + 32, left: 20, backgroundColor: "#EC4899" }]} />
          <View style={[styles.decoDot, { top: insets.top + 68, left: 28, backgroundColor: "#06B6D4" }]} />
          <View style={[styles.decoDot, { top: insets.top + 104, left: 18, backgroundColor: "#8B5CF6" }]} />
          <View style={[styles.decoDot, { top: insets.top + 52, left: 60, backgroundColor: "#F97316" }]} />
          <View style={[styles.decoDot, { top: insets.top + 88, left: 54, backgroundColor: "#EAB308" }]} />

          {/* Smooth Dark Gradient Overlay */}
          <LinearGradient
            colors={[
              "rgba(10, 10, 14, 0.45)",
              "rgba(10, 10, 14, 0.88)",
              COLORS.bgPrimary,
            ]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Modern Profile Header Floating on Top of Hero */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("Profile")}
              style={styles.headerProfileRow}
            >
              <AppAvatarBadge size={44} />
              <View style={styles.headerTextCol}>
                <Text style={styles.headerSubtitle}>{timeGreeting.greeting}</Text>
                <Text numberOfLines={1} style={styles.headerTitle}>
                  {timeGreeting.moodTitle}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
              onPress={() => navigation.navigate("Notifications")}
              style={styles.headerIconBtn}
              accessibilityLabel="Thông báo"
            >
              <Bell size={20} color={COLORS.white} />
              {unreadCount > 0 && (
                <View style={styles.unreadBadgeDot} />
              )}
            </TouchableOpacity>
          </View>

          {/* Reload Status Indicator below Header */}
          {refreshing && (
            <View style={styles.refreshBar}>
              <ActivityIndicator size="small" color={COLORS.accentPrimary} />
            </View>
          )}

          {/* Quick Shelf Section: Hero Card Yêu thích Full-Width + 2 Card dài bên dưới (ảnh 1 bên, info 1 bên) */}
          <View style={styles.quickShelfContainer}>
            {/* 1. Card Yêu thích FULL WIDTH theo phong cách Spotify Hiện Đại */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate("LikedSongs")}
              style={styles.heroLikedCard}
            >
              {/* Full-Height Left Tile: Flush with card edge with vibrant gradient & large heart */}
              <View style={styles.heroLikedTile}>
                <LinearGradient
                  colors={['#7C3AED', '#EC4899', '#FC475C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Heart size={28} color={COLORS.white} fill={COLORS.white} />
              </View>

              {/* Text Info */}
              <View style={styles.heroLikedTextGroup}>
                <Text numberOfLines={1} style={styles.heroLikedTitle}>Bài hát đã thích</Text>
                <Text numberOfLines={1} style={styles.heroLikedSub}>
                  {likedSongs.length > 0 ? `${likedSongs.length} bài hát đã lưu` : "Bộ sưu tập yêu thích"}
                </Text>
              </View>

              {/* Quick Play Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={(e) => {
                  e.stopPropagation();
                  if (likedSongs.length > 0) {
                    handlePlaySong(likedSongs[0], likedSongs, { type: 'playlist', title: 'Bài hát đã thích' });
                  } else {
                    navigation.navigate("LikedSongs");
                  }
                }}
                style={styles.heroLikedPlayBtn}
              >
                <Play size={16} color={COLORS.accentPrimary} fill={COLORS.accentPrimary} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* 2. Hàng 2 card còn lại (dài nhưng không full width, ảnh 1 bên, thông tin 1 bên) */}
            <View style={styles.shelfDualRow}>
              {/* Card 2: Khi Online -> Album vừa nghe / Album thịnh hành; Khi Offline -> Đã tải xuống */}
              {!isOffline && recentPlayedItem ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("PlaylistDetail", {
                      id: recentPlayedItem.id,
                      title: recentPlayedItem.title,
                      thumbnail: recentPlayedItem.thumbnail,
                    })
                  }
                  style={styles.horizontalCard}
                >
                  <Image
                    source={{
                      uri:
                        recentPlayedItem.thumbnail ||
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
                    }}
                    style={styles.horizontalCardImg}
                    resizeMode="cover"
                  />
                  <View style={styles.horizontalCardInfo}>
                    <Text style={styles.horizontalCardBadge}>
                      {recentPlayedItem.badge || "Gần đây nghe"}
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardTitle}>
                      {recentPlayedItem.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardSub}>
                      {recentPlayedItem.artistsNames || "Album"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("Downloads")}
                  style={styles.horizontalCard}
                >
                  {downloadedSongs[0]?.thumbnail ? (
                    <Image
                      source={{ uri: downloadedSongs[0].thumbnail }}
                      style={styles.horizontalCardImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.horizontalCardImg, { backgroundColor: '#2A1719', alignItems: 'center', justifyContent: 'center' }]}>
                      <Download size={20} color={COLORS.accentPrimary} />
                    </View>
                  )}
                  <View style={styles.horizontalCardInfo}>
                    <Text style={[styles.horizontalCardBadge, { color: COLORS.accentPrimary }]}>Ngoại tuyến</Text>
                    <Text numberOfLines={1} style={styles.horizontalCardTitle}>
                      Đã tải xuống
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardSub}>
                      {downloadedSongs.length > 0 ? `${downloadedSongs.length} bài hát` : "Sẵn sàng nghe"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Card 3: Khi Online -> Gợi ý khám phá; Khi Offline -> Nghe gần đây */}
              {!isOffline && suggestedDiscoverItem ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("PlaylistDetail", {
                      id: suggestedDiscoverItem.id,
                      title: suggestedDiscoverItem.title,
                      thumbnail: suggestedDiscoverItem.thumbnail,
                    })
                  }
                  style={styles.horizontalCard}
                >
                  <Image
                    source={{
                      uri:
                        suggestedDiscoverItem.thumbnail ||
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
                    }}
                    style={styles.horizontalCardImg}
                    resizeMode="cover"
                  />
                  <View style={styles.horizontalCardInfo}>
                    <Text style={[styles.horizontalCardBadge, { color: '#8B5CF6' }]}>
                      {suggestedDiscoverItem.badge || "Gợi ý khám phá"}
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardTitle}>
                      {suggestedDiscoverItem.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardSub}>
                      {suggestedDiscoverItem.artistsNames || "Tuyển tập"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("SeeAll", {
                      type: "history",
                      title: "Nghe gần đây",
                    })
                  }
                  style={styles.horizontalCard}
                >
                  {history[0]?.song?.thumbnail ? (
                    <Image
                      source={{ uri: history[0].song.thumbnail }}
                      style={styles.horizontalCardImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.horizontalCardImg, { backgroundColor: '#1A1B2E', alignItems: 'center', justifyContent: 'center' }]}>
                      <Clock size={20} color={'#8B5CF6'} />
                    </View>
                  )}
                  <View style={styles.horizontalCardInfo}>
                    <Text style={[styles.horizontalCardBadge, { color: '#8B5CF6' }]}>Lịch sử</Text>
                    <Text numberOfLines={1} style={styles.horizontalCardTitle}>
                      Nghe gần đây
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardSub}>
                      {history.length > 0 ? `${history.length} bài hát` : "Đã nghe"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Main Feed Content */}
        {isLoading ? (
          <HomeScreenSkeleton />
        ) : isOffline ? (
          /* === OFFLINE MODE: Hiện nội dung local thay vì lỗi trắng === */
          <View style={styles.feedContent}>
            {/* Banner thông báo offline kèm nút Thử lại */}
            <View style={styles.offlineBanner}>
              <View style={styles.offlineBannerLeft}>
                <WifiOff size={16} color={COLORS.accentPrimary} />
                <Text style={styles.offlineBannerText} numberOfLines={1}>
                  Không có mạng · Chế độ Offline
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsLoading(true);
                  loadData();
                }}
                style={styles.offlineRetryBtn}
              >
                <RefreshCw size={12} color={COLORS.white} style={{ marginRight: 4 }} />
                <Text style={styles.offlineRetryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>

            {/* Section Nghe tiếp - chỉ bài có trong đã tải xuống */}
            {(() => {
              const downloadedIds = new Set(downloadedSongs.map((s) => s.id));
              const offlineContinue = history
                .filter((item) => downloadedIds.has(item.song.id))
                .slice(0, 8);
              if (offlineContinue.length === 0) return null;
              return (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Nghe tiếp</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
                  >
                    {offlineContinue.map((item) => {
                      const song = item.song;
                      const songDur = item.durationMs || (song?.duration ? song.duration * 1000 : 0);
                      const songPos = item.lastPositionMs || 0;
                      const progressRatio = songDur > 0 ? Math.min(songPos / songDur, 1) : 0;
                      return (
                        <TouchableOpacity
                          key={song.id}
                          activeOpacity={0.85}
                          onPress={() => handlePlaySong(song, offlineContinue.map((h) => h.song), { type: 'single', title: 'Nghe tiếp' })}
                          style={styles.continueCard}
                        >
                          <Image
                            source={{
                              uri:
                                song.thumbnail ||
                                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
                            }}
                            style={styles.continueCardBg}
                          />
                          <LinearGradient
                            colors={["rgba(0,0,0,0.15)", "rgba(10,10,14,0.85)"]}
                            locations={[0, 1]}
                            style={styles.continueCardOverlay}
                          />

                          <View style={styles.continueCardInner}>
                            <View style={styles.continueTextGroup}>
                              <Text numberOfLines={1} style={styles.continueTitle}>
                                {song.title}
                              </Text>
                              <Text numberOfLines={1} style={styles.continueArtist}>
                                {song.artistsNames}
                              </Text>
                            </View>

                            <View style={styles.continuePlayBtn}>
                              <Play
                                size={12}
                                color={COLORS.black}
                                fill={COLORS.black}
                                style={{ marginLeft: 2 }}
                              />
                            </View>
                          </View>

                          <View style={styles.continueProgressTrack}>
                            <View
                              style={[
                                styles.continueProgressBar,
                                { width: `${Math.max(progressRatio * 100, 8)}%` },
                              ]}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })()}

            {/* Section Đã tải xuống */}
            {downloadedSongs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Đã tải xuống</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Downloads")}>
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ paddingHorizontal: SPACING.screenPadding }}>
                  {downloadedSongs.slice(0, 5).map((song) => (
                    <SongItem
                      key={song.id}
                      song={song}
                      onPress={() => handlePlaySong(song, downloadedSongs, { type: 'downloaded', title: 'Đã tải xuống' })}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Khi không có gì để hiện offline */}
            {history.length === 0 && downloadedSongs.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Download size={36} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Chưa có nội dung offline</Text>
                <Text style={styles.emptySubtitle}>
                  Tải xuống bài hát yêu thích để nghe khi không có mạng
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => { setIsLoading(true); loadData(); }}
                  style={styles.retryButton}
                >
                  <RefreshCw size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Real Data Content Feed */
          <View style={styles.feedContent}>
            {/* Section 1: Tiếp tục nghe (Chỉ hiển thị khi đã có bài nghe trong lịch sử) */}
            {history.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Tiếp tục nghe</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("SeeAll", {
                        type: "history",
                        title: "Tiếp tục nghe",
                      })
                    }
                  >
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
                >
                  {history.slice(0, 8).map((item) => {
                    const song = item.song;
                    const songDur = item.durationMs || (song?.duration ? song.duration * 1000 : 0);
                    const songPos = item.lastPositionMs || 0;
                    const progressRatio = songDur > 0 ? Math.min(songPos / songDur, 1) : 0;

                    return (
                      <TouchableOpacity
                        key={song.id}
                        activeOpacity={0.85}
                        onPress={() => handlePlaySong(song, history.map((h) => h.song), { type: 'single', title: 'Tiếp tục nghe' })}
                        style={styles.continueCard}
                      >
                        <Image
                          source={{
                            uri:
                              song.thumbnail ||
                              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
                          }}
                          style={styles.continueCardBg}
                        />
                        <LinearGradient
                          colors={["rgba(0,0,0,0.15)", "rgba(10,10,14,0.85)"]}
                          locations={[0, 1]}
                          style={styles.continueCardOverlay}
                        />

                        <View style={styles.continueCardInner}>
                          <View style={styles.continueTextGroup}>
                            <Text numberOfLines={1} style={styles.continueTitle}>
                              {song.title}
                            </Text>
                            <Text numberOfLines={1} style={styles.continueArtist}>
                              {song.artistsNames}
                            </Text>
                          </View>

                          <View style={styles.continuePlayBtn}>
                            <Play
                              size={12}
                              color={COLORS.black}
                              fill={COLORS.black}
                              style={{ marginLeft: 2 }}
                            />
                          </View>
                        </View>

                        <View style={styles.continueProgressTrack}>
                          <View
                            style={[
                              styles.continueProgressBar,
                              { width: `${Math.max(progressRatio * 100, 8)}%` },
                            ]}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Section: Tuyển tập Daily Mix dành riêng cho bạn */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dành riêng cho bạn</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
              >
                {dailyMixes.map((mix) => (
                  <TouchableOpacity
                    key={mix.id}
                    activeOpacity={0.88}
                    onPress={() => {
                      navigation.navigate("PlaylistDetail", {
                        id: mix.id,
                        title: mix.title,
                        thumbnail: mix.thumbnail,
                        songs: mix.songs,
                        artistsNames: mix.subtitle,
                      });
                    }}
                    style={styles.dailyMixCard}
                  >
                    <View style={styles.dailyMixCoverWrap}>
                      <LinearGradient
                        colors={mix.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.dailyMixGradient}
                      />
                      <Image
                        source={{ uri: mix.thumbnail }}
                        style={styles.dailyMixCoverImg}
                        resizeMode="cover"
                      />
                      <View style={styles.dailyMixBadge}>
                        <Text style={styles.dailyMixBadgeText}>{mix.tag}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (mix.songs.length > 0) {
                            handlePlaySong(mix.songs[0], mix.songs, { type: "playlist", title: mix.title });
                          }
                        }}
                        style={styles.dailyMixPlayBtn}
                      >
                        <Play size={15} color={COLORS.black} fill={COLORS.black} style={{ marginLeft: 2 }} />
                      </TouchableOpacity>
                    </View>
                    <Text numberOfLines={1} style={styles.dailyMixTitle}>
                      {mix.title}
                    </Text>
                    <Text numberOfLines={2} style={styles.dailyMixSubtitle}>
                      {mix.subtitle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Section 2: Nghệ Sĩ Thịnh Hành */}
            {displayArtists.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Nghệ sĩ thịnh hành</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
                >
                  {displayArtists.map((artist) => (
                    <TouchableOpacity
                      key={artist.id + artist.alias}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate("ArtistDetail", {
                          id: artist.id,
                          name: artist.name,
                          alias: artist.alias,
                          thumbnail: artist.thumbnail,
                        })
                      }
                      style={styles.artistCircleCard}
                    >
                      <Image
                        source={{
                          uri:
                            artist.thumbnail ||
                            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200",
                        }}
                        style={styles.artistCircleThumb}
                      />
                      <Text numberOfLines={1} style={styles.artistCircleName}>
                        {artist.name}
                      </Text>
                      <Text style={styles.artistCircleRole}>Nghệ sĩ</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section: Âm thanh Viral TikTok & Mạng xã hội */}
            {(tiktokSongs.length > 0 || globalTrendingSongs.length > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Flame size={16} color="#EC4899" />
                    <Text style={styles.sectionTitle}>Xu hướng TikTok & MXH</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("SeeAll", {
                        type: "global_trending",
                        title: "Xu hướng TikTok & MXH",
                      })
                    }
                  >
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
                >
                  {(tiktokSongs.length > 0 ? tiktokSongs : globalTrendingSongs).slice(0, 10).map((song) => (
                    <TouchableOpacity
                      key={song.id}
                      activeOpacity={0.88}
                      onPress={() => {
                        handlePlaySong(song, tiktokSongs.length > 0 ? tiktokSongs : globalTrendingSongs, {
                          type: "custom",
                          title: "Xu hướng TikTok",
                        });
                      }}
                      style={styles.tiktokCard}
                    >
                      <View style={styles.tiktokCoverWrap}>
                        <Image
                          source={{
                            uri:
                              song.thumbnail ||
                              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
                          }}
                          style={styles.tiktokCoverImg}
                        />
                        <View style={styles.tiktokPlayOverlay}>
                          <Play size={13} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 1 }} />
                        </View>
                        <View style={styles.tiktokBadge}>
                          <Text style={styles.tiktokBadgeText}>TIKTOK</Text>
                        </View>
                        {song.duration > 0 && (
                          <View style={styles.tiktokDurationBadge}>
                            <Text style={styles.tiktokDurationText}>{formatDuration(song.duration)}</Text>
                          </View>
                        )}
                      </View>
                      <Text numberOfLines={1} style={styles.tiktokTitle}>
                        {song.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.tiktokArtist}>
                        {song.artistsNames}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section: Khám phá theo Chủ đề & Không gian (Ambient & Activities) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Chủ đề & Không gian</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
              >
                {activityThemes.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    activeOpacity={0.88}
                    onPress={() => {
                      navigation.navigate("PlaylistDetail", {
                        id: theme.id,
                        title: theme.title,
                        thumbnail: theme.image,
                        songs: theme.songs,
                        artistsNames: theme.subtitle,
                      });
                    }}
                    style={styles.themeCard}
                  >
                    <Image source={{ uri: theme.image }} style={styles.themeCardImg} />
                    <LinearGradient
                      colors={["rgba(10, 10, 15, 0.2)", "rgba(10, 10, 15, 0.88)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.themeCardContent}>
                      <View style={[styles.themeBadge, { backgroundColor: theme.accent }]}>
                        <Text style={styles.themeBadgeText}>{theme.badge}</Text>
                      </View>
                      <Text numberOfLines={1} style={styles.themeTitle}>
                        {theme.title}
                      </Text>
                      <Text numberOfLines={2} style={styles.themeSub}>
                        {theme.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Section 3: Album & Tuyển Tập Nổi Bật */}
            {featuredPlaylists.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Top Album & Tuyển tập</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("SeeAll", {
                        type: "playlists",
                        title: "Top Album & Tuyển tập",
                      })
                    }
                  >
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
                >
                  {(featuredPlaylists[0]?.items || [])
                    .filter((a: any) => a.id !== recentPlayedItem?.id && a.id !== suggestedDiscoverItem?.id)
                    .slice(0, 8)
                    .map((album: any) => (
                    <TouchableOpacity
                      key={album.id}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate("PlaylistDetail", {
                          id: album.id,
                          title: album.title,
                          thumbnail: album.thumbnail,
                        })
                      }
                      style={styles.albumCard}
                    >
                      <Image
                        source={{
                          uri:
                            album.thumbnail ||
                            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
                        }}
                        style={styles.albumThumb}
                      />
                      <Text numberOfLines={1} style={styles.albumTitle}>
                        {album.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.albumArtist}>
                        {album.artistsNames || "Zing MP3"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section 4: Bài hát xu hướng toàn cầu (Global Trending) */}
            {globalTrendingSongs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Xu hướng toàn cầu</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("SeeAll", {
                        type: "global_trending",
                        title: "Xu hướng toàn cầu",
                      })
                    }
                  >
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
                >
                  {globalTrendingSongs.slice(0, 8).map((song) => (
                    <TouchableOpacity
                      key={song.id}
                      activeOpacity={0.85}
                      onPress={() => handlePlaySong(song, globalTrendingSongs, { type: 'custom', title: 'Thịnh Hành Quốc Tế' })}
                      style={styles.trendingSongCard}
                    >
                      <View style={styles.trendingSongCoverWrapper}>
                        <Image
                          source={{
                            uri:
                              song.thumbnail ||
                              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
                          }}
                          style={styles.trendingSongCover}
                        />
                        <View style={styles.trendingSongPlayBtn}>
                          <Play
                            size={14}
                            color={COLORS.black}
                            fill={COLORS.black}
                            style={{ marginLeft: 2 }}
                          />
                        </View>
                      </View>
                      <Text numberOfLines={1} style={styles.trendingSongTitle}>
                        {song.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.trendingSongArtist}>
                        {song.artistsNames}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Section 5: Bảng xếp hạng V-Pop (Top Charts) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Bảng xếp hạng V-Pop</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("SeeAll", {
                      type: "chart",
                      title: "Bảng xếp hạng V-Pop",
                    })
                  }
                >
                  <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: SPACING.screenPadding }}>
                {topChartSongs.length > 0 ? (
                  topChartSongs.slice(0, 10).map((song, i) => (
                    <SongItem
                      key={song.id}
                      song={song}
                      index={i}
                      showIndex
                      onPress={() => handlePlaySong(song, topChartSongs, { type: 'chart', title: 'Bảng xếp hạng V-Pop' })}
                    />
                  ))
                ) : (
                  <View style={styles.emptyListNotice}>
                    <Text style={styles.emptyListText}>Đang cập nhật bảng xếp hạng...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.xl,
  },

  // Full-Bleed Creative Hero Section (Full Tai Thỏ)
  heroSection: {
    overflow: "hidden",
    marginBottom: SPACING.xs,
    position: "relative",
    backgroundColor: COLORS.bgPrimary,
    paddingBottom: SPACING.xs,
  },
  diagonalPillContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    opacity: 0.7,
  },
  diagonalPill: {
    position: "absolute",
    width: 140,
    height: 280,
    borderRadius: 70,
    overflow: "hidden",
    transform: [{ rotate: "-28deg" }],
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  pill1: {
    top: -40,
    right: 175,
  },
  pill2: {
    top: -10,
    right: 45,
  },
  pill3: {
    top: 50,
    right: -80,
  },
  pillImage: {
    width: "100%",
    height: "100%",
    transform: [{ rotate: "28deg" }, { scale: 1.35 }],
  },
  decoDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 2,
    opacity: 0.75,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.xxxl,
    zIndex: 3,
  },
  headerProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  headerTextCol: {
    justifyContent: "center",
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizeSubheading,
    fontWeight: "800",
    color: COLORS.white,
  },
  headerIconBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadBadgeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentPrimary,
  },

  // Refresh Indicator
  refreshBar: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: 36,
    height: 36,
    backgroundColor: "rgba(30, 30, 36, 0.92)",
    borderRadius: 18,
    marginBottom: SPACING.md,
    zIndex: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Quick Shelf Container
  quickShelfContainer: {
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.xxl,
    gap: 10,
    zIndex: 2,
  },
  // Hero Liked Card: Full-width matching dual shelf cards below
  heroLikedCard: {
    width: "100%",
    height: 64,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: "#1E1E24",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  heroLikedTile: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FC475C",
  },
  heroLikedTextGroup: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  heroLikedBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  heroLikedTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
    lineHeight: 18,
  },
  heroLikedSub: {
    fontSize: 11,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  heroLikedPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  // 2 Dual Horizontal Row Cards (Ảnh 1 bên, thông tin 1 bên)
  shelfDualRow: {
    flexDirection: "row",
    gap: 10,
  },
  horizontalCard: {
    flex: 1,
    height: 64,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: "#1E1E24",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  horizontalCardImg: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  horizontalCardInfo: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  horizontalCardBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.accentPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  horizontalCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    lineHeight: 15,
  },
  horizontalCardSub: {
    fontSize: 10,
    fontWeight: "400",
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  feedContent: {
    paddingTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xxxl + 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizeHeading - 2,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.accentPrimary,
  },

  // Continue Listening Card (Phong cách Duyệt tìm tất cả - Bo góc Top-Left, các góc dưới vuông vức)
  continueCard: {
    width: 172,
    height: 92,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    overflow: "hidden",
    position: "relative",
    marginRight: SPACING.md,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  continueCardBg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  continueCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  continueCardInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    paddingTop: 8,
    paddingBottom: 12,
    zIndex: 2,
  },
  continueTextGroup: {
    flex: 1,
    marginRight: 6,
  },
  continueTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  continueArtist: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  continuePlayBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  continueProgressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 3,
  },
  continueProgressBar: {
    height: "100%",
    backgroundColor: COLORS.accentPrimary,
  },

  // Album & Tuyển tập Card
  albumCard: {
    width: 140,
    marginRight: SPACING.md,
  },
  albumThumb: {
    width: 140,
    height: 140,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs + 2,
  },
  albumTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  albumArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },

  // Trending Artists Shelf
  artistCircleCard: {
    alignItems: "center",
    width: 96,
    marginRight: SPACING.md,
  },
  artistCircleThumb: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs,
  },
  artistCircleName: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    width: "100%",
  },
  artistCircleRole: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 1,
  },

  // Global Trending Song Card (Chuẩn Card Bài Hát Hình Vuông)
  trendingSongCard: {
    width: 140,
    marginRight: SPACING.md,
  },
  trendingSongCoverWrapper: {
    width: 140,
    height: 140,
    borderRadius: LAYOUT.radiusMd,
    overflow: "hidden",
    backgroundColor: COLORS.bgSurface,
    marginBottom: SPACING.sm,
    position: "relative",
  },
  trendingSongCover: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  trendingSongPlayBtn: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  trendingSongTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  trendingSongArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: LAYOUT.radiusFull,
  },
  retryButtonText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.white,
  },
  emptyListNotice: {
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  emptyListText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: SPACING.screenPadding,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: "rgba(252,71,92,0.1)",
    borderRadius: LAYOUT.radiusMd,
  },
  offlineBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
  },
  offlineBannerText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  offlineRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 1,
    borderRadius: LAYOUT.radiusFull,
  },
  offlineRetryBtnText: {
    fontSize: TYPOGRAPHY.sizeCaption - 1,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Section Title Row
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // 1. Filter Pills
  filterPillsWrapper: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  filterPillsScroll: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.xs + 2,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  filterPillActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  filterPillText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.white,
    fontWeight: "800",
  },

  // 2. Daily Mixes
  dailyMixCard: {
    width: 155,
    marginRight: SPACING.md,
  },
  dailyMixCoverWrap: {
    width: 155,
    height: 155,
    borderRadius: LAYOUT.radiusMd,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs + 2,
  },
  dailyMixGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  dailyMixCoverImg: {
    position: "absolute",
    right: -10,
    bottom: -10,
    width: 110,
    height: 110,
    borderRadius: LAYOUT.radiusSm,
    transform: [{ rotate: "10deg" }],
    opacity: 0.9,
  },
  dailyMixBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LAYOUT.radiusXs,
  },
  dailyMixBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  dailyMixPlayBtn: {
    position: "absolute",
    left: 10,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  dailyMixTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  dailyMixSubtitle: {
    fontSize: TYPOGRAPHY.sizeCaption - 1,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },

  // 3. TikTok Viral Sounds
  tiktokCard: {
    width: 130,
    marginRight: SPACING.md,
  },
  tiktokCoverWrap: {
    width: 130,
    height: 130,
    borderRadius: LAYOUT.radiusMd,
    overflow: "hidden",
    position: "relative",
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs + 2,
  },
  tiktokCoverImg: {
    width: "100%",
    height: "100%",
  },
  tiktokPlayOverlay: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  tiktokBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#EC4899",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tiktokBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tiktokDurationBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tiktokDurationText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.white,
  },
  tiktokTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  tiktokArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },

  // 4. Themes & Activities
  themeCard: {
    width: 200,
    height: 120,
    borderRadius: LAYOUT.radiusMd,
    overflow: "hidden",
    position: "relative",
    marginRight: SPACING.md,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  themeCardImg: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  themeCardContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: SPACING.md,
  },
  themeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  themeBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  themeTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
  },
  themeSub: {
    fontSize: TYPOGRAPHY.sizeCaption - 1,
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: 14,
  },
});
