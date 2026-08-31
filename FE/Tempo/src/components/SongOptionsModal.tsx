/**
 * SongOptionsModal - Hộp thoại Tùy chọn 3 Chấm (Hẹn giờ, Nghệ sĩ, Thêm danh sách, Xóa bài tải)
 * Strictly follows STANDARDS.md
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import {
  Moon,
  Heart,
  User,
  Share2,
  X,
  Clock,
  Trash2,
  ListPlus,
} from 'lucide-react-native';
import { UnifiedSong } from '../types/music';
import { useSleepTimerStore } from '../store/sleepTimerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useDownloadStore } from '../store/downloadStore';
import { useToastStore } from '../store/toastStore';
import { navigate } from '../navigation/AppNavigator';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

interface SongOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  song: UnifiedSong | null;
  onOpenArtist?: () => void;
}

export const SongOptionsModal: React.FC<SongOptionsModalProps> = ({
  visible,
  onClose,
  song,
  onOpenArtist,
}) => {
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const { openModal: openSleepTimer, isTimerActive, remainingSeconds, activeOption } = useSleepTimerStore();
  const { isLiked, toggleLike } = useLibraryStore();
  const { isDownloaded, removeDownload } = useDownloadStore();
  const { showToast } = useToastStore();

  if (!visible && !showAddToPlaylist) return null;
  if (!song) return null;

  const liked = isLiked(song.id);
  const downloaded = isDownloaded(song.id);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleShare = () => {
    showToast(`Đã sao chép liên kết bài hát "${song.title}"`, 'info');
    onClose();
  };

  const handleViewArtist = () => {
    onClose();
    setTimeout(() => {
      if (onOpenArtist) {
        onOpenArtist();
      } else {
        const alias = song.artists?.[0]?.link?.replace('/', '') || song.artistsNames.toLowerCase().replace(/\s+/g, '-');
        navigate('ArtistDetail', { alias, name: song.artistsNames, thumbnail: song.thumbnail });
      }
    }, 120);
  };

  const handleDeleteDownload = () => {
    removeDownload(song.id);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                {/* Song Header Info */}
                <View style={styles.songHeader}>
                  <Image source={{ uri: song.thumbnail }} style={styles.songThumb} />
                  <View style={styles.songTextWrap}>
                    <Text numberOfLines={1} style={styles.songTitle}>
                      {song.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.songArtist}>
                      {song.artistsNames}
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

                <View style={styles.divider} />

                {/* Options List */}
                <View style={styles.menuList}>
                  {/* 1. Thêm vào danh sách phát (Cho chọn playlist) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      setTimeout(() => setShowAddToPlaylist(true), 150);
                    }}
                    style={styles.menuItem}
                  >
                    <View style={styles.menuIconWrap}>
                      <ListPlus size={22} color={COLORS.accentPrimary} />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuLabel}>Thêm vào danh sách phát</Text>
                      <Text style={styles.menuSubLabel}>Chọn playlist để lưu bài hát</Text>
                    </View>
                  </TouchableOpacity>

                  {/* 2. Yêu thích (Heart) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleLike(song)}
                    style={styles.menuItem}
                  >
                    <View style={styles.menuIconWrap}>
                      <Heart
                        size={22}
                        color={liked ? COLORS.accentPrimary : COLORS.textPrimary}
                        fill={liked ? COLORS.accentPrimary : 'transparent'}
                      />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuLabel}>
                        {liked ? 'Xóa khỏi Bài hát ưa thích' : 'Thêm vào Bài hát ưa thích'}
                      </Text>
                      <Text style={styles.menuSubLabel}>Lưu vào thư viện cá nhân của bạn</Text>
                    </View>
                  </TouchableOpacity>

                  {/* 3. Hẹn giờ đi ngủ (Sleep Timer) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      setTimeout(() => openSleepTimer(), 200);
                    }}
                    style={styles.menuItem}
                  >
                    <View style={styles.menuIconWrap}>
                      <Moon size={22} color={isTimerActive ? COLORS.accentPrimary : COLORS.textPrimary} />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={[styles.menuLabel, isTimerActive && styles.activeText]}>
                        Hẹn giờ đi ngủ
                      </Text>
                      <Text style={styles.menuSubLabel}>
                        {isTimerActive
                          ? activeOption === 'end_of_track'
                            ? 'Đang hẹn: Tắt khi hết bài hát'
                            : remainingSeconds !== null
                            ? `Đang đếm ngược: còn ${formatCountdown(remainingSeconds)}`
                            : 'Đang bật'
                          : 'Tự động dừng phát khi bạn ngủ'}
                      </Text>
                    </View>
                    {isTimerActive && <Clock size={16} color={COLORS.accentPrimary} />}
                  </TouchableOpacity>

                {/* 3. Xem trang nghệ sĩ */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleViewArtist}
                  style={styles.menuItem}
                >
                  <View style={styles.menuIconWrap}>
                    <User size={22} color={COLORS.textPrimary} />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuLabel}>Xem thông tin nghệ sĩ</Text>
                    <Text style={styles.menuSubLabel}>{song.artistsNames}</Text>
                  </View>
                </TouchableOpacity>

                {/* 4. Chia sẻ bài hát */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleShare}
                  style={styles.menuItem}
                >
                  <View style={styles.menuIconWrap}>
                    <Share2 size={22} color={COLORS.textPrimary} />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text style={styles.menuLabel}>Chia sẻ bài hát</Text>
                    <Text style={styles.menuSubLabel}>Gửi liên kết cho bạn bè</Text>
                  </View>
                </TouchableOpacity>

                {/* 5. Xóa khỏi danh sách đã tải về (Nằm trong 3 chấm) */}
                {downloaded && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleDeleteDownload}
                    style={styles.menuItem}
                  >
                    <View style={styles.menuIconWrap}>
                      <Trash2 size={22} color={COLORS.accentPrimary} />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={[styles.menuLabel, { color: COLORS.accentPrimary }]}>
                        Xóa khỏi danh sách tải về
                      </Text>
                      <Text style={styles.menuSubLabel}>Gỡ bài hát khỏi bộ nhớ ngoại tuyến</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>

    {/* Add To Playlist Modal */}
    <AddToPlaylistModal
      visible={showAddToPlaylist}
      onClose={() => setShowAddToPlaylist(false)}
      song={song}
    />
  </>
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl + 8,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  songThumb: {
    width: 48,
    height: 48,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginRight: SPACING.md,
  },
  songTextWrap: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  songTitle: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  songArtist: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.bgSurfaceSecondary,
    marginBottom: SPACING.md,
  },
  menuList: {
    gap: SPACING.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: LAYOUT.radiusMd,
  },
  menuIconWrap: {
    width: 36,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  menuSubLabel: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textSecondary,
  },
  activeText: {
    color: COLORS.accentPrimary,
  },
});
