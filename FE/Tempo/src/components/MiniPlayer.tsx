/**
 * Global Floating MiniPlayer Component
 * Spotify-style Cross-Device Floating Tooltip Notification & Borderless Card
 * 100% NO EMOJIS - Clean Vector Icons & Tokenized Theme
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, Cast, Radio, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { GradientPlayButton } from './GradientButton';
import { usePlayerStore } from '../store/playerStore';
import { useNavStore } from '../store/navStore';
import { useConnectStore, useActivePlayback } from '../store/connectStore';
import { DevicePickerModal } from './DevicePickerModal';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

export const MiniPlayerProgressBar: React.FC<{ isRemote: boolean }> = React.memo(({ isRemote }) => {
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const remotePlayback = useConnectStore((s) => s.remotePlayback);

  const pos = isRemote ? (remotePlayback?.positionMs || 0) : positionMs;
  const dur = isRemote ? (remotePlayback?.durationMs || 1) : durationMs;
  const pct = dur > 0 ? Math.min(Math.max((pos / dur) * 100, 0), 100) : 0;

  return (
    <View style={styles.bottomProgressTrack}>
      <LinearGradient
        colors={
          isRemote
            ? [COLORS.accentPrimary, '#FC655A']
            : [COLORS.gradientTop, COLORS.gradientBottom]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.bottomProgressBar, { width: `${pct}%` }]}
      />
    </View>
  );
});

export const MiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { hasTabBar } = useNavStore();
  const { openFullPlayer } = usePlayerStore();
  const {
    isRemote,
    song,
    isPlaying,
    isLoading,
    device,
    togglePlayPause,
  } = useActivePlayback(false);

  const {
    newlyDiscoveredDevice,
    clearNewlyDiscoveredDevice,
    selectDevice,
    openConnectModal,
  } = useConnectStore();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const bottomInset = insets.bottom > 0 ? insets.bottom : SPACING.sm;
  const bottomPosition = hasTabBar
    ? LAYOUT.tabBarHeight + bottomInset + SPACING.xs
    : bottomInset + SPACING.xs;

  // Trigger Spotify-style speech bubble tooltip khi thiết bị từ xa đang active HOẶC vừa phát hiện Web Player online
  useEffect(() => {
    if (isRemote || newlyDiscoveredDevice) {
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
        clearNewlyDiscoveredDevice();
      }, 9000);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [isRemote, device.deviceName, newlyDiscoveredDevice]);

  if (!song) return null;

  const tooltipHeading = isRemote
    ? 'Đang nghe trên'
    : (newlyDiscoveredDevice?.deviceName || 'Web Player');
  const tooltipDeviceName = isRemote
    ? device.deviceName
    : 'Sẵn sàng để kết nối';
  const tooltipAction = isRemote
    ? 'Thay đổi'
    : 'Kết nối';

  const handleTooltipPress = () => {
    if (!isRemote && newlyDiscoveredDevice) {
      selectDevice(newlyDiscoveredDevice);
      clearNewlyDiscoveredDevice();
    } else {
      openConnectModal();
    }
  };

  return (
    <>
      {/* 1. Spotify-style Floating Speech Bubble Tooltip above MiniPlayer */}
      {showTooltip && !isCollapsed && (
        <View style={[styles.tooltipContainer, { bottom: bottomPosition + LAYOUT.miniPlayerHeight + 10 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleTooltipPress}
            style={styles.tooltipBubble}
          >
            <View style={styles.tooltipLeft}>
              <Radio size={16} color={COLORS.black} />
              <View style={styles.tooltipTextWrap}>
                <Text style={styles.tooltipHeading} numberOfLines={1}>
                  {tooltipHeading}
                </Text>
                <Text style={styles.tooltipDeviceName} numberOfLines={1}>
                  {tooltipDeviceName}
                </Text>
              </View>
            </View>
            <Text style={styles.tooltipActionBtn}>
              {tooltipAction}
            </Text>
          </TouchableOpacity>
          {/* Pointer arrow pointing directly to the Cast button */}
          <View style={styles.tooltipArrow} />
        </View>
      )}

      {/* 2. Collapsed Floating Disc on the Right OR Full MiniPlayer Card */}
      {isCollapsed ? (
        <View style={[styles.collapsedWrapper, { bottom: bottomPosition }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsCollapsed(false)}
            style={styles.collapsedPill}
          >
            <ChevronLeft size={16} color={COLORS.white} style={styles.expandChevron} />
            <View style={styles.collapsedDiscWrapper}>
              <Image
                source={{
                  uri:
                    song.thumbnail ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
                }}
                style={styles.collapsedDiscImage}
              />
              {isPlaying && (
                <View style={styles.collapsedPlayingDot} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.wrapper, { bottom: bottomPosition }]}>
          {/* Dynamic Blurred Artwork Background */}
          {song?.thumbnail ? (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Image
                source={{ uri: song.thumbnail }}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.55 }]}
                blurRadius={Platform.OS === 'ios' ? 25 : 12}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(15, 15, 20, 0.45)', 'rgba(12, 12, 18, 0.8)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openFullPlayer}
            style={styles.container}
          >
            {/* Nút mũi tên thu nhỏ sang phải (ChevronRight - Mũi tên góc không có dấu -) */}
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              onPress={() => setIsCollapsed(true)}
              style={styles.collapseBtn}
              accessibilityLabel="Thu nhỏ sang phải"
            >
              <ChevronRight size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Image
              source={{
                uri:
                  song.thumbnail ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
              }}
              style={styles.thumbnail}
            />

            <View style={styles.info}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
                {song.title}
              </Text>

              {isRemote ? (
                <View style={styles.remoteSubRow}>
                  <Radio size={11} color={COLORS.accentPrimary} />
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.remoteSubText}>
                    {device.deviceName}
                  </Text>
                </View>
              ) : (
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.artist}>
                  {song.artistsNames}
                </Text>
              )}
            </View>

            <View style={styles.controls}>
              {/* Cast / Connect Button with Active Glow/Indicator */}
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={openConnectModal}
                style={styles.iconBtn}
              >
                <Cast
                  size={19}
                  color={
                    isRemote
                      ? COLORS.accentPrimary
                      : COLORS.textSecondary
                  }
                />
                {isRemote && (
                  <View
                    style={[
                      styles.castDot,
                      { backgroundColor: COLORS.accentPrimary },
                    ]}
                  />
                )}
              </TouchableOpacity>

              <GradientPlayButton onPress={togglePlayPause} size={38}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : isPlaying ? (
                  <Pause size={18} color={COLORS.white} fill={COLORS.white} />
                ) : (
                  <Play size={18} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 2 }} />
                )}
              </GradientPlayButton>
            </View>
          </TouchableOpacity>

          {/* Thanh ngang thời lượng ở đáy card (Đã tối ưu 0ms re-render) */}
          <MiniPlayerProgressBar isRemote={isRemote} />
        </View>
      )}

      <DevicePickerModal />
    </>
  );
};

