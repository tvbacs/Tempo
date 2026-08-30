/**
 * DownloadSelectorModal - Hộp thoại Chọn Bài Hát Để Tải Xuống Nghe Offline
 * Cho phép người dùng tick chọn từng bài cụ thể thay vì tải 1 mớ
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import {
  Download,
  CheckCircle,
  Check,
  X,
  CheckSquare,
  Square,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UnifiedSong } from '../types/music';
import { useDownloadStore } from '../store/downloadStore';
import { useToastStore } from '../store/toastStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatDuration } from '../utils/format';

interface DownloadSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  songs: UnifiedSong[];
  playlistTitle?: string;
}

export const DownloadSelectorModal: React.FC<DownloadSelectorModalProps> = ({
  visible,
  onClose,
  songs,
  playlistTitle = 'Danh sách bài hát',
}) => {
  const { downloadSong, isDownloaded, isDownloading } = useDownloadStore();
  const { showToast } = useToastStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!visible) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const unDownloaded = songs.filter((s) => !isDownloaded(s.id));
    if (selectedIds.length === unDownloaded.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unDownloaded.map((s) => s.id));
    }
  };

  const handleDownloadSelected = () => {
    if (selectedIds.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 bài hát để tải về', 'info');
      return;
    }

    const songsToDownload = songs.filter((s) => selectedIds.includes(s.id));
    showToast(`Đang tải xuống ${songsToDownload.length} bài hát đã chọn...`, 'info');
    songsToDownload.forEach((song) => downloadSong(song));
    setSelectedIds([]);
    onClose();
  };

  const unDownloadedCount = songs.filter((s) => !isDownloaded(s.id)).length;
  const isAllSelected = selectedIds.length > 0 && selectedIds.length === unDownloadedCount;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Download size={22} color={COLORS.accentPrimary} />
                  <View>
                    <Text style={styles.title}>Tải xuống nghe offline</Text>
                    <Text style={styles.subtitle}>{playlistTitle}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
                  style={styles.closeBtn}
                >
                  <X size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Select All Bar */}
              {unDownloadedCount > 0 && (
                <View style={styles.selectionBar}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={handleSelectAll}
                    style={styles.selectAllBtn}
                  >
                    {isAllSelected ? (
                      <CheckSquare size={18} color={COLORS.accentPrimary} />
                    ) : (
                      <Square size={18} color={COLORS.textSecondary} />
                    )}
                    <Text style={styles.selectAllText}>
                      {isAllSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${unDownloadedCount} bài)`}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.selectedCountText}>
                    Đã chọn: {selectedIds.length}
                  </Text>
                </View>
              )}

              {/* Songs List */}
              <FlatList
                data={songs}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const downloaded = isDownloaded(item.id);
                  const downloading = isDownloading(item.id);
                  const selected = selectedIds.includes(item.id);

                  return (
                    <TouchableOpacity
                      activeOpacity={downloaded ? 1 : 0.75}
                      onPress={() => {
                        if (!downloaded && !downloading) {
                          toggleSelect(item.id);
                        }
                      }}
                      style={[
                        styles.songRow,
                        selected && styles.songRowSelected,
                        downloaded && styles.songRowDownloaded,
                      ]}
                    >
                      {/* Checkbox / Status */}
                      <View style={styles.checkWrap}>
                        {downloaded ? (
                          <CheckCircle size={20} color="#1DB954" />
                        ) : downloading ? (
                          <Download size={18} color={COLORS.accentPrimary} />
                        ) : selected ? (
                          <View style={styles.checkedBox}>
                            <Check size={14} color={COLORS.white} />
                          </View>
                        ) : (
                          <View style={styles.uncheckedBox} />
                        )}
                      </View>

                      {/* Thumbnail */}
                      <Image source={{ uri: item.thumbnail }} style={styles.thumb} />

                      {/* Song Info */}
                      <View style={styles.infoWrap}>
                        <Text numberOfLines={1} style={styles.songTitle}>
                          {item.title}
                        </Text>
                        <Text numberOfLines={1} style={styles.songArtist}>
                          {item.artistsNames}
                        </Text>
                      </View>

                      {/* Right Tag */}
                      {downloaded ? (
                        <View style={styles.downloadedTag}>
                          <Text style={styles.downloadedTagText}>Đã tải</Text>
                        </View>
                      ) : (
                        <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />

              {/* Bottom Action Button */}
              {unDownloadedCount > 0 && (
                <View style={styles.bottomBar}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleDownloadSelected}
                    disabled={selectedIds.length === 0}
                    style={[styles.downloadBtn, selectedIds.length === 0 && styles.downloadBtnDisabled]}
                  >
                    <LinearGradient
                      colors={
                        selectedIds.length === 0
                          ? [COLORS.bgSurfaceSecondary, COLORS.bgSurfaceSecondary]
                          : [COLORS.accentPrimary, COLORS.accentSecondary]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.downloadBtnGradient}
                    >
                      <Download size={18} color={selectedIds.length === 0 ? COLORS.textMuted : COLORS.white} />
                      <Text
                        style={[
                          styles.downloadBtnText,
                          selectedIds.length === 0 && styles.downloadBtnTextDisabled,
                        ]}
                      >
                        {selectedIds.length === 0
                          ? 'Chọn bài hát để tải'
                          : `Tải xuống (${selectedIds.length} bài hát)`}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: LAYOUT.radiusXl,
    borderTopRightRadius: LAYOUT.radiusXl,
    paddingTop: SPACING.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  selectAllText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  selectedCountText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: LAYOUT.radiusMd,
    marginBottom: 2,
  },
  songRowSelected: {
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  songRowDownloaded: {
    opacity: 0.65,
  },
  checkWrap: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  checkedBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckedBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  infoWrap: {
    flex: 1,
    marginRight: SPACING.sm,
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
  durationText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
  },
  downloadedTag: {
    backgroundColor: COLORS.tileOrange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: LAYOUT.radiusXs,
  },
  downloadedTagText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: '700',
    color: COLORS.accentPrimary,
  },
  bottomBar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl + 8,
    backgroundColor: COLORS.bgSurface,
  },
  downloadBtn: {
    borderRadius: LAYOUT.radiusFull,
    overflow: 'hidden',
  },
  downloadBtnDisabled: {
    opacity: 0.5,
  },
  downloadBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.md,
  },
  downloadBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '800',
    color: COLORS.white,
  },
  downloadBtnTextDisabled: {
    color: COLORS.textMuted,
  },
});
