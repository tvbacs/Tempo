/**
 * LyricsModalScreen - Dedicated Fullscreen Lyrics Experience
 * - Dynamic ambient gradient background derived from song artwork palette
 * - SoundCloud-style mirrored waveform progress bar
 * - Full-line prominent crisp active state (100% bright white, no partial blurry fades)
 * - Jitter-free, smooth centered auto-scrolling
 * - 0ms responsive touch-to-seek on any lyric line
 * Strictly follows STANDARDS.md
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Share,
  Animated,
  Easing,
  Dimensions,
  BackHandler,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  Heart,
  Share2,
  Cast,
} from 'lucide-react-native';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useToastStore } from '../store/toastStore';
import { useActivePlayback, useConnectStore } from '../store/connectStore';
import { apiClient } from '../api/client';
import { LyricData, LyricSentence } from '../types/music';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';
import { getArtworkPalette } from '../utils/colorExtractor';
import { WaveformScrubber } from '../components/WaveformScrubber';
import { GradientPlayButton } from '../components/GradientButton';
import { SongOptionsModal } from '../components/SongOptionsModal';
import { navigate } from '../navigation/navigationRef';

export const LyricsModalScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<LyricSentence>>(null);
  const prevActiveIndexRef = useRef<number>(-1);

  const { isLyricsScreenVisible, closeLyricsScreen, toggleShuffle, cycleRepeat, isShuffle, repeatMode } = usePlayerStore();
  const {
    isRemote,
    song: currentSong,
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
  } = useActivePlayback(true);

  const { isLiked, toggleLike } = useLibraryStore();
  const { showToast } = useToastStore();

  const [lyrics, setLyrics] = useState<LyricData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [showSongOptions, setShowSongOptions] = useState(false);

  // Animation trượt từ dưới lên (Slide-Up / Slide-Down)
  const [isRendered, setIsRendered] = useState(isLyricsScreenVisible);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (isLyricsScreenVisible) {
      setIsRendered(true);
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (isRendered) {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsRendered(false);
      });
    }
  }, [isLyricsScreenVisible, isRendered]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      closeLyricsScreen();
      setIsRendered(false);
    });
  };

  useEffect(() => {
    if (!isLyricsScreenVisible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleDismiss();
      return true;
    });
    return () => sub.remove();
  }, [isLyricsScreenVisible]);

  // Sinh bảng màu Ambient Gradient theo bài hát
  const palette = useMemo(
    () =>
      getArtworkPalette(
        currentSong?.thumbnail,
        currentSong?.title,
        currentSong?.artistsNames
      ),
    [currentSong?.thumbnail, currentSong?.title, currentSong?.artistsNames]
  );

  // Tải lời bài hát khi bài hát thay đổi
  useEffect(() => {
    if (currentSong?.id) {
      setLyrics(null);
      setIsLoadingLyrics(true);
      apiClient
        .getLyrics(currentSong.id)
        .then((data) => {
          setLyrics(data);
        })
        .catch(() => {
          setLyrics({ lrcUrl: null, sentences: [] });
        })
        .finally(() => {
          setIsLoadingLyrics(false);
        });
    }
  }, [currentSong?.id]);

  const sentences = lyrics?.sentences || [];

  // Tìm index câu hát đang phát
  const activeIndex = useMemo(() => {
    if (!sentences.length) return -1;
    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      const start = s.words?.[0]?.startTime ?? (s as any).startMs ?? 0;
      const end = s.words?.[s.words.length - 1]?.endTime ?? (s as any).endMs ?? Infinity;
      if (positionMs >= start && positionMs <= end) {
        return i;
      }
    }
    // Nếu nằm giữa 2 câu
    for (let i = 0; i < sentences.length - 1; i++) {
      const currStart = sentences[i].words?.[0]?.startTime ?? (sentences[i] as any).startMs ?? 0;
      const nextStart = sentences[i + 1].words?.[0]?.startTime ?? (sentences[i + 1] as any).startMs ?? Infinity;
      if (positionMs >= currStart && positionMs < nextStart) {
        return i;
      }
    }
    return -1;
  }, [positionMs, sentences]);

  // Cuộn mượt mà chỉ khi chuyển sang câu mới (tránh giật)
  useEffect(() => {
    if (activeIndex >= 0 && activeIndex !== prevActiveIndexRef.current && isLyricsScreenVisible) {
      prevActiveIndexRef.current = activeIndex;
      try {
        flatListRef.current?.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewPosition: 0.38,
        });
      } catch (_) {}
    }
  }, [activeIndex, isLyricsScreenVisible]);

  if (!isRendered || !currentSong) return null;

  const liked = isLiked(currentSong.id);
  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  const safeTopPadding = insets.top > 0 ? insets.top + 16 : 40;
  const safeBottomPadding = insets.bottom > 0 ? insets.bottom + SPACING.sm : SPACING.lg;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Đang nghe bài hát "${currentSong.title}" - ${currentSong.artistsNames} trên Tempo Music!`,
      });
    } catch (_) {}
  };

  const handleCast = () => {
    useConnectStore.getState().openConnectModal();
  };

  const handleSentencePress = (sentence: LyricSentence) => {
    const targetMs = sentence.words?.[0]?.startTime ?? (sentence as any).startMs ?? 0;
    seekTo(targetMs);
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        {
          zIndex: 999,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
        {/* Dynamic Ambient Gradient Background */}
        <LinearGradient
          colors={[palette.top, palette.middle, palette.bottom, '#0A0A0C']}
          locations={[0, 0.42, 0.78, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Floating Navigation Header */}
        <View style={[styles.topNav, { paddingTop: safeTopPadding }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            onPress={handleDismiss}
            style={styles.navCircleBtn}
          >
            <ChevronDown size={26} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerTitleCenter}>
            <Text numberOfLines={1} style={styles.headerMain}>
              {currentSong.title}
            </Text>
            <Text numberOfLines={1} style={styles.headerSub}>
              {currentSong.artistsNames}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            onPress={() => setShowSongOptions(true)}
            style={styles.navCircleBtn}
          >
            <MoreHorizontal size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Center: Fullscreen Synced Lyrics Stream */}
        <View style={styles.lyricsListWrapper}>
          {isLoadingLyrics ? (
            <View style={styles.centerLoadingBox}>
              <ActivityIndicator size="large" color={palette.accent || COLORS.accentPrimary} />
              <Text style={styles.loadingText}>Đang tải lời bài hát đồng bộ...</Text>
            </View>
          ) : sentences.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={sentences}
              keyExtractor={(_, index) => `lyric_${index}`}
              contentContainerStyle={{
                paddingTop: SCREEN_HEIGHT * 0.18,
                paddingBottom: SCREEN_HEIGHT * 0.35,
                paddingHorizontal: SPACING.xl,
              }}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0.38,
                  });
                }, 100);
              }}
              renderItem={({ item, index }) => {
                const isActive = index === activeIndex;
                const sentenceText = Array.isArray(item.words)
                  ? item.words.map((w: any) => (typeof w === 'string' ? w : w.data || w.text || '')).join(' ')
                  : (typeof (item as any).words === 'string' ? (item as any).words : '');

                if (!sentenceText.trim()) return null;

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSentencePress(item)}
                    style={styles.lyricLineTouchable}
                  >
                    <Text
                      style={[
                        styles.lyricLineBase,
                        isActive ? styles.lyricLineActive : styles.lyricLineInactive,
                      ]}
                    >
                      {sentenceText}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <View style={styles.centerEmptyBox}>
              <Text style={styles.emptyTitle}>Chưa có lời bài hát đồng bộ</Text>
              <Text style={styles.emptySub}>
                Lời bài hát sẽ tự động hiển thị khi được cập nhật
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Control & Waveform Scrubber Dock */}
        <View style={[styles.bottomDock, { paddingBottom: safeBottomPadding + 12 }]}>
          {/* Quick Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => toggleLike(currentSong)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Heart
                size={22}
                color={liked ? COLORS.accentPrimary : 'rgba(255, 255, 255, 0.7)'}
                fill={liked ? COLORS.accentPrimary : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCast}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Cast size={20} color={isRemote ? COLORS.accentPrimary : 'rgba(255, 255, 255, 0.7)'} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Share2 size={20} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>

          {/* SoundCloud-Style Dual-Waveform Progress Bar */}
          <View style={styles.waveformWrapper}>
            <WaveformScrubber
              progress={progress}
              positionMs={positionMs}
              durationMs={durationMs}
              onSeek={seekTo}
              seed={currentSong.id || currentSong.title}
              activeColor={palette.accent || COLORS.accentPrimary}
              inactiveColor="rgba(255, 255, 255, 0.85)"
              height={56}
              barCount={48}
            />
          </View>

          {/* Playback Controls Row (Shuffle, Prev, Play/Pause, Next, Repeat) */}
          <View style={styles.playbackControlsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleShuffle}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Shuffle
                size={20}
                color={isShuffle ? (palette.accent || COLORS.accentPrimary) : 'rgba(255, 255, 255, 0.5)'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={playPrev}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <SkipBack size={26} color={COLORS.white} fill={COLORS.white} />
            </TouchableOpacity>

            <GradientPlayButton onPress={togglePlayPause} size={64}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : isPlaying ? (
                <Pause size={28} color={COLORS.white} fill={COLORS.white} />
              ) : (
                <Play size={28} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 3 }} />
              )}
            </GradientPlayButton>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={playNext}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <SkipForward size={26} color={COLORS.white} fill={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={cycleRepeat}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {repeatMode === 'one' ? (
                <Repeat1 size={20} color={palette.accent || COLORS.accentPrimary} />
              ) : (
                <Repeat
                  size={20}
                  color={repeatMode === 'all' ? (palette.accent || COLORS.accentPrimary) : 'rgba(255, 255, 255, 0.5)'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Modal */}
        <SongOptionsModal
          visible={showSongOptions}
          song={currentSong}
          onClose={() => setShowSongOptions(false)}
          onOpenArtist={() => {
            setShowSongOptions(false);
            closeLyricsScreen();
            const alias = currentSong.artists?.[0]?.link?.replace('/', '') || currentSong.artistsNames;
            navigate('ArtistDetail', { alias, name: currentSong.artistsNames, thumbnail: currentSong.thumbnail });
          }}
        />
      </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  navCircleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  headerMain: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
    textAlign: 'center',
  },
  lyricsListWrapper: {
    flex: 1,
  },
  lyricLineTouchable: {
    paddingVertical: 6,
  },
  lyricLineBase: {
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  lyricLineActive: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    opacity: 1,
    transform: [{ scale: 1.03 }],
  },
  lyricLineInactive: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.38)',
    opacity: 0.85,
  },
  centerLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  centerEmptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizeHeading,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  bottomDock: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  waveformWrapper: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  playbackControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    marginBottom: 12,
  },
});
