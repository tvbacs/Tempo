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
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
} from "lucide-react-native";
import { GradientPlayButton } from "../components/GradientButton";
import { SongItem } from "../components/SongItem";

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDownloadSelector, setShowDownloadSelector] = useState(false);
  const [selectedSongForOptions, setSelectedSongForOptions] = useState<UnifiedSong | null>(null);

  // Multi-Select Mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { playSong, isLoading, isShuffle, toggleShuffle, playbackContext } = usePlayerStore();
  const { isPlaying, togglePlayPause } = useActivePlayback();
  const { likedSongs, fetchLikedSongs, toggleLike } = useLibraryStore();
  const { downloadSong } = useDownloadStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    fetchLikedSongs();
  }, [fetchLikedSongs]);

  // Chỉ xem là đang phát danh sách này nếu đúng context 'liked'
  const isCurrentPlaylistPlaying =
    isPlaying &&
    playbackContext?.type === 'liked';

  const handlePlayAll = () => {
    if (likedSongs.length === 0) return;

    if (isCurrentPlaylistPlaying) {
      togglePlayPause();
      return;
    }

    const songsToPlay = isShuffle
      ? [...likedSongs].sort(() => Math.random() - 0.5)
      : likedSongs;
    playSong(songsToPlay[0], songsToPlay, { type: 'liked', title: 'Bài hát đã thích' });
  };

  const handleToggleShuffle = () => {
    if (!isShuffle) {
      toggleShuffle();
    }
    if (!isCurrentPlaylistPlaying && likedSongs.length > 0) {
      const shuffled = [...likedSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], likedSongs, { type: 'liked', title: 'Bài hát đã thích' });
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
    if (selectedIds.length === likedSongs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(likedSongs.map((s) => s.id));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 bài hát", "info");
      return;
    }

    const songsToRemove = likedSongs.filter((s) => selectedIds.includes(s.id));
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
    showToast(`Đang tải xuống ${songsToDownload.length} bài hát đã chọn...`, "info");
    songsToDownload.forEach((song) => downloadSong(song));
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
      >
        {/* Left-Aligned Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Bài hát ưa thích</Text>
          <Text style={styles.subtitle}>
            {isSelectMode ? `Đã chọn ${selectedIds.length} / ${likedSongs.length} bài hát` : `${likedSongs.length} bài hát`}
          </Text>

          {/* Action Row: Preview stack, Download, Shuffle & Large Play (Hidden in Select Mode) */}
          {!isSelectMode && (
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

                <TouchableOpacity
                  activeOpacity={0.75}
                  hitSlop={{ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.sm, right: SPACING.sm }}
                  onPress={() => setShowDownloadSelector(true)}
                  style={styles.downloadBtn}
                >
                  <Download size={22} color={COLORS.textSecondary} />
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

          {/* Add Song Button (Opens Search & Add Modal) */}
          {!isSelectMode && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowAddModal(true)}
              style={styles.addSongBtn}
            >
              <View style={styles.addSongIconBox}>
                <Plus size={16} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.addSongText}>Thêm bài hát</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Songs List */}
        <View style={styles.songListContainer}>
          {likedSongs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa có bài hát ưa thích</Text>
              <Text style={styles.emptySubtitle}>
                Chạm vào biểu tượng trái tim trên bất kỳ bài hát nào hoặc nhấn "Thêm bài hát" ở trên để lưu vào đây.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAddModal(true)}
                style={styles.discoverBtn}
              >
                <Text style={styles.discoverBtnText}>Thêm bài hát ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            likedSongs.map((song, index) => {
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
                  onPress={() => playSong(song, likedSongs, { type: 'liked', title: 'Bài hát đã thích' })}
                  onMorePress={() => setSelectedSongForOptions(song)}
                />
              );
            })
          )}
        </View>

        <View style={{ height: isSelectMode ? 100 : LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>

      {/* Floating Bottom Action Toolbar for Multi-Select Mode */}
      {isSelectMode && (
        <View style={styles.floatingActionToolbar}>
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
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
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
    backgroundColor: COLORS.bgSurfaceSecondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: LAYOUT.radiusFull,
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
  downloadBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  shuffleBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  addSongBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgSurfaceSecondary,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.radiusFull,
    alignSelf: "flex-start",
    gap: SPACING.xs + 2,
  },
  addSongIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.bgSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  addSongText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.textPrimary,
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
    bottom: SPACING.xl,
    left: SPACING.screenPadding,
    right: SPACING.screenPadding,
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusFull,
    padding: SPACING.xs + 2,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toolbarActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.sm + 2,
    borderRadius: LAYOUT.radiusFull,
  },
  toolbarDeleteBtn: {
    backgroundColor: COLORS.tileOrange,
  },
  toolbarDownloadBtn: {
    backgroundColor: COLORS.accentPrimary,
  },
  toolbarBtnDisabled: {
    opacity: 0.4,
  },
  toolbarDeleteText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.accentPrimary,
  },
  toolbarDownloadText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: "700",
    color: COLORS.white,
  },
  toolbarTextDisabled: {
    color: COLORS.textMuted,
  },
});
