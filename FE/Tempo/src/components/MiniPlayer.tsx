/**
 * Global Floating MiniPlayer Component
 * Spotify-style Cross-Device Floating Tooltip Notification & Borderless Card
 * 100% NO EMOJIS - Clean Vector Icons & Tokenized Theme
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, Cast, Radio } from 'lucide-react-native';
import { GradientPlayButton } from './GradientButton';
import { usePlayerStore } from '../store/playerStore';
import { useNavStore } from '../store/navStore';
import { useConnectStore } from '../store/connectStore';
import { DevicePickerModal } from './DevicePickerModal';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

export const MiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { hasTabBar } = useNavStore();
  const {
    currentSong,
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    togglePlayPause,
    openFullPlayer,
  } = usePlayerStore();

  const { activeDevice, availableDevices, openConnectModal } = useConnectStore();
  const [showTooltip, setShowTooltip] = useState(false);

  const isRemoteActive = activeDevice.deviceId !== 'mobile-app';

  // Trigger Spotify-style speech bubble tooltip CHỈ KHI thiết bị từ xa đang thực sự phát nhạc
  useEffect(() => {
    if (isRemoteActive && isPlaying) {
      setShowTooltip(true);
      const timer = setTimeout(() => setShowTooltip(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [isRemoteActive, isPlaying, activeDevice.deviceName]);

  if (!currentSong) return null;

  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  const bottomInset = insets.bottom > 0 ? insets.bottom : SPACING.sm;
  const bottomPosition = hasTabBar
    ? LAYOUT.tabBarHeight + bottomInset + SPACING.xs
    : bottomInset + SPACING.xs;

  return (
    <>
      {/* 1. Spotify-style Floating Speech Bubble Tooltip above MiniPlayer */}
      {showTooltip && isRemoteActive && isPlaying && (
        <View style={[styles.tooltipContainer, { bottom: bottomPosition + LAYOUT.miniPlayerHeight + 10 }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openConnectModal}
            style={styles.tooltipBubble}
          >
            <View style={styles.tooltipLeft}>
              <Radio size={16} color={COLORS.black} />
              <View style={styles.tooltipTextWrap}>
                <Text style={styles.tooltipHeading} numberOfLines={1}>
                  Đang nghe trên
                </Text>
                <Text style={styles.tooltipDeviceName} numberOfLines={1}>
                  {activeDevice.deviceName}
                </Text>
              </View>
            </View>
            <Text style={styles.tooltipActionBtn}>
              Thay đổi
            </Text>
          </TouchableOpacity>
          {/* Pointer arrow pointing directly to the Cast button */}
          <View style={styles.tooltipArrow} />
        </View>
      )}

      {/* 2. Main MiniPlayer Card with Dynamic Blurred Artwork Background */}
      <View style={[styles.wrapper, { bottom: bottomPosition }]}>
        {/* Dynamic Blurred Artwork Background */}
        {currentSong?.thumbnail ? (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Image
              source={{ uri: currentSong.thumbnail }}
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
          <Image
            source={{
              uri:
                currentSong.thumbnail ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
            }}
            style={styles.thumbnail}
          />

          <View style={styles.info}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
              {currentSong.title}
            </Text>

            {isRemoteActive && isPlaying ? (
              <View style={styles.remoteSubRow}>
                <Radio size={11} color={COLORS.accentPrimary} />
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.remoteSubText}>
                  {activeDevice.deviceName}
                </Text>
              </View>
            ) : (
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.artist}>
                {currentSong.artistsNames}
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
                  isRemoteActive && isPlaying
                    ? COLORS.accentPrimary
                    : COLORS.textSecondary
                }
              />
              {isRemoteActive && isPlaying && (
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

        {/* Thanh ngang thời lượng ở đáy card */}
        <View style={styles.bottomProgressTrack}>
          <LinearGradient
            colors={
              isRemoteActive
                ? [COLORS.accentPrimary, '#FC655A']
                : [COLORS.gradientTop, COLORS.gradientBottom]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.bottomProgressBar, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>

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
    paddingVertical: 7,
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
