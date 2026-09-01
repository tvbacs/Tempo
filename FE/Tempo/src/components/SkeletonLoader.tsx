import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, LAYOUT, SPACING } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = LAYOUT.radiusSm,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SongItemSkeleton: React.FC = () => {
  return (
    <View style={styles.songRow}>
      <Skeleton width={LAYOUT.avatarMd} height={LAYOUT.avatarMd} borderRadius={LAYOUT.radiusSm} />
      <View style={styles.songInfo}>
        <Skeleton width="70%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={36} height={12} />
    </View>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardWrapper}>
      <Skeleton width={150} height={150} borderRadius={LAYOUT.radiusMd} style={{ marginBottom: SPACING.sm }} />
      <Skeleton width={120} height={14} style={{ marginBottom: 4 }} />
      <Skeleton width={85} height={12} />
    </View>
  );
};

export const TileSkeleton: React.FC = () => {
  return (
    <View style={styles.tileWrapper}>
      <Skeleton width={180} height={110} borderRadius={LAYOUT.radiusLg} />
    </View>
  );
};

export const CircleSkeleton: React.FC = () => {
  return (
    <View style={styles.circleWrapper}>
      <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: SPACING.sm }} />
      <Skeleton width={70} height={12} style={{ marginBottom: 3 }} />
      <Skeleton width={50} height={10} />
    </View>
  );
};

export const HomeScreenSkeleton: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <ScrollView
        style={styles.homeScrollView}
        contentContainerStyle={styles.homeSkeletonContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Placeholder */}
        <View style={styles.topHeaderSkeleton}>
          <View>
            <Skeleton width={130} height={12} style={{ marginBottom: 6 }} />
            <Skeleton width={190} height={22} />
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <Skeleton width={40} height={40} borderRadius={20} />
          </View>
        </View>

        {/* Quick Access 2x2 Grid */}
        <View style={styles.quickAccessGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.quickAccessCard}>
              <Skeleton width={50} height={50} borderRadius={LAYOUT.radiusSm} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Skeleton width="80%" height={13} style={{ marginBottom: 4 }} />
                <Skeleton width="45%" height={10} />
              </View>
            </View>
          ))}
        </View>

        {/* Section 1: Dành riêng cho bạn (Daily Mixes) */}
        <View style={styles.sectionSkeleton}>
          <View style={styles.sectionHeaderSkeleton}>
            <View>
              <Skeleton width={110} height={11} style={{ marginBottom: 4 }} />
              <Skeleton width={160} height={18} />
            </View>
            <Skeleton width={60} height={14} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}>
            <TileSkeleton />
            <TileSkeleton />
            <TileSkeleton />
            <TileSkeleton />
          </ScrollView>
        </View>

        {/* Section 2: Bảng xếp hạng V-Pop */}
        <View style={styles.sectionSkeleton}>
          <View style={styles.sectionHeaderSkeleton}>
            <View>
              <Skeleton width={100} height={11} style={{ marginBottom: 4 }} />
              <Skeleton width={170} height={18} />
            </View>
            <Skeleton width={60} height={14} />
          </View>
          <SongItemSkeleton />
          <SongItemSkeleton />
          <SongItemSkeleton />
          <SongItemSkeleton />
          <SongItemSkeleton />
        </View>

        {/* Section 3: Chủ đề & Không gian */}
        <View style={styles.sectionSkeleton}>
          <View style={styles.sectionHeaderSkeleton}>
            <View>
              <Skeleton width={90} height={11} style={{ marginBottom: 4 }} />
              <Skeleton width={180} height={18} />
            </View>
            <Skeleton width={60} height={14} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </ScrollView>
        </View>

        {/* Section 4: Nghệ sĩ thịnh hành */}
        <View style={styles.sectionSkeleton}>
          <View style={styles.sectionHeaderSkeleton}>
            <Skeleton width={150} height={18} />
            <Skeleton width={60} height={14} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}>
            <CircleSkeleton />
            <CircleSkeleton />
            <CircleSkeleton />
            <CircleSkeleton />
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  homeScrollView: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  topHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  quickAccessCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurfaceSecondary,
    borderRadius: LAYOUT.radiusMd,
    overflow: 'hidden',
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 1,
    paddingHorizontal: SPACING.screenPadding,
  },
  songInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
  },
  cardWrapper: {
    width: 150,
    marginRight: SPACING.md,
  },
  tileWrapper: {
    width: 180,
    marginRight: SPACING.md,
  },
  circleWrapper: {
    width: 80,
    marginRight: SPACING.md + 4,
    alignItems: 'center',
  },
  homeSkeletonContainer: {
    paddingBottom: SPACING.xxxl,
  },
  sectionSkeleton: {
    marginBottom: SPACING.xxl,
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.md,
  },
});
