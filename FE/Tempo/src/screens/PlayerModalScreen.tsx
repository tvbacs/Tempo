/**
 * PlayerModalScreen - SoundCloud-Style Fullscreen Immersive Music Player
 * - Edge-to-edge background artwork with atmospheric gradient overlay
 * - SoundCloud dual mirrored soundwave progress scrubber with real-time time badge
 * - Playback controls in primary dock, Tempo action icons in bottom bar
 * - Dedicated fullscreen lyrics button and AI story integration
 * Strictly follows STANDARDS.md
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
import Slider from "@react-native-community/slider";
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
  ListMusic,
  Heart,
  UserPlus,
  Check,
  ChevronRight,
  Radio,
  VolumeX,
  Volume2,
  Download,
  Mic2,
  BookOpen,
  CheckCircle2,
} from "lucide-react-native";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useDownloadStore } from "../store/downloadStore";
import { useSleepTimerStore } from "../store/sleepTimerStore";
import { useToastStore } from "../store/toastStore";
import { navigate } from "../navigation/navigationRef";
import { apiClient } from "../api/client";
import { LyricData, UnifiedSong } from "../types/music";
import { SleepTimerModal } from "../components/SleepTimerModal";
import { SongOptionsModal } from "../components/SongOptionsModal";
import { Toast } from "../components/Toast";
import { useConnectStore, useActivePlayback } from "../store/connectStore";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";
import { WaveformScrubber } from "../components/WaveformScrubber";
import { LyricsModalScreen } from "./LyricsModalScreen";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Chiều cao ảnh nền kết thúc ngang tầm hàng nút Lời bài hát & controls
const ARTWORK_HEIGHT = Math.round(SCREEN_HEIGHT * 0.70);

function getHighResArtworkUrl(url?: string): string {
  if (!url) return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1080";
  // Tự động nâng cấp thumbnail Zing MP3 từ w240/w360 lên w1024 để không bị vỡ/mờ
  return url.replace(/\/w\d+_/g, "/w1024_");
}

const FullPlayerContent: React.FC = () => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const {
    isRemote,
    song: currentSong,
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    queue,
    device: activeDevice,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
  } = useActivePlayback(true);

  const {
    isShuffle,
    repeatMode,
    isFullPlayerVisible,
    toggleShuffle,
    cycleRepeat,
    closeFullPlayer,
    openLyricsScreen,
    playSong,
    playbackContext,
    getNextTrack,
  } = usePlayerStore();

  const { volume: remoteVolume, setVolume: setRemoteVolume } = useConnectStore();
  const { isLiked, toggleLike, toggleFollowArtist, isArtistFollowed } = useLibraryStore();
  const { downloadSong, isDownloaded, isDownloading } = useDownloadStore();
  const { showToast } = useToastStore();

  const [songStory, setSongStory] = useState<string | null>(null);
  const [showStory, setShowStory] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [showSongOptions, setShowSongOptions] = useState(false);

  const [recommendedSongs, setRecommendedSongs] = useState<UnifiedSong[]>([]);
  const [artistInfo, setArtistInfo] = useState<{
    name: string;
    thumbnail: string;
    cover?: string;
    biography: string;
    sortBiography: string;
    totalFollow: number;
    alias: string;
  } | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);

  const liked = currentSong ? isLiked(currentSong.id) : false;

  useEffect(() => {
    if (currentSong?.id) {
      setSongStory(null);
      setShowStory(false);
      setArtistInfo(null);
      setShowFullBio(false);

      // Tải danh sách bài hát gợi ý và thông tin nghệ sĩ chính thức
      const artistQuery = (currentSong.artistsNames || "").split(",")[0].trim();
      if (artistQuery) {
        apiClient
          .search(artistQuery)
          .then((res) => {
            const filtered = (res.songs || []).filter((s) => s.id !== currentSong.id).slice(0, 5);
            setRecommendedSongs(filtered);

            if (res.artists && res.artists.length > 0) {
              const matched = res.artists[0];
              if (matched) {
                setArtistInfo((prev) => ({
                  name: matched.name || artistQuery,
                  thumbnail: matched.thumbnail || prev?.thumbnail || currentSong.thumbnail || '',
                  cover: matched.thumbnail || prev?.cover || currentSong.thumbnail || '',
                  biography: prev?.biography || `Nghệ sĩ ${matched.name || artistQuery}`,
                  sortBiography: prev?.sortBiography || '',
                  totalFollow: matched.totalFollow || prev?.totalFollow || 0,
                  alias: (matched as any).alias || (matched as any).id || artistQuery.toLowerCase().replace(/\s+/g, "-"),
                }));
              }
            }
          })
          .catch(() => {});

        const artistAlias =
          currentSong.artists?.[0]?.link?.replace("/", "") ||
          artistQuery.toLowerCase().replace(/\s+/g, "-");

        if (artistAlias) {
          apiClient
            .getArtistInfo(artistAlias)
            .then((info) => {
              if (info) {
                setArtistInfo((prev) => ({
                  ...info,
                  thumbnail: info.thumbnail || info.cover || prev?.thumbnail || currentSong.thumbnail || '',
                  cover: info.cover || info.thumbnail || prev?.cover || currentSong.thumbnail || '',
                }));
              }
            })
            .catch(() => {
              setArtistInfo((prev) => prev || {
                name: artistQuery,
                thumbnail: currentSong.thumbnail || '',
                cover: currentSong.thumbnail || '',
                biography: `Nghệ sĩ ${artistQuery}`,
                sortBiography: '',
                totalFollow: 0,
                alias: artistAlias,
              });
            });
        }
      }
    }
  }, [currentSong?.id]);

  const handleToggleLike = async () => {
    if (!currentSong) return;
    const isNowLiked = await toggleLike(currentSong);
    showToast(
      isNowLiked ? "Đã thêm vào Bài hát ưa thích" : "Đã xóa khỏi Bài hát ưa thích",
      "info"
    );
  };

  const isExtractedOrSingle =
    playbackContext?.type === 'extracted' || queue.length <= 1;

  const handleToggleShuffle = () => {
    toggleShuffle();
    if (isExtractedOrSingle) {
      showToast(
        "Đang phát 1 bài. Thêm bài hát vào Thư viện hoặc Playlist để dùng tính năng Trộn bài!",
        "info"
      );
    }
  };

  const handleCycleRepeat = () => {
    cycleRepeat();
    if (isExtractedOrSingle && repeatMode === 'off') {
      showToast(
        "Danh sách chỉ có 1 bài. Thêm vào Playlist để lặp toàn bộ danh sách!",
        "info"
      );
    }
  };

  const handlePlayNext = () => {
    if (isExtractedOrSingle) {
      showToast(
        "Danh sách chỉ có 1 bài hát. Hãy thêm vào Thư viện hoặc Danh sách phát để chuyển bài!",
        "info"
      );
    } else {
      playNext();
    }
  };

  const handlePlayPrev = () => {
    if (isExtractedOrSingle) {
      showToast(
        "Danh sách chỉ có 1 bài hát. Hãy thêm vào Thư viện hoặc Danh sách phát để chuyển bài!",
        "info"
      );
    } else {
      playPrev();
    }
  };

  const handleHeaderPress = () => {
    if (isExtractedOrSingle) {
      showToast(
        "Đang phát từ trích xuất (1 bài). Hãy thêm bài hát vào Thư viện hoặc Playlist để dùng đầy đủ tính năng!",
        "info"
      );
    } else {
      closeFullPlayer();
    }
  };

  const handleCast = () => {
    closeFullPlayer();
    setTimeout(() => {
      useConnectStore.getState().openConnectModal();
    }, 260);
  };

  const handleOpenLyrics = () => {
    openLyricsScreen();
  };

  const handleToggleStory = async () => {
    const nextState = !showStory;
    setShowStory(nextState);
    if (nextState) {
      if (!songStory && currentSong) {
        setIsLoadingStory(true);
        try {
          const story = await apiClient.getSongStory(
            currentSong.title,
            currentSong.artistsNames
          );
          setSongStory(story);
        } catch (e) {
          setSongStory("Chưa có câu chuyện cho bài hát này.");
        } finally {
          setIsLoadingStory(false);
        }
      }
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: SCREEN_HEIGHT * 0.45, animated: true });
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
    const thumbnail = artistInfo?.cover || artistInfo?.thumbnail || currentSong.thumbnail;
    setShowSongOptions(false);
    closeFullPlayer();
    setTimeout(() => {
      navigate("ArtistDetail", { alias, name, thumbnail });
    }, 150);
  };

  if (!currentSong) return null;

  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  const nextTrackInfo = getNextTrack();
  const safeTopPadding = insets.top > 0 ? insets.top + 18 : 44;
  const safeBottomPadding = insets.bottom > 0 ? insets.bottom + SPACING.md : SPACING.xl;

  const contextSub = playbackContext
    ? playbackContext.type === 'liked'
      ? 'ĐANG NGHE NHẠC Ở BÀI HÁT ĐÃ THÍCH'
      : playbackContext.type === 'downloaded'
      ? 'ĐANG NGHE NHẠC Ở BÀI HÁT ĐÃ TẢI VỀ'
      : playbackContext.type === 'playlist'
      ? 'ĐANG NGHE NHẠC Ở DANH SÁCH PHÁT'
      : playbackContext.type === 'artist'
      ? 'ĐANG NGHE NHẠC Ở NGHỆ SĨ'
      : playbackContext.type === 'chart'
      ? 'ĐANG NGHE NHẠC Ở BẢNG XẾP HẠNG'
      : playbackContext.type === 'search'
      ? 'ĐANG NGHE NHẠC Ở TÌM KIẾM'
      : playbackContext.type === 'extracted'
      ? 'ĐANG NGHE NHẠC Ở TRÍCH XUẤT'
      : 'ĐANG NGHE NHẠC Ở'
    : 'ĐANG NGHE NHẠC Ở';

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
        {/* Top Hero Artwork Background (Ends at lyrics button level to prevent blurring) */}
        <View style={[styles.bgArtworkContainer, { height: ARTWORK_HEIGHT }]}>
          <Image
            source={{
              uri: getHighResArtworkUrl(
                currentSong.thumbnail || (currentSong as any).thumbnailM
              ),
            }}
            style={styles.bgArtworkImage}
            resizeMode="cover"
          />
          {/* SoundCloud-Style Multi-stop Vignette Gradient Overlay smoothly fading into bgPrimary */}
          <LinearGradient
            colors={[
              "rgba(10, 10, 14, 0.72)",
              "rgba(10, 10, 14, 0.08)",
              "rgba(10, 10, 14, 0.20)",
              "rgba(10, 10, 14, 0.55)",
              "rgba(15, 15, 19, 0.90)",
              COLORS.bgPrimary,
            ]}
            locations={[0, 0.18, 0.45, 0.70, 0.88, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Scrollable Container */}
        <ScrollView
          ref={scrollRef}
          style={styles.contentScroll}
          contentContainerStyle={{ paddingBottom: safeBottomPadding }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* --- TOP SOUNDCLOUD-STYLE HERO SECTION (100vh) --- */}
          <View style={[styles.mainHeroSection, { paddingTop: safeTopPadding }]}>
            {/* Top Navigation & Track Title Row */}
            <View style={styles.headerInfoRow}>
              {/* Left Column: Context Subtitle, Title & Artist */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleHeaderPress}
                style={styles.titleCol}
              >
                <Text style={styles.contextSubText}>{contextSub}</Text>
                <Text numberOfLines={1} style={styles.contextTitleText}>
                  {contextTitle}
                </Text>
                <Text numberOfLines={2} style={styles.songTitleText}>
                  {currentSong.title}
                </Text>
                <Text numberOfLines={1} style={styles.songArtistText}>
                  {currentSong.artistsNames}
                </Text>
              </TouchableOpacity>

              {/* Right Column: Close, Follow & Cast Buttons */}
              <View style={styles.navIconsCol}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={closeFullPlayer}
                  style={styles.topIconBtn}
                >
                  <ChevronDown size={28} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={handleToggleFollow}
                  style={styles.topIconBtn}
                >
                  {isFollowingArtist ? (
                    <Check size={22} color={COLORS.accentPrimary} />
                  ) : (
                    <UserPlus size={22} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Middle Artwork Focus Area */}
            <View style={styles.artworkCenterSpacer} />

            {/* SoundCloud-Style Dual-Waveform Scrubber directly over artwork */}
            <View style={styles.waveformContainer}>
              <WaveformScrubber
                mode="scrolling"
                progress={progress}
                positionMs={positionMs}
                durationMs={durationMs > 0 ? durationMs : (currentSong?.duration ? currentSong.duration * 1000 : 0)}
                onSeek={seekTo}
                seed={currentSong.id || currentSong.title}
                activeColor={COLORS.accentPrimary}
                inactiveColor="rgba(255, 255, 255, 0.88)"
                height={108}
                barCount={120}
              />
            </View>

            {/* --- BOTTOM CONTROLS DOCK (Replaces Comment Box & Bottom Bar) --- */}
            <View style={styles.bottomControlsDock}>
              {/* Row 1 (Replaces Comment Box): Main Playback Controls */}
              <View style={styles.playbackControlsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleToggleShuffle}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <Shuffle
                    size={22}
                    color={isShuffle ? COLORS.accentPrimary : COLORS.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePlayPrev}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
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
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <SkipForward size={28} color={COLORS.white} fill={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCycleRepeat}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
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

              {/* Row 2 (Replaces Bottom Bar): Tempo App Actions */}
              <View style={styles.tempoActionsRow}>
                {/* Heart / Like */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleToggleLike}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.tempoActionBtn}
                >
                  <Heart
                    size={24}
                    color={liked ? COLORS.accentPrimary : COLORS.white}
                    fill={liked ? COLORS.accentPrimary : "transparent"}
                  />
                </TouchableOpacity>

                {/* Download / Downloaded status */}
                {isDownloaded(currentSong.id) || currentSong.isOffline ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => showToast("Bài hát đã được lưu trong bộ nhớ máy", "success")}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.tempoActionBtn}
                    accessibilityLabel="Đã tải xuống"
                  >
                    <CheckCircle2 size={22} color="#1DB954" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => downloadSong(currentSong)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.tempoActionBtn}
                    accessibilityLabel="Tải bài hát"
                  >
                    {isDownloading(currentSong.id) ? (
                      <ActivityIndicator size="small" color="#1DB954" />
                    ) : (
                      <Download size={22} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleOpenLyrics}
                  style={styles.lyricsPillButton}
                >
                  <Mic2 size={16} color={COLORS.white} />
                  <Text style={styles.lyricsPillButtonText}>Lời bài hát</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleToggleStory}
                  style={[styles.tempoActionBtn, showStory && styles.tempoActionBtnActive]}
                  accessibilityLabel="Câu chuyện bài hát"
                >
                  <BookOpen size={22} color={showStory ? COLORS.accentPrimary : COLORS.white} />
                </TouchableOpacity>

                {/* More Options */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowSongOptions(true)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.tempoActionBtn}
                >
                  <MoreHorizontal size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Smooth Upward Black Gradient for seamless blend ("đen dần dần đi lên") */}
            <LinearGradient
              colors={["transparent", "rgba(11, 11, 14, 0.4)", "rgba(11, 11, 14, 0.85)", COLORS.bgPrimary]}
              locations={[0, 0.35, 0.72, 1]}
              style={styles.bottomBlendGradient}
              pointerEvents="none"
            />
          </View>

          {/* --- SCROLLABLE DETAILS SECTION (Below the fold) --- */}
          <View style={styles.detailsContentContainer}>
            {/* Thanh Kéo Âm Lượng Khi Đang Cast Trên PC */}
            {isRemote && (
              <View style={styles.remoteVolumeCard}>
                <View style={styles.remoteVolumeHeader}>
                  <View style={styles.remoteVolumeTitleGroup}>
                    <Radio size={13} color={COLORS.accentPrimary} />
                    <Text style={styles.remoteVolumeTitle}>
                      Âm lượng {activeDevice?.deviceName || 'Web Player (PC)'}
                    </Text>
                  </View>
                  <Text style={styles.remoteVolumePct}>
                    {Math.round((remoteVolume ?? 0.8) * 100)}%
                  </Text>
                </View>
                <View style={styles.remoteVolumeRow}>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => setRemoteVolume(0)}
                  >
                    <VolumeX size={15} color={COLORS.textMuted} />
                  </TouchableOpacity>
                  <Slider
                    style={styles.remoteVolumeSlider}
                    minimumValue={0}
                    maximumValue={1}
                    value={remoteVolume ?? 0.8}
                    onValueChange={(val: number) => setRemoteVolume(val)}
                    minimumTrackTintColor={COLORS.accentPrimary}
                    maximumTrackTintColor="rgba(255, 255, 255, 0.15)"
                    thumbTintColor={COLORS.white}
                  />
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => setRemoteVolume(1)}
                  >
                    <Volume2 size={15} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
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

            {/* 1. BÀI TIẾP THEO TRONG DANH SÁCH */}
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
                  <Text style={styles.artistSectionLabel}>GIỚI THIỆU VỀ NGHỆ SĨ</Text>
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
                    source={{
                      uri:
                        artistInfo.cover ||
                        artistInfo.thumbnail ||
                        currentSong?.thumbnail ||
                        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600",
                    }}
                    style={styles.artistCoverImg}
                    resizeMode="cover"
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

        {/* Fullscreen Dedicated Lyrics Screen */}
        <LyricsModalScreen />

        {/* Song Options Modal */}
        <SongOptionsModal
          visible={showSongOptions}
          song={currentSong}
          onClose={() => setShowSongOptions(false)}
          onOpenArtist={openArtistDetail}
        />

        {/* Global Synchronized Sleep Timer Modal */}
        <SleepTimerModal />

        {/* In-Modal Synchronized Toast */}
        <Toast />
      </View>
    </Modal>
  );
};

