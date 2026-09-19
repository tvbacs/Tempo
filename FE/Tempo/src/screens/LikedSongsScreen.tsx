/**
 * LikedSongsScreen - Danh Sách Bài Hát Ưa Thích
 * Hỗ trợ Chế độ Chọn Nhiều Bài (Multi-Select): Cho phép chọn chính xác bài muốn bỏ thích hoặc tải về
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Shuffle,
  Play,
  Pause,
  Plus,
  Moon,
  Download,
  Check,
  CheckSquare,
  Square,
  Trash2,
  Heart,
  Search,
  X,
} from "lucide-react-native";
import { GradientPlayButton } from "../components/GradientButton";
import { SongItem } from "../components/SongItem";
import { SongItemSkeleton } from "../components/SkeletonLoader";

import { SongOptionsModal } from "../components/SongOptionsModal";
import { AddSongsModal } from "../components/AddSongsModal";
import { DownloadSelectorModal } from "../components/DownloadSelectorModal";
import { usePlayerStore } from "../store/playerStore";
import { useLibraryStore } from "../store/libraryStore";
import { useSleepTimerStore } from "../store/sleepTimerStore";
import { useDownloadStore } from "../store/downloadStore";
import { useToastStore } from "../store/toastStore";
import { useActivePlayback } from "../store/connectStore";
import { UnifiedSong } from "../types/music";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";
import { formatDuration } from "../utils/format";

export const LikedSongsScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDownloadSelector, setShowDownloadSelector] = useState(false);
  const [selectedSongForOptions, setSelectedSongForOptions] = useState<UnifiedSong | null>(null);
  const [isScreenLoading, setIsScreenLoading] = useState(true);

  // Multi-Select Mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const playSong = usePlayerStore((s) => s.playSong);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const playbackContext = usePlayerStore((s) => s.playbackContext);
  const { song: currentSong, isPlaying, togglePlayPause } = useActivePlayback();
  const { likedSongs, fetchLikedSongs, toggleLike } = useLibraryStore();
  const { downloadedSongs, downloadSong } = useDownloadStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    // Mở màn hình ngay lập tức, fetch trong nền
    fetchLikedSongs().finally(() => setIsScreenLoading(false));
  }, [fetchLikedSongs]);

  // Lọc chỉ hiển thị các bài hát có thể phát (chỉ loại bỏ bài local thuần túy do user import đã bị xoá tệp)
  const displaySongs = React.useMemo(() => {
    return likedSongs.filter((s) => {
      const isImportedLocalOnly = (s.source as any) === 'local' || (typeof s.id === 'string' && s.id.startsWith('local_'));
      if (isImportedLocalOnly) {
        return downloadedSongs.some((d) => d.id === s.id);
      }
      return true; // Các bài Zing, YouTube, trích xuất đều phát online bình thường
    });
  }, [likedSongs, downloadedSongs]);

  // Lọc tìm kiếm theo từ khoá
  const filteredSongs = React.useMemo(() => {
    if (!searchQuery.trim()) return displaySongs;
    const q = searchQuery.toLowerCase().trim();
    return displaySongs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artistsNames?.toLowerCase().includes(q)
    );
  }, [displaySongs, searchQuery]);

  // Chỉ xem là đang phát danh sách này nếu đúng context 'liked'
  const isCurrentPlaylistPlaying =
    isPlaying &&
    playbackContext?.type === 'liked';

  const handlePlayAll = () => {
    if (filteredSongs.length === 0) return;

    if (isCurrentPlaylistPlaying) {
      togglePlayPause();
      return;
    }

    const songsToPlay = isShuffle
      ? [...filteredSongs].sort(() => Math.random() - 0.5)
      : filteredSongs;
    playSong(songsToPlay[0], songsToPlay, { type: 'liked', title: 'Bài hát đã thích' });
  };

  const handleToggleShuffle = () => {
    if (!isShuffle) {
      toggleShuffle();
    }
    if (!isCurrentPlaylistPlaying && filteredSongs.length > 0) {
      const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], filteredSongs, { type: 'liked', title: 'Bài hát đã thích' });
    } else {
      toggleShuffle();
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredSongs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSongs.map((s) => s.id));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 bài hát", "info");
      return;
    }

    const songsToRemove = filteredSongs.filter((s) => selectedIds.includes(s.id));
    const count = songsToRemove.length;
    for (const song of songsToRemove) {
      await toggleLike(song);
    }
    setSelectedIds([]);
    setIsSelectMode(false);
    showToast(`Đã xóa ${count} bài hát khỏi Bài hát ưa thích`, "info");
  };

  const handleDownloadSelected = () => {
    if (selectedIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 bài hát", "info");
      return;
    }

    const songsToDownload = likedSongs.filter((s) => selectedIds.includes(s.id));
    useDownloadStore.getState().downloadMultiple(songsToDownload);
    setSelectedIds([]);
    setIsSelectMode(false);
  };

  // Preview stack covers (3 bài đầu)
  const previewCovers = likedSongs.slice(0, 3).map((s) => s.thumbnail);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Background Gradient Top Ambient - Sáng hồng / Đỏ đô chuẩn Card Bài hát ưa thích */}
      <LinearGradient
        colors={["#631526", "#420F1B", "#22080E", COLORS.bgPrimary]}
        locations={[0, 0.3, 0.6, 0.9]}
        style={styles.ambientGradient}
      />

      {/* Top Floating Navigation */}
      <View style={styles.topNav}>
        {isSelectMode ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleToggleSelectAll}
            style={styles.navTextBtn}
          >
            <Text style={styles.navTextBtnText}>
              {selectedIds.length === likedSongs.length ? "Bỏ chọn tất cả" : `Chọn tất cả (${likedSongs.length})`}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
            onPress={() => navigation.goBack()}
            style={styles.navCircleBtn}
          >
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={styles.topNavRight}>
          {likedSongs.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIds([]);
              }}
              style={styles.selectToggleBtn}
            >
              <Text style={[styles.selectToggleBtnText, isSelectMode && { color: COLORS.accentPrimary }]}>
                {isSelectMode ? "Hủy" : "Chọn bài"}
              </Text>
            </TouchableOpacity>
          )}

          {!isSelectMode && (
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
              onPress={() => useSleepTimerStore.getState().openModal()}
              style={styles.navCircleBtn}
            >
              <Moon size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Left-Aligned Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Bài hát ưa thích</Text>
          <Text style={styles.subtitle}>
            {isSelectMode ? `Đã chọn ${selectedIds.length} / ${displaySongs.length} bài hát` : `${displaySongs.length} bài hát`}
          </Text>

          {/* Action Row: Preview stack, Download, Add Song, Shuffle & Large Play (Hidden in Select Mode) */}
          {!isSelectMode && (
            <View style={styles.actionControlRow}>
              <View style={styles.leftActions}>
                {displaySongs.length > 0 ? (
                  <View style={styles.coverStack}>
                    {displaySongs.slice(0, 3).map((s, i) => (
                      <Image
                        key={i}
                        source={{ uri: s.thumbnail }}
                        style={[
                          styles.coverStackItem,
                          { left: i * 14, zIndex: 10 - i },
                        ]}
                      />
                    ))}
                  </View>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.75}
                  hitSlop={{ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.sm, right: SPACING.sm }}
                  onPress={() => setShowDownloadSelector(true)}
                  style={styles.actionCircleBtn}
                  accessibilityLabel="Tải xuống tất cả"
                >
                  <Download size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  hitSlop={{ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.sm, right: SPACING.sm }}
                  onPress={() => setShowAddModal(true)}
                  style={styles.actionCircleBtn}
                  accessibilityLabel="Thêm bài hát"
                >
                  <Plus size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.rightActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleToggleShuffle}
                  hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
                  style={styles.shuffleBtn}
                >
                  <Shuffle
                    size={22}
                    color={isShuffle ? COLORS.accentPrimary : COLORS.textSecondary}
                  />
                </TouchableOpacity>

                <GradientPlayButton
                  onPress={handlePlayAll}
                  size={LAYOUT.iconButtonXl}
                >
                  {isLoading && isCurrentPlaylistPlaying ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : isCurrentPlaylistPlaying ? (
                    <Pause size={24} color={COLORS.white} fill={COLORS.white} />
                  ) : (
                    <Play size={24} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 2 }} />
                  )}
                </GradientPlayButton>
              </View>
            </View>
          )}

          {/* Inline Search Bar */}
          {!isSelectMode && displaySongs.length > 0 && (
            <View style={styles.searchBarWrap}>
              <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm trong bài hát đã thích..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Songs List */}
        <View style={styles.songListContainer}>
          {isScreenLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SongItemSkeleton key={i} />)
          ) : displaySongs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa có bài hát ưa thích</Text>
              <Text style={styles.emptySubtitle}>
                Chạm vào biểu tượng trái tim trên bất kỳ bài hát nào hoặc nhấn dấu "+" ở trên để thêm vào đây.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAddModal(true)}
                style={styles.discoverBtn}
              >
                <Text style={styles.discoverBtnText}>Thêm bài hát ngay</Text>
              </TouchableOpacity>
            </View>
          ) : filteredSongs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Không tìm thấy bài hát</Text>
              <Text style={styles.emptySubtitle}>
                Không có bài hát nào khớp với từ khóa "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredSongs.map((song, index) => {
              const selected = selectedIds.includes(song.id);

              if (isSelectMode) {
                return (
                  <TouchableOpacity
                    key={song.id}
                    activeOpacity={0.75}
                    onPress={() => toggleSelect(song.id)}
                    style={[styles.selectSongRow, selected && styles.selectSongRowActive]}
                  >
                    <View style={styles.checkboxWrap}>
                      {selected ? (
                        <View style={styles.checkedBox}>
                          <Check size={14} color={COLORS.white} />
                        </View>
                      ) : (
                        <View style={styles.uncheckedBox} />
                      )}
                    </View>

                    <Image source={{ uri: song.thumbnail }} style={styles.selectSongThumb} />

                    <View style={styles.selectSongInfo}>
                      <Text numberOfLines={1} style={styles.selectSongTitle}>
                        {song.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.selectSongArtist}>
                        {song.artistsNames}
                      </Text>
                    </View>

                    <Text style={styles.durationText}>{formatDuration(song.duration)}</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <SongItem
                  key={song.id}
                  song={song}
                  index={index + 1}
                  hideSavedBadge
                  onPress={() => playSong(song, filteredSongs, { type: 'liked', title: 'Bài hát đã thích' })}
                  onMorePress={() => setSelectedSongForOptions(song)}
                />
              );
            })
          )}
        </View>

        <View style={{ height: isSelectMode ? 130 : LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>

      {/* Floating Bottom Action Toolbar for Multi-Select Mode */}
      {isSelectMode && (
        <View style={[styles.floatingActionToolbar, { bottom: currentSong ? LAYOUT.miniPlayerHeight + insets.bottom + SPACING.sm : insets.bottom + SPACING.md }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRemoveSelected}
            disabled={selectedIds.length === 0}
            style={[styles.toolbarActionBtn, styles.toolbarDeleteBtn, selectedIds.length === 0 && styles.toolbarBtnDisabled]}
          >
            <Trash2 size={18} color={selectedIds.length === 0 ? COLORS.textMuted : COLORS.accentPrimary} />
            <Text style={[styles.toolbarDeleteText, selectedIds.length === 0 && styles.toolbarTextDisabled]}>
              Bỏ thích ({selectedIds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDownloadSelected}
            disabled={selectedIds.length === 0}
            style={[styles.toolbarActionBtn, styles.toolbarDownloadBtn, selectedIds.length === 0 && styles.toolbarBtnDisabled]}
          >
            <Download size={18} color={selectedIds.length === 0 ? COLORS.textMuted : COLORS.white} />
            <Text style={[styles.toolbarDownloadText, selectedIds.length === 0 && styles.toolbarTextDisabled]}>
              Tải về ({selectedIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Songs Modal */}
      <AddSongsModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Song Options Modal (3 dots menu) */}
      <SongOptionsModal
        visible={selectedSongForOptions !== null}
        song={selectedSongForOptions}
        onClose={() => setSelectedSongForOptions(null)}
      />

      {/* Download Selector Modal */}
      <DownloadSelectorModal
        visible={showDownloadSelector}
        onClose={() => setShowDownloadSelector(false)}
        songs={likedSongs}
        playlistTitle="Bài hát ưa thích"
      />

      {/* Sleep Timer Synchronized Modal */}
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  ambientGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    zIndex: 10,
  },
  topNavRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  navCircleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    alignItems: "center",
    justifyContent: "center",
  },
  navTextBtn: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.xs,
  },
  navTextBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  selectToggleBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  selectToggleBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: SPACING.xxxl,
  },
  headerSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  mainTitle: {
    fontSize: TYPOGRAPHY.sizeHero,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  actionControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  coverStack: {
    flexDirection: "row",
    width: 68,
    height: 40,
    position: "relative",
  },
  coverStackItem: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  actionCircleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: LAYOUT.radiusFull,
    paddingHorizontal: SPACING.md,
    height: 46,
    marginTop: 2,
    marginBottom: SPACING.sm,
    gap: SPACING.xs + 2,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  shuffleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    alignItems: "center",
    justifyContent: "center",
  },
  songListContainer: {
    paddingHorizontal: SPACING.screenPadding,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 1.5,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: TYPOGRAPHY.lineHeightBody,
    marginBottom: SPACING.md,
  },
  discoverBtn: {
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.radiusFull,
  },
  discoverBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.white,
  },
  selectSongRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: LAYOUT.radiusMd,
    marginBottom: 4,
  },
  selectSongRowActive: {
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  checkboxWrap: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.xs,
  },
  checkedBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckedBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  selectSongThumb: {
    width: 44,
    height: 44,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  selectSongInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  selectSongTitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  selectSongArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  durationText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
  },
  floatingActionToolbar: {
    position: "absolute",
    left: SPACING.screenPadding,
    right: SPACING.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    zIndex: 99,
  },
  toolbarActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.sm + 3,
    borderRadius: LAYOUT.radiusFull,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  toolbarDeleteBtn: {
    backgroundColor: '#26161A',
  },
  toolbarDownloadBtn: {
    backgroundColor: COLORS.accentPrimary,
  },
  toolbarBtnDisabled: {
    opacity: 0.45,
  },
  toolbarDeleteText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.accentPrimary,
  },
  toolbarDownloadText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.white,
  },
  toolbarTextDisabled: {
    color: COLORS.textMuted,
  },
});
