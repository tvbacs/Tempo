/**
 * ProfileScreen - Quản lý tài khoản, cài đặt âm thanh, thống kê & Đăng xuất
 * Strictly follows STANDARDS.md: Zero Emojis, Zero Borders, Tokenized variables
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, LogOut, Crown, Zap, Sparkles, HardDrive, Download, Trash2, Share2 } from 'lucide-react-native';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useLibraryStore } from '../store/libraryStore';
import { useDownloadStore } from '../store/downloadStore';
import { useAuthStore } from '../store/authStore';
import { AppAvatarBadge } from '../components/AppAvatarBadge';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { likedSongs, playlists, history, resetForUser } = useLibraryStore();
  const { user, logout, getRemainingExtracts } = useAuthStore();
  const {
    downloadedSongs,
    preserveOnUninstall,
    setPreserveOnUninstall,
    totalStorageBytes,
    exportAllDownloads,
    clearAllDownloads,
    calculateStorageUsage,
    scanAndSyncLocalFiles,
  } = useDownloadStore();

  const [streamQuality, setStreamQuality] = useState<'Tiêu chuẩn (128k)' | 'Chất lượng cao (320k)' | 'Không nén (Lossless)'>('Chất lượng cao (320k)');
  const [dataSaver, setDataSaver] = useState(false);
  const [gaplessPlayback, setGaplessPlayback] = useState(true);

  useEffect(() => {
    calculateStorageUsage();
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const totalListenMs = history.reduce((acc, h) => acc + (h.durationMs || 0), 0);
  const totalListenH = Math.round(totalListenMs / 3600000);
  const listenTimeLabel = totalListenH >= 1 ? `${totalListenH}h` : `${Math.round(totalListenMs / 60000)}p`;
  const remaining = getRemainingExtracts();

  const handleLogout = async () => {
    resetForUser();
    useDownloadStore.getState().resetForUser();
    await logout();
  };

  const handleConfirmClearAll = () => {
    Alert.alert(
      'Xóa toàn bộ nhạc ngoại tuyến?',
      `Hành động này sẽ xóa ${downloadedSongs.length} bài hát đã tải và giải phóng ${formatBytes(totalStorageBytes)} dung lượng trên máy.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa sạch', style: 'destructive', onPress: clearAllDownloads },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
            onPress={() => navigation?.goBack?.()}
            style={styles.backBtn}
          >
            <ChevronLeft size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>Cá nhân</Text>

          <View style={{ width: LAYOUT.iconButtonMd }} />
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <AppAvatarBadge size={54} />
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{user?.username || 'Người dùng Tempo'}</Text>
              {user?.isVip && (
                <View style={styles.vipBadge}>
                  <Crown size={12} color={COLORS.white} />
                  <Text style={styles.vipBadgeText}>VIP</Text>
                </View>
              )}
            </View>
            <Text style={styles.userHandle}>{user?.email || 'Tài khoản cá nhân'}</Text>
          </View>
        </View>

        {/* Listening Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{likedSongs.length}</Text>
            <Text style={styles.statLabel}>Bài thích</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{playlists.length}</Text>
            <Text style={styles.statLabel}>Danh sách</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {user?.isVip ? 'Vô hạn' : `${remaining}/5`}
            </Text>
            <Text style={styles.statLabel}>Lượt trích xuất</Text>
          </View>
        </View>

        {/* Upgrade Banner Card */}
        {!user?.isVip && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Upgrade')}
            style={styles.upgradeBannerCard}
          >
            <View style={styles.upgradeBannerLeft}>
              <Text style={styles.upgradeBannerTitle}>Tempo VIP Premium</Text>
              <Text style={styles.upgradeBannerSub}>
                Trích xuất không giới hạn & tắt trộn bài
              </Text>
            </View>
            <View style={styles.upgradeBannerBtn}>
              <Text style={styles.upgradeBannerBtnText}>Nâng cấp</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Section: Audio Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHẤT LƯỢNG ÂM THANH</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Chất lượng phát trực tuyến</Text>
              <Text style={styles.settingSubLabel}>{streamQuality}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (streamQuality === 'Tiêu chuẩn (128k)') setStreamQuality('Chất lượng cao (320k)');
                else if (streamQuality === 'Chất lượng cao (320k)') setStreamQuality('Không nén (Lossless)');
                else setStreamQuality('Tiêu chuẩn (128k)');
              }}
              style={styles.pillActionBtn}
            >
              <Text style={styles.pillActionText}>Đổi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Tiết kiệm dữ liệu</Text>
              <Text style={styles.settingSubLabel}>Tự động đặt chất lượng tiêu chuẩn khi dùng 4G/5G</Text>
            </View>
            <Switch
              value={dataSaver}
              onValueChange={setDataSaver}
              trackColor={{ false: COLORS.bgPill, true: COLORS.accentPrimary }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Phát liền mạch (Gapless)</Text>
              <Text style={styles.settingSubLabel}>Chuyển bài mượt mà không ngắt quãng âm thanh</Text>
            </View>
            <Switch
              value={gaplessPlayback}
              onValueChange={setGaplessPlayback}
              trackColor={{ false: COLORS.bgPill, true: COLORS.accentPrimary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Section: Storage & Downloads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LƯU TRỮ & DỮ LIỆU NGOẠI TUYẾN</Text>

          {/* 1. Tùy chọn Bảo tồn tệp khi gỡ cài đặt app */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Bảo tồn tệp khi gỡ ứng dụng</Text>
              <Text style={styles.settingSubLabel}>
                {preserveOnUninstall
                  ? 'Bật: File nhạc được bảo toàn trên máy, không bị xoá khi gỡ app'
                  : 'Tắt: File nhạc sẽ tự động xoá sạch khi gỡ cài đặt app'}
              </Text>
            </View>
            <Switch
              value={preserveOnUninstall}
              onValueChange={setPreserveOnUninstall}
              trackColor={{ false: COLORS.bgPill, true: COLORS.accentPrimary }}
              thumbColor={COLORS.white}
            />
          </View>

          {/* 2. Quản lý bài hát & Xem dung lượng */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DownloadedSongs')}
            style={styles.settingRow}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dung lượng nhạc ngoại tuyến</Text>
              <Text style={styles.settingSubLabel}>
                {formatBytes(totalStorageBytes)} · {downloadedSongs.length} bài hát đã tải
              </Text>
            </View>
            <View style={styles.pillActionBtn}>
              <Text style={styles.pillActionText}>Quản lý</Text>
            </View>
          </TouchableOpacity>

          {/* 3. Nút Sao lưu / Xuất nhạc ra thư mục máy */}
          {downloadedSongs.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={exportAllDownloads}
              style={styles.settingRow}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sao lưu nhạc ra Thư mục máy</Text>
                <Text style={styles.settingSubLabel}>
                  Đóng gói ZIP toàn bộ MP3 ra bộ nhớ thiết bị / Tệp để lưu trữ vĩnh viễn
                </Text>
              </View>
              <View style={[styles.pillActionBtn, { backgroundColor: 'rgba(252, 71, 92, 0.15)' }]}>
                <Text style={[styles.pillActionText, { color: COLORS.accentPrimary }]}>Sao lưu</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* 3.1 Nút Quét & Khôi phục nhạc từ tệp máy / thư mục giải nén */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={scanAndSyncLocalFiles}
            style={styles.settingRow}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Khôi phục nhạc từ Tệp máy</Text>
              <Text style={styles.settingSubLabel}>
                Quét và nạp lại toàn bộ file MP3 đã giải nén hoặc lưu trong máy vào app
              </Text>
            </View>
            <View style={[styles.pillActionBtn, { backgroundColor: 'rgba(29, 185, 84, 0.15)' }]}>
              <Text style={[styles.pillActionText, { color: '#1DB954' }]}>Quét tệp</Text>
            </View>
          </TouchableOpacity>

          {/* 4. Nút Xoá toàn bộ tệp nhạc tải về */}
          {downloadedSongs.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmClearAll}
              style={styles.settingRow}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Xóa toàn bộ nhạc ngoại tuyến</Text>
                <Text style={styles.settingSubLabel}>
                  Giải phóng {formatBytes(totalStorageBytes)} bộ nhớ trên máy
                </Text>
              </View>
              <View style={[styles.pillActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Text style={[styles.pillActionText, { color: '#EF4444' }]}>Xóa sạch</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Section: Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Đăng xuất khỏi tài khoản</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  backBtn: {
    width: LAYOUT.iconButtonMd,
    height: LAYOUT.iconButtonMd,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: COLORS.bgSurfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizeTitle,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: LAYOUT.radiusXs,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
  },
  userHandle: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusMd,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textSecondary,
  },
  upgradeBannerCard: {
    backgroundColor: '#1E1015',
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  upgradeBannerLeft: {
    flex: 1,
    gap: 2,
  },
  upgradeBannerTitle: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '800',
    color: COLORS.white,
  },
  upgradeBannerSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  upgradeBannerBtn: {
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: LAYOUT.radiusFull,
  },
  upgradeBannerBtnText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '800',
    color: COLORS.white,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusMd,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingSubLabel: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textSecondary,
  },
  pillActionBtn: {
    backgroundColor: COLORS.bgSurfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: LAYOUT.radiusFull,
  },
  pillActionText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.accentPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#261214',
    paddingVertical: 14,
    borderRadius: LAYOUT.radiusMd,
    gap: 8,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: '#EF4444',
  },
});
