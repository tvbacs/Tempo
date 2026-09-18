import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Download,
  Minimize2,
  Maximize2,
  X,
} from 'lucide-react-native';
import { useToastStore } from '../store/toastStore';
import { useDownloadStore } from '../store/downloadStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

export const Toast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { visible, message, type, hideToast, downloadToast, hideDownloadToast } = useToastStore();
  const [isMinimized, setIsMinimized] = useState(false);

  const topPos = insets.top > 0 ? insets.top + SPACING.sm : SPACING.lg;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={22} color="#22C55E" />;
      case 'error':
        return <AlertCircle size={22} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={22} color="#F59E0B" />;
      case 'vip':
      case 'info':
      default:
        return <Info size={22} color="#EF4444" />;
    }
  };

  // Download toast hiện độc lập
  const showDownload = !!downloadToast;
  const downloadTopOffset = (visible && message) ? topPos + 62 : topPos;

  const handleCancelDownload = (e?: any) => {
    e?.stopPropagation?.();
    if (downloadToast?.songId) {
      useDownloadStore.getState().cancelDownload(downloadToast.songId);
    } else {
      hideDownloadToast();
    }
  };

  return (
    <>
      {/* 1. Regular Toast */}
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

      {/* 2. Download Progress Toast (Hỗ trợ Thu Nhỏ dạng Floating Pill / Phóng To) */}
      {showDownload && downloadToast ? (
        isMinimized ? (
          /* Dạng Thu Nhỏ (Floating Pill ở góc phải màn hình - Không che nội dung) */
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setIsMinimized(false)}
            style={[styles.minimizedPill, { top: downloadTopOffset }]}
          >
            <Download size={18} color={COLORS.accentPrimary} />
            <Text style={styles.minimizedPct}>
              {downloadToast.totalCount && downloadToast.totalCount > 1
                ? `${downloadToast.currentIndex}/${downloadToast.totalCount} • `
                : ''}
              {Math.round(downloadToast.progress * 100)}%
            </Text>
            <Maximize2 size={16} color={COLORS.textSecondary} style={{ marginLeft: 2 }} />
            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 12 }}
              onPress={handleCancelDownload}
              style={styles.minimizedCloseBtn}
              accessibilityLabel="Hủy tải xuống"
            >
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          /* Dạng Đầy Đủ (Thanh tiến trình chi tiết) */
          <View style={[styles.downloadContainer, { top: downloadTopOffset }]}>
            <View style={styles.downloadHeader}>
              <Download size={20} color={COLORS.accentPrimary} />
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {downloadToast.totalCount && downloadToast.totalCount > 1 ? (
                    <View style={styles.batchBadge}>
                      <Text style={styles.batchBadgeText}>
                        {downloadToast.currentIndex}/{downloadToast.totalCount}
                      </Text>
                    </View>
                  ) : null}
                  <Text style={styles.downloadTitle} numberOfLines={1}>
                    {downloadToast.title}
                  </Text>
                </View>
                {downloadToast.remainingInQueue && downloadToast.remainingInQueue > 0 ? (
                  <Text style={styles.queueSubText}>
                    Còn {downloadToast.remainingInQueue} bài hát trong hàng đợi
                  </Text>
                ) : null}
              </View>

              <Text style={styles.downloadPct}>
                {Math.round(downloadToast.progress * 100)}%
              </Text>

              {/* Nút Thu Nhỏ */}
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                onPress={() => setIsMinimized(true)}
                style={styles.actionIconBtn}
                accessibilityLabel="Thu nhỏ"
              >
                <Minimize2 size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>

              {/* Nút Đóng / Hủy tải */}
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
                onPress={handleCancelDownload}
                style={styles.actionIconBtn}
                accessibilityLabel="Hủy tải xuống"
              >
                <X size={17} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Thanh tiến trình */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.round(downloadToast.progress * 100)}%` },
                ]}
              />
            </View>
          </View>
        )
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.radiusLg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md - 2,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeSecondary,
    fontWeight: '700',
    color: '#111827',
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
  },
  // Download progress toast styles (dạng thanh mở rộng)
  downloadContainer: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.radiusMd,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    zIndex: 9998,
    elevation: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
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
    color: '#111827',
  },
  batchBadge: {
    backgroundColor: 'rgba(252, 71, 92, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  batchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentPrimary,
  },
  queueSubText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  downloadPct: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    minWidth: 36,
    textAlign: 'right',
  },
  actionIconBtn: {
    padding: 6,
    marginLeft: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  progressTrack: {
    height: 3.5,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 2,
  },
  // Download Floating Minimized Pill (Bong bóng thu nhỏ góc phải)
  minimizedPill: {
    position: 'absolute',
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    zIndex: 9998,
    elevation: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    gap: 8,
  },
  minimizedPct: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  minimizedCloseBtn: {
    padding: 4,
    marginLeft: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
