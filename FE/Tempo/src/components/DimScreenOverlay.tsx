/**
 * DimScreenOverlay - Màn hình tối đen giả lập khóa màn hình khi đi ngủ
 * Phủ đen 100% màn hình, chạm bất kỳ đâu để bật lại màn hình (0ms response)
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useDimScreenStore } from '../store/dimScreenStore';

export const DimScreenOverlay: React.FC = () => {
  const { isVisible, hide } = useDimScreenStore();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    hide();
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <StatusBar hidden style="light" />
      <Pressable
        onPress={handleDismiss}
        style={styles.pressableArea}
      >
        <View style={styles.hintWrap} pointerEvents="none">
          <Text style={styles.hintText}>Chạm vào màn hình để bật lại</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 999999,
    elevation: 999999,
  },
  pressableArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  hintWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  hintText: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

