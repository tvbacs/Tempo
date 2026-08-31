/**
 * Global Floating MiniPlayer Component
 * Horizontal Progress Bar at the bottom of the card
 * Inspired by reference designs - Borderless, Accent #FF5800, 100% Tokenized
 */
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
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

  const { activeDevice, openConnectModal } = useConnectStore();

  if (!currentSong) return null;

  const isWebActive = activeDevice.type === 'web';
  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
  const bottomInset = insets.bottom > 0 ? insets.bottom : SPACING.sm;
  const bottomPosition = hasTabBar
    ? LAYOUT.tabBarHeight + bottomInset + SPACING.xs
    : bottomInset + SPACING.xs;

  return (
    <>
      <View style={[styles.wrapper, { bottom: bottomPosition }]}>
        {/* Floating Connect Device Pill Banner (Spotify Style) */}
        {isWebActive && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openConnectModal}
            style={styles.connectPillBanner}
          >
            <View style={styles.connectPillLeft}>
              <Radio size={14} color={COLORS.accentPrimary} />
              <Text style={styles.connectPillText} numberOfLines={1}>
                Đang nghe trên <Text style={{ fontWeight: '800' }}>{activeDevice.deviceName}</Text>
              </Text>
            </View>
            <Text style={styles.connectPillChange}>Thay đổi</Text>
          </TouchableOpacity>
        )}

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
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.artist}>
              {isWebActive ? activeDevice.deviceName : currentSong.artistsNames}
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
              onPress={openConnectModal}
              style={styles.iconBtn}
            >
              <Cast size={18} color={isWebActive ? COLORS.accentPrimary : COLORS.textSecondary} />
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

        {/* Thanh ngang gradient thời lượng ở đáy card */}
        <View style={styles.bottomProgressTrack}>
          <LinearGradient
            colors={isWebActive ? [COLORS.accentPrimary, '#10B981'] : [COLORS.gradientTop, COLORS.gradientBottom]}
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
  wrapper: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    height: LAYOUT.miniPlayerHeight,
    backgroundColor: COLORS.bgCardDark,
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
    paddingHorizontal: SPACING.md,
  },
  thumbnail: {
    width: LAYOUT.avatarSm,
    height: LAYOUT.avatarSm,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  info: {
    flex: 1,
    marginHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
    marginBottom: 2,
  },
  artist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeightCaption,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md + 2,
  },
  iconBtn: {
    width: LAYOUT.iconButtonSm,
    height: LAYOUT.iconButtonSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomProgressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: COLORS.bgProgressTrack,
  },
  bottomProgressBar: {
    height: '100%',
    backgroundColor: COLORS.accentPrimary,
  },
  connectPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E24',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  connectPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: SPACING.sm,
  },
  connectPillText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.accentPrimary,
    fontWeight: '600',
  },
  connectPillChange: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.white,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
