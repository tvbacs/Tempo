import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CheckCheck,
  Bell,
  Sparkles,
  Radio,
  Music,
  Crown,
  Trash2,
  Disc,
} from 'lucide-react-native';
import { useNotificationStore } from '../store/notificationStore';
import { AppNotification } from '../types/notification';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

type FilterTab = 'all' | 'release' | 'system';

export const NotificationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'release') return item.type === 'release';
    if (activeTab === 'system') return item.type === 'system' || item.type === 'vip';
    return true;
  });

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hôm qua';
    return `${diffDays} ngày trước`;
  };

  const handleNotificationPress = (item: AppNotification) => {
    markAsRead(item.id);

    if (item.data?.screen) {
      if (item.data.screen === 'ArtistDetail' && item.data.artistAlias) {
        navigation.navigate('ArtistDetail', {
          alias: item.data.artistAlias,
          name: item.data.artistName || 'Nghệ sĩ',
          thumbnail: item.thumbnail || '',
        });
      } else if (item.data.screen === 'UpgradeScreen') {
        navigation.navigate('UpgradeScreen');
      } else if (item.data.screen === 'Home') {
        navigation.navigate('MainTabs', { screen: 'Home' });
      } else {
        navigation.navigate(item.data.screen);
      }
    }
  };

  const renderIconBadge = (item: AppNotification) => {
    if (item.thumbnail) {
      return (
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.notifAvatar}
          resizeMode="cover"
        />
      );
    }

    switch (item.type) {
      case 'release':
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(252, 71, 92, 0.15)' }]}>
            <Disc size={20} color={COLORS.accentPrimary} />
          </View>
        );
      case 'vip':
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
            <Crown size={20} color="#EC4899" />
          </View>
        );
      case 'system':
      default:
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Radio size={20} color="#3B82F6" />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Quay lại"
        >
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={markAllAsRead}
            style={styles.markAllBtn}
          >
            <CheckCheck size={16} color={COLORS.accentPrimary} />
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderBox} />
        )}
      </View>

      {/* 2. Filter Pills */}
      <View style={styles.tabFilterRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('all')}
          style={[styles.filterPill, activeTab === 'all' && styles.filterPillActive]}
        >
          <Text style={[styles.filterPillText, activeTab === 'all' && styles.filterPillTextActive]}>
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('release')}
          style={[styles.filterPill, activeTab === 'release' && styles.filterPillActive]}
        >
          <Text style={[styles.filterPillText, activeTab === 'release' && styles.filterPillTextActive]}>
            Nhạc mới
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('system')}
          style={[styles.filterPill, activeTab === 'system' && styles.filterPillActive]}
        >
          <Text style={[styles.filterPillText, activeTab === 'system' && styles.filterPillTextActive]}>
            Hệ thống & VIP
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Notification List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accentPrimary} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Bell size={36} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thông báo mới</Text>
          <Text style={styles.emptySubtitle}>
            Các cập nhật bài hát mới và tin tức hệ thống sẽ hiển thị tại đây.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredNotifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => handleNotificationPress(item)}
              style={[
                styles.notifCard,
                !item.isRead && styles.notifCardUnread,
              ]}
            >
              {renderIconBadge(item)}

              <View style={styles.notifContentCol}>
                <View style={styles.notifTopRow}>
                  <Text numberOfLines={1} style={styles.notifTitle}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text numberOfLines={2} style={styles.notifMessage}>
                  {item.message}
                </Text>

                <View style={styles.notifBottomRow}>
                  <Text style={styles.notifTimeText}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>

                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={13} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  backBtn: {
    padding: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizeHeading,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unreadCountBadge: {
    backgroundColor: COLORS.accentPrimary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.accentPrimary,
  },
  placeholderBox: {
    width: 60,
  },
  tabFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#16161B',
  },
  filterPillActive: {
    backgroundColor: COLORS.accentPrimary,
  },
  filterPillText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 110, // Avoid bottom player obstruction
    gap: SPACING.sm + 2,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#121216',
    borderRadius: LAYOUT.radiusMd,
    padding: SPACING.md,
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  notifCardUnread: {
    backgroundColor: '#181820',
  },
  notifAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#202028',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContentCol: {
    flex: 1,
    gap: 4,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentPrimary,
  },
  notifMessage: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
  },
  notifBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  notifTimeText: {
    fontSize: TYPOGRAPHY.sizeMicro,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16161B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizeHeading,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizeSecondary,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeightSecondary,
  },
});
