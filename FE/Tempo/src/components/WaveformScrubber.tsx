/**
 * WaveformScrubber - SoundCloud-Style Interactive Audio Waveform Scrubber
 * Features dual-sided mirrored soundwave bars, real-time active color fill,
 * floating time badge, and 0ms responsive touch/pan seeking.
 * Strictly follows STANDARDS.md
 */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatDurationMs } from '../utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BAR_WIDTH = 2.5;
const BAR_GAP = 2.0;
const BAR_STEP = BAR_WIDTH + BAR_GAP; // 4.5px per bar

interface WaveformScrubberProps {
  progress: number; // 0 to 1
  positionMs: number;
  durationMs: number;
  onSeek: (positionMs: number) => void;
  barCount?: number;
  activeColor?: string;
  inactiveColor?: string;
  seed?: string;
  height?: number;
  showTimeBadge?: boolean;
  mode?: 'scrolling' | 'fit';
}

/**
 * Sinh chuỗi chiều cao các cột sóng âm thanh dựa trên seed của bài hát
 */
function generateSoundcloudWaveHeights(count: number, seedStr?: string): number[] {
  let seed = 42;
  if (seedStr) {
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed << 5) - seed + seedStr.charCodeAt(i);
      seed |= 0;
    }
  }

  // LCG pseudo-random generator
  let state = Math.abs(seed) || 12345;
  const nextRandom = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    const progress = i / count;
    // Phong cách sóng SoundCloud: có nhịp beat, các đoạn cao trào và baseline
    const envelope = 0.55 + 0.45 * Math.sin(progress * Math.PI);
    const wave1 = Math.sin(progress * Math.PI * 4) * 0.25;
    const wave2 = Math.sin(progress * Math.PI * 1.5) * 0.35 + 0.4;
    const beat = Math.pow(Math.sin(progress * Math.PI * 16), 4) * 0.35;
    const noise = nextRandom() * 0.35;
    const raw = (wave1 + wave2 + beat + noise) * envelope;
    const height = Math.max(0.12, Math.min(1.0, raw));
    heights.push(height);
  }
  return heights;
}

/**
 * Render chuỗi cột sóng SoundCloud cho scrolling mode
 */
