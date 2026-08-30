/**
 * AlbumCard / PlaylistCard Component - Borderless, Accent #FF5800, 100% Tokenized
 */
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Play } from 'lucide-react-native';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

interface AlbumCardProps {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail: string;
  onPress?: () => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  title,
  subtitle,
  thumbnail,
  onPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.coverWrapper}>
        <Image
          source={{
            uri:
              thumbnail ||
              'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
          }}
          style={styles.cover}
        />
        <View style={styles.playCircle}>
          <Play size={14} color={COLORS.black} fill={COLORS.black} style={{ marginLeft: 2 }} />
        </View>
      </View>
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 146,
    marginRight: SPACING.md + 2,
  },
  coverWrapper: {
    width: 146,
    height: 146,
    borderRadius: LAYOUT.radiusMd,
    overflow: 'hidden',
    backgroundColor: COLORS.bgSurface,
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playCircle: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: LAYOUT.iconButtonSm,
    height: LAYOUT.iconButtonSm,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeightCaption,
  },
});
