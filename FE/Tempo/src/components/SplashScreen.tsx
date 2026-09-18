/**
 * In-App Animated Splash Screen
 * Black Background #000000 + Centered Logo
 * Strictly follows STANDARDS.md - Accent #FF5800, NO EMOJIS, NO BORDERS, 100% Tokenized
 */
import React, { useEffect, useRef } from 'react';
import { View, Image, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_SIZE = Math.min(SCREEN_WIDTH * 0.45, 180);

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const containerFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Fade in & Scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Hold for 900ms then smooth fade out
      setTimeout(() => {
        Animated.timing(containerFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 900);
    });
  }, [fadeAnim, scaleAnim, containerFade, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerFade }]}>
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>TEMPO</Text>
        <Text style={styles.brandSubtitle}>FEEL THE RHYTHM</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: SPACING.lg,
  },
  brandTitle: {
    fontSize: TYPOGRAPHY.sizeTitle,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 6,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: '700',
    color: COLORS.accentPrimary,
    letterSpacing: 3,
  },
});
