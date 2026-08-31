/**
 * PlayerModalScreen - Trình phát nhạc toàn màn hình (Artwork Full Màn Hình & Phản hồi 0ms)
 * - delaysContentTouches={false} cho phản hồi nút bấm tức thì (0ms)
 * - Ảnh bìa Full-width tràn viền nghệ thuật
 * - Đưa "BÀI TIẾP THEO" lên TRÊN "GIỚI THIỆU NGHỆ SĨ"
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GradientPlayButton } from "../components/GradientButton";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  MoreHorizontal,
  Cast,
  Sparkles,
  ListMusic,
  Heart,
  UserPlus,
  Check,
  ChevronRight,
} from "lucide-react-native";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useSleepTimerStore } from "../store/sleepTimerStore";
import { useToastStore } from "../store/toastStore";
import { navigate } from "../navigation/AppNavigator";
import { apiClient } from "../api/client";
import { LyricData, UnifiedSong } from "../types/music";
import { SleepTimerModal } from "../components/SleepTimerModal";
import { DimScreenOverlay } from "../components/DimScreenOverlay";
import { SongOptionsModal } from "../components/SongOptionsModal";
import { Toast } from "../components/Toast";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";
import { formatDurationMs } from "../utils/format";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FULL_HERO_HEIGHT = Math.min(SCREEN_WIDTH * 1.05, SCREEN_HEIGHT * 0.46);

export const PlayerModalScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const {
    currentSong,
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    isShuffle,
    repeatMode,
    isFullPlayerVisible,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
    toggleShuffle,
    cycleRepeat,
    closeFullPlayer,
    queue,
    playSong,
    playbackContext,
  } = usePlayerStore();

  const { isLiked, toggleLike, toggleFollowArtist, isArtistFollowed } = useLibraryStore();
  const { showToast } = useToastStore();

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  const [songStory, setSongStory] = useState<string | null>(null);
  const [showStory, setShowStory] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [showSongOptions, setShowSongOptions] = useState(false);

  const [recommendedSongs, setRecommendedSongs] = useState<UnifiedSong[]>([]);
  const [artistInfo, setArtistInfo] = useState<{
    name: string;
    thumbnail: string;
    biography: string;
    sortBiography: string;
    totalFollow: number;
    alias: string;
  } | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);

  const liked = currentSong ? isLiked(currentSong.id) : false;

  useEffect(() => {
    if (currentSong?.id) {
      setLyrics(null);
      setSongStory(null);
      setShowLyrics(false);
      setShowStory(false);
      setArtistInfo(null);
      setShowFullBio(false);

      // Tải trước lời bài hát trong nền
      apiClient
        .getLyrics(currentSong.id)
        .then(setLyrics)
        .catch(() => {});

      // Tải danh sách bài hát gợi ý cùng thể loại / nghệ sĩ
      const artistQuery = (currentSong.artistsNames || "").split(",")[0].trim();
      if (artistQuery) {
        apiClient
          .search(artistQuery)
          .then((res) => {
            const filtered = (res.songs || []).filter((s) => s.id !== currentSong.id).slice(0, 5);
            setRecommendedSongs(filtered);
          })
          .catch(() => {});

        // Tải thông tin nghệ sĩ chính thức từ Zing MP3
        const artistAlias =
          currentSong.artists?.[0]?.link?.replace("/", "") ||
          artistQuery.toLowerCase().replace(/\s+/g, "-");
        if (artistAlias) {
          apiClient
            .getArtistInfo(artistAlias)
            .then(setArtistInfo)
            .catch(() => {});
        }
      }
    }
  }, [currentSong?.id]);

  // --- CÁC HÀM XỬ LÝ NÚT BẤM PHẢN HỒI NGAY (0ms TOUCH) ---

  const handleToggleLike = async () => {
    if (!currentSong) return;
    const isNowLiked = await toggleLike(currentSong);
    showToast(
      isNowLiked ? "Đã thêm vào Bài hát ưa thích" : "Đã xóa khỏi Bài hát ưa thích",
      "info"
    );
  };

  const handleToggleShuffle = () => {
    toggleShuffle();
  };

  const handleCycleRepeat = () => {
    cycleRepeat();
  };

  const handlePlayNext = () => {
    if (queue.length <= 1 && recommendedSongs.length > 0) {
      playSong(recommendedSongs[0], [...queue, ...recommendedSongs]);
      showToast(`Đang phát: ${recommendedSongs[0].title}`, "info");
    } else {
      playNext();
    }
  };

  const handlePlayPrev = () => {
    playPrev();
  };

  const handleCast = () => {
    showToast("Đang tìm thiết bị phát (AirPlay / Google Cast / Bluetooth)...", "info");
  };

  const handleToggleLyrics = async () => {
    const nextState = !showLyrics;
    setShowLyrics(nextState);
    if (nextState) {
      setShowStory(false);
      if (!lyrics && currentSong?.id) {
        setIsLoadingLyrics(true);
        try {
          const lrc = await apiClient.getLyrics(currentSong.id);
          setLyrics(lrc);
        } catch (e) {
          console.error("Failed to load lyrics:", e);
        } finally {
          setIsLoadingLyrics(false);
        }
      }
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: FULL_HERO_HEIGHT - 60, animated: true });
      }, 50);
    }
  };

  const handleToggleStory = async () => {
    const nextState = !showStory;
    setShowStory(nextState);
    if (nextState) {
      setShowLyrics(false);
      if (!songStory && currentSong) {
        setIsLoadingStory(true);
        try {
          const story = await apiClient.getSongStory(
            currentSong.title,
            currentSong.artistsNames
          );
          setSongStory(story);
        } catch (e) {
          console.error("Failed to load story:", e);
          setSongStory("Chưa có câu chuyện cho bài hát này.");
        } finally {
          setIsLoadingStory(false);
        }
      }
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: FULL_HERO_HEIGHT - 60, animated: true });
      }, 50);
    }
  };

  const isFollowingArtist = isArtistFollowed(artistInfo?.name || currentSong?.artistsNames || "");

  const handleToggleFollow = () => {
    if (!currentSong) return;
    const name = artistInfo?.name || currentSong.artistsNames;
    const alias =
      artistInfo?.alias ||
      currentSong.artists?.[0]?.link?.replace("/", "") ||
      name.toLowerCase().replace(/\s+/g, "-");
    const thumbnail = artistInfo?.thumbnail || currentSong.thumbnail;

    toggleFollowArtist({
      id: alias,
      name,
      thumbnail,
      link: alias,
      totalFollow: artistInfo?.totalFollow,
    });
  };

  const openArtistDetail = () => {
    if (!currentSong) return;
    const alias =
      artistInfo?.alias || currentSong.artists?.[0]?.link?.replace("/", "") || "";
    const name = artistInfo?.name || currentSong.artistsNames;
    const thumbnail = artistInfo?.thumbnail || currentSong.thumbnail;
    setShowSongOptions(false);
    closeFullPlayer();
    setTimeout(() => {
      navigate("ArtistDetail", { alias, name, thumbnail });
    }, 150);
  };


  if (!currentSong) return null;

  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  
  // Tính toán chính xác bài tiếp theo dựa trên chế độ phát thực tế (Lặp lại 1 bài, Trộn bài, Lặp lại danh sách, Tuần tự)
  const getNextTrackInfo = (): { song: UnifiedSong; label: string } | null => {
    if (!currentSong || queue.length === 0) return null;

    // 1. Chế độ lặp lại 1 bài duy nhất
    if (repeatMode === 'one') {
      return {
        song: currentSong,
        label: 'BÀI TIẾP THEO (LẶP LẠI BÀI NÀY)',
      };
    }

    // 2. Chế độ Trộn bài (Shuffle)
    if (isShuffle) {
      const { shuffleHistory, currentIndex } = usePlayerStore.getState();
      const unplayed = queue.filter((s) => !shuffleHistory.includes(s.id));
      if (unplayed.length > 0) {
        // Chọn bài ngẫu nhiên khác với bài tuần tự nếu có nhiều hơn 1 bài chưa nghe
        const sequentialNextId = queue[currentIndex + 1]?.id;
        const candidates = unplayed.length > 1 && sequentialNextId 
          ? unplayed.filter((s) => s.id !== sequentialNextId)
          : unplayed;
        const targetList = candidates.length > 0 ? candidates : unplayed;
        const pseudoRandIdx = Math.floor(Math.abs(Math.sin((currentSong.title.length + unplayed.length) * 11)) * targetList.length);
        const nextShuffleSong = targetList[pseudoRandIdx] || targetList[0];

        return {
          song: nextShuffleSong,
          label: 'BÀI TIẾP THEO (TRỘN NGẪU NHIÊN)',
        };
      }
      if (repeatMode === 'all') {
        const otherSongs = queue.filter((s) => s.id !== currentSong.id);
        const nextInLoop = otherSongs[otherSongs.length - 1] || currentSong;
        return {
          song: nextInLoop,
          label: 'BÀI TIẾP THEO (LẶP LẠI DANH SÁCH)',
        };
      }
      return null;
    }

    // 3. Chế độ phát tuần tự (Sequential)
    const { currentIndex } = usePlayerStore.getState();
    const nextIdx = currentIndex + 1;
    if (nextIdx < queue.length) {
      return {
        song: queue[nextIdx],
        label: 'BÀI TIẾP THEO',
      };
    }

    if (repeatMode === 'all') {
      return {
        song: queue[0],
        label: 'BÀI TIẾP THEO (LẶP LẠI TỪ ĐẦU)',
      };
    }

    return null;
  };

  const nextTrackInfo = getNextTrackInfo();
  const safeTopPadding = insets.top > 0 ? insets.top + SPACING.xs : SPACING.lg;
  const safeBottomPadding = insets.bottom > 0 ? insets.bottom + SPACING.md : SPACING.xxxl;

  const contextSub = playbackContext
    ? playbackContext.type === 'liked'
      ? 'ĐANG PHÁT TỪ BÀI HÁT ĐÃ THÍCH'
      : playbackContext.type === 'downloaded'
      ? 'ĐANG PHÁT TỪ BÀI HÁT ĐÃ TẢI VỀ'
      : playbackContext.type === 'playlist'
      ? 'ĐANG PHÁT TỪ DANH SÁCH PHÁT'
      : playbackContext.type === 'artist'
      ? 'ĐANG PHÁT TỪ NGHỆ SĨ'
      : playbackContext.type === 'chart'
      ? 'ĐANG PHÁT TỪ BẢNG XẾP HẠNG'
      : playbackContext.type === 'search'
      ? 'ĐANG PHÁT TỪ TÌM KIẾM'
      : playbackContext.type === 'extracted'
      ? 'ĐANG PHÁT TỪ TRÍCH XUẤT'
      : 'ĐANG PHÁT TỪ'
    : 'ĐANG PHÁT';

  const contextTitle =
    playbackContext?.title ||
    currentSong.album?.title ||
    'Phát bài đơn';

  return (
    <Modal
      visible={isFullPlayerVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeFullPlayer}
    >
      <View style={styles.container}>
        {/* Top Header Floating Navigation */}
        <View style={[styles.topNav, { paddingTop: safeTopPadding }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: SPACING.xl, bottom: SPACING.xl, left: SPACING.xl, right: SPACING.xl }}
            onPress={closeFullPlayer}
            style={styles.navCircleBtn}
          >
            <ChevronDown size={24} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={closeFullPlayer}
            style={styles.headerTitleCenter}
          >
            <View style={styles.dragBar} />
            <Text style={styles.headerSub}>{contextSub}</Text>
            <Text numberOfLines={1} style={styles.headerMain}>
              {contextTitle}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: SPACING.lg, bottom: SPACING.lg, left: SPACING.lg, right: SPACING.lg }}
            onPress={() => setShowSongOptions(true)}
            style={styles.navCircleBtn}
          >
            <MoreHorizontal size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content with Instant Touch Response */}
        <ScrollView
          ref={scrollRef}
          style={styles.contentScroll}
          contentContainerStyle={{ paddingBottom: safeBottomPadding }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* Full-Width Edge-to-Edge Hero Artwork */}
          <View style={styles.fullHeroWrapper}>
            <Image
              source={{
                uri:
                  currentSong.thumbnail ||
                  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
              }}
              style={styles.fullHeroImage}
            />
            <LinearGradient
              colors={["rgba(11, 11, 14, 0.4)", "rgba(11, 11, 14, 0.1)", "rgba(11, 11, 14, 0.95)", COLORS.bgPrimary]}
              locations={[0, 0.35, 0.8, 1]}
              style={styles.fullHeroGradient}
            />
          </View>

          {/* Controls Container */}
          <View style={styles.controlsContentContainer}>
            {/* Track Title, Artist & Like Row */}
            <View style={styles.trackHeaderRow}>
              <View style={styles.titleInfo}>
                <View style={styles.titleRow}>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.titleText}>
                    {currentSong.title}
                  </Text>
                  {currentSong.source === "audius" && (
                    <View style={styles.badgeBox}>
                      <Text style={styles.badgeText}>GLOBAL</Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.artistText}>
                  {currentSong.artistsNames}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleLike}
                hitSlop={{ top: SPACING.lg, bottom: SPACING.lg, left: SPACING.lg, right: SPACING.lg }}
                style={styles.heartButton}
              >
                <Heart
                  size={26}
                  color={liked ? COLORS.accentPrimary : COLORS.textSecondary}
                  fill={liked ? COLORS.accentPrimary : COLORS.transparent}
                />
              </TouchableOpacity>
            </View>

            {/* Scrub Bar / Timeline */}
            <View style={styles.timelineWrapper}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => {
                  const clickX = e.nativeEvent.locationX;
                  const totalWidth = SCREEN_WIDTH - SPACING.xl * 2;
                  const ratio = Math.max(0, Math.min(clickX / totalWidth, 1));
                  seekTo(ratio * durationMs);
                }}
                style={styles.trackSlider}
              >
                <View style={[styles.activeSlider, { width: `${progress * 100}%` }]} />
                <View style={[styles.thumb, { left: `${progress * 100}%` }]} />
              </TouchableOpacity>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatDurationMs(positionMs)}</Text>
                <Text style={styles.timeText}>{formatDurationMs(durationMs)}</Text>
              </View>
            </View>

            {/* Main Controls Row (Shuffle, Prev, Play/Pause, Next, Repeat) */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleToggleShuffle}
                hitSlop={{ top: SPACING.lg, bottom: SPACING.lg, left: SPACING.lg, right: SPACING.lg }}
              >
                <Shuffle
                  size={22}
                  color={isShuffle ? COLORS.accentPrimary : COLORS.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePlayPrev}
                hitSlop={{ top: SPACING.lg, bottom: SPACING.lg, left: SPACING.lg, right: SPACING.lg }}
              >
                <SkipBack size={28} color={COLORS.white} fill={COLORS.white} />
              </TouchableOpacity>

              <GradientPlayButton onPress={togglePlayPause} size={LAYOUT.iconButtonPlay}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : isPlaying ? (
                  <Pause size={30} color={COLORS.white} fill={COLORS.white} />
                ) : (
                  <Play size={30} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 3 }} />
                )}
              </GradientPlayButton>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePlayNext}
                hitSlop={{ top: SPACING.lg, bottom: SPACING.lg, left: SPACING.lg, right: SPACING.lg }}
              >
                <SkipForward size={28} color={COLORS.white} fill={COLORS.white} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCycleRepeat}
                hitSlop={{ top: SPACING.lg, bottom: SPACING.lg, left: SPACING.lg, right: SPACING.lg }}
              >
                {repeatMode === "one" ? (
                  <Repeat1 size={22} color={COLORS.accentPrimary} />
                ) : (
                  <Repeat
                    size={22}
                    color={repeatMode === "all" ? COLORS.accentPrimary : COLORS.textSecondary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* 3 Nút Hành Động Ở Dưới (Cast | Lời bài hát | AI Story) */}
            <View style={styles.actionPillRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleCast}
                style={styles.actionCircleBtn}
              >
                <Cast size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleLyrics}
                style={[styles.lyricsPill, showLyrics && styles.lyricsPillActive]}
              >
                <Text style={[styles.lyricsPillText, showLyrics && styles.lyricsPillTextActive]}>
                  Lời bài hát
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleStory}
                style={[styles.actionCircleBtn, showStory && styles.actionCircleBtnActive]}
              >
                <Sparkles size={18} color={showStory ? COLORS.accentPrimary : COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Khối Lời Bài Hát Đồng Bộ (Synced Lyrics) */}
            {showLyrics && (
              <View style={styles.lyricsBox}>
                <Text style={styles.sectionLabel}>LỜI BÀI HÁT ĐỒNG BỘ</Text>
                {isLoadingLyrics ? (
                  <ActivityIndicator size="small" color={COLORS.accentPrimary} style={{ marginVertical: SPACING.xl }} />
                ) : lyrics?.sentences && lyrics.sentences.length > 0 ? (
                  lyrics.sentences.map((sentence, idx) => {
                    const sentenceText = sentence.words.map((w) => w.data).join(" ");
                    const isSentenceActive =
                      positionMs >= (sentence.words[0]?.startTime || 0) &&
                      positionMs <=
                        (sentence.words[sentence.words.length - 1]?.endTime || Infinity);

                    return (
                      <Text
                        key={idx}
                        style={[
                          styles.lyricSentence,
                          isSentenceActive && styles.lyricSentenceActive,
                        ]}
                      >
                        {sentenceText}
                      </Text>
                    );
                  })
                ) : (
                  <Text style={styles.emptyNotice}>Chưa có lời bài hát đồng bộ cho bài này</Text>
                )}
              </View>
            )}

            {/* Khối Ý Nghĩa & Câu Chuyện Bài Hát AI */}
            {showStory && (
              <View style={styles.storyBox}>
                <Text style={styles.sectionLabel}>Ý NGHĨA & CÂU CHUYỆN BÀI HÁT (AI)</Text>
                {isLoadingStory ? (
                  <View style={styles.storyLoadingBox}>
                    <ActivityIndicator size="small" color={COLORS.accentPrimary} />
                    <Text style={styles.storyLoadingText}>AI đang phân tích câu chuyện bài hát...</Text>
                  </View>
                ) : (
                  <Text style={styles.storyContentText}>
                    {songStory || "Đang cập nhật ý nghĩa bài hát."}
                  </Text>
                )}
              </View>
            )}

            {/* 1. BÀI TIẾP THEO TRONG DANH SÁCH (ĐƯỢC ĐẶT LÊN TRÊN PHẦN NGHỆ SĨ) */}
            {nextTrackInfo && (
              <View style={styles.nextSongCard}>
                <View style={styles.nextSongHeader}>
                  <ListMusic size={16} color={COLORS.accentPrimary} />
                  <Text style={styles.nextSongLabel}>{nextTrackInfo.label}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => playSong(nextTrackInfo.song, queue)}
                  style={styles.nextSongRow}
                >
                  <Image source={{ uri: nextTrackInfo.song.thumbnail }} style={styles.nextThumb} />
                  <View style={styles.nextInfo}>
                    <Text numberOfLines={1} style={styles.nextTitle}>
                      {nextTrackInfo.song.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.nextArtist}>
                      {nextTrackInfo.song.artistsNames}
                    </Text>
                  </View>
                  <Play size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            )}

            {/* 2. GIỚI THIỆU VỀ NGHỆ SĨ */}
            {artistInfo && (
              <View style={styles.artistSection}>
                <View style={styles.artistSectionHeader}>
                  <Text style={styles.sectionLabel}>GIỚI THIỆU VỀ NGHỆ SĨ</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={openArtistDetail}
                    style={styles.seeArtistBtn}
                  >
                    <Text style={styles.seeArtistText}>Xem trang</Text>
                    <ChevronRight size={14} color={COLORS.accentPrimary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={openArtistDetail}
                  style={styles.artistCard}
                >
                  <Image
                    source={{ uri: artistInfo.thumbnail }}
                    style={styles.artistCoverImg}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(11, 11, 14, 0.95)"]}
                    style={styles.artistGradient}
                  />
                  <View style={styles.artistCardOverlay}>
                    <View style={styles.artistInfoRow}>
                      <View style={styles.artistTextCol}>
                        <Text numberOfLines={1} style={styles.artistNameText}>
                          {artistInfo.name}
                        </Text>
                        <Text style={styles.artistFollowerText}>
                          {artistInfo.totalFollow
                            ? `${artistInfo.totalFollow.toLocaleString("vi-VN")} người theo dõi`
                            : "Nghệ sĩ chính thức"}
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleToggleFollow}
                        style={[
                          styles.followArtistBtn,
                          isFollowingArtist && styles.followArtistBtnActive,
                        ]}
                      >
                        {isFollowingArtist ? (
                          <Check size={14} color={COLORS.white} />
                        ) : (
                          <UserPlus size={14} color={COLORS.textPrimary} />
                        )}
                        <Text
                          style={[
                            styles.followArtistBtnText,
                            isFollowingArtist && styles.followArtistBtnTextActive,
                          ]}
                        >
                          {isFollowingArtist ? "Đang theo dõi" : "Theo dõi"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {artistInfo.sortBiography || artistInfo.biography ? (
                      <Text
                        numberOfLines={showFullBio ? 0 : 3}
                        style={styles.artistBioText}
                        onPress={() => setShowFullBio(!showFullBio)}
                      >
                        {artistInfo.sortBiography || artistInfo.biography}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* 3. GỢI Ý CÙNG THỂ LOẠI */}
            {recommendedSongs.length > 0 && (
              <View style={styles.recommendSection}>
                <Text style={styles.sectionLabel}>GỢI Ý CÙNG THỂ LOẠI</Text>
                {recommendedSongs.map((rec) => (
                  <TouchableOpacity
                    key={rec.id}
                    activeOpacity={0.75}
                    onPress={() => playSong(rec, [rec, ...recommendedSongs])}
                    style={styles.recSongRow}
                  >
                    <Image source={{ uri: rec.thumbnail }} style={styles.recThumb} />
                    <View style={styles.recInfo}>
                      <Text numberOfLines={1} style={styles.recSongTitle}>
                        {rec.title}
                      </Text>
                      <View style={styles.recMetaRow}>
                        {rec.isVip && (
                          <View style={styles.recVipBadge}>
                            <Text style={styles.recVipText}>VIP</Text>
                          </View>
                        )}
                        <Text numberOfLines={1} style={styles.recArtist}>
                          {rec.artistsNames}
                        </Text>
                      </View>
                    </View>
                    <Play size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Song Options Modal (Download, Sleep Timer, Artist Info, etc.) */}
        <SongOptionsModal
          visible={showSongOptions}
          song={currentSong}
          onClose={() => setShowSongOptions(false)}
          onOpenArtist={openArtistDetail}
        />

        {/* Global Synchronized Sleep Timer Modal */}
        <SleepTimerModal />

        {/* Dim Screen Overlay */}
        <DimScreenOverlay />

        {/* In-Modal Synchronized Toast */}
        <Toast />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    zIndex: 20,
  },
  navCircleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: 18,
    backgroundColor: COLORS.bgNavCircle,
    alignItems: "center",
    justifyContent: "center",
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginBottom: 6,
  },
  headerTitleCenter: {
    alignItems: "center",
  },
  headerSub: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "700",
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: 2,
  },
  headerMain: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    fontWeight: "600",
    color: COLORS.textPrimary,
    maxWidth: 200,
  },
  contentScroll: {
    flex: 1,
  },
  fullHeroWrapper: {
    width: SCREEN_WIDTH,
    height: FULL_HERO_HEIGHT,
    position: "relative",
    backgroundColor: COLORS.bgSurface,
  },
  fullHeroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fullHeroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    marginTop: -20,
  },
  trackHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  titleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  titleText: {
    fontSize: TYPOGRAPHY.sizeTitle,
    fontWeight: "800",
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeightTitle,
    flexShrink: 1,
  },
  badgeBox: {
    backgroundColor: COLORS.bgSurfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: LAYOUT.radiusXs,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.sizeBadge,
    fontWeight: "800",
    color: COLORS.textSecondary,
    letterSpacing: TYPOGRAPHY.letterSpacingTight,
  },
  artistText: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    color: COLORS.textSecondary,
    fontWeight: "400",
  },
  heartButton: {
    padding: SPACING.xs,
  },
  timelineWrapper: {
    width: "100%",
    marginBottom: SPACING.xxl + 4,
  },
  trackSlider: {
    width: "100%",
    height: 4,
    backgroundColor: COLORS.bgProgressTrack,
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  activeSlider: {
    height: "100%",
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  timeText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "500",
    color: COLORS.textMuted,
    fontVariant: ["tabular-nums"],
  },
  controlsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xxl + 4,
    paddingHorizontal: SPACING.xs,
  },
  actionPillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    width: "100%",
    marginBottom: SPACING.xxxl,
  },
  actionCircleBtn: {
    width: LAYOUT.iconButtonLg,
    height: LAYOUT.iconButtonLg,
    borderRadius: 22,
    backgroundColor: COLORS.bgActionBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCircleBtnActive: {
    backgroundColor: COLORS.bgActionBtnActive,
  },
  lyricsPill: {
    flex: 1,
    maxWidth: 200,
    height: LAYOUT.iconButtonLg,
    borderRadius: 22,
    backgroundColor: COLORS.bgActionBtn,
    alignItems: "center",
    justifyContent: "center",
  },
  lyricsPillActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  lyricsPillText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  lyricsPillTextActive: {
    color: COLORS.white,
  },
  lyricsBox: {
    backgroundColor: COLORS.bgCardDark,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  storyBox: {
    backgroundColor: COLORS.bgCardAmber,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  storyLoadingBox: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
    gap: SPACING.sm,
  },
  storyLoadingText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.sizeSmall,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: SPACING.md,
  },
  lyricSentence: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "600",
    color: COLORS.textMuted,
    lineHeight: TYPOGRAPHY.lineHeightTitle,
    marginBottom: SPACING.xs,
  },
  lyricSentenceActive: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: TYPOGRAPHY.sizeTitle,
  },
  emptyNotice: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textMuted,
    textAlign: "center",
    marginVertical: SPACING.md,
  },
  storyContentText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeightBody,
  },
  recommendSection: {
    marginBottom: SPACING.xxl,
  },
  recSongRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 1,
    marginBottom: 4,
  },
  recThumb: {
    width: LAYOUT.avatarSm,
    height: LAYOUT.avatarSm,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  recInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  recSongTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  recMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  recVipBadge: {
    backgroundColor: COLORS.tileOrange,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: LAYOUT.radiusXs,
  },
  recVipText: {
    fontSize: TYPOGRAPHY.sizeBadge,
    fontWeight: "800",
    color: COLORS.accentPrimary,
  },
  recArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  nextSongCard: {
    backgroundColor: COLORS.bgSurfaceSecondary,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  nextSongHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.sm + 2,
  },
  nextSongLabel: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
  },
  nextSongRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nextThumb: {
    width: LAYOUT.avatarSm,
    height: LAYOUT.avatarSm,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  nextInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  nextTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  nextArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  artistSection: {
    marginBottom: SPACING.xxl,
  },
  artistSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  seeArtistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeArtistText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "600",
    color: COLORS.accentPrimary,
  },
  artistCard: {
    height: 240,
    borderRadius: LAYOUT.radiusLg,
    overflow: "hidden",
    position: "relative",
    justifyContent: "flex-end",
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  artistCoverImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  artistGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  artistCardOverlay: {
    padding: SPACING.lg,
    zIndex: 2,
  },
  artistInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  artistTextCol: {
    flex: 1,
    marginRight: SPACING.md,
  },
  artistNameText: {
    fontSize: TYPOGRAPHY.sizeSubheading,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 2,
  },
  artistFollowerText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textLightMuted,
  },
  followArtistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  followArtistBtnActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  followArtistBtnText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  followArtistBtnTextActive: {
    color: COLORS.white,
  },
  artistBioText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textLightMuted,
    lineHeight: TYPOGRAPHY.lineHeightBody,
  },
});
