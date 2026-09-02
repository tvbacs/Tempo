import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Plus, CheckCircle2, Music, ArrowDownCircle, HardDriveDownload, Globe } from 'lucide-react-native';
import { apiClient } from '../api/client';
import { UnifiedSong } from '../types/music';
import { useLibraryStore } from '../store/libraryStore';
import { useDownloadStore } from '../store/downloadStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

interface AddSongsModalProps {
  visible: boolean;
  onClose: () => void;
  playlistId?: string;
  playlistTitle?: string;
}

export const AddSongsModal: React.FC<AddSongsModalProps> = ({
  visible,
  onClose,
  playlistId,
  playlistTitle,
}) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'downloaded' | 'online'>('all');
  const [searchResults, setSearchResults] = useState<UnifiedSong[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { isLiked, toggleLike, isSongInPlaylist, addSongToPlaylist } = useLibraryStore();
  const { downloadedSongs } = useDownloadStore();

  useEffect(() => {
    if (visible && trendingSongs.length === 0) {
      apiClient
        .getChart()
        .then((chart) => {
          setTrendingSongs(chart.items || []);
        })
        .catch(() => {});
    }
  }, [visible]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.search(text);
      setSearchResults(res.songs || []);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  // Lọc bài hát đã tải khớp từ khóa
  const qLower = query.toLowerCase().trim();
  const matchingDownloads = downloadedSongs.filter((s) => {
    if (!qLower) return true;
    return (
      (s.title || '').toLowerCase().includes(qLower) ||
      (s.artistsNames || '').toLowerCase().includes(qLower)
    );
  });

  // Xác định danh sách hiển thị theo Tab
  let displayList: UnifiedSong[] = [];
  if (activeTab === 'downloaded') {
    displayList = matchingDownloads;
  } else if (activeTab === 'online') {
    displayList = query.trim() ? searchResults : trendingSongs;
  } else {
    // Tab 'all': Gộp bài tải về khớp lên đầu, sau đó là kết quả trực tuyến
    const onlineList = query.trim() ? searchResults : trendingSongs;
    const downloadIds = new Set(matchingDownloads.map((s) => s.id));
    const uniqueOnline = onlineList.filter((s) => !downloadIds.has(s.id));
    displayList = [...matchingDownloads, ...uniqueOnline];
  }

  const isItemAdded = (songId: string) => {
    return playlistId ? isSongInPlaylist(playlistId, songId) : isLiked(songId);
  };

  const handleToggle = (song: UnifiedSong) => {
    if (playlistId) {
      addSongToPlaylist(playlistId, song);
    } else {
      toggleLike(song);
    }
  };

  const topInset = Math.max(insets.top, 24);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: topInset }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text numberOfLines={1} style={styles.title}>
            {playlistTitle ? `Thêm bài hát: ${playlistTitle}` : 'Thêm bài hát ưa thích'}
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Xong</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.textSecondary} />
            <TextInput
              value={query}
              onChangeText={handleSearch}
              placeholder="Tìm bài hát, ca sĩ online hoặc đã tải..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs: Tất cả | Đã tải về | Trực tuyến */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('all')}
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('downloaded')}
            style={[styles.tabBtn, activeTab === 'downloaded' && styles.tabBtnActive]}
          >
            <HardDriveDownload
              size={14}
              color={activeTab === 'downloaded' ? COLORS.white : COLORS.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabText, activeTab === 'downloaded' && styles.tabTextActive]}>
              Đã tải ({downloadedSongs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('online')}
            style={[styles.tabBtn, activeTab === 'online' && styles.tabBtnActive]}
          >
            <Globe
              size={14}
              color={activeTab === 'online' ? COLORS.white : COLORS.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.tabText, activeTab === 'online' && styles.tabTextActive]}>
              Trực tuyến
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionHeading}>
          {activeTab === 'downloaded'
            ? `BÀI HÁT ĐÃ TẢI VỀ (${displayList.length})`
            : query.trim()
            ? 'KẾT QUẢ TÌM KIẾM'
            : 'BÀI HÁT THỊNH HÀNH & ĐÃ TẢI'}
        </Text>

        {/* Results List */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={COLORS.accentPrimary} />
          </View>
        ) : displayList.length === 0 ? (
          <View style={styles.centerBox}>
            <Music size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {activeTab === 'downloaded'
                ? 'Không có bài hát đã tải nào phù hợp'
                : 'Không tìm thấy bài hát phù hợp'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayList}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
            renderItem={({ item }) => {
              const added = isItemAdded(item.id);
              const isDownloaded = downloadedSongs.some((ds) => ds.id === item.id);
              return (
                <View style={styles.songRow}>
                  <Image
                    source={{
                      uri:
                        item.thumbnail ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
                    }}
                    style={styles.thumb}
                  />
                  <View style={styles.songInfo}>
                    <Text numberOfLines={1} style={styles.songTitle}>
                      {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                      {isDownloaded && (
                        <View style={styles.offlineBadge}>
                          <ArrowDownCircle size={12} color="#1DB954" style={{ marginRight: 3 }} />
                          <Text style={styles.offlineBadgeText}>ĐÃ TẢI</Text>
                        </View>
                      )}
                      <Text numberOfLines={1} style={styles.songArtist}>
                        {item.artistsNames}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
                    onPress={() => handleToggle(item)}
                    style={styles.addBtn}
                  >
                    {added ? (
                      <CheckCircle2 size={20} color="#1DB954" />
                    ) : (
                      <Plus size={20} color={COLORS.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeHeading,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  doneBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  doneBtnText: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '700',
    color: COLORS.accentPrimary,
  },
  searchBarWrapper: {
    paddingHorizontal: SPACING.screenPadding,
    marginVertical: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: LAYOUT.radiusFull,
    height: LAYOUT.searchBarHeight,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizeBodySmall,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.xs + 2,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  tabBtnActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    paddingHorizontal: SPACING.screenPadding,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.xxxl,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
  },
  thumb: {
    width: LAYOUT.avatarSm,
    height: LAYOUT.avatarSm,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  songInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  songTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  offlineBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1DB954',
  },
  songArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  addBtn: {
    padding: SPACING.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
