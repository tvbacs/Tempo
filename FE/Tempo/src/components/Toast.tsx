import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Download } from 'lucide-react-native';
import { useToastStore } from '../store/toastStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

export const Toast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { visible, message, type, hideToast, downloadToast } = useToastStore();

  const topPos = insets.top > 0 ? insets.top + SPACING.sm : SPACING.lg;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#22C55E" />;
      case 'error':
        return <AlertCircle size={18} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={18} color="#F59E0B" />;
      case 'vip':
      case 'info':
      default:
        return <Info size={18} color={COLORS.accentPrimary} />;
    }
  };

  // Download toast hiện độc lập bên dưới regular toast
  const showDownload = !!downloadToast;
  const downloadTopOffset = (visible && message) ? topPos + 62 : topPos;

  return (
    <>
      {/* Regular toast */}
      {visible && message ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={hideToast}
          style={[styles.container, { top: topPos }]}
        >
          <View style={styles.contentRow}>
            <View style={styles.iconBox}>{renderIcon()}</View>
            <Text numberOfLines={2} style={styles.messageText}>
              {message}
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Download progress toast — luôn hiện khi đang tải */}
      {showDownload && downloadToast ? (
        <View style={[styles.downloadContainer, { top: downloadTopOffset }]}>
          <View style={styles.downloadHeader}>
            <Download size={14} color={COLORS.accentPrimary} />
            <Text style={styles.downloadTitle} numberOfLines={1}>
              {downloadToast.title}
            </Text>
            <Text style={styles.downloadPct}>
              {Math.round(downloadToast.progress * 100)}%
            </Text>
          </View>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.round(downloadToast.progress * 100)}%` },
              ]}
            />
          </View>
        </View>
      ) : null}
    </>
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
  messageText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeSecondary,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
  },
  // Download progress toast styles
  downloadContainer: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.bgPill,
    borderRadius: LAYOUT.radiusMd,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    zIndex: 9998,
    elevation: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  downloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    marginBottom: 6,
  },
  downloadTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.white,
  },
  downloadPct: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    minWidth: 34,
    textAlign: 'right',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 2,
  },
});
