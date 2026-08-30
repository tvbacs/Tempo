/**
 * DevicePickerModal Component (Spotify Connect Clone)
 * Directly matches reference design from Spotify Connect
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Laptop,
  Smartphone,
  Check,
  Volume2,
  VolumeX,
  Radio,
  Bluetooth,
  X,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useConnectStore, ConnectedDevice } from '../store/connectStore';
import { usePlayerStore } from '../store/playerStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

export const DevicePickerModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    isConnectModalVisible,
    closeConnectModal,
    availableDevices,
    activeDevice,
    selectDevice,
    volume,
    setVolume,
    initConnect,
  } = useConnectStore();

  const { currentSong, isPlaying } = usePlayerStore();

  useEffect(() => {
    if (isConnectModalVisible) {
      initConnect();
    }
  }, [isConnectModalVisible, initConnect]);

  if (!isConnectModalVisible) return null;

  const isWebActive = activeDevice.type === 'web';
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
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, SPACING.md) + SPACING.md }]}>
              {/* Drag Handle */}
              <View style={styles.handleBar} />

              {/* Title */}
              <View style={styles.header}>
                <Text style={styles.title}>Connect</Text>
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={closeConnectModal}
                >
                  <X size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Active Device Highlight Card */}
              <View style={styles.activeCard}>
                <View style={styles.activeCardTop}>
                  <View style={styles.activeCardIcon}>
                    {isWebActive ? (
                      <Laptop size={32} color={activeColor} />
                    ) : (
                      <Smartphone size={32} color={activeColor} />
                    )}
                  </View>
                  <View style={styles.activeCardInfo}>
                    <Text style={styles.activeDeviceName}>{activeDevice.deviceName}</Text>
                    {currentSong && (
                      <Text numberOfLines={1} style={[styles.activeTrackName, { color: activeColor }]}>
                        {isPlaying ? '▶ ' : '⏸ '}{currentSong.title} – {currentSong.artistsNames}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Volume Slider for Active Device */}
                <View style={styles.volumeRow}>
                  <VolumeX size={16} color={COLORS.textMuted} />
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={volume}
                    onValueChange={setVolume}
                    minimumTrackTintColor={activeColor}
                    maximumTrackTintColor="rgba(255,255,255,0.15)"
                    thumbTintColor={COLORS.white}
                  />
                  <Volume2 size={16} color={COLORS.textMuted} />
                </View>
              </View>

              {/* Discovered Devices List */}
              <Text style={styles.sectionHeading}>Phát trên các thiết bị của bạn</Text>

              <ScrollView style={styles.deviceList} showsVerticalScrollIndicator={false}>
                {/* 1. Điện thoại này */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => selectDevice({ deviceId: 'mobile-app', deviceName: 'Điện thoại này', type: 'mobile', isOnline: true })}
                  style={styles.deviceItem}
                >
                  <Smartphone size={22} color={!isWebActive ? activeColor : COLORS.textPrimary} />
                  <View style={styles.deviceItemText}>
                    <Text style={[styles.deviceItemName, !isWebActive && { color: activeColor, fontWeight: '700' }]}>
                      Điện thoại này
                    </Text>
                    <Text style={styles.deviceItemSub}>Loa & Tai nghe điện thoại</Text>
                  </View>
                  {!isWebActive && <Check size={20} color={activeColor} />}
                </TouchableOpacity>

                {/* 2. Web Player / PC */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => selectDevice({ deviceId: 'web-player-pc', deviceName: 'Web Player (PC / Chrome)', type: 'web', isOnline: true })}
                  style={styles.deviceItem}
                >
                  <Laptop size={22} color={isWebActive ? activeColor : COLORS.textPrimary} />
                  <View style={styles.deviceItemText}>
                    <Text style={[styles.deviceItemName, isWebActive && { color: activeColor, fontWeight: '700' }]}>
                      Web Player (PC / Chrome)
                    </Text>
                    <Text style={styles.deviceItemSub}>Loa máy tính · localhost:5050</Text>
                  </View>
                  {isWebActive && <Check size={20} color={activeColor} />}
                </TouchableOpacity>

                {/* Các thiết bị khác tìm thấy */}
                {availableDevices
                  .filter((d) => d.deviceId !== 'mobile-app' && d.deviceId !== 'web-player-pc')
                  .map((device) => {
                    const isSelected = activeDevice.deviceId === device.deviceId;
                    return (
                      <TouchableOpacity
                        key={device.deviceId}
                        activeOpacity={0.7}
                        onPress={() => selectDevice(device)}
                        style={styles.deviceItem}
                      >
                        <Radio size={22} color={isSelected ? activeColor : COLORS.textPrimary} />
                        <View style={styles.deviceItemText}>
                          <Text style={[styles.deviceItemName, isSelected && { color: activeColor, fontWeight: '700' }]}>
                            {device.deviceName}
                          </Text>
                          <Text style={styles.deviceItemSub}>Thiết bị Tempo Connect</Text>
                        </View>
                        {isSelected && <Check size={20} color={activeColor} />}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              {/* Bottom Bluetooth & Airplay Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={closeConnectModal}
                style={styles.airplayBtn}
              >
                <Bluetooth size={18} color={COLORS.white} />
                <Text style={styles.airplayBtnText}>Bluetooth & Airplay</Text>
              </TouchableOpacity>
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
  sheet: {
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: LAYOUT.radiusLg,
    borderTopRightRadius: LAYOUT.radiusLg,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    maxHeight: Dimensions.get('window').height * 0.75,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeHeading,
    fontWeight: '800',
    color: COLORS.white,
  },
  activeCard: {
    backgroundColor: '#282832',
    borderRadius: LAYOUT.radiusMd,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  activeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  activeCardIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCardInfo: {
    flex: 1,
  },
  activeDeviceName: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  activeTrackName: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '600',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  slider: {
    flex: 1,
    height: 30,
  },
  sectionHeading: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  deviceList: {
    maxHeight: 220,
    marginBottom: SPACING.lg,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md - 2,
    gap: SPACING.md,
  },
  deviceItemText: {
    flex: 1,
  },
  deviceItemName: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  deviceItemSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  airplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#32323E',
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.radiusFull,
    gap: SPACING.sm,
  },
  airplayBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
});
