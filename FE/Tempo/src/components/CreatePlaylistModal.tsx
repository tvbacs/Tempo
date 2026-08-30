/**
 * CreatePlaylistModal - Hộp thoại tạo danh sách phát mới
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
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ListMusic, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLibraryStore } from '../store/libraryStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
}) => {
  const [name, setName] = useState('');
  const { createPlaylist, playlists } = useLibraryStore();

  if (!visible) return null;

  const handleCreate = async () => {
    const playlistName = name.trim() || `Danh sách phát #${playlists.length + 1}`;
    await createPlaylist(playlistName);
    setName('');
    onClose();
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardWrap}
          >
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <ListMusic size={22} color={COLORS.accentPrimary} />
                    <Text style={styles.title}>Tạo danh sách phát</Text>
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

                <Text style={styles.subtitle}>
                  Đặt tên cho danh sách phát của bạn để lưu các bài hát yêu thích.
                </Text>

                {/* Input Field */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={`Danh sách phát #${playlists.length + 1}`}
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.input}
                    autoFocus
                    autoCapitalize="sentences"
                    returnKeyType="done"
                    onSubmitEditing={handleCreate}
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onClose}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleCreate}
                    style={styles.createBtn}
                  >
                    <LinearGradient
                      colors={[COLORS.accentPrimary, COLORS.accentSecondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.createBtnGradient}
                    >
                      <Text style={styles.createBtnText}>Tạo</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  keyboardWrap: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusXl,
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeTitle,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: TYPOGRAPHY.lineHeightBody,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  inputWrapper: {
    backgroundColor: COLORS.bgSurfaceSecondary,
    borderRadius: LAYOUT.radiusMd,
    paddingHorizontal: SPACING.lg,
    height: 50,
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  input: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  cancelBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  createBtn: {
    borderRadius: LAYOUT.radiusFull,
    overflow: 'hidden',
  },
  createBtnGradient: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '800',
    color: COLORS.white,
  },
});
