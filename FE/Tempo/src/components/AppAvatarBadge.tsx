/**
 * AppAvatarBadge - Logo thương hiệu / Avatar người dùng với chỉ báo VIP
 * Strictly follows STANDARDS.md
 */
import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Music, Crown } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS, LAYOUT } from '../constants/theme';

interface AppAvatarBadgeProps {
  size?: number;
  showVipBadge?: boolean;
}

export const AppAvatarBadge: React.FC<AppAvatarBadgeProps> = ({
  size = 40,
  showVipBadge = true,
}) => {
  const { user } = useAuthStore();
  const radius = size / 2;
  const vipDotSize = Math.max(15, Math.round(size * 0.38));
  const crownIconSize = Math.max(9, Math.round(vipDotSize * 0.6));

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[styles.avatarImg, { borderRadius: radius }]}
        resizeMode="cover"
      />

      {showVipBadge && user?.isVip && (
        <View
          style={[
            styles.vipDot,
            {
              width: vipDotSize,
              height: vipDotSize,
              borderRadius: vipDotSize / 2,
              bottom: -1,
              right: -1,
            },
          ]}
        >
          <Crown size={crownIconSize} color={COLORS.white} strokeWidth={2.5} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: LAYOUT.radiusFull,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
  },
});