export const PlayerModalScreen: React.FC = () => {
  const isFullPlayerVisible = usePlayerStore((s) => s.isFullPlayerVisible);
  if (!isFullPlayerVisible) return null;
  return <FullPlayerContent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  bgArtworkContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    overflow: "hidden",
  },
  bgArtworkImage: {
    width: "100%",
    height: "100%",
  },
  contentScroll: {
    flex: 1,
  },
  mainHeroSection: {
    minHeight: SCREEN_HEIGHT * 0.92,
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    position: "relative",
  },
  bottomBlendGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 360,
    zIndex: 1,
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    zIndex: 10,
  },
  titleCol: {
    flex: 1,
    marginRight: SPACING.md,
  },
  contextSubText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contextTitleText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: 6,
    maxWidth: 240,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  songTitleText: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.white,
    lineHeight: 28,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  songArtistText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  navIconsCol: {
    alignItems: "center",
    gap: SPACING.md,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 19,
  },
  artworkCenterSpacer: {
    flex: 1,
    minHeight: SCREEN_HEIGHT * 0.16,
  },
  waveformContainer: {
    width: SCREEN_WIDTH,
    marginHorizontal: -SPACING.xl,
    marginBottom: 36,
    zIndex: 5,
    overflow: "visible",
  },
  bottomControlsDock: {
    width: "100%",
    gap: SPACING.lg,
    zIndex: 5,
  },
  playbackControlsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xs,
  },
  tempoActionsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xs,
  },
  tempoActionBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  tempoActionBtnActive: {
    backgroundColor: "rgba(252, 71, 92, 0.2)",
    borderRadius: 22,
  },
  lyricsPillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  lyricsPillButtonText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.white,
  },
  detailsContentContainer: {
    backgroundColor: COLORS.bgPrimary,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl * 2,
    minHeight: SCREEN_HEIGHT,
  },
  remoteVolumeCard: {
    backgroundColor: COLORS.bgCardDark,
    borderRadius: LAYOUT.radiusLg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  remoteVolumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  remoteVolumeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  remoteVolumeTitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  remoteVolumePct: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '800',
    color: COLORS.accentPrimary,
  },
  remoteVolumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  remoteVolumeSlider: {
    flex: 1,
    height: 32,
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
  artistSectionLabel: {
    fontSize: TYPOGRAPHY.sizeSmall,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    lineHeight: 18,
    includeFontPadding: false,
  },
  seeArtistBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  seeArtistText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.accentPrimary,
    lineHeight: 18,
    includeFontPadding: false,
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
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  artistGradient: {
    ...StyleSheet.absoluteFill,
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
