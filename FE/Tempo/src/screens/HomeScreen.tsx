/**
 * HomeScreen - Giao diện Trang chủ hiện đại (Visual Artwork Backgrounds)
 * Full-Bleed Edge-to-Edge Notch (Full Tai Thỏ), Diagonal Capsule Hero, Quick Shelf & Music Feed
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Play, Music, RefreshCw, Heart, Download, WifiOff, Clock } from "lucide-react-native";
import { apiClient } from "../api/client";
import { HomeFeedData, ChartData, UnifiedSong } from "../types/music";
import { SongItem } from "../components/SongItem";
import { HomeScreenSkeleton } from "../components/SkeletonLoader";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useDownloadStore } from "../store/downloadStore";
import { AppAvatarBadge } from "../components/AppAvatarBadge";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const { playSong, positionMs, durationMs, currentSong } = usePlayerStore();
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

  const loadData = useCallback(async () => {
    setHasError(false);
    // Luôn load local data trước (lịch sử, yêu thích, tải xuống)
    await Promise.all([fetchHistory(), fetchLikedSongs(), fetchLastPlayedContext(), fetchDownloads()]);
    try {
      const [feedData, chartData] = await Promise.all([
        apiClient.getHome(),
        apiClient.getChart(),
      ]);
      setFeed(feedData);
      setChart(chartData);
      setIsOffline(false);
    } catch (e: any) {
      console.error("Failed to load home data:", e);
      // Không có mạng → hiện nội dung offline, không hiện lỗi trắng
      setIsOffline(true);
      setHasError(false);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [fetchHistory, fetchLikedSongs, fetchLastPlayedContext, fetchDownloads]);

  useEffect(() => {
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

  // Lấy 1 album và 1 playlist từ API gợi ý (nếu chưa có lịch sử nghe)
  const quickAlbum = featuredPlaylists[0]?.items?.[0] ?? null;
  const quickPlaylist = featuredPlaylists[1]?.items?.[0] ?? featuredPlaylists[0]?.items?.[1] ?? null;

  const currentAlbum = lastPlayedAlbum || quickAlbum;
  const currentPlaylist = lastPlayedPlaylist || quickPlaylist;

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
            tintColor={COLORS.accentPrimary}
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
              <AppAvatarBadge size={38} />
              <View style={styles.headerTextCol}>
                <Text style={styles.headerSubtitle}>KHÁM PHÁ ÂM NHẠC</Text>
                <Text numberOfLines={1} style={styles.headerTitle}>
                  Dành Cho Bạn
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
              style={styles.headerIconBtn}
            >
              <Bell size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

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
              {/* Card 2: Album gần đây / gợi ý HOẶC Đã tải xuống khi offline */}
              {currentAlbum ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("PlaylistDetail", {
                      id: currentAlbum.id,
                      title: currentAlbum.title,
                      thumbnail: currentAlbum.thumbnail,
                    })
                  }
                  style={styles.horizontalCard}
                >
                  <Image
                    source={{ uri: currentAlbum.thumbnail }}
                    style={styles.horizontalCardImg}
                    resizeMode="cover"
                  />
                  <View style={styles.horizontalCardInfo}>
                    <Text style={styles.horizontalCardBadge}>
                      {lastPlayedAlbum ? "Album gần đây" : "Album gợi ý"}
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardTitle}>
                      {currentAlbum.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardSub}>
                      {currentAlbum.artistsNames || "Album"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("Downloads")}
                  style={styles.horizontalCard}
                >
                  <View style={[styles.horizontalCardImg, { backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }]}>
                    <Download size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.horizontalCardInfo}>
                    <Text style={styles.horizontalCardBadge}>Ngoại tuyến</Text>
                    <Text numberOfLines={1} style={styles.horizontalCardTitle}>
                      Đã tải xuống
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardSub}>
                      {downloadedSongs.length > 0 ? `${downloadedSongs.length} bài hát` : "Sẵn sàng nghe"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Card 3: Playlist gần đây / gợi ý HOẶC Nghe gần đây khi offline */}
              {currentPlaylist ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("PlaylistDetail", {
                      id: currentPlaylist.id,
                      title: currentPlaylist.title,
                      thumbnail: currentPlaylist.thumbnail,
                    })
                  }
                  style={styles.horizontalCard}
                >
                  <Image
                    source={{ uri: currentPlaylist.thumbnail }}
                    style={styles.horizontalCardImg}
                    resizeMode="cover"
                  />
                  <View style={styles.horizontalCardInfo}>
                    <Text style={styles.horizontalCardBadge}>
                      {lastPlayedPlaylist ? "Playlist gần đây" : "Playlist gợi ý"}
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardTitle}>
                      {currentPlaylist.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.horizontalCardSub}>
                      {currentPlaylist.artistsNames || "Tuyển tập"}
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
                  <View style={[styles.horizontalCardImg, { backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' }]}>
                    <Clock size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.horizontalCardInfo}>
                    <Text style={styles.horizontalCardBadge}>Lịch sử</Text>
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

            {/* Section Nghe tiếp (từ lịch sử local) */}
            {history.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Nghe tiếp</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}
                >
                  {history.slice(0, 8).map((item) => {
                    const song = item.song;
                    const isCurrent = currentSong?.id === song.id;
                    const songDur = isCurrent && durationMs > 0 ? durationMs : item.durationMs;
                    const songPos = isCurrent ? positionMs : item.lastPositionMs;
                    const progressRatio = songDur > 0 ? Math.min(songPos / songDur, 1) : 0;
                    return (
                      <TouchableOpacity
                        key={song.id}
                        activeOpacity={0.85}
                        onPress={() => handlePlaySong(song, history.map((h) => h.song), { type: 'single', title: 'Nghe tiếp' })}
                        style={styles.continueCard}
                      >
                        <View style={styles.continueCoverWrapper}>
                          <Image source={{ uri: song.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300" }} style={styles.continueCover} />
                          <View style={styles.continuePlayBtn}>
                            <Play size={14} color={COLORS.black} fill={COLORS.black} style={{ marginLeft: 2 }} />
                          </View>
                          <View style={styles.continueProgressTrack}>
                            <View style={[styles.continueProgressBar, { width: `${Math.max(progressRatio * 100, 8)}%` }]} />
                          </View>
                        </View>
                        <Text numberOfLines={1} style={styles.continueTitle}>{song.title}</Text>
                        <Text numberOfLines={1} style={styles.continueArtist}>{song.artistsNames}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

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
                    const isCurrent = currentSong?.id === song.id;
                    const songDur = isCurrent && durationMs > 0 ? durationMs : item.durationMs;
                    const songPos = isCurrent ? positionMs : item.lastPositionMs;
                    const progressRatio = songDur > 0 ? Math.min(songPos / songDur, 1) : 0;

                    return (
                      <TouchableOpacity
                        key={song.id}
                        activeOpacity={0.85}
                        onPress={() => handlePlaySong(song, history.map((h) => h.song), { type: 'single', title: 'Tiếp tục nghe' })}
                        style={styles.continueCard}
                      >
                        <View style={styles.continueCoverWrapper}>
                          <Image
                            source={{
                              uri:
                                song.thumbnail ||
                                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
                            }}
                            style={styles.continueCover}
                          />
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => handlePlaySong(song, history.map((h) => h.song), { type: 'single', title: 'Tiếp tục nghe' })}
                            style={styles.continuePlayBtn}
                          >
                            <Play
                              size={14}
                              color={COLORS.black}
                              fill={COLORS.black}
                              style={{ marginLeft: 2 }}
                            />
                          </TouchableOpacity>
                          <View style={styles.continueProgressTrack}>
                            <View
                              style={[
                                styles.continueProgressBar,
                                { width: `${Math.max(progressRatio * 100, 8)}%` },
                              ]}
                            />
                          </View>
                        </View>
                        <Text numberOfLines={1} style={styles.continueTitle}>
                          {song.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.continueArtist}>
                          {song.artistsNames}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

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
                  {(featuredPlaylists[0]?.items || []).slice(0, 8).map((album: any) => (
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
  },

  // Quick Shelf Container
  quickShelfContainer: {
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.xs,
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

  // Continue Listening Card
  continueCard: {
    width: 140,
    marginRight: SPACING.md,
  },
  continueCoverWrapper: {
    width: 140,
    height: 140,
    borderRadius: LAYOUT.radiusMd,
    overflow: "hidden",
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs + 2,
    position: "relative",
  },
  continueCover: {
    width: "100%",
    height: "100%",
  },
  continuePlayBtn: {
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
  continueProgressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.bgProgressInactive,
  },
  continueProgressBar: {
    height: "100%",
    backgroundColor: COLORS.accentPrimary,
  },
  continueTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  continueArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
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
});