const styles = StyleSheet.create({
  // Tooltip Speech Bubble Container
  tooltipContainer: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 100,
    alignItems: 'flex-end',
  },
  tooltipBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 14,
  },
  tooltipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  tooltipTextWrap: {
    flex: 1,
  },
  tooltipHeading: {
    fontSize: 10,
    color: '#111827',
    fontWeight: '700',
    lineHeight: 13,
  },
  tooltipDeviceName: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    lineHeight: 14,
  },
  tooltipActionBtn: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    paddingLeft: 6,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    marginRight: 64, // Aligned directly above the Cast icon button
  },

  // Main MiniPlayer Card
  wrapper: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    height: LAYOUT.miniPlayerHeight,
    backgroundColor: '#1C1C24',
    borderRadius: LAYOUT.radiusMd,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 99,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 9.5,
    paddingBottom: 5.5,
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  info: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
    marginBottom: 2,
  },
  artist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeightCaption,
  },
  remoteSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  remoteSubText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.accentPrimary,
    lineHeight: TYPOGRAPHY.lineHeightCaption,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  castDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  collapseBtn: {
    paddingHorizontal: 5,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
  },
  collapsedWrapper: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 999,
    elevation: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  collapsedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C24',
    paddingVertical: 5,
    paddingLeft: 7,
    paddingRight: 6,
    borderRadius: LAYOUT.radiusFull,
    gap: 4,
  },
  expandChevron: {
    marginRight: 1,
  },
  collapsedDiscWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  collapsedDiscImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  collapsedPlayingDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DB954',
  },
  bottomProgressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomProgressBar: {
    height: '100%',
    backgroundColor: COLORS.accentPrimary,
  },
});
