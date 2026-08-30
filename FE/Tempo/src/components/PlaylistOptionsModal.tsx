/**
 * PlaylistOptionsModal - Menu Tùy Chọn Danh Sách Phát Cá Nhân
 * Strictly follows STANDARDS.md
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Trash2,
  Share2,
  X,
  Play,
  ListPlus,
  Moon,
} from 'lucide-react-native';
import { CustomPlaylist, useLibraryStore } from '../store/libraryStore';
import { useSleepTimerStore } from '../store/sleepTimerStore';
import { useToastStore } from '../store/toastStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

interface PlaylistOptionsModalProps {
  visible: boolean;
  playlist: CustomPlaylist | null;
  onClose: () => void;
  onPlay?: () => void;
  onAddSongs?: () => void;
}

export const PlaylistOptionsModal: React.FC<PlaylistOptionsModalProps> = ({
  visible,
  playlist,
  onClose,
  onPlay,
  onAddSongs,
}) => {
  const { deletePlaylist } = useLibraryStore();
  const { showToast } = useToastStore();

  if (!visible || !playlist) return null;

  const handleDelete = () => {
    onClose();
    deletePlaylist(playlist.id);
  };

  const handleShare = () => {
    onClose();
    showToast(`Đã sao chép liên kết danh sách phát "${playlist.name}"`, 'info');
  };

  const handleSleepTimer = () => {
    onClose();
    useSleepTimerStore.getState().openModal();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header Info */}
              <View style={styles.header}>
                <View style={styles.headerInfo}>
                  <Text numberOfLines={1} style={styles.title}>
                    {playlist.name}
                  </Text>
                  <Text style={styles.subtitle}>
                    Danh sách phát · {playlist.songCount || playlist.songs?.length || 0} bài hát
                  </Text>
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

              {/* Options List */}
              <View style={styles.optionsList}>
                {onPlay && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      onPlay();
                    }}
                    style={styles.optionRow}
                  >
                    <View style={styles.iconBox}>
                      <Play size={20} color={COLORS.textPrimary} />
                    </View>
                    <Text style={styles.optionText}>Phát danh sách này</Text>
                  </TouchableOpacity>
                )}

                {onAddSongs && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      onAddSongs();
                    }}
                    style={styles.optionRow}
                  >
                    <View style={styles.iconBox}>
                      <ListPlus size={20} color={COLORS.textPrimary} />
                    </View>
                    <Text style={styles.optionText}>Thêm bài hát vào danh sách</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSleepTimer}
                  style={styles.optionRow}
                >
                  <View style={styles.iconBox}>
                    <Moon size={20} color={COLORS.textPrimary} />
                  </View>
                  <Text style={styles.optionText}>Hẹn giờ tắt nhạc</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleShare}
                  style={styles.optionRow}
                >
                  <View style={styles.iconBox}>
                    <Share2 size={20} color={COLORS.textPrimary} />
                  </View>
                  <Text style={styles.optionText}>Chia sẻ danh sách phát</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDelete}
                  style={[styles.optionRow, styles.deleteRow]}
                >
                  <View style={[styles.iconBox, styles.deleteIconBox]}>
                    <Trash2 size={20} color={COLORS.accentPrimary} />
                  </View>
                  <Text style={[styles.optionText, styles.deleteText]}>
                    Xóa danh sách phát
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: LAYOUT.radiusXl,
    borderTopRightRadius: LAYOUT.radiusXl,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomColor: COLORS.bgSurfaceSecondary,
  },
  headerInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    marginTop: SPACING.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  optionText: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  deleteRow: {
    marginTop: SPACING.xs,
  },
  deleteIconBox: {
    backgroundColor: COLORS.tileOrange,
  },
  deleteText: {
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
});
