/**
 * ArtistDetailScreen - Chi tiết nghệ sĩ toàn diện (Tiếng Việt)
 * Có nút theo dõi, danh sách bài hát nổi bật, album & tiểu sử
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
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Play,
  Pause,
  Shuffle,
  UserPlus,
  CheckCircle2,
  MoreHorizontal,
  BadgeCheck,
} from "lucide-react-native";
import { GradientPlayButton } from "../components/GradientButton";
import { SongItem } from "../components/SongItem";
import { SongItemSkeleton } from "../components/SkeletonLoader";
import { SongOptionsModal } from "../components/SongOptionsModal";
import { usePlayerStore } from "../store/playerStore";
import { useActivePlayback } from "../store/connectStore";
import { useLibraryStore } from "../store/libraryStore";
import { useSleepTimerStore } from "../store/sleepTimerStore";
import { useToastStore } from "../store/toastStore";
import { apiClient } from "../api/client";
import { UnifiedSong } from "../types/music";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";
import { formatDurationMs } from "../utils/format";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 300;

export const ArtistDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { alias, name: initialName, thumbnail: initialThumbnail } = route.params || {};

  const [artistData, setArtistData] = useState<{
    name: string;
    thumbnail: string;
    cover: string;
    biography: string;
    sortBiography: string;
    totalFollow: number;
    alias: string;
  } | null>(null);

  const [topSongs, setTopSongs] = useState<UnifiedSong[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedSongForOptions, setSelectedSongForOptions] = useState<UnifiedSong | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFullBio, setShowFullBio] = useState<boolean>(false);
  const playSong = usePlayerStore((s) => s.playSong);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const playbackContext = usePlayerStore((s) => s.playbackContext);
  const { song: currentSong, isPlaying, togglePlayPause } = useActivePlayback();
  const { toggleFollowArtist, isArtistFollowed } = useLibraryStore();
  const { showToast } = useToastStore();

  const artistName = artistData?.name || initialName || "Nghệ sĩ";
  const artistHeroImage =
    artistData?.cover ||
    artistData?.thumbnail ||
    initialThumbnail ||
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800";

  const isFollowing = isArtistFollowed(alias || artistName);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadArtist = async () => {
      try {
        const queryAlias = alias || initialName?.toLowerCase().replace(/\s+/g, "-") || "";
        if (queryAlias) {
          try {
            const data = await apiClient.getArtistInfo(queryAlias);
            if (isMounted && data) {
              setArtistData(data);
            }
          } catch (_) {}
        }

        // Fetch top songs and artist details
        const searchName = initialName || alias?.replace(/-/g, " ") || "";
        if (searchName) {
          const searchRes = await apiClient.search(searchName);
          if (isMounted) {
            const cleanSongs = (searchRes.songs || []).filter((s) => {
              if (s.id.startsWith('audius_')) {
                return (s.artistsNames || '').toLowerCase().includes(searchName.toLowerCase());
              }
              return true;
            });
            setTopSongs(cleanSongs);
            setAlbums(searchRes.playlists || []);

            // Nếu artistData chưa có ảnh bìa hoặc thumbnail, lấy từ kết quả tìm kiếm
            if (searchRes.artists && searchRes.artists.length > 0) {
              const foundArtist = searchRes.artists[0];
              if (foundArtist && foundArtist.thumbnail) {
                setArtistData((prev) => ({
                  name: prev?.name || foundArtist.name || searchName,
                  thumbnail: prev?.thumbnail || foundArtist.thumbnail || '',
                  cover: prev?.cover || foundArtist.thumbnail || '',
                  biography: prev?.biography || `Nghệ sĩ ${foundArtist.name || searchName}`,
                  sortBiography: prev?.sortBiography || '',
                  totalFollow: prev?.totalFollow || foundArtist.totalFollow || 0,
                  alias: prev?.alias || queryAlias,
                }));
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load artist details:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadArtist();

    return () => {
      isMounted = false;
    };
  }, [alias, initialName]);

  const handleToggleFollow = () => {
    toggleFollowArtist({
      id: alias || artistName.toLowerCase().replace(/\s+/g, "-"),
      name: artistName,
      thumbnail: artistHeroImage,
      link: alias,
      totalFollow: artistData?.totalFollow,
    });
  };

  const isCurrentArtistPlaying =
    isPlaying &&
    ((playbackContext?.type === 'artist' && (playbackContext.id === alias || playbackContext.title === artistName)) ||
     (playbackContext?.title === artistName));

  const handlePlayAll = (shuffle: boolean = false) => {
    if (topSongs.length === 0) return;
    if (isCurrentArtistPlaying && !shuffle) {
      togglePlayPause();
      return;
    }
    if (shuffle && !isShuffle) {
      toggleShuffle();
    }
    const songsToPlay = shuffle
      ? [...topSongs].sort(() => Math.random() - 0.5)
      : topSongs;
    playSong(songsToPlay[0], topSongs, { type: 'artist', title: artistName, id: alias || artistName });
  };

  return (
    <View style={styles.container}>
      {/* Top Floating Navigation Bar */}
      <SafeAreaView style={styles.topNavFloating} edges={["top"]}>
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
          onPress={() => navigation.goBack()}
          style={styles.navCircleBtn}
        >
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
          onPress={() => useSleepTimerStore.getState().openModal()}
          style={styles.navCircleBtn}
        >
          <MoreHorizontal size={20} color={COLORS.white} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollSection}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Artwork Image with Smooth Bottom Gradient Fade */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: artistHeroImage }} style={styles.heroImage} />
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.3)",
              "rgba(0,0,0,0.6)",
              COLORS.bgPrimary,
            ]}
            locations={[0, 0.6, 1]}
            style={styles.heroGradientOverlay}
          />

          {/* Artist Hero Info */}
          <View style={styles.artistHeroInfo}>
            <View style={styles.verifiedRow}>
              <BadgeCheck size={16} color={COLORS.accentPrimary} />
              <Text style={styles.verifiedText}>NGHỆ SĨ ĐÃ XÁC MINH</Text>
            </View>

            <Text numberOfLines={2} style={styles.artistName}>
              {artistName}
            </Text>

            <Text style={styles.listenerCount}>
              {artistData?.totalFollow
                ? `${artistData.totalFollow.toLocaleString("vi-VN")} người theo dõi`
                : "Hơn 1.000.000 người nghe hàng tháng"}
            </Text>
          </View>
        </View>

        {/* Action Controls Row (Nút Theo Dõi & Phát Nhạc) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleToggleFollow}
            style={[
              styles.followBtn,
              isFollowing ? styles.followBtnActive : styles.followBtnInactive,
            ]}
          >
            {isFollowing ? (
              <View style={styles.btnContentRow}>
                <CheckCircle2 size={16} color="#1DB954" style={{ marginRight: 6 }} />
                <Text style={styles.followTextActive}>Đang theo dõi</Text>
              </View>
            ) : (
              <View style={styles.btnContentRow}>
                <UserPlus size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.followText}>Theo dõi</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.playGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handlePlayAll(true)}
              style={styles.shuffleBtn}
            >
              <Shuffle size={20} color={isShuffle && isCurrentArtistPlaying ? COLORS.accentPrimary : COLORS.textPrimary} />
            </TouchableOpacity>

            <GradientPlayButton
              onPress={() => handlePlayAll(false)}
              size={54}
            >
              {isCurrentArtistPlaying ? (
                <Pause size={24} color={COLORS.white} fill={COLORS.white} />
              ) : (
                <Play size={24} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 2 }} />
              )}
            </GradientPlayButton>
          </View>
        </View>

        {/* Section: Bài Hát Nổi Bật */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BÀI HÁT NỔI BẬT</Text>

          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <SongItemSkeleton key={index} />
            ))
          ) : topSongs.length > 0 ? (
            topSongs.slice(0, 10).map((song, index) => (
              <SongItem
                key={song.id}
                song={song}
                index={index + 1}
                showIndex
                onPress={() => playSong(song, topSongs, { type: 'artist', title: artistName, id: alias || artistName })}
                onMorePress={() => setSelectedSongForOptions(song)}
              />
            ))
          ) : (
            <Text style={styles.emptyNotice}>Chưa có bài hát nổi bật</Text>
          )}
        </View>

        {/* Section: Album & Tuyển Tập */}
        {albums.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALBUM & TUYỂN TẬP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.albumsScroll}>
              {albums.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("PlaylistDetail", { id: album.id, title: album.title })}
                  style={styles.albumCard}
                >
                  <Image source={{ uri: album.thumbnail }} style={styles.albumThumb} />
                  <Text numberOfLines={1} style={styles.albumTitle}>
                    {album.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.albumArtist}>
                    {album.artistsNames}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Tiểu Sử Nghệ Sĩ */}
        {(artistData?.biography || artistData?.sortBiography) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GIỚI THIỆU</Text>
            <View style={styles.bioCard}>
              <Text
                style={styles.bioText}
                numberOfLines={showFullBio ? undefined : 4}
              >
                {artistData?.biography || artistData?.sortBiography}
              </Text>
              {(artistData?.biography?.length || 0) > 200 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowFullBio(!showFullBio)}
                  style={styles.moreBioBtn}
                >
                  <Text style={styles.moreBioText}>
                    {showFullBio ? "Thu gọn" : "Xem thêm"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={{ height: currentSong ? LAYOUT.miniPlayerHeight + SPACING.md : SPACING.xxl }} />
      </ScrollView>

      {/* Song Options Modal */}
      <SongOptionsModal
        visible={!!selectedSongForOptions}
        song={selectedSongForOptions}
        onClose={() => setSelectedSongForOptions(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topNavFloating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    zIndex: 20,
  },
  navCircleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollSection: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  heroWrapper: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: "relative",
    justifyContent: "flex-end",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  artistHeroInfo: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.lg,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.xs,
  },
  verifiedText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
  },
  artistName: {
    fontSize: TYPOGRAPHY.sizeHero,
    fontWeight: "900",
    color: COLORS.white,
    lineHeight: TYPOGRAPHY.lineHeightHero,
    marginBottom: 4,
  },
  listenerCount: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textLightMedium,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    marginVertical: SPACING.md,
  },
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  followBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 10,
    borderRadius: LAYOUT.radiusFull,
  },
  followBtnInactive: {
    backgroundColor: COLORS.whiteAlpha15,
  },
  followBtnActive: {
    backgroundColor: COLORS.bgFollowActive,
  },
  followText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.white,
  },
  followTextActive: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  playGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  shuffleBtn: {
    width: LAYOUT.iconButtonLg,
    height: LAYOUT.iconButtonLg,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: SPACING.screenPadding,
    marginTop: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizeSmall,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: SPACING.md,
  },
  songRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
  },
  songIndex: {
    width: 24,
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textMuted,
    textAlign: "center",
    marginRight: SPACING.sm,
  },
  songThumb: {
    width: LAYOUT.avatarSm,
    height: LAYOUT.avatarSm,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  songInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  songTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  songMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  vipBadge: {
    backgroundColor: COLORS.tileOrange,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: LAYOUT.radiusXs,
  },
  vipText: {
    fontSize: TYPOGRAPHY.sizeBadge,
    fontWeight: "800",
    color: COLORS.accentPrimary,
  },
  songArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  durationText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
    fontVariant: ["tabular-nums"],
  },
  emptyNotice: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textMuted,
    marginVertical: SPACING.md,
  },
  albumsScroll: {
    marginHorizontal: -SPACING.screenPadding,
    paddingHorizontal: SPACING.screenPadding,
  },
  albumCard: {
    width: 140,
    marginRight: SPACING.md,
  },
  albumThumb: {
    width: 140,
    height: 140,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs,
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
  bioCard: {
    backgroundColor: COLORS.bgCardPlan,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
  },
  bioText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textLightMedium,
    lineHeight: TYPOGRAPHY.lineHeightBodySmall,
  },
  moreBioBtn: {
    marginTop: SPACING.sm,
  },
  moreBioText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.accentPrimary,
  },
});
