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
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Plus,
  Users,
  Download,
  MoreHorizontal,
  Disc,
  ListMusic,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useLibraryStore, CustomPlaylist } from '../store/libraryStore';
import { useDownloadStore } from '../store/downloadStore';
import { useNavStore } from '../store/navStore';
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

  useFocusEffect(
    React.useCallback(() => {
      useNavStore.getState().setCurrentRoute('Library');
    }, [])
  );

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
        keyboardShouldPersistTaps="handled"
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
                <AppAvatarBadge size={42} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Bottom Content */}
          <View style={styles.creativeHeroContent}>
            <View style={styles.heroBadgeRow}>
              <Text style={styles.heroBadgeText}>BỘ SƯU TẬP CỦA BẠN</Text>
            </View>
            <Text style={styles.creativeHeroTitle}>Không Gian Âm Nhạc</Text>
          </View>
        </View>

        {/* Clean Modern Quick Action Items */}
        <View style={styles.bannerCardsContainer}>
          {/* Item 1: Bài hát đã thích */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('LikedSongs')}
            style={styles.fullWidthCard}
          >
            <LinearGradient
              colors={['#8A2387', '#E94057']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconBox}
            >
              <Heart size={22} color={COLORS.white} fill={COLORS.white} />
            </LinearGradient>
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardMainTitle}>Bài hát đã thích</Text>
              <Text style={styles.cardSubTitle}>{likedSongs.length} bài hát</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Item 2: Bài hát đã tải về */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('DownloadedSongs')}
            style={styles.fullWidthCard}
          >
            {downloadedSongs[0]?.thumbnail ? (
              <Image source={{ uri: downloadedSongs[0].thumbnail }} style={styles.cardImageThumb} />
            ) : (
              <LinearGradient
                colors={['#065F46', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconBox}
              >
                <Download size={22} color={COLORS.white} strokeWidth={2.3} />
              </LinearGradient>
            )}
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardMainTitle}>Bài hát đã tải</Text>
              <Text style={styles.cardSubTitle}>{downloadedSongs.length} bài hát · Nghe ngoại tuyến</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Item 3: Nghệ sĩ đã theo dõi */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('FollowedArtists')}
            style={styles.fullWidthCard}
          >
            {(followedArtists[0]?.thumbnail || (followedArtists[0] as any)?.cover || (followedArtists[0] as any)?.avatar) ? (
              <Image
                source={{ uri: followedArtists[0]?.thumbnail || (followedArtists[0] as any)?.cover || (followedArtists[0] as any)?.avatar }}
                style={[styles.cardImageThumb, { borderRadius: LAYOUT.radiusFull }]}
              />
            ) : (
              <LinearGradient
                colors={['#92400E', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconBox}
              >
                <Users size={22} color={COLORS.white} strokeWidth={2.3} />
              </LinearGradient>
            )}
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardMainTitle}>Nghệ sĩ theo dõi</Text>
              <Text style={styles.cardSubTitle}>{followedArtists.length} nghệ sĩ</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Item 4: Album đã lưu */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('SavedAlbums')}
            style={styles.fullWidthCard}
          >
            {(savedAlbums[0]?.thumbnail || (savedAlbums[0] as any)?.cover) ? (
              <Image
                source={{ uri: savedAlbums[0]?.thumbnail || (savedAlbums[0] as any)?.cover }}
                style={styles.cardImageThumb}
              />
            ) : (
              <LinearGradient
                colors={['#1E40AF', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconBox}
              >
                <Disc size={22} color={COLORS.white} strokeWidth={2.3} />
              </LinearGradient>
            )}
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardMainTitle}>Album đã lưu</Text>
              <Text style={styles.cardSubTitle}>{savedAlbums.length} album</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section Heading: Playlists */}
        <Text style={styles.sectionHeading}>DANH SÁCH PHÁT CỦA BẠN</Text>

        {playlists.filter((pl) => pl.name && !pl.name.includes('TEMPO_ACTIVE') && !pl.name.includes('active-server') && !pl.name.startsWith('__')).length > 0 ? (
          playlists.filter((pl) => pl.name && !pl.name.includes('TEMPO_ACTIVE') && !pl.name.includes('active-server') && !pl.name.startsWith('__')).map((pl) => {
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
                    initialSongs: pl.songs,
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
              initialSongs: selectedPlaylistForOptions.songs,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'visible',
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
  bannerCardsContainer: {
    paddingHorizontal: SPACING.screenPadding,
    gap: 0,
    marginBottom: SPACING.md,
  },
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  cardIconBox: {
    width: 64,
    height: 64,
    borderRadius: LAYOUT.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardImageThumb: {
    width: 64,
    height: 64,
    borderRadius: LAYOUT.radiusLg,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  cardInfoCol: {
    flex: 1,
  },
  cardMainTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: -0.1,
  },
  cardSubTitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginTop: 2,
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
