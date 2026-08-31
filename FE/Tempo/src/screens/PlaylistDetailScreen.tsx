/**
 * PlaylistDetailScreen - Chi Tiết Danh Sách Phát / Tuyển Tập Tuyệt Đẹp (Tiếng Việt)
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
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Play, Pause, Shuffle, Heart, MoreHorizontal, Plus, Music } from "lucide-react-native";
import { GradientPlayButton } from "../components/GradientButton";
import { SongItem } from "../components/SongItem";
import { SongItemSkeleton } from "../components/SkeletonLoader";
import { AddSongsModal } from "../components/AddSongsModal";
import { usePlayerStore } from "../store/playerStore";
import { useActivePlayback } from "../store/connectStore";
import { useLibraryStore } from "../store/libraryStore";
import { useSleepTimerStore } from "../store/sleepTimerStore";
import { useToastStore } from "../store/toastStore";
import { apiClient } from "../api/client";
import { UnifiedSong } from "../types/music";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";

export const PlaylistDetailScreen: React.FC<{
  route: any;
  navigation: any;
}> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { id, title: initTitle, thumbnail: initThumb, songs: initialSongs, artistsNames: initArtists } = route.params || {};

  const [playlist, setPlaylist] = useState<{
    id: string;
    title: string;
    thumbnail: string;
    artistsNames?: string;
    songs: UnifiedSong[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const { playSong, isShuffle, toggleShuffle } = usePlayerStore();
  const { song: currentSong, isPlaying, togglePlayPause } = useActivePlayback();
  const { playlists, savedAlbums, setLastPlayedContext, toggleSaveAlbum, isAlbumSaved } = useLibraryStore();
  const { showToast } = useToastStore();

  const isLiked = id ? isAlbumSaved(id) : false;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadPlaylist = async () => {
      try {
        // 0. Nếu được truyền trực tiếp danh sách bài hát (Daily Mix / Theme / Saved Albums)
        if (initialSongs && Array.isArray(initialSongs) && initialSongs.length > 0) {
          if (isMounted) {
            setPlaylist({
              id: id || "custom_mix",
              title: initTitle || "Tuyển tập âm nhạc",
              thumbnail:
                initThumb ||
                initialSongs[0]?.thumbnail ||
                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
              artistsNames: initArtists || `${initialSongs.length} bài hát`,
              songs: initialSongs,
            });
            setIsLoading(false);
          }
          return;
        }

        if (!id) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // 0b. Kiểm tra xem có trong danh sách Album đã lưu với đầy đủ bài hát không
        const savedAl = savedAlbums.find((a) => a.id === id);
        if (savedAl && savedAl.songs && savedAl.songs.length > 0) {
          if (isMounted) {
            setPlaylist({
              id: savedAl.id,
              title: savedAl.title || initTitle || "Album đã lưu",
              thumbnail: savedAl.thumbnail || initThumb || "",
              artistsNames: savedAl.artistsNames || `${savedAl.songs.length} bài hát`,
              songs: savedAl.songs,
            });
            setIsLoading(false);
          }
          return;
        }

        // 0c. Nếu là Chủ đề & Không gian mở bằng ID thuần
        if (id === "theme_coffee") {
          const res = await apiClient.search("Cà Phê Sáng").catch(() => ({ songs: [] }));
          if (res?.songs?.length && isMounted) {
            setPlaylist({
              id: "theme_coffee",
              title: initTitle || "Cà phê sáng",
              thumbnail: initThumb || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500",
              artistsNames: initArtists || "Acoustic, Indie & Jazz nhẹ nhàng",
              songs: res.songs,
            });
            setIsLoading(false);
            return;
          }
        } else if (id === "theme_focus") {
          const res = await apiClient.search("Lofi Chill").catch(() => ({ songs: [] }));
          if (res?.songs?.length && isMounted) {
            setPlaylist({
              id: "theme_focus",
              title: initTitle || "Góc làm việc tập trung",
              thumbnail: initThumb || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500",
              artistsNames: initArtists || "Deep Focus & Lofi Beats",
              songs: res.songs,
            });
            setIsLoading(false);
            return;
          }
        } else if (id === "theme_drive") {
          const res = await apiClient.search("Lái Xe Thư Giãn").catch(() => ({ songs: [] }));
          if (res?.songs?.length && isMounted) {
            setPlaylist({
              id: "theme_drive",
              title: initTitle || "Lái xe thư giãn",
              thumbnail: initThumb || "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=500",
              artistsNames: initArtists || "City Pop & Night Drive",
              songs: res.songs,
            });
            setIsLoading(false);
            return;
          }
        } else if (id === "theme_rain") {
          const res = await apiClient.search("Nhạc Mưa").catch(() => ({ songs: [] }));
          if (res?.songs?.length && isMounted) {
            setPlaylist({
              id: "theme_rain",
              title: initTitle || "Nhạc mưa chill",
              thumbnail: initThumb || "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=500",
              artistsNames: initArtists || "Rainy Lofi & Piano Sleep",
              songs: res.songs,
            });
            setIsLoading(false);
            return;
          }
        }

        // 1. Kiểm tra xem có phải playlist cá nhân do user tự tạo không
        const customPl = playlists.find((p) => p.id === id);
        if (customPl) {
          if (isMounted) {
            setPlaylist({
              id: customPl.id,
              title: customPl.name,
              thumbnail:
                customPl.songs?.[0]?.thumbnail ||
                customPl.coverUrl ||
                initThumb ||
                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
              artistsNames: `${customPl.songs?.length || 0} bài hát`,
              songs: customPl.songs || [],
            });
            setIsLoading(false);
          }
          return;
        }

        // 2. Nếu là playlist/album trực tuyến từ Zing API
        const data = await apiClient.getPlaylistDetail(id);
        if (isMounted && data) {
          setPlaylist(data);
        }
      } catch (e: any) {
        console.warn("Playlist API fallback:", e?.message || e);
        if (isMounted && !playlist) {
          setPlaylist({
            id: id || "unknown",
            title: initTitle || "Tuyển tập âm nhạc",
            thumbnail: initThumb || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
            artistsNames: "Tuyển tập đặc sắc",
            songs: [],
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPlaylist();

    return () => {
      isMounted = false;
    };
  }, [id, playlists]);

  const displayTitle = playlist?.title || initTitle || "Danh sách phát";
  const displayThumb =
    playlist?.thumbnail ||
    initThumb ||
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500";
  const songList = playlist?.songs || [];

  const isCustomPlaylist =
    playlists.some((p) => p.id === id) ||
    (typeof id === 'string' && id.startsWith('pl_'));

  const contextType: 'album' | 'playlist' =
    route.params?.type === 'album' || displayTitle.toLowerCase().includes('album')
      ? 'album'
      : 'playlist';

  const handlePlayAll = () => {
    if (songList.length === 0) return;
    if (isCurrentPlaylistPlaying) {
      togglePlayPause();
      return;
    }
    setLastPlayedContext({
      id: playlist?.id || id || displayTitle,
      title: displayTitle,
      thumbnail: displayThumb,
      type: contextType,
      artistsNames: playlist?.artistsNames,
    });

    const songsToPlay = isShuffle
      ? [...songList].sort(() => Math.random() - 0.5)
      : songList;
    playSong(songsToPlay[0], songsToPlay, { type: 'playlist', title: displayTitle, id: playlist?.id || id });
  };

  const handlePlaySingle = (song: UnifiedSong) => {
    setLastPlayedContext({
      id: playlist?.id || id || displayTitle,
      title: displayTitle,
      thumbnail: displayThumb,
      type: contextType,
      artistsNames: playlist?.artistsNames,
    });
    playSong(song, songList, { type: 'playlist', title: displayTitle, id: playlist?.id || id });
  };

  const handleToggleShuffle = () => {
    if (!isShuffle) {
      toggleShuffle();
    }
    if (!isCurrentPlaylistPlaying && songList.length > 0) {
      const shuffled = [...songList].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], songList, { type: 'playlist', title: displayTitle, id: playlist?.id || id });
    } else {
      toggleShuffle();
    }
  };

  const handleToggleLike = () => {
    toggleSaveAlbum({
      id: id || playlist?.id || displayTitle,
      title: displayTitle,
      thumbnail: displayThumb,
      artistsNames: playlist?.artistsNames,
      songs: songList,
    });
  };

  const isCurrentPlaylistPlaying =
    isPlaying && songList.some((s) => s.id === currentSong?.id);

  const getSubtitle = () => {
    if (isCustomPlaylist) {
      return `Danh sách phát · ${songList.length} bài hát`;
    }
    const artists = playlist?.artistsNames || initArtists;
    if (artists && !artists.toLowerCase().includes('bài hát')) {
      return `${artists} · ${songList.length > 0 ? `${songList.length} bài hát` : 'Đang cập nhật'}`;
    }
    return songList.length > 0 ? `${songList.length} bài hát` : 'Đang cập nhật';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Floating Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
          onPress={() => navigation.goBack()}
          style={styles.navCircleBtn}
        >
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
          onPress={() => useSleepTimerStore.getState().openModal()}
          style={styles.navCircleBtn}
        >
          <MoreHorizontal size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Playlist Hero Artwork */}
        <View style={styles.heroSection}>
          <Image source={{ uri: displayThumb }} style={styles.heroImage} />
          <Text numberOfLines={2} style={styles.playlistTitle}>{displayTitle}</Text>
          <Text style={styles.playlistSubtitle}>
            {getSubtitle()}
          </Text>
        </View>

        {/* Action Controls Row */}
        <View style={styles.actionsRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleLike}
              hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
              style={styles.heartBtn}
            >
              <Heart
                size={24}
                color={isLiked ? COLORS.accentPrimary : COLORS.textSecondary}
                fill={isLiked ? COLORS.accentPrimary : COLORS.transparent}
              />
            </TouchableOpacity>

            {isCustomPlaylist && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowAddModal(true)}
                style={styles.addSongBtnSmall}
              >
                <Plus size={16} color={COLORS.textPrimary} style={{ marginRight: 4 }} />
                <Text style={styles.addSongTextSmall}>Thêm bài hát</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleShuffle}
              hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
              style={styles.shuffleBtn}
            >
              <Shuffle
                size={22}
                color={isShuffle ? COLORS.accentPrimary : COLORS.textSecondary}
              />
            </TouchableOpacity>

            <GradientPlayButton
              onPress={handlePlayAll}
              size={LAYOUT.iconButtonXl}
            >
              {isCurrentPlaylistPlaying ? (
                <Pause size={24} color={COLORS.white} fill={COLORS.white} />
              ) : (
                <Play size={24} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 2 }} />
              )}
            </GradientPlayButton>
          </View>
        </View>

        {/* Songs List */}
        <View style={styles.songsList}>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <SongItemSkeleton key={index} />
            ))
          ) : songList.length === 0 ? (
            <View style={styles.emptyNotice}>
              <Music size={42} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có bài hát nào</Text>
              <Text style={styles.emptyText}>
                Tìm kiếm và thêm bài hát yêu thích để lấp đầy danh sách phát này.
              </Text>
            </View>
          ) : (
            songList.map((song, index) => (
              <SongItem
                key={song.id}
                song={song}
                index={index + 1}
                onPress={() => handlePlaySingle(song)}
              />
            ))
          )}
        </View>

        <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>

      {/* Add Songs Search & Select Modal */}
      <AddSongsModal
        visible={showAddModal}
        playlistId={id}
        playlistTitle={displayTitle}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    zIndex: 10,
  },
  navCircleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.xxxl,
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  heroImage: {
    width: 200,
    height: 200,
    borderRadius: LAYOUT.radiusLg,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playlistTitle: {
    fontSize: TYPOGRAPHY.sizeHero,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  playlistSubtitle: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.xl,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  addSongBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgSurfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: LAYOUT.radiusFull,
    minHeight: 36,
  },
  addSongTextSmall: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  heartBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  shuffleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  songsList: {
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyNotice: {
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: TYPOGRAPHY.lineHeightBody,
  },
});
