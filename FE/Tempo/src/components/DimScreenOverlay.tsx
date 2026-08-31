/**
 * DimScreenOverlay - Màn hình tối đen giả lập khóa màn hình khi đi ngủ
 * Chạm nhẹ 1 lần để tắt overlay
 */
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { useDimScreenStore } from '../store/dimScreenStore';

export const DimScreenOverlay: React.FC = () => {
  const { isVisible, hide } = useDimScreenStore();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={hide}
    >
      <StatusBar hidden />
      <TouchableWithoutFeedback onPress={hide}>
        <Animated.View style={[styles.overlay, { opacity }]}>
          <View style={styles.hintWrap}>
            <Text style={styles.hintText}>Chạm để tắt</Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hintWrap: {
    paddingBottom: 60,
    opacity: 0.2,
  },
  hintText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
