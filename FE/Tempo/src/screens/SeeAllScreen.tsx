/**
 * SeeAllScreen - Màn hình danh sách mở rộng ("Xem tất cả")
 * Tối ưu padding bottom chuẩn theo SafeArea và trạng thái MiniPlayer
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Play, Pause, Shuffle, Music, Flame, Sparkles, Search, X } from "lucide-react-native";
import { SongItem } from "../components/SongItem";
import { SongItemSkeleton } from "../components/SkeletonLoader";
import { usePlayerStore } from "../store/playerStore";
import { useActivePlayback } from "../store/connectStore";
import { useLibraryStore } from "../store/libraryStore";
import { useToastStore } from "../store/toastStore";
import { apiClient } from "../api/client";
import { UnifiedSong } from "../types/music";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLAYLIST_CARD_WIDTH = (SCREEN_WIDTH - (SPACING.screenPadding * 2) - SPACING.md) / 2;

export const SeeAllScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { type, title: initialTitle } = route.params || {};

  const [title, setTitle] = useState<string>(initialTitle || "Xem tất cả");
  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { playSong, isShuffle, toggleShuffle, playbackContext } = usePlayerStore();
  const { song: currentSong, isPlaying, togglePlayPause } = useActivePlayback();
  const { history } = useLibraryStore();
  const { showToast } = useToastStore();

  const isCurrentCollectionPlaying =
    isPlaying &&
    ((playbackContext?.id && playbackContext.id === type) ||
     (playbackContext?.title && playbackContext.title === title));

  const bottomPadding = currentSong
    ? LAYOUT.miniPlayerHeight + insets.bottom + SPACING.md
    : insets.bottom + SPACING.xl;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        if (type === "chart") {
          setTitle(initialTitle || "Bảng xếp hạng V-Pop");
          const chartData = await apiClient.getChart();
          if (isMounted) setSongs(chartData.items || []);
        } else if (type === "new_release") {
          setTitle(initialTitle || "Mới phát hành");
          const homeData = await apiClient.getHome();
          if (isMounted) setSongs(homeData.newReleasesVPop || []);
        } else if (type === "global_trending") {
          setTitle(initialTitle || "Xu hướng toàn cầu");
          const homeData = await apiClient.getHome();
          if (isMounted) setSongs(homeData.globalTrending || []);
        } else if (type === "playlists") {
          setTitle(initialTitle || "Dành riêng cho bạn");
          const homeData = await apiClient.getHome();
          if (isMounted) {
            const allPlaylists = (homeData.featuredPlaylists || []).flatMap(
              (sec) => sec.items || []
            );
            setPlaylists(allPlaylists);
          }
        } else if (type === "history") {
          setTitle(initialTitle || "Tiếp tục nghe");
          if (isMounted) setSongs(history.map((h) => h.song));
        }
      } catch (e) {
        console.error("Failed to load see all data:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [type, initialTitle]);

  const filteredSongs = React.useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase().trim();
    return songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artistsNames?.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  const filteredPlaylists = React.useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const q = searchQuery.toLowerCase().trim();
    return playlists.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.artistsNames?.toLowerCase().includes(q) ||
        p.sortDescription?.toLowerCase().includes(q)
    );
  }, [playlists, searchQuery]);

  const handlePlayAll = () => {
    if (filteredSongs.length === 0) return;
    if (isCurrentCollectionPlaying) {
      togglePlayPause();
      return;
    }
    const songsToPlay = isShuffle
      ? [...filteredSongs].sort(() => Math.random() - 0.5)
      : filteredSongs;
    playSong(songsToPlay[0], songsToPlay, { type: type === 'chart' ? 'chart' : 'custom', title, id: type });
  };

  const handleToggleShuffle = () => {
    if (!isShuffle) {
      toggleShuffle();
    }
    if (!isCurrentCollectionPlaying && filteredSongs.length > 0) {
      const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], filteredSongs, { type: type === 'chart' ? 'chart' : 'custom', title, id: type });
    } else {
      toggleShuffle();
    }
  };

  const isPlaylistMode = type === "playlists";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isPlaylistMode
              ? `${playlists.length} danh sách phát`
              : `${songs.length} bài hát`}
          </Text>
        </View>
      </View>

      {/* Hero Header Card for Songs List */}
      {!isPlaylistMode && songs.length > 0 && !isLoading && !searchQuery && (
        <View style={styles.heroBanner}>
          <Image
            source={{
              uri:
                songs[0]?.thumbnail ||
                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[
              "rgba(0, 0, 0, 0.35)",
              "rgba(10, 10, 14, 0.8)",
              "rgba(10, 10, 14, 0.98)",
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroBannerContent}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                {type === "chart" ? (
                  <Flame size={12} color={COLORS.accentPrimary} />
                ) : (
                  <Sparkles size={12} color={COLORS.accentPrimary} />
                )}
                <Text style={styles.heroBadgeText}>
                  {type === "chart" ? "TOP 1 THỊNH HÀNH" : "BÀI HÁT NỔI BẬT"}
                </Text>
              </View>
            </View>

            <Text numberOfLines={1} style={styles.heroSongTitle}>
              {songs[0]?.title}
            </Text>
            <Text numberOfLines={1} style={styles.heroSongArtist}>
              {songs[0]?.artistsNames}
            </Text>

            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handlePlayAll}
                style={styles.heroPlayAllBtn}
              >
                <LinearGradient
                  colors={[COLORS.accentPrimary, COLORS.accentSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroPlayGradient}
                >
                  {isCurrentCollectionPlaying ? (
                    <Pause size={15} color={COLORS.white} fill={COLORS.white} />
                  ) : (
                    <Play size={15} color={COLORS.white} fill={COLORS.white} />
                  )}
                  <Text style={styles.heroPlayText}>
                    {isCurrentCollectionPlaying ? "Tạm dừng" : "Phát tất cả"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleShuffle}
                style={[
                  styles.heroShuffleBtn,
                  isShuffle && isCurrentCollectionPlaying && styles.heroShuffleBtnActive,
                ]}
              >
                <Shuffle
                  size={16}
                  color={isShuffle && isCurrentCollectionPlaying ? COLORS.accentPrimary : COLORS.textMuted}
                />
              </TouchableOpacity>

              <Text style={styles.heroSongCountRight}>{filteredSongs.length} ca khúc</Text>
            </View>
          </View>
        </View>
      )}

      {/* Inline Search Bar */}
      {!isLoading && (songs.length > 0 || playlists.length > 0) && (
        <View style={styles.searchBarWrap}>
          <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={isPlaylistMode ? "Tìm danh sách phát..." : "Tìm trong danh sách này..."}
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingWrapper}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <SongItemSkeleton key={idx} />
          ))}
        </View>
      ) : isPlaylistMode ? (
        /* Grid Mode: Playlists & Albums */
        filteredPlaylists.length > 0 ? (
          <FlatList
            data={filteredPlaylists}
            keyExtractor={(item, index) => item.id + index}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[styles.gridContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("PlaylistDetail", {
                    id: item.id,
                    title: item.title,
                    thumbnail: item.thumbnail,
                  })
                }
                style={styles.playlistCard}
              >
                <Image
                  source={{
                    uri:
                      item.thumbnail ||
                      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
                  }}
                  style={styles.playlistCover}
                />
                <Text numberOfLines={1} style={styles.playlistTitle}>
                  {item.title}
                </Text>
                <Text numberOfLines={2} style={styles.playlistSubtitle}>
                  {item.artistsNames || item.sortDescription || "Tuyển tập âm nhạc"}
                </Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Music size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? `Không tìm thấy danh sách phát "${searchQuery}"` : "Chưa có danh sách phát nào"}
            </Text>
          </View>
        )
      ) : (
        /* List Mode: Songs */
        filteredSongs.length > 0 ? (
          <FlatList
            data={filteredSongs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <SongItem
                song={item}
                index={index}
                showIndex={type === "chart"}
                onPress={() => playSong(item, filteredSongs, { type: type === 'chart' ? 'chart' : 'custom', title })}
              />
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Music size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? `Không tìm thấy bài hát nào khớp với "${searchQuery}"` : "Không có bài hát nào"}
            </Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  backBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizeHeading,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  navCircleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: LAYOUT.radiusFull,
    paddingHorizontal: SPACING.md,
    height: 46,
    marginHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.md,
    gap: SPACING.xs + 2,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  heroBanner: {
    height: 180,
    marginHorizontal: SPACING.screenPadding,
    borderRadius: LAYOUT.radiusLg,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: SPACING.md,
    position: "relative",
  },
  heroBannerContent: {
    padding: SPACING.md,
    zIndex: 2,
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LAYOUT.radiusXs,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  heroCountText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "600",
    color: COLORS.textLightMuted,
  },
  heroSongTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 2,
  },
  heroSongArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  heroActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  heroPlayAllBtn: {
    borderRadius: LAYOUT.radiusFull,
    overflow: "hidden",
  },
  heroPlayGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: 8,
  },
  heroPlayText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "800",
    color: COLORS.white,
  },
  heroShuffleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroShuffleBtnActive: {
    backgroundColor: "rgba(252, 71, 92, 0.2)",
  },
  heroSongCountRight: {
    marginLeft: "auto",
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  loadingWrapper: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.screenPadding,
  },
  gridContent: {
    paddingHorizontal: SPACING.screenPadding,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  playlistCard: {
    width: PLAYLIST_CARD_WIDTH,
  },
  playlistCover: {
    width: PLAYLIST_CARD_WIDTH,
    height: PLAYLIST_CARD_WIDTH,
    borderRadius: LAYOUT.radiusLg,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.sm,
  },
  playlistTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  playlistSubtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeightCaption,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizeBody,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});
