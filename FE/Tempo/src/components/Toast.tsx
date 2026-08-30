import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles } from 'lucide-react-native';
import { useToastStore } from '../store/toastStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

export const Toast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { visible, message, type, hideToast } = useToastStore();

  if (!visible || !message) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#22C55E" />;
      case 'error':
        return <AlertCircle size={18} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={18} color="#F59E0B" />;
      case 'vip':
        return <Sparkles size={18} color="#EAB308" />;
      case 'info':
      default:
        return <Info size={18} color={COLORS.accentPrimary} />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={hideToast}
      style={[
        styles.container,
        { top: insets.top > 0 ? insets.top + SPACING.sm : SPACING.lg },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconBox}>{renderIcon()}</View>
        {type === 'vip' && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </View>
        )}
        <Text numberOfLines={2} style={styles.messageText}>
          {message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.bgPill,
    borderRadius: LAYOUT.radiusLg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    zIndex: 9999,
    elevation: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipBadge: {
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LAYOUT.radiusXs,
  },
  vipBadgeText: {
    fontSize: TYPOGRAPHY.sizeBadge,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: TYPOGRAPHY.letterSpacingTight,
  },
  messageText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeSecondary,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
  },
});
