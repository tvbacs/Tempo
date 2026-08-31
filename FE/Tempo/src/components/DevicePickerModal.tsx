/**
 * DevicePickerModal Component (Spotify Connect Clone)
 * 100% NO EMOJIS, Compact Content-Hug Bottom Sheet
 * Tokenized Theme with COLORS.accentPrimary for Active Device
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Laptop,
  Smartphone,
  Check,
  Radio,
  X,
  Play,
  Pause,
} from 'lucide-react-native';
import { useConnectStore, useActivePlayback, ConnectedDevice } from '../store/connectStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

export const DevicePickerModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    isConnectModalVisible,
    closeConnectModal,
    availableDevices,
    activeDevice,
    selectDevice,
  } = useConnectStore();

  const { song: currentSong, isPlaying } = useActivePlayback();

  if (!isConnectModalVisible) return null;

  const isWebActive = activeDevice.type === 'web';
  // Luôn dùng màu primary thương hiệu Tempo, không dùng xanh Spotify
  const activeColor = COLORS.accentPrimary;

  return (
    <Modal
      visible={isConnectModalVisible}
      transparent
      animationType="slide"
      onRequestClose={closeConnectModal}
    >
      <TouchableWithoutFeedback onPress={closeConnectModal}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.md) + 4 }]}>
              {/* Drag Handle */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Kết nối thiết bị</Text>
                <TouchableOpacity
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  onPress={closeConnectModal}
                >
                  <X size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Active Device Highlight Card (Màu Primary ở đây) */}
              <View style={styles.activeCard}>
                <View style={styles.activeCardIcon}>
                  {isWebActive ? (
                    <Laptop size={26} color={activeColor} />
                  ) : (
                    <Smartphone size={26} color={activeColor} />
                  )}
                </View>
                <View style={styles.activeCardInfo}>
                  <Text style={styles.activeDeviceName}>{activeDevice.deviceName}</Text>
                  {currentSong && (
                    <View style={styles.trackInfoRow}>
                      {isPlaying ? (
                        <Play size={11} color={activeColor} fill={activeColor} style={{ marginRight: 4 }} />
                      ) : (
                        <Pause size={11} color={activeColor} fill={activeColor} style={{ marginRight: 4 }} />
                      )}
                      <Text numberOfLines={1} style={[styles.activeTrackName, { color: activeColor }]}>
                        {currentSong.title} – {currentSong.artistsNames}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Discovered Devices List (Chữ trắng / neutral, không dùng màu hồng trong list) */}
              <Text style={styles.sectionHeading}>Phát trên các thiết bị của bạn</Text>

              <ScrollView style={styles.deviceList} bounces={false} showsVerticalScrollIndicator={false}>
                {/* 1. Điện thoại này */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => selectDevice({ deviceId: 'mobile-app', deviceName: 'Điện thoại này', type: 'mobile', isOnline: true })}
                  style={styles.deviceItem}
                >
                  <Smartphone size={22} color={COLORS.white} />
                  <View style={styles.deviceItemText}>
                    <Text style={styles.deviceItemName}>
                      Điện thoại này
                    </Text>
                    <Text style={styles.deviceItemSub}>Loa & Tai nghe điện thoại</Text>
                  </View>
                  {!isWebActive && <Check size={18} color={COLORS.white} />}
                </TouchableOpacity>

                {/* 2. Danh sách thiết bị thực tế đang trực tuyến */}
                {availableDevices
                  .filter((d) => d.deviceId !== 'mobile-app' && d.isOnline)
                  .map((device) => {
                    const isSelected = activeDevice.deviceId === device.deviceId;
                    return (
                      <TouchableOpacity
                        key={device.deviceId}
                        activeOpacity={0.7}
                        onPress={() => selectDevice(device)}
                        style={styles.deviceItem}
                      >
                        {device.type === 'web' ? (
                          <Laptop size={22} color={COLORS.white} />
                        ) : (
                          <Radio size={22} color={COLORS.white} />
                        )}
                        <View style={styles.deviceItemText}>
                          <Text style={styles.deviceItemName}>
                            {device.deviceName}
                          </Text>
                          <Text style={styles.deviceItemSub}>
                            {device.type === 'web' ? 'Loa máy tính · Trực tuyến' : 'Thiết bị Tempo Kết nối'}
                          </Text>
                        </View>
                        {isSelected && <Check size={18} color={COLORS.white} />}
                      </TouchableOpacity>
                    );
                  })}

                {availableDevices.filter((d) => d.deviceId !== 'mobile-app' && d.isOnline).length === 0 && (
                  <View style={styles.noDeviceHint}>
                    <Text style={styles.noDeviceText}>
                      Đang tìm kiếm... Hãy mở Tempo Web trên máy tính để tự động kết nối.
                    </Text>
                  </View>
                )}
              </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: LAYOUT.radiusCard + 4,
    borderTopRightRadius: LAYOUT.radiusCard + 4,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeHeading - 2,
    fontWeight: '800',
    color: COLORS.white,
  },
  activeCard: {
    backgroundColor: '#262630',
    borderRadius: LAYOUT.radiusCard,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  activeCardIcon: {
    width: 44,
    height: 44,
    borderRadius: LAYOUT.radiusCard - 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCardInfo: {
    flex: 1,
  },
  activeDeviceName: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 2,
  },
  activeTrackName: {
    fontSize: TYPOGRAPHY.sizeMicro + 1,
    fontWeight: '600',
    flex: 1,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs + 2,
    marginTop: 2,
  },
  deviceList: {
    maxHeight: 200,
    marginBottom: SPACING.xs,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.md,
  },
  deviceItemText: {
    flex: 1,
  },
  deviceItemName: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '600',
    color: COLORS.white,
  },
  deviceItemSub: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  noDeviceHint: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  noDeviceText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