function renderScrollingWaveBars(
  heights: number[],
  isTopActive: boolean,
  isBottomActive: boolean,
  actCol: string,
  inactCol: string,
  totalHeight: number
) {
  const topMaxHeight = totalHeight * 0.58;
  const bottomMaxHeight = totalHeight * 0.34;

  // Solid colors ensure active track 2 completely covers inactive track 1 without blending
  const topColor = isTopActive ? actCol : inactCol;
  const bottomColor = isBottomActive ? actCol : 'rgba(255, 255, 255, 0.38)';

  return (
    <View style={styles.scrollingBarsRow}>
      {heights.map((barRatio, index) => {
        const topH = Math.max(3, barRatio * topMaxHeight);
        const bottomH = Math.max(2, barRatio * bottomMaxHeight);

        return (
          <View key={index} style={styles.scrollingBarColumn}>
            {/* Top Bar */}
            <View style={styles.scrollingBarTopContainer}>
              <View
                style={[
                  styles.scrollingBarPill,
                  {
                    height: topH,
                    backgroundColor: topColor,
                  },
                ]}
              />
            </View>

            {/* Center Mirror Gap */}
            <View style={styles.scrollingCenterGap} />

            {/* Bottom Mirrored Bar */}
            <View style={styles.scrollingBarBottomContainer}>
              <View
                style={[
                  styles.scrollingBarPill,
                  {
                    height: bottomH,
                    backgroundColor: bottomColor,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  progress,
  positionMs,
  durationMs,
  onSeek,
  barCount,
  activeColor = COLORS.accentPrimary,
  inactiveColor = 'rgba(255, 255, 255, 0.88)',
  seed = 'tempo_track',
  height = 108,
  showTimeBadge = true,
  mode = 'fit',
}) => {
  const effectiveBarCount = mode === 'scrolling' ? (barCount ?? 120) : (barCount ?? 52);
  const totalWaveWidth = effectiveBarCount * BAR_STEP;

  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);

  // Anchor X is fixed playhead location (~44% across the screen)
  const anchorX = Math.round(containerWidth * 0.44);

  // Dynamic references to completely eliminate STALE CLOSURES in PanResponder
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const currentRatioRef = useRef(progress);
  currentRatioRef.current = isScrubbing ? scrubRatio : progress;

  const durationMsRef = useRef(durationMs);
  durationMsRef.current = durationMs;

  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const anchorXRef = useRef(anchorX);
  anchorXRef.current = anchorX;

  const totalWaveWidthRef = useRef(totalWaveWidth);
  totalWaveWidthRef.current = totalWaveWidth;

  const containerWidthRef = useRef(containerWidth);
  containerWidthRef.current = containerWidth;

  const isScrubbingRef = useRef(false);
  const dragStartRatioRef = useRef(0);
  const grantPageXRef = useRef(0);

  const animatedTranslateX = useRef(
    new Animated.Value(anchorX - (progress || 0) * totalWaveWidth)
  ).current;
  const animatedProgress = useRef(new Animated.Value(progress || 0)).current;

  const waveHeights = useMemo(
    () => generateSoundcloudWaveHeights(effectiveBarCount, seed),
    [effectiveBarCount, seed]
  );

  const currentRatio = isScrubbing ? scrubRatio : progress;
  const currentPosMs = isScrubbing ? currentRatio * durationMs : positionMs;

  // Smooth Native Driver horizontal translation for scrolling mode during playback
  useEffect(() => {
    if (mode !== 'scrolling') return;
    if (isScrubbingRef.current) return;

    const targetX = anchorX - progress * totalWaveWidth;
    const currentVal = (animatedTranslateX as any)._value;
    const isBigJump =
      typeof currentVal === 'number' && Math.abs(currentVal - targetX) > totalWaveWidth * 0.12;

    if (isBigJump) {
      animatedTranslateX.setValue(targetX);
    } else {
      Animated.timing(animatedTranslateX, {
        toValue: targetX,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [mode, progress, anchorX, totalWaveWidth, animatedTranslateX]);

  // Progress animation for fit mode
  useEffect(() => {
    if (mode !== 'fit') return;
    Animated.timing(animatedProgress, {
      toValue: currentRatio,
      duration: isScrubbing ? 0 : 320,
      useNativeDriver: false,
    }).start();
  }, [mode, animatedProgress, currentRatio, isScrubbing]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  };

  // --- SCROLLING PAN RESPONDER (Touch & Drag Seeking) ---
  const scrollingPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        isScrubbingRef.current = true;
        setIsScrubbing(true);
        dragStartRatioRef.current = currentRatioRef.current;
        grantPageXRef.current = evt.nativeEvent.pageX;
      },

      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const width = totalWaveWidthRef.current;
        if (width <= 0) return;
        // Dragging left (dx < 0) advances track; dragging right rewinds
        const deltaRatio = -(gestureState.dx / width);
        const nextRatio = Math.max(0, Math.min(1, dragStartRatioRef.current + deltaRatio));
        setScrubRatio(nextRatio);
        animatedTranslateX.setValue(anchorXRef.current - nextRatio * width);
      },

      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const width = totalWaveWidthRef.current;
        const durMs = durationMsRef.current;
        const startRatio = dragStartRatioRef.current;
        const anchor = anchorXRef.current;

        const isTap = Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6;
        let finalRatio = startRatio;

        if (isTap && width > 0) {
          const tapOffset = evt.nativeEvent.pageX - anchor;
          finalRatio = Math.max(0, Math.min(1, startRatio + tapOffset / width));
        } else if (width > 0) {
          const deltaRatio = -(gestureState.dx / width);
          finalRatio = Math.max(0, Math.min(1, startRatio + deltaRatio));
        }

        if (isNaN(finalRatio) || !isFinite(finalRatio)) {
          finalRatio = startRatio || 0;
        }

        setScrubRatio(finalRatio);
        animatedTranslateX.setValue(anchor - finalRatio * width);

        // Perform audio seek with latest duration
        if (durMs > 0) {
          const seekTargetMs = Math.round(finalRatio * durMs);
          onSeekRef.current(seekTargetMs);
        }

        // Brief buffer time before unblocking auto-scroll to allow audio player state update
        setTimeout(() => {
          isScrubbingRef.current = false;
          setIsScrubbing(false);
        }, 120);
      },

      onPanResponderTerminate: () => {
        isScrubbingRef.current = false;
        setIsScrubbing(false);
      },
    })
  ).current;

  // --- FIT PAN RESPONDER ---
  const handleFitTouch = (evt: GestureResponderEvent) => {
    const cWidth = containerWidthRef.current;
    if (cWidth <= 0) return;
    const locationX = evt.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(locationX / cWidth, 1));
    setScrubRatio(ratio);
    return ratio;
  };

  const fitPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        isScrubbingRef.current = true;
        setIsScrubbing(true);
        handleFitTouch(evt);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        handleFitTouch(evt);
      },
      onPanResponderRelease: (evt: GestureResponderEvent) => {
        const finalRatio = handleFitTouch(evt);
        const durMs = durationMsRef.current;
        if (finalRatio !== undefined && durMs > 0) {
          onSeekRef.current(Math.floor(finalRatio * durMs));
        }
        setTimeout(() => {
          isScrubbingRef.current = false;
          setIsScrubbing(false);
        }, 120);
      },
      onPanResponderTerminate: () => {
        isScrubbingRef.current = false;
        setIsScrubbing(false);
      },
    })
  ).current;

  // Render SCROLLING mode (SoundCloud style overflowing past right edge)
  if (mode === 'scrolling') {
    return (
      <View style={styles.scrollingRoot}>
        <View
          style={[styles.scrollingWaveContainer, { height }]}
          onLayout={onLayout}
          {...scrollingPanResponder.panHandlers}
        >
          {/* Subtle Horizontal Mirror Baseline */}
          <View pointerEvents="none" style={styles.scrollingMirrorAxis} />

          {/* 1. Underlying Inactive Wave (White/Muted) - overflows to the right! */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.scrollingAnimatedTrack,
              {
                width: totalWaveWidth,
                transform: [{ translateX: animatedTranslateX }],
              },
            ]}
          >
            {renderScrollingWaveBars(
              waveHeights,
              false,
              false,
              activeColor,
              inactiveColor,
              height
            )}
          </Animated.View>

          {/* 2. Active Wave Container - clipped strictly at anchorX */}
          <View
            pointerEvents="none"
            style={[
              styles.scrollingActiveClipContainer,
              {
                width: anchorX,
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.scrollingAnimatedTrack,
                {
                  width: totalWaveWidth,
                  transform: [{ translateX: animatedTranslateX }],
                },
              ]}
            >
              {renderScrollingWaveBars(
                waveHeights,
                true,
                true,
                activeColor,
                inactiveColor,
                height
              )}
            </Animated.View>
          </View>

          {/* 3. SoundCloud Fixed Time Badge pinned exactly at anchorX */}
          {showTimeBadge && (
            <View
              pointerEvents="none"
              style={[
                styles.scrollingTimeBadgeWrapper,
                {
                  left: anchorX,
                },
              ]}
            >
              <View style={styles.scrollingTimeBadge}>
                <View style={styles.scrollingBadgeCol}>
                  <Text style={styles.timeBadgeActiveText}>
                    {formatDurationMs(currentPosMs)}
                  </Text>
                </View>
                <View style={styles.scrollingBadgeDivider} />
                <View style={styles.scrollingBadgeCol}>
                  <Text style={styles.timeBadgeTotalText}>
                    {formatDurationMs(durationMs)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  // Render FIT mode (Fallback static view)
  const badgeLeftPercent = Math.max(0, Math.min(currentRatio * 100, 78));

  return (
    <View style={styles.container}>
      <View
        style={[styles.waveContainer, { height }]}
        onLayout={onLayout}
        {...fitPanResponder.panHandlers}
      >
        <View style={styles.barsRow}>
          {waveHeights.map((barRatio, index) => {
            const barHeight = Math.max(3, barRatio * (height * 0.47));
            const color = inactiveColor;
            const bottomColor = 'rgba(255, 255, 255, 0.35)';

            return (
              <View key={index} style={styles.barColumn}>
                <View
                  style={[
                    styles.barTop,
                    {
                      height: barHeight,
                      backgroundColor: color,
                    },
                  ]}
                />
                <View style={styles.barGap} />
                <View
                  style={[
                    styles.barBottom,
                    {
                      height: barHeight,
                      backgroundColor: bottomColor,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeWaveClip,
            { width: animatedProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        >
          <View style={[styles.barsRow, { width: containerWidth }]}>
            {waveHeights.map((barRatio, index) => {
              const barHeight = Math.max(3, barRatio * (height * 0.47));
              return (
                <View key={index} style={styles.barColumn}>
                  <View style={[styles.barTop, { height: barHeight, backgroundColor: activeColor }]} />
                  <View style={[styles.barBottom, { height: barHeight, backgroundColor: `${activeColor}99` }]} />
                </View>
              );
            })}
          </View>
        </Animated.View>
        <View pointerEvents="none" style={styles.mirrorAxis} />

        {showTimeBadge && (
          <View style={[styles.timeBadgeContainer, { left: `${badgeLeftPercent}%` }]}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeActiveText}>{formatDurationMs(currentPosMs)}</Text>
              <View style={styles.timeBadgeDivider} />
              <Text style={styles.timeBadgeTotalText}>{formatDurationMs(durationMs)}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // --- SCROLLING MODE STYLES ---
  scrollingRoot: {
    width: '100%',
    overflow: 'visible',
    justifyContent: 'center',
  },
  scrollingWaveContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    justifyContent: 'center',
  },
  scrollingMirrorAxis: {
    position: 'absolute',
    left: 0,
    right: -300,
    top: '60.5%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    zIndex: 1,
  },
  scrollingAnimatedTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollingActiveClipContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 3,
  },
  scrollingBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  scrollingBarColumn: {
    width: BAR_WIDTH,
    marginRight: BAR_GAP,
    height: '100%',
    alignItems: 'center',
  },
  scrollingBarTopContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scrollingCenterGap: {
    height: 3,
  },
  scrollingBarBottomContainer: {
    height: '38%',
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  scrollingBarPill: {
    width: BAR_WIDTH,
    borderRadius: 1.25,
  },
  scrollingTimeBadgeWrapper: {
    position: 'absolute',
    top: '60.5%',
    marginTop: -13,
    transform: [{ translateX: -47 }],
    zIndex: 10,
  },
  scrollingTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 4,
    height: 26,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollingBadgeCol: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollingBadgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginHorizontal: 4,
  },

  // --- COMMON & FIT MODE STYLES ---
  container: {
    width: '100%',
    paddingVertical: SPACING.xs,
    justifyContent: 'center',
  },
  waveContainer: {
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  barColumn: {
    flex: 1,
    height: '100%',
    position: 'relative',
    marginHorizontal: 0.5,
  },
  barTop: {
    position: 'absolute',
    bottom: '50%',
    width: 2.5,
    borderRadius: 1.25,
    alignSelf: 'center',
  },
  barGap: {
    display: 'none',
  },
  barBottom: {
    position: 'absolute',
    top: '50%',
    width: 2.5,
    borderRadius: 1.25,
    alignSelf: 'center',
  },
  activeWaveClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    overflow: 'hidden',
  },
  mirrorAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    zIndex: 2,
  },
  timeBadgeContainer: {
    position: 'absolute',
    bottom: -10,
    zIndex: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 5,
  },
  timeBadgeActiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  timeBadgeDivider: {
    width: 1,
    height: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  timeBadgeTotalText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
