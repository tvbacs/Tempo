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
  Clock,
  Crown,
} from 'lucide-react-native';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useLibraryStore, CustomPlaylist } from '../store/libraryStore';
import { useDownloadStore } from '../store/downloadStore';
import { usePlayerStore } from '../store/playerStore';
import { useAuthStore } from '../store/authStore';
import { useNavStore } from '../store/navStore';
import { AppAvatarBadge } from '../components/AppAvatarBadge';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';
import { PlaylistOptionsModal } from '../components/PlaylistOptionsModal';
import { AddSongsModal } from '../components/AddSongsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

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
    history,
    fetchHistory,
  } = useLibraryStore();

  const { downloadedSongs, fetchDownloads } = useDownloadStore();
  const playSong = usePlayerStore((s) => s.playSong);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchLikedSongs();
    fetchDownloads();
    fetchPlaylists();
    fetchFollowedArtists();
    fetchSavedAlbums();
    fetchHistory();
  }, [fetchLikedSongs, fetchDownloads, fetchPlaylists, fetchFollowedArtists, fetchSavedAlbums, fetchHistory]);

  const userPlaylists = playlists.filter(
    (pl) => pl.name && !pl.name.includes('TEMPO_ACTIVE') && !pl.name.includes('active-server') && !pl.name.startsWith('__')
  );

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top SoundCloud-style Header Section */}
        <View style={[styles.heroHeaderRow, { paddingTop: Math.max(insets.top, 20), paddingBottom: SPACING.md }]}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Profile')}
              style={styles.headerAvatarBtn}
            >
              <AppAvatarBadge size={38} />
            </TouchableOpacity>

            {!user?.isVip ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Upgrade')}
                style={styles.proUpgradeBadge}
              >
                <LinearGradient
                  colors={['#FC475C', '#FC655A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.proUpgradeGradient}
                >
                  <Crown size={11} color={COLORS.white} fill={COLORS.white} style={{ marginRight: 3 }} />
                  <Text style={styles.proUpgradeText}>Nâng cấp VIP</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.title}>Thư viện</Text>
          </View>

          <View style={styles.headerRightRow} />
        </View>

        {/* SoundCloud-style Clean Vertical Navigation Rows */}
        <View style={styles.bannerCardsContainer}>
          {/* Row 1: Bài hát đã thích */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('LikedSongs')}
            style={styles.fullWidthCard}
          >
            <LinearGradient
              colors={['#8A2387', '#E94057']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconBox}
            >
              <Heart size={20} color={COLORS.white} fill={COLORS.white} />
            </LinearGradient>
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardMainTitle}>Bài hát đã thích</Text>
              <Text style={styles.cardSubTitle}>{likedSongs.length} bài hát</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Row 2: Bài hát đã tải về */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('DownloadedSongs')}
            style={styles.fullWidthCard}
          >
            {downloadedSongs.length > 0 && downloadedSongs[0]?.thumbnail ? (
              <Image
                source={{ uri: downloadedSongs[0].thumbnail }}
                style={[styles.cardIconBox, { borderRadius: LAYOUT.radiusMd }]}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#065F46', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconBox}
              >
                <Download size={20} color={COLORS.white} strokeWidth={2.3} />
              </LinearGradient>
            )}
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardMainTitle}>Bài hát đã tải</Text>
              <Text style={styles.cardSubTitle}>{downloadedSongs.length} bài hát · Nghe ngoại tuyến</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Row 3: Nghệ sĩ đã theo dõi */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('FollowedArtists')}
            style={styles.fullWidthCard}
          >
            {followedArtists.length > 0 && (followedArtists[0]?.thumbnail || (followedArtists[0] as any)?.imageUrl) ? (
              <Image
                source={{ uri: followedArtists[0].thumbnail || (followedArtists[0] as any).imageUrl }}
                style={[styles.cardIconBox, { borderRadius: LAYOUT.radiusFull }]}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#92400E', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconBox}
              >
                <Users size={20} color={COLORS.white} strokeWidth={2.3} />
              </LinearGradient>
            )}
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardMainTitle}>Nghệ sĩ theo dõi</Text>
              <Text style={styles.cardSubTitle}>{followedArtists.length} nghệ sĩ</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Row 4: Album đã lưu */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SavedAlbums')}
            style={styles.fullWidthCard}
          >
            {savedAlbums.length > 0 && (savedAlbums[0]?.thumbnail || (savedAlbums[0] as any)?.coverUrl) ? (
              <Image
                source={{ uri: savedAlbums[0].thumbnail || (savedAlbums[0] as any).coverUrl }}
                style={[styles.cardIconBox, { borderRadius: LAYOUT.radiusSm }]}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#1E40AF', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconBox}
              >
                <Disc size={20} color={COLORS.white} strokeWidth={2.3} />
              </LinearGradient>
            )}
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardMainTitle}>Album đã lưu</Text>
              <Text style={styles.cardSubTitle}>{savedAlbums.length} album</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Danh sách phát — Horizontal Scroll Vertical Cards */}
        <View style={styles.playlistSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeadingTitle}>Danh sách phát</Text>
            {userPlaylists.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.seeAllText}>+ Tạo mới</Text>
              </TouchableOpacity>
            )}
          </View>

          {userPlaylists.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playlistHScrollContent}
            >
              {userPlaylists.map((pl) => {
                const coverImage =
                  pl.songs?.[0]?.thumbnail ||
                  pl.coverUrl ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';

                return (
                  <TouchableOpacity
                    key={pl.id}
                    activeOpacity={0.85}
                    style={styles.playlistVertCard}
                    onPress={() => {
                      navigation.navigate('PlaylistDetail', {
                        id: pl.id,
                        title: pl.name,
                        thumbnail: coverImage,
                        initialSongs: pl.songs,
                      });
                    }}
                    onLongPress={() => setSelectedPlaylistForOptions(pl)}
                  >
                    <Image source={{ uri: coverImage }} style={styles.playlistVertImg} resizeMode="cover" />
                    <Text numberOfLines={2} style={styles.playlistVertTitle}>{pl.name}</Text>
                    <Text numberOfLines={1} style={styles.playlistVertSub}>
                      {pl.songCount || pl.songs?.length || 0} bài hát
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            /* Clean Empty State */
            <View style={styles.emptyPlaylistState}>
              <ListMusic size={38} color={COLORS.textMuted} />
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
        </View>

        {/* Section: Gần đây nghe (SoundCloud Listening History Style) */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeadingTitle}>Gần đây nghe</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SeeAll', { type: 'history', title: 'Lịch sử nghe' })}
              >
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {history.slice(0, 5).map((item, index) => {
              const song = item.song;
              if (!song) return null;
              return (
                <TouchableOpacity
                  key={`${song.id || index}_${item.updatedAt || index}`}
                  activeOpacity={0.8}
                  onPress={() => playSong(song, history.map((h) => h.song).filter(Boolean))}
                  style={styles.historyRow}
                >
                  <Image
                    source={{
                      uri: song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
                    }}
                    style={styles.historyThumb}
                  />
                  <View style={styles.historyInfoCol}>
                    <Text numberOfLines={1} style={styles.historySongTitle}>
                      {song.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.historyArtist}>
                      {song.artistsNames || 'Nhiều nghệ sĩ'}
                    </Text>
                  </View>
                  {(item.durationMs || (song as any).duration) ? (
                    <Text style={styles.historyDuration}>
                      {formatDuration(item.durationMs || ((song as any).duration * 1000))}
                    </Text>
                  ) : (
                    <Clock size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}
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
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeHero - 2,
    fontWeight: '800',
    color: '#EEEEF2',
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'visible',
  },
  proUpgradeBadge: {
    borderRadius: LAYOUT.radiusFull,
    overflow: 'hidden',
  },
  proUpgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: LAYOUT.radiusFull,
  },
  proUpgradeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
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
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 0,
  },
  cardIconBox: {
    width: 68,
    height: 68,
    borderRadius: LAYOUT.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardInfoCol: {
    flex: 1,
  },
  cardMainTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '600',
    color: '#EEEEF2',
    letterSpacing: -0.1,
  },
  cardSubTitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // History Section (SoundCloud Style)
  historySection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionHeadingTitle: {
    fontSize: TYPOGRAPHY.sizeHeading - 4,
    fontWeight: '800',
    color: '#EEEEF2',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.accentPrimary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  historyThumb: {
    width: 68,
    height: 68,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  historyInfoCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  historySongTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '600',
    color: '#EEEEF2',
    marginBottom: 2,
  },
  historyArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  historyDuration: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
    minWidth: 32,
    textAlign: 'right',
  },

  // Playlist Section
  playlistSection: {
    paddingHorizontal: SPACING.screenPadding,
    marginTop: SPACING.lg,
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: 2,
  },
  playlistThumbImage: {
    width: 68,
    height: 68,
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
    color: '#EEEEF2',
    marginBottom: 2,
  },
  itemSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },

  // Horizontal scroll vertical card (playlist)
  playlistHScrollContent: {
    paddingLeft: 2,
    paddingRight: SPACING.screenPadding,
    gap: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  playlistVertCard: {
    width: 130,
  },
  playlistVertImg: {
    width: 130,
    height: 130,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.xs + 2,
  },
  playlistVertTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: '#EEEEF2',
    lineHeight: 17,
    marginBottom: 2,
  },
  playlistVertSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  playlistOptionsBtn: {
    padding: SPACING.xs,
  },
  emptyPlaylistState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xs + 2,
  },
  emptyPlaylistTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '700',
    color: '#EEEEF2',
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
