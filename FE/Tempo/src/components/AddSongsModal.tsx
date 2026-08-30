/**
 * AddSongsModal - Thêm bài hát vào danh sách Bài hát ưa thích
 * Tìm kiếm bài hát và chạm "+" để lưu ngay vào Thư viện
 * Strictly follows STANDARDS.md
 */
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
import { Search, X, Plus, Check, Music } from 'lucide-react-native';
import { apiClient } from '../api/client';
import { UnifiedSong } from '../types/music';
import { useLibraryStore } from '../store/libraryStore';
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
  const [searchResults, setSearchResults] = useState<UnifiedSong[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<UnifiedSong[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { isLiked, toggleLike, isSongInPlaylist, addSongToPlaylist } = useLibraryStore();

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

  const displayList = query.trim() ? searchResults : trendingSongs;

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
              placeholder="Tìm bài hát, ca sĩ..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
              autoFocus
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

        {/* Section Heading */}
        <Text style={styles.sectionHeading}>
          {query.trim() ? 'KẾT QUẢ TÌM KIẾM' : 'BÀI HÁT THỊNH HÀNH ĐỀ XUẤT'}
        </Text>

        {/* Results List */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="small" color={COLORS.accentPrimary} />
          </View>
        ) : displayList.length === 0 ? (
          <View style={styles.centerBox}>
            <Music size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Không tìm thấy bài hát phù hợp</Text>
          </View>
        ) : (
          <FlatList
            data={displayList}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
            renderItem={({ item }) => {
              const added = isItemAdded(item.id);
              return (
                <View style={styles.songRow}>
                  <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
                  <View style={styles.songInfo}>
                    <Text numberOfLines={1} style={styles.songTitle}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.songArtist}>
                      {item.artistsNames}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => handleToggle(item)}
                    style={[styles.addBtn, added && styles.addBtnLiked]}
                  >
                    {added ? (
                      <Check size={18} color={COLORS.white} />
                    ) : (
                      <Plus size={18} color={COLORS.textPrimary} />
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
    marginVertical: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurfaceSecondary,
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
  songArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnLiked: {
    backgroundColor: COLORS.accentPrimary,
  },
});
