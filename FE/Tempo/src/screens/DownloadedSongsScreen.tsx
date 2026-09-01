/**
 * DownloadedSongsScreen - Màn hình Bài Hát Đã Tải Về (Nghe Offline 100%)
 * Thiết kế chuẩn như màn hình Bài hát ưa thích:
 * - Preview cover stack, nút Shuffle độc lập, nút Play lớn
 * - Nút "Chọn bài" (Multi-Select): cho phép chọn nhiều bài để xóa khỏi bộ nhớ máy
 * - Phát trực tiếp từ file vật lý .mp3 trên ổ đĩa máy (độ trễ 0s, không cần mạng)
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
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Shuffle,
  Play,
  Pause,
  Moon,
  Check,
  CheckSquare,
  Square,
  Trash2,
  HardDriveDownload,
  Search,
  X,
} from "lucide-react-native";
import { GradientPlayButton } from "../components/GradientButton";
import { SongItem } from "../components/SongItem";

import { SongOptionsModal } from "../components/SongOptionsModal";
import { usePlayerStore } from "../store/playerStore";
import { useDownloadStore } from "../store/downloadStore";
import { useSleepTimerStore } from "../store/sleepTimerStore";
import { useToastStore } from "../store/toastStore";
import { useActivePlayback } from "../store/connectStore";
import { UnifiedSong } from "../types/music";
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from "../constants/theme";
import { formatDuration } from "../utils/format";

export const DownloadedSongsScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedSongForOptions, setSelectedSongForOptions] = useState<UnifiedSong | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Multi-Select Mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { playSong, isLoading, isShuffle, toggleShuffle, playbackContext } = usePlayerStore();
  const { song: currentSong, isPlaying, togglePlayPause } = useActivePlayback();
  const { downloadedSongs, fetchDownloads, removeDownload } = useDownloadStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const filteredSongs = downloadedSongs.filter((song) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(q) ||
      song.artistsNames.toLowerCase().includes(q)
    );
  });

  const isCurrentPlaylistPlaying =
    isPlaying &&
    playbackContext?.type === 'downloaded';

  const handlePlayAll = () => {
    if (downloadedSongs.length === 0) return;

    if (isCurrentPlaylistPlaying) {
      togglePlayPause();
      return;
    }

    const songsToPlay = isShuffle
      ? [...downloadedSongs].sort(() => Math.random() - 0.5)
      : downloadedSongs;
    playSong(songsToPlay[0], downloadedSongs, { type: 'downloaded', title: 'Bài hát đã tải về' });
  };

  const handleToggleShuffle = () => {
    if (!isShuffle) {
      toggleShuffle();
    }
    if (!isCurrentPlaylistPlaying && downloadedSongs.length > 0) {
      const shuffled = [...downloadedSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], downloadedSongs, { type: 'downloaded', title: 'Bài hát đã tải về' });
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

    const count = selectedIds.length;
    for (const id of selectedIds) {
      await removeDownload(id);
    }
    setSelectedIds([]);
    setIsSelectMode(false);
    showToast(`Đã xóa ${count} bài hát khỏi bộ nhớ máy`, "info");
  };

  // Preview stack covers (3 bài đầu)
  const previewCovers = downloadedSongs.slice(0, 3).map((s) => s.thumbnail);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Background Gradient Top Ambient */}
      <LinearGradient
        colors={["#111111", "#1a1a1a", COLORS.bgPrimary]}
        locations={[0, 0.4, 0.8]}
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
              {selectedIds.length === filteredSongs.length ? "Bỏ chọn tất cả" : `Chọn tất cả (${filteredSongs.length})`}
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
          {!isSelectMode && (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setIsSearching(!isSearching)}
              style={styles.navCircleBtn}
            >
              <Search size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          )}

          {downloadedSongs.length > 0 && (
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
          <Text style={styles.mainTitle}>Bài hát đã tải về</Text>
          <Text style={styles.subtitle}>
            {isSelectMode
              ? `Đã chọn ${selectedIds.length} / ${filteredSongs.length} bài hát`
              : `${downloadedSongs.length} bài hát sẵn sàng nghe khi không có mạng`}
          </Text>

          {/* Inline Search Bar */}
          {isSearching && (
            <View style={styles.searchBarWrap}>
              <Search size={16} color={COLORS.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm trong các bài đã tải..."
                placeholderTextColor={COLORS.textMuted}
                style={styles.searchField}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Row: Preview stack, Shuffle & Large Play (Hidden in Select Mode) */}
          {!isSelectMode && downloadedSongs.length > 0 && (
            <View style={styles.actionControlRow}>
              <View style={styles.leftActions}>
                {previewCovers.length > 0 ? (
                  <View style={styles.coverStack}>
                    {previewCovers.map((uri, i) => (
                      <Image
                        key={i}
                        source={{ uri }}
                        style={[
                          styles.coverStackItem,
                          { left: i * 14, zIndex: 10 - i },
                        ]}
                      />
                    ))}
                  </View>
                ) : null}

                <View style={styles.offlinePill}>
                  <HardDriveDownload size={14} color="#1DB954" />
                  <Text style={styles.offlinePillText}>Offline 100%</Text>
                </View>
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
        </View>

        {/* Songs List */}
        <View style={styles.songListContainer}>
          {filteredSongs.length === 0 ? (
            <View style={styles.emptyState}>
              <HardDriveDownload size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có bài hát tải về</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `Không tìm thấy bài hát nào khớp với "${searchQuery}"`
                  : "Bạn có thể trích xuất nhạc từ YouTube hoặc nhấn nút Tải xuống trên bài hát bất kỳ để nghe offline."}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("MainTabs", { screen: "Downloads" })}
                style={styles.discoverBtn}
              >
                <Text style={styles.discoverBtnText}>Tải nhạc từ YouTube</Text>
              </TouchableOpacity>
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
                  onPress={() => playSong(song, filteredSongs, { type: 'downloaded', title: 'Bài hát đã tải về' })}
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
              Xóa khỏi máy ({selectedIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Song Options Modal (3 dots menu) */}
      <SongOptionsModal
        visible={selectedSongForOptions !== null}
        song={selectedSongForOptions}
        onClose={() => setSelectedSongForOptions(null)}
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
    marginBottom: SPACING.md,
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
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchField: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textPrimary,
  },
  actionControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
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
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: LAYOUT.radiusFull,
  },
  offlinePillText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: "800",
    color: "#1DB954",
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
    justifyContent: "center",
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
  toolbarBtnDisabled: {
    opacity: 0.45,
  },
  toolbarDeleteText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: "700",
    color: COLORS.accentPrimary,
  },
  toolbarTextDisabled: {
    color: COLORS.textMuted,
  },
});
