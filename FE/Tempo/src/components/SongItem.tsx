/**
 * SongItem Component - High density, Borderless, Accent #FF5800, 100% Tokenized
 */
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Play, Pause, MoreVertical, ArrowDownCircle } from 'lucide-react-native';
import { UnifiedSong } from '../types/music';
import { usePlayerStore } from '../store/playerStore';
import { useDownloadStore } from '../store/downloadStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatDuration } from '../utils/format';

interface SongItemProps {
  song: UnifiedSong;
  index?: number;
  showIndex?: boolean;
  onPress?: () => void;
  onMorePress?: () => void;
}

export const SongItem: React.FC<SongItemProps> = ({
  song,
  index,
  showIndex = false,
  onPress,
  onMorePress,
}) => {
  const { currentSong, isPlaying, isLoading, playSong, togglePlayPause } = usePlayerStore();
  const isDownloaded = useDownloadStore((s) => s.downloadedSongs.some((ds) => ds.id === song.id)) || song.isOffline;
  const isCurrent = currentSong?.id === song.id;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isCurrent) {
      togglePlayPause();
    } else {
      playSong(song);
    }
  };

  const isTop1 = showIndex && index === 0;
  const isTop2 = showIndex && index === 1;
  const isTop3 = showIndex && index === 2;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={[
        styles.container,
        isCurrent && styles.containerActive,
        isTop1 && styles.containerTop1,
      ]}
    >
      {showIndex && (
        <View style={styles.indexBox}>
          <Text
            style={[
              styles.indexText,
              isTop1 && styles.indexTop1,
              isTop2 && styles.indexTop2,
              isTop3 && styles.indexTop3,
              isCurrent && styles.indexActive,
            ]}
          >
            {index !== undefined ? String(index + 1).padStart(2, '0') : ''}
          </Text>
        </View>
      )}

      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri:
              song.thumbnail ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120',
          }}
          style={styles.thumbnail}
        />
        {isCurrent && (
          <View style={styles.playingOverlay}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : isPlaying ? (
              <Pause size={16} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Play size={16} color={COLORS.white} fill={COLORS.white} />
            )}
          </View>
        )}
      </View>

      <View style={styles.infoWrapper}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.title, isCurrent && styles.titleActive]}
        >
          {song.title}
        </Text>
        <View style={styles.metaRow}>
          {isDownloaded && (
            <ArrowDownCircle size={13} color="#1DB954" style={{ marginRight: 2 }} />
          )}
          {song.isVip && (
            <View style={[styles.sourceBadge, { backgroundColor: COLORS.tileOrange }]}>
              <Text style={[styles.sourceText, { color: COLORS.accentPrimary }]}>VIP</Text>
            </View>
          )}
          {song.source === 'audius' && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceText}>GLOBAL</Text>
            </View>
          )}
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.artist}>
            {song.artistsNames}
          </Text>
        </View>
      </View>

      <Text style={styles.durationText}>{formatDuration(song.duration)}</Text>

      {onMorePress && (
        <TouchableOpacity
          hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
          onPress={onMorePress}
          style={styles.moreButton}
        >
          <MoreVertical size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 1,
    paddingHorizontal: 0,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.transparent,
  },
  containerActive: {
    backgroundColor: COLORS.transparent,
  },
  containerTop1: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  indexBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  indexText: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  indexTop1: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F59E0B',
  },
  indexTop2: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38BDF8',
  },
  indexTop3: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FB923C',
  },
  indexActive: {
    color: COLORS.accentPrimary,
  },
  imageWrapper: {
    width: LAYOUT.avatarMd,
    height: LAYOUT.avatarMd,
    borderRadius: LAYOUT.radiusSm,
    overflow: 'hidden',
    backgroundColor: COLORS.bgSurface,
    position: 'relative',
    marginRight: SPACING.md,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeightBodySmall,
    marginBottom: 3,
  },
  titleActive: {
    color: COLORS.accentPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  sourceBadge: {
    backgroundColor: COLORS.bgPill,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: LAYOUT.radiusXs,
  },
  sourceText: {
    fontSize: TYPOGRAPHY.sizeBadge,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: TYPOGRAPHY.letterSpacingTight,
  },
  artist: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
    flex: 1,
  },
  durationText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '500',
    color: COLORS.textMuted,
    fontVariant: ['tabular-nums'],
    marginRight: SPACING.xs,
  },
  moreButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
