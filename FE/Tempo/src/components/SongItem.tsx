/**
 * SongItem Component - High density, Borderless, Accent #FF5800, 100% Tokenized
 */
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Play, Pause, MoreVertical, ArrowDownCircle, Plus, CheckCircle2, FolderCheck } from 'lucide-react-native';
import { UnifiedSong } from '../types/music';
import { usePlayerStore } from '../store/playerStore';
import { useDownloadStore } from '../store/downloadStore';
import { useLibraryStore } from '../store/libraryStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatDuration, formatAddedDate } from '../utils/format';

interface SongItemProps {
  song: UnifiedSong;
  index?: number;
  showIndex?: boolean;
  hideSavedBadge?: boolean;
  onPress?: () => void;
  onMorePress?: () => void;
  onPlusPress?: () => void;
}

export const SongItem: React.FC<SongItemProps> = React.memo(({
  song,
  index,
  showIndex = false,
  hideSavedBadge = false,
  onPress,
  onMorePress,
  onPlusPress,
}) => {
  const isCurrent = usePlayerStore((s) => s.currentSong?.id === song.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying && s.currentSong?.id === song.id);
  const isLoading = usePlayerStore((s) => s.isLoading && s.currentSong?.id === song.id);
  const playSong = usePlayerStore((s) => s.playSong);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const isDownloaded = useDownloadStore((s) => s.downloadedSongs.some((ds) => ds.id === song.id));
  const isDownloading = useDownloadStore((s) => s.downloadingIds.includes(song.id));
  const isQueued = useDownloadStore((s) => s.queueSongIds?.includes(song.id));
  const isSaved = useLibraryStore((s) => s.likedSongs.some((ls) => ls.id === song.id));
  const isInPlaylist = useLibraryStore((s) => s.playlists.some((p) => (p.songs || []).some((ps) => ps.id === song.id)));

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
          {isDownloading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginRight: 4 }}>
              <ActivityIndicator size={10} color="#1DB954" />
              <Text style={{ fontSize: 10, color: '#1DB954', fontWeight: '800' }}>Đang tải...</Text>
            </View>
          ) : isQueued ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginRight: 4 }}>
              <Text style={{ fontSize: 10, color: COLORS.accentPrimary, fontWeight: '700' }}>Đang chờ tải...</Text>
            </View>
          ) : isDownloaded ? (
            <ArrowDownCircle size={13} color="#1DB954" style={{ marginRight: 2 }} />
          ) : null}
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

      <View style={styles.rightMetaWrap}>
        <Text style={styles.durationText}>{formatDuration(song.duration)}</Text>
        {!!song.addedAt && (
          <Text style={styles.addedDateText}>{formatAddedDate(song.addedAt)}</Text>
        )}
      </View>

      {onPlusPress ? (
        <TouchableOpacity
          hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
          onPress={onPlusPress}
          style={styles.moreButton}
        >
          {isSaved ? (
            <CheckCircle2 size={18} color="#1DB954" />
          ) : isInPlaylist ? (
            <FolderCheck size={18} color="#1DB954" />
          ) : (
            <Plus size={18} color={COLORS.textSecondary} />
          )}
        </TouchableOpacity>
      ) : !hideSavedBadge ? (
        <View style={styles.savedBadgeSlotRow}>
          {isSaved && (
            <View style={styles.savedBadgeSlot}>
              <CheckCircle2 size={15} color="#1DB954" />
            </View>
          )}
          {isInPlaylist && (
            <View style={styles.savedBadgeSlot}>
              <FolderCheck size={15} color="#1DB954" />
            </View>
          )}
        </View>
      ) : null}

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
});

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
  rightMetaWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  durationText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '500',
    color: COLORS.textMuted,
    fontVariant: ['tabular-nums'],
  },
  addedDateText: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  savedBadgeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: SPACING.xs,
  },
  savedBadgeSlot: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
