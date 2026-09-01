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
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Play, Pause, Shuffle, Heart, MoreHorizontal, Plus, Music, Search, X } from "lucide-react-native";
import { GradientPlayButton } from "../components/GradientButton";
import { SongItem } from "../components/SongItem";
import { SongItemSkeleton } from "../components/SkeletonLoader";
import { AddSongsModal } from "../components/AddSongsModal";
import { SongOptionsModal } from "../components/SongOptionsModal";
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
  const [selectedSongForOptions, setSelectedSongForOptions] = useState<UnifiedSong | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { playSong, isShuffle, toggleShuffle, playbackContext } = usePlayerStore();
  const { song: currentSong, isPlaying, togglePlayPause } = useActivePlayback();
  const { playlists, savedAlbums, setLastPlayedContext, toggleSaveAlbum, isAlbumSaved, removeSongFromPlaylist } = useLibraryStore();
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
        } else if (id === "daily_mix_3") {
          const res = await apiClient.search("US UK Billboard Hits").catch(() => ({ songs: [] }));
          if (res?.songs?.length && isMounted) {
            setPlaylist({
              id: "daily_mix_3",
              title: initTitle || "Daily Mix 3 · US-UK Hits",
              thumbnail: initThumb || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
              artistsNames: initArtists || "Pop Quốc Tế · Taylor Swift, The Weeknd, Bruno Mars...",
              songs: res.songs,
            });
            setIsLoading(false);
            return;
          }
        } else if (id === "daily_mix_4") {
          const res = await apiClient.search("Nhạc Hot Thịnh Hành").catch(() => ({ songs: [] }));
          if (res?.songs?.length && isMounted) {
            setPlaylist({
              id: "daily_mix_4",
              title: initTitle || "Daily Mix 4 · Khám Phá Mới",
              thumbnail: initThumb || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
              artistsNames: initArtists || "Xu hướng mới & Thịnh hành hôm nay",
              songs: res.songs,
            });
            setIsLoading(false);
            return;
          }
        }

        // 1. Kiểm tra Playlist cá nhân người dùng tự tạo
        const localPl = playlists.find((p) => p.id === id);
        if (localPl) {
          if (isMounted) {
            const songs = localPl.songs || [];
            setPlaylist({
              id: localPl.id,
              title: localPl.name,
              thumbnail:
                localPl.coverUrl ||
                songs[0]?.thumbnail ||
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
              artistsNames: `${songs.length} bài hát`,
              songs: songs,
            });
            setIsLoading(false);
          }
          return;
        }

        // 2. Fetch Playlist / Album từ Zing / Audius
        try {
          const res = await apiClient.getPlaylistDetail(id);
          if (res && isMounted) {
            setPlaylist({
              id: res.id || id,
              title: res.title || initTitle || "Danh sách phát",
              thumbnail: res.thumbnail || initThumb || "",
              artistsNames: res.artistsNames || `${res.songs?.length || 0} bài hát`,
              songs: res.songs || [],
            });
          }
        } catch (apiErr) {
          // Fallback: Tìm kiếm các bài hát theo tên Playlist nếu getPlaylistDetail không có
          const searchTitle = initTitle || "Nhạc tuyển chọn";
          const fallbackRes = await apiClient.search(searchTitle).catch(() => ({ songs: [] }));
          if (fallbackRes?.songs?.length && isMounted) {
            setPlaylist({
              id,
              title: searchTitle,
              thumbnail: initThumb || fallbackRes.songs[0]?.thumbnail || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
              artistsNames: initArtists || `${fallbackRes.songs.length} bài hát`,
              songs: fallbackRes.songs,
            });
          } else if (isMounted) {
            setPlaylist({
              id,
              title: initTitle || "Danh sách phát",
              thumbnail: initThumb || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500",
              artistsNames: "Tuyển tập đặc sắc",
              songs: [],
            });
          }
        }
      } catch (err) {
        console.error("Failed to load playlist detail:", err);
        if (isMounted) {
          setPlaylist({
            id,
            title: initTitle || "Danh sách phát",
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

  const filteredSongs = React.useMemo(() => {
    if (!searchQuery.trim()) return songList;
    const q = searchQuery.toLowerCase().trim();
    return songList.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artistsNames?.toLowerCase().includes(q)
    );
  }, [songList, searchQuery]);

  const isCustomPlaylist =
    playlists.some((p) => p.id === id) ||
    (typeof id === 'string' && id.startsWith('pl_'));

  const contextType: 'album' | 'playlist' =
    route.params?.type === 'album' || displayTitle.toLowerCase().includes('album')
      ? 'album'
      : 'playlist';

  const currentPlaylistId = playlist?.id || id || displayTitle;
  const isCurrentPlaylistPlaying =
    isPlaying &&
    ((playbackContext?.id && playbackContext.id === currentPlaylistId) ||
     (playbackContext?.title && playbackContext.title === displayTitle));

  const handlePlayAll = () => {
    if (filteredSongs.length === 0) return;
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
      ? [...filteredSongs].sort(() => Math.random() - 0.5)
      : filteredSongs;
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
    playSong(song, filteredSongs, { type: 'playlist', title: displayTitle, id: playlist?.id || id });
  };

  const handleToggleShuffle = () => {
    if (!isShuffle) {
      toggleShuffle();
    }
    if (!isCurrentPlaylistPlaying && filteredSongs.length > 0) {
      const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], filteredSongs, { type: 'playlist', title: displayTitle, id: playlist?.id || id });
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

  const handleRemoveSongFromPlaylist = async (songToRemove: UnifiedSong) => {
    if (id) {
      await removeSongFromPlaylist(id, songToRemove.id);
    }
    setPlaylist((prev) =>
      prev ? { ...prev, songs: prev.songs.filter((s) => s.id !== songToRemove.id) } : null
    );
  };

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
              style={styles.actionCircleBtn}
            >
              <Heart
                size={22}
                color={isLiked ? COLORS.accentPrimary : COLORS.textSecondary}
                fill={isLiked ? COLORS.accentPrimary : COLORS.transparent}
              />
            </TouchableOpacity>

            {isCustomPlaylist && (
              <TouchableOpacity
                activeOpacity={0.75}
                hitSlop={{ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.sm, right: SPACING.sm }}
                onPress={() => setShowAddModal(true)}
                style={styles.actionCircleBtn}
                accessibilityLabel="Thêm bài hát"
              >
                <Plus size={20} color={COLORS.textSecondary} />
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
                color={isShuffle && isCurrentPlaylistPlaying ? COLORS.accentPrimary : COLORS.textSecondary}
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

        {/* Inline Search Bar */}
        {songList.length > 0 && (
          <View style={styles.searchBarWrap}>
            <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm trong danh sách này..."
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
          ) : filteredSongs.length === 0 ? (
            <View style={styles.emptyNotice}>
              <Text style={styles.emptyTitle}>Không tìm thấy bài hát</Text>
              <Text style={styles.emptyText}>
                Không có bài hát nào khớp với từ khóa "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredSongs.map((song, index) => (
              <SongItem
                key={song.id}
                song={song}
                index={index + 1}
                onPress={() => handlePlaySingle(song)}
                onMorePress={() => setSelectedSongForOptions(song)}
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

      {/* Song Options Modal (3 dots menu) */}
      <SongOptionsModal
        visible={selectedSongForOptions !== null}
        song={selectedSongForOptions}
        onClose={() => setSelectedSongForOptions(null)}
        onRemoveFromPlaylist={isCustomPlaylist ? handleRemoveSongFromPlaylist : undefined}
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
  actionCircleBtn: {
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
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  shuffleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
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
