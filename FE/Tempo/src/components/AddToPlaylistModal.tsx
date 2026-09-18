import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ListPlus,
  Plus,
  CheckCircle2,
  X,
  Heart,
  ListMusic,
} from 'lucide-react-native';
import { UnifiedSong } from '../types/music';
import { useLibraryStore } from '../store/libraryStore';
import { useToastStore } from '../store/toastStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  song: UnifiedSong | null;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  visible,
  onClose,
  song,
}) => {
  const { playlists, likedSongs, isLiked, toggleLike, addSongToPlaylist, isSongInPlaylist, createPlaylist } = useLibraryStore();
  const { showToast } = useToastStore();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible || !song) return null;

  const isSongLiked = isLiked(song.id);

  const handleToggleLiked = async () => {
    await toggleLike(song);
  };

  // Lọc ra các playlist của người dùng
  const userPlaylists = playlists.filter(
    (p) => p.name && !p.name.includes('TEMPO_ACTIVE') && !p.name.startsWith('__')
  );

  const handleSelectPlaylist = async (playlistId: string, playlistName: string) => {
    if (isSongInPlaylist(playlistId, song.id)) {
      showToast(`Bài hát đã có trong "${playlistName}"`, 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSongToPlaylist(playlistId, song);
      showToast(`Đã thêm vào "${playlistName}"`, 'success');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndAdd = async () => {
    const name = newPlaylistName.trim();
    if (!name) {
      showToast('Vui lòng nhập tên danh sách phát', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPlaylist(name);
      // Lấy playlist vừa tạo mới nhất
      const updatedList = useLibraryStore.getState().playlists;
      const created = updatedList.find((p) => p.name === name) || updatedList[0];
      if (created) {
        await addSongToPlaylist(created.id, song);
        showToast(`Đã tạo và thêm vào "${name}"`, 'success');
      }
      setNewPlaylistName('');
      setIsCreatingNew(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ListPlus size={20} color={COLORS.textPrimary} />
              <Text style={styles.title}>Thêm vào danh sách phát</Text>
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

          {/* Target Song Info Card */}
          <View style={styles.songCard}>
            <Image
              source={{
                uri:
                  song.thumbnail ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
              }}
              style={styles.songThumb}
            />
            <View style={styles.songInfo}>
              <Text numberOfLines={1} style={styles.songTitle}>
                {song.title}
              </Text>
              <Text numberOfLines={1} style={styles.songArtist}>
                {song.artistsNames}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <ScrollView
            style={styles.playlistScroll}
            contentContainerStyle={styles.playlistScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 0. Mục Bài hát ưa thích */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleToggleLiked}
              style={[styles.playlistRow, isSongLiked && styles.playlistRowAdded]}
            >
              <View style={[styles.playlistThumb, { backgroundColor: 'rgba(252, 71, 92, 0.15)', alignItems: 'center', justifyContent: 'center' }]}>
                <Heart size={22} color="#FC475C" fill={isSongLiked ? "#FC475C" : "transparent"} />
              </View>
              <View style={styles.playlistInfo}>
                <Text numberOfLines={1} style={styles.playlistName}>
                  Bài hát ưa thích
                </Text>
                <Text style={styles.playlistCount}>{likedSongs.length} bài hát</Text>
              </View>
              <View style={styles.actionIconSlot}>
                {isSongLiked ? (
                  <View style={styles.addedBadge}>
                    <CheckCircle2 size={14} color="#1DB954" />
                    <Text style={styles.addedText}>Đã thích</Text>
                  </View>
                ) : (
                  <Plus size={18} color={COLORS.textSecondary} />
                )}
              </View>
            </TouchableOpacity>

            {/* 1. Nút Tạo danh sách phát mới */}
            {isCreatingNew ? (
                  <View style={styles.createBox}>
                    <Text style={styles.createLabel}>Tên danh sách phát mới</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        value={newPlaylistName}
                        onChangeText={setNewPlaylistName}
                        placeholder={`Danh sách phát #${userPlaylists.length + 1}`}
                        placeholderTextColor={COLORS.textMuted}
                        style={styles.inputField}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleCreateAndAdd}
                      />
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleCreateAndAdd}
                        disabled={isSubmitting}
                        style={styles.saveNewBtn}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={styles.saveNewBtnText}>Tạo & Thêm</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setIsCreatingNew(false);
                          setNewPlaylistName('');
                        }}
                        style={styles.cancelNewBtn}
                      >
                        <X size={18} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => setIsCreatingNew(true)}
                    style={styles.newPlaylistRow}
                  >
                    <View style={styles.newIconBox}>
                      <Plus size={20} color={COLORS.accentPrimary} />
                    </View>
                    <View style={styles.newTextWrap}>
                      <Text style={styles.newTitle}>Tạo danh sách phát mới</Text>
                      <Text style={styles.newSub}>Tạo playlist và đưa bài hát vào ngay</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 2. Danh sách các playlist có sẵn */}
                {userPlaylists.length > 0 && (
                  <View style={styles.playlistList}>
                    <Text style={styles.listHeading}>CHỌN DANH SÁCH CỦA BẠN</Text>
                    {userPlaylists.map((pl) => {
                      const alreadyIn = isSongInPlaylist(pl.id, song.id);
                      const coverImg =
                        pl.songs?.[0]?.thumbnail ||
                        pl.coverUrl ||
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';
                      const count = pl.songCount || pl.songs?.length || 0;

                      return (
                        <TouchableOpacity
                          key={pl.id}
                          activeOpacity={0.75}
                          onPress={() => handleSelectPlaylist(pl.id, pl.name)}
                          style={[styles.playlistRow, alreadyIn && styles.playlistRowAdded]}
                        >
                          <Image source={{ uri: coverImg }} style={styles.playlistThumb} />
                          <View style={styles.playlistInfo}>
                            <Text numberOfLines={1} style={styles.playlistName}>
                              {pl.name}
                            </Text>
                            <Text style={styles.playlistCount}>{count} bài hát</Text>
                          </View>

                          <View style={styles.actionIconSlot}>
                            {alreadyIn ? (
                              <View style={styles.addedBadge}>
                                <CheckCircle2 size={14} color="#1DB954" />
                                <Text style={styles.addedText}>Đã có</Text>
                              </View>
                            ) : (
                              <Plus size={18} color={COLORS.textSecondary} />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {userPlaylists.length === 0 && !isCreatingNew && (
                  <View style={styles.emptyWrap}>
                    <ListMusic size={36} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>Chưa có danh sách phát nào</Text>
                    <Text style={styles.emptySubText}>
                      Nhấn "Tạo danh sách phát mới" ở trên để bắt đầu
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: LAYOUT.radiusXl,
    borderTopRightRadius: LAYOUT.radiusXl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeSubheading,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurfaceSecondary,
    padding: SPACING.sm + 2,
    borderRadius: LAYOUT.radiusMd,
    gap: SPACING.sm + 2,
  },
  songThumb: {
    width: 44,
    height: 44,
    borderRadius: LAYOUT.radiusSm,
  },
  songInfo: {
    flex: 1,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: SPACING.md,
  },
  playlistScroll: {
    maxHeight: 340,
  },
  playlistScrollContent: {
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  newPlaylistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 71, 92, 0.08)',
    padding: SPACING.md,
    borderRadius: LAYOUT.radiusMd,
    gap: SPACING.md,
  },
  newIconBox: {
    width: 40,
    height: 40,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: 'rgba(252, 71, 92, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTextWrap: {
    flex: 1,
  },
  newTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '700',
    color: COLORS.accentPrimary,
    marginBottom: 2,
  },
  newSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
  },
  createBox: {
    backgroundColor: COLORS.bgSurfaceSecondary,
    padding: SPACING.md,
    borderRadius: LAYOUT.radiusMd,
    gap: SPACING.sm,
  },
  createLabel: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputField: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: LAYOUT.radiusFull,
    paddingHorizontal: SPACING.lg,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizeBodySmall,
  },
  saveNewBtn: {
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: SPACING.lg,
    height: 44,
    borderRadius: LAYOUT.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNewBtnText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '800',
    color: COLORS.white,
  },
  cancelNewBtn: {
    padding: SPACING.xs,
  },
  playlistList: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  listHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: LAYOUT.radiusMd,
    gap: SPACING.md,
  },
  playlistRowAdded: {
    opacity: 0.8,
  },
  playlistThumb: {
    width: 44,
    height: 44,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  playlistCount: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
  },
  actionIconSlot: {
    paddingRight: SPACING.xs,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(29, 185, 84, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: LAYOUT.radiusFull,
  },
  addedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1DB954',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  emptySubText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
