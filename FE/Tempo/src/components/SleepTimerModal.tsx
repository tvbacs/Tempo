/**
 * SleepTimerModal - Hộp thoại Hẹn Giờ Tắt Nhạc Đồng Bộ Toàn App
 * Strictly follows STANDARDS.md:
 * - NO EMOJIS
 * - NO BORDERS (borderWidth: 0)
 * - 100% Tokenized variables from theme.ts
 * - Accent Gradient #FC475C -> #FC655A
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { Moon, Check, X, Clock, MonitorOff } from 'lucide-react-native';
import { useSleepTimerStore, SleepTimerOption } from '../store/sleepTimerStore';
import { useDimScreenStore } from '../store/dimScreenStore';
import { usePlayerStore } from '../store/playerStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

const OPTIONS: { label: string; value: SleepTimerOption }[] = [
  { label: '5 phút', value: 5 },
  { label: '10 phút', value: 10 },
  { label: '15 phút', value: 15 },
  { label: '30 phút', value: 30 },
  { label: '45 phút', value: 45 },
  { label: '1 giờ', value: 60 },
  { label: 'Kết thúc bài hát này', value: 'end_of_track' },
];

export const SleepTimerModal: React.FC = () => {
  const {
    isModalVisible,
    closeModal,
    activeOption,
    remainingSeconds,
    isTimerActive,
    setTimer,
    cancelTimer,
  } = useSleepTimerStore();

  const { show: showDimScreen } = useDimScreenStore();
  const { currentSong } = usePlayerStore();

  if (!isModalVisible) return null;

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <TouchableWithoutFeedback onPress={closeModal}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Moon size={20} color={COLORS.accentPrimary} />
                  <Text style={styles.title}>Hẹn giờ đi ngủ</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={closeModal}
                  hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
                  style={styles.closeBtn}
                >
                  <X size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Active Timer Banner if running */}
              {isTimerActive && (
                <View style={styles.activeBanner}>
                  <Clock size={16} color={COLORS.accentPrimary} />
                  <Text style={styles.activeBannerText}>
                    {activeOption === 'end_of_track'
                      ? 'Sẽ tắt nhạc khi bài hát kết thúc'
                      : remainingSeconds !== null
                      ? `Còn lại: ${formatCountdown(remainingSeconds)}`
                      : 'Đang hẹn giờ'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      cancelTimer();
                    }}
                    style={styles.cancelBannerBtn}
                  >
                    <Text style={styles.cancelBannerText}>Tắt hẹn giờ</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Options List */}
              <View style={styles.optionsList}>
                {OPTIONS.map((opt) => {
                  const isSelected = activeOption === opt.value;
                  const isEndOfTrack = opt.value === 'end_of_track';
                  const isDisabled = isEndOfTrack && !currentSong;

                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      activeOpacity={isDisabled ? 1 : 0.7}
                      disabled={isDisabled}
                      onPress={() => {
                        if (isDisabled) return;
                        setTimer(opt.value);
                        closeModal();
                      }}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemActive,
                        isDisabled && styles.optionItemDisabled,
                      ]}
                    >
                      <View style={styles.optionLabelWrap}>
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected && styles.optionLabelActive,
                            isDisabled && styles.optionLabelDisabled,
                          ]}
                        >
                          {opt.label}
                        </Text>
                        {isDisabled && (
                          <Text style={styles.disabledNotice}>(Chưa chọn bài hát)</Text>
                        )}
                      </View>
                      {isSelected && (
                        <Check size={18} color={COLORS.accentPrimary} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Nút Tối màn hình ngay */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    closeModal();
                    showDimScreen();
                  }}
                  style={styles.dimScreenBtn}
                >
                  <MonitorOff size={18} color={COLORS.textSecondary} />
                  <View style={styles.dimScreenTextWrap}>
                    <Text style={styles.dimScreenLabel}>Tối màn hình ngay</Text>
                    <Text style={styles.dimScreenHint}>Chạm nhẹ để tắt — iPhone tự khóa sau đó</Text>
                  </View>
                </TouchableOpacity>

                {/* Tắt hẹn giờ button */}
                {isTimerActive && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      cancelTimer();
                      closeModal();
                    }}
                    style={styles.turnOffOptionItem}
                  >
                    <Text style={styles.turnOffLabel}>Tắt hẹn giờ</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: LAYOUT.radiusXl,
    borderTopRightRadius: LAYOUT.radiusXl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl + 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
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
  closeBtn: {
    padding: SPACING.xs,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: LAYOUT.radiusMd,
    marginBottom: SPACING.md,
    gap: SPACING.xs + 2,
  },
  activeBannerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  cancelBannerBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: LAYOUT.radiusSm,
    backgroundColor: COLORS.bgActionBtn,
  },
  cancelBannerText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  optionsList: {
    gap: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.radiusMd,
  },
  optionItemActive: {
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  optionItemDisabled: {
    opacity: 0.35,
  },
  optionLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  optionLabelDisabled: {
    color: COLORS.textMuted,
  },
  disabledNotice: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  turnOffOptionItem: {
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.xs,
  },
  turnOffLabel: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
  },
  dimScreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.radiusMd,
    gap: SPACING.md,
  },
  dimScreenTextWrap: {
    flex: 1,
    gap: 2,
  },
  dimScreenLabel: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  dimScreenHint: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
});
