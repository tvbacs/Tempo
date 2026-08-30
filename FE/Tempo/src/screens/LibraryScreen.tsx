/**
 * LibraryScreen - Thư viện cá nhân với Full-Bleed Creative Diagonal Capsule Hero (Full Tai Thỏ)
 * Strictly follows STANDARDS.md - Accent #FC475C -> #FC655A, NO EMOJIS, NO BORDERS
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Plus,
  Users,
  Download,
  MoreHorizontal,
  Disc,
  ListMusic,
} from 'lucide-react-native';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useLibraryStore, CustomPlaylist } from '../store/libraryStore';
import { useDownloadStore } from '../store/downloadStore';
import { AppAvatarBadge } from '../components/AppAvatarBadge';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';
import { PlaylistOptionsModal } from '../components/PlaylistOptionsModal';
import { AddSongsModal } from '../components/AddSongsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LibraryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlaylistForOptions, setSelectedPlaylistForOptions] = useState<CustomPlaylist | null>(null);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);

  const {
    likedSongs,
    fetchLikedSongs,
    playlists,
    fetchPlaylists,
    followedArtists,
    fetchFollowedArtists,
    savedAlbums,
    fetchSavedAlbums,
  } = useLibraryStore();

  const { downloadedSongs, fetchDownloads } = useDownloadStore();

  useEffect(() => {
    fetchLikedSongs();
    fetchDownloads();
    fetchPlaylists();
    fetchFollowedArtists();
    fetchSavedAlbums();
  }, [fetchLikedSongs, fetchDownloads, fetchPlaylists, fetchFollowedArtists, fetchSavedAlbums]);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Full-Bleed Creative Diagonal Capsule Hero Section (Tràn Viền & Full Tai Thỏ) */}
        <View style={[styles.creativeHeroCard, { paddingTop: Math.max(insets.top, 24) }]}>
          {/* Diagonal Pill Floating Capsule Images */}
          <View style={styles.diagonalPillContainer} pointerEvents="none">
            {/* Pill 1 - Top Left */}
            <View style={[styles.diagonalPill, styles.pill1]}>
              <Image
                source={{
                  uri:
                    likedSongs[0]?.thumbnail ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
                }}
                style={styles.pillImage}
                resizeMode="cover"
              />
            </View>

            {/* Pill 2 - Center High */}
            <View style={[styles.diagonalPill, styles.pill2]}>
              <Image
                source={{
                  uri:
                    playlists[0]?.coverUrl ||
                    playlists[0]?.songs?.[0]?.thumbnail ||
                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
                }}
                style={styles.pillImage}
                resizeMode="cover"
              />
            </View>

            {/* Pill 3 - Bottom Right */}
            <View style={[styles.diagonalPill, styles.pill3]}>
              <Image
                source={{
                  uri:
                    savedAlbums[0]?.thumbnail ||
                    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
                }}
                style={styles.pillImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Floating Colorful Accent Deco Squares (Figma Inspiration) */}
          <View style={[styles.decoDot, { top: insets.top + 30, left: 18, backgroundColor: '#EC4899' }]} />
          <View style={[styles.decoDot, { top: insets.top + 65, left: 24, backgroundColor: '#06B6D4' }]} />
          <View style={[styles.decoDot, { top: insets.top + 100, left: 16, backgroundColor: '#8B5CF6' }]} />
          <View style={[styles.decoDot, { top: insets.top + 50, left: 56, backgroundColor: '#F97316' }]} />
          <View style={[styles.decoDot, { top: insets.top + 85, left: 50, backgroundColor: '#EAB308' }]} />

          {/* Smooth Dark Gradient Fade */}
          <LinearGradient
            colors={[
              'rgba(10, 10, 14, 0.2)',
              'rgba(10, 10, 14, 0.72)',
              COLORS.bgPrimary,
            ]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Top Floating Header Row */}
          <View style={styles.heroHeaderRow}>
            <Text style={styles.title}>Thư viện</Text>

            <View style={styles.headerRightRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowCreateModal(true)}
                style={styles.headerIconBtn}
                hitSlop={{ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.sm, right: SPACING.sm }}
              >
                <Plus size={20} color={COLORS.white} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Profile')}
                style={styles.headerAvatarBtn}
              >
                <AppAvatarBadge size={36} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Bottom Content */}
          <View style={styles.creativeHeroContent}>
            <View style={styles.heroBadgeRow}>
              <Text style={styles.heroBadgeText}>BỘ SƯU TẬP CỦA BẠN</Text>
            </View>
            <Text style={styles.creativeHeroTitle}>Không Gian Âm Nhạc</Text>
            <Text style={styles.creativeHeroSubtitle}>
              {likedSongs.length} bài yêu thích · {playlists.length} danh sách phát · {downloadedSongs.length} bài đã tải
            </Text>
          </View>
        </View>

        {/* 2x2 Grid of 4 Quick Action Cards */}
        <View style={styles.gridContainer}>
          {/* Card 1: Bài hát đã thích */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('LikedSongs')}
            style={styles.gridCard}
          >
            <LinearGradient
              colors={['#0A0A0E', '#1C0E14', '#42141F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridCardGradient}
            />
            <View style={[styles.gridIconBox, { backgroundColor: COLORS.accentPrimary }]}>
              <Heart size={20} color={COLORS.white} fill={COLORS.white} />
            </View>
            <View style={styles.gridCardBottom}>
              <Text numberOfLines={1} style={styles.gridCardTitle}>Bài hát đã thích</Text>
              <Text style={styles.gridCardSub}>{likedSongs.length} bài hát</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Bài hát đã tải về */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DownloadedSongs')}
            style={styles.gridCard}
          >
            <LinearGradient
              colors={['#0A0A0E', '#0B1D14', '#114227']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridCardGradient}
            />
            <View style={[styles.gridIconBox, { backgroundColor: '#1DB954' }]}>
              <Download size={20} color={COLORS.white} />
            </View>
            <View style={styles.gridCardBottom}>
              <Text numberOfLines={1} style={styles.gridCardTitle}>Bài hát đã tải</Text>
              <Text style={styles.gridCardSub}>{downloadedSongs.length} bài hát</Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: Nghệ sĩ đã theo dõi */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FollowedArtists')}
            style={styles.gridCard}
          >
            <LinearGradient
              colors={['#0A0A0E', '#1C150A', '#45260A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridCardGradient}
            />
            <View style={[styles.gridIconBox, { backgroundColor: '#FF9500' }]}>
              <Users size={20} color={COLORS.white} />
            </View>
            <View style={styles.gridCardBottom}>
              <Text numberOfLines={1} style={styles.gridCardTitle}>Nghệ sĩ theo dõi</Text>
              <Text style={styles.gridCardSub}>{followedArtists.length} nghệ sĩ</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: Album đã lưu */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('SavedAlbums')}
            style={styles.gridCard}
          >
            <LinearGradient
              colors={['#0A0A0E', '#0D1728', '#14315A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridCardGradient}
            />
            <View style={[styles.gridIconBox, { backgroundColor: '#3A7BD5' }]}>
              <Disc size={20} color={COLORS.white} />
            </View>
            <View style={styles.gridCardBottom}>
              <Text numberOfLines={1} style={styles.gridCardTitle}>Album đã lưu</Text>
              <Text style={styles.gridCardSub}>{savedAlbums.length} album</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Heading: Playlists */}
        <Text style={styles.sectionHeading}>DANH SÁCH PHÁT CỦA BẠN</Text>

        {playlists.length > 0 ? (
          playlists.map((pl) => {
            const coverImage =
              pl.songs?.[0]?.thumbnail ||
              pl.coverUrl ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';

            return (
              <TouchableOpacity
                key={pl.id}
                activeOpacity={0.85}
                style={styles.libraryRow}
                onPress={() => {
                  navigation.navigate('PlaylistDetail', {
                    id: pl.id,
                    title: pl.name,
                    thumbnail: coverImage,
                  });
                }}
              >
                <Image source={{ uri: coverImage }} style={styles.playlistThumbImage} />
                <View style={styles.itemInfo}>
                  <Text numberOfLines={1} style={styles.itemTitle}>{pl.name}</Text>
                  <Text style={styles.itemSub}>
                    Danh sách phát · {pl.songCount || pl.songs?.length || 0} bài hát
                  </Text>
                </View>

                {/* 3 dots action button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
                  onPress={() => setSelectedPlaylistForOptions(pl)}
                  style={styles.playlistOptionsBtn}
                >
                  <MoreHorizontal size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          /* Clean Empty State */
          <View style={styles.emptyPlaylistState}>
            <ListMusic size={42} color={COLORS.textMuted} />
            <Text style={styles.emptyPlaylistTitle}>Chưa có danh sách phát nào</Text>
            <Text style={styles.emptyPlaylistSub}>
              Tạo danh sách phát riêng để lưu trữ và phân loại các bài hát yêu thích theo gu của bạn.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowCreateModal(true)}
              style={styles.createPlaylistActionBtn}
            >
              <Plus size={16} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.createPlaylistActionText}>Tạo danh sách phát ngay</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>

      {/* Create New Playlist Modal */}
      <CreatePlaylistModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Playlist Options Modal */}
      <PlaylistOptionsModal
        visible={selectedPlaylistForOptions !== null}
        playlist={selectedPlaylistForOptions}
        onClose={() => setSelectedPlaylistForOptions(null)}
        onPlay={() => {
          if (selectedPlaylistForOptions) {
            navigation.navigate('PlaylistDetail', {
              id: selectedPlaylistForOptions.id,
              title: selectedPlaylistForOptions.name,
              thumbnail: selectedPlaylistForOptions.songs?.[0]?.thumbnail || selectedPlaylistForOptions.coverUrl,
            });
          }
        }}
        onAddSongs={() => {
          setShowAddSongsModal(true);
        }}
      />

      {/* Add Songs Modal */}
      <AddSongsModal
        visible={showAddSongsModal}
        onClose={() => setShowAddSongsModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },

  // Creative Full-Bleed Hero Card (Full Tai Thỏ)
  creativeHeroCard: {
    minHeight: 225,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
    position: 'relative',
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'space-between',
  },
  diagonalPillContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    opacity: 0.7,
  },
  diagonalPill: {
    position: 'absolute',
    width: 140,
    height: 280,
    borderRadius: 70,
    overflow: 'hidden',
    transform: [{ rotate: '-28deg' }],
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  pill1: {
    top: -40,
    right: 175,
  },
  pill2: {
    top: -10,
    right: 45,
  },
  pill3: {
    top: 50,
    right: -80,
  },
  pillImage: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '28deg' }, { scale: 1.35 }],
  },
  decoDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    opacity: 0.75,
  },

  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sm,
    zIndex: 3,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeHero,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIconBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },

  creativeHeroContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    zIndex: 2,
  },
  heroBadgeRow: {
    marginBottom: 4,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: 0.5,
  },
  creativeHeroTitle: {
    fontSize: TYPOGRAPHY.sizeHeading,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  creativeHeroSubtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textLightMuted,
    lineHeight: 16,
  },

  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.xl,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '47.5%',
    height: 116,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.md,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  gridCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  gridIconBox: {
    width: 38,
    height: 38,
    borderRadius: LAYOUT.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardBottom: {
    marginTop: SPACING.xs,
  },
  gridCardTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  gridCardSub: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textSecondary,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    paddingHorizontal: SPACING.screenPadding,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm + 2,
    marginBottom: 2,
  },
  playlistThumbImage: {
    width: LAYOUT.avatarMd,
    height: LAYOUT.avatarMd,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  itemInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  playlistOptionsBtn: {
    padding: SPACING.xs,
  },
  emptyPlaylistState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xs + 2,
  },
  emptyPlaylistTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  emptyPlaylistSub: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeightBody,
    marginBottom: SPACING.md,
  },
  createPlaylistActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: LAYOUT.radiusFull,
  },
  createPlaylistActionText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
});
