/**
 * Skeleton Loader Component - Shimmer layout for Tempo Home & Detail
 * Strictly follows STANDARDS.md - Accent #FF5800, NO EMOJIS, NO BORDERS, 100% Tokenized
 */
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
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
      <Skeleton width={140} height={140} borderRadius={LAYOUT.radiusMd} style={{ marginBottom: SPACING.sm }} />
      <Skeleton width={110} height={14} style={{ marginBottom: 4 }} />
      <Skeleton width={80} height={12} />
    </View>
  );
};

export const TileSkeleton: React.FC = () => {
  return (
    <View style={styles.tileWrapper}>
      <Skeleton width={146} height={146} borderRadius={LAYOUT.radiusLg} />
    </View>
  );
};

export const CircleSkeleton: React.FC = () => {
  return (
    <View style={styles.circleWrapper}>
      <Skeleton width={LAYOUT.avatarXl} height={LAYOUT.avatarXl} borderRadius={43} style={{ marginBottom: SPACING.sm }} />
      <Skeleton width={70} height={12} style={{ marginBottom: 3 }} />
      <Skeleton width={50} height={10} />
    </View>
  );
};

export const HomeScreenSkeleton: React.FC = () => {
  return (
    <View style={styles.homeSkeletonContainer}>
      {/* Continue listening skeleton */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionHeaderSkeleton}>
          <Skeleton width={140} height={18} />
          <Skeleton width={60} height={14} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      </View>

      {/* Made for you skeleton */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionHeaderSkeleton}>
          <Skeleton width={160} height={18} />
          <Skeleton width={60} height={14} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}>
          <TileSkeleton />
          <TileSkeleton />
          <TileSkeleton />
        </ScrollView>
      </View>

      {/* Recently played skeleton */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionHeaderSkeleton}>
          <Skeleton width={130} height={18} />
          <Skeleton width={60} height={14} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.screenPadding }}>
          <CircleSkeleton />
          <CircleSkeleton />
          <CircleSkeleton />
          <CircleSkeleton />
        </ScrollView>
      </View>

      {/* Top Charts skeleton */}
      <View style={styles.sectionSkeleton}>
        <View style={styles.sectionHeaderSkeleton}>
          <Skeleton width={150} height={18} />
          <Skeleton width={60} height={14} />
        </View>
        <SongItemSkeleton />
        <SongItemSkeleton />
        <SongItemSkeleton />
        <SongItemSkeleton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.bgSurfaceSecondary,
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
    width: 140,
    marginRight: SPACING.md,
  },
  tileWrapper: {
    width: 146,
    marginRight: SPACING.md,
  },
  circleWrapper: {
    width: LAYOUT.avatarXl,
    marginRight: SPACING.md + 2,
    alignItems: 'center',
  },
  homeSkeletonContainer: {
    paddingTop: SPACING.sm,
  },
  sectionSkeleton: {
    marginBottom: SPACING.xxxl,
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.md + 2,
  },
});
