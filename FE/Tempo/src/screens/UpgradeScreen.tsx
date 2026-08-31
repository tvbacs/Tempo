/**
 * UpgradeScreen - Giao diện Nâng Cấp VIP cao cấp
 * Full Tai Thỏ (Edge-to-Edge Notch), Lưới ảnh mosaic sole nhau, Icon Trắng, App Primary Accent Gradient (#FC475C -> #FC655A)
 * Strictly follows STANDARDS.md: Zero Emojis, Zero Borders, Tokenized variables
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Crown,
  Zap,
  Shuffle,
  Download,
  Check,
  Sparkles,
  Volume2,
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOSAIC_ROW_1 = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=350&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=350&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=350&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=350&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=350&auto=format&fit=crop&q=80',
];

const MOSAIC_ROW_2 = [
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=350&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=350&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=350&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=350&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1445985543470-41fba5c3144a?w=350&auto=format&fit=crop&q=80',
];

interface PlanItem {
  id: 'monthly' | 'yearly' | 'lifetime';
  badge?: string;
  name: string;
  price: string;
  period: string;
  subText: string;
  featured?: boolean;
}

const REASONS = [
  { icon: Zap, label: 'Trích xuất bài hát không giới hạn' },
  { icon: Shuffle, label: 'Tự do tắt / bật chế độ Trộn bài bất kỳ lúc nào' },
  { icon: Download, label: 'Tải xuống để nghe ngoại tuyến không cần mạng' },
  { icon: Volume2, label: 'Chất lượng âm thanh trung thực Lossless 320kbps' },
];

const PLANS: PlanItem[] = [
  {
    id: 'yearly',
    badge: 'TIẾT KIỆM 30% · PHỔ BIẾN NHẤT',
    name: 'Gói 1 Năm',
    price: '499.000 đ',
    period: '/ năm',
    subText: 'Khoảng 41.000 đ / tháng · Mở khóa toàn bộ đặc quyền',
    featured: true,
  },
  {
    id: 'monthly',
    name: 'Gói 1 Tháng',
    price: '59.000 đ',
    period: '/ tháng',
    subText: 'Thanh toán hàng tháng · Hủy bất cứ lúc nào',
  },
  {
    id: 'lifetime',
    badge: 'MỘT LẦN DUY NHẤT',
    name: 'VIP Trọn Đời',
    price: '999.000 đ',
    period: ' vĩnh viễn',
    subText: 'Sở hữu trọn đời không bao giờ hết hạn',
  },
];

export const UpgradeScreen: React.FC = () => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user, upgradeVip } = useAuthStore();
  const insets = useSafeAreaInsets();
  const currentPlan = user?.isVip ? (user.vipPlan || 'yearly') : null;

  const handleSelectPlan = async (plan: PlanItem) => {
    setProcessingId(plan.id);
    await upgradeVip(plan.id);
    setProcessingId(null);
  };

  const topSafePadding = insets.top > 0 ? insets.top : 24;

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Top Hero with Full Notch Bleed & Alternating Mosaic Grid Background */}
        <View style={[styles.heroWrapper, { paddingTop: topSafePadding + SPACING.lg }]}>
          {/* Alternating Mosaic Rows */}
          <View style={styles.mosaicContainer} pointerEvents="none">
            <View style={styles.mosaicRow1}>
              {MOSAIC_ROW_1.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.mosaicCover} />
              ))}
            </View>
            <View style={styles.mosaicRow2}>
              {MOSAIC_ROW_2.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.mosaicCover} />
              ))}
            </View>
          </View>

          {/* Deep Dark & Primary Gradient Overlay */}
          <LinearGradient
            colors={[
              'rgba(10, 10, 14, 0.05)',
              'rgba(10, 10, 14, 0.45)',
              'rgba(10, 10, 14, 0.92)',
              COLORS.bgPrimary,
            ]}
            locations={[0, 0.4, 0.75, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={styles.brandRow}>
              <LinearGradient
                colors={[COLORS.accentPrimary, COLORS.accentSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.crownBox}
              >
                <Crown size={13} color={COLORS.white} fill={COLORS.white} />
              </LinearGradient>
              <Text style={styles.brandText}>TEMPO VIP</Text>
            </View>

            <Text style={styles.heroHeadline}>
              {`Trải nghiệm âm nhạc\nKhông giới hạn`}
            </Text>

            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>Ưu đãi dành cho thành viên mới</Text>
            </View>

            {/* Quick Action Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleSelectPlan(PLANS[0])}
              disabled={processingId !== null || !!user?.isVip}
              style={styles.heroCTA}
            >
              <LinearGradient
                colors={[COLORS.accentPrimary, COLORS.accentSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCTAGradient}
              >
                <Text style={styles.heroCTAText}>
                  {user?.isVip ? 'Đã Kích Hoạt VIP' : 'Bắt Đầu Ngay'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Lý do nên dùng gói VIP */}
        <View style={styles.reasonsCard}>
          <Text style={styles.reasonsHeading}>Đặc quyền dành riêng cho VIP</Text>

          <View style={styles.reasonsList}>
            {REASONS.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <View key={idx} style={styles.reasonItem}>
                  <View style={styles.reasonIconBox}>
                    <IconComp size={18} color={COLORS.white} />
                  </View>
                  <Text style={styles.reasonText}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Section: Các gói có sẵn */}
        <View style={styles.plansSection}>
          <Text style={styles.plansHeading}>CÁC GÓI CÓ SẴN</Text>

          {PLANS.map((plan) => {
            const isCurrent = user?.isVip && currentPlan === plan.id;
            const isProcessing = processingId === plan.id;

            return (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.88}
                onPress={() => handleSelectPlan(plan)}
                disabled={isProcessing || isCurrent}
                style={[
                  styles.planCard,
                  plan.featured && styles.planCardFeatured,
                  isCurrent && styles.planCardActive,
                ]}
              >
                {plan.badge && (
                  <View
                    style={[
                      styles.planBadge,
                      plan.featured && styles.planBadgeFeatured,
                    ]}
                  >
                    <Text
                      style={[
                        styles.planBadgeText,
                        plan.featured && styles.planBadgeTextFeatured,
                      ]}
                    >
                      {plan.badge}
                    </Text>
                  </View>
                )}

                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planSub}>{plan.subText}</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>{plan.price}</Text>
                  <Text style={styles.periodText}>{plan.period}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleSelectPlan(plan)}
                  disabled={isProcessing || isCurrent}
                  style={styles.subscribeBtn}
                >
                  <LinearGradient
                    colors={
                      isCurrent
                        ? ['#10B981', '#059669']
                        : plan.featured
                        ? [COLORS.accentPrimary, COLORS.accentSecondary]
                        : [COLORS.bgSurfaceSecondary, COLORS.bgSurface]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnGradient}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : isCurrent ? (
                      <View style={styles.btnInner}>
                        <Check size={16} color={COLORS.white} />
                        <Text style={styles.btnText}>Đang Hoạt Động</Text>
                      </View>
                    ) : (
                      <Text style={styles.btnText}>
                        {plan.featured ? 'Nâng Cấp Gói Này' : 'Chọn Gói Này'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: LAYOUT.miniPlayerHeight + SPACING.bottomPaddingOffset }} />
      </ScrollView>
    </View>
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
    paddingBottom: SPACING.xl,
  },
  heroWrapper: {
    position: 'relative',
    minHeight: 380,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.xl,
    overflow: 'hidden',
  },
  mosaicContainer: {
    position: 'absolute',
    top: -50,
    left: -20,
    right: -20,
    bottom: 0,
    justifyContent: 'center',
    gap: 12,
    opacity: 0.88,
  },
  mosaicRow1: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: -20,
  },
  mosaicRow2: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: -55,
  },
  mosaicCover: {
    width: (SCREEN_WIDTH - 20) / 3,
    height: (SCREEN_WIDTH - 20) / 3,
    borderRadius: LAYOUT.radiusMd,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  heroContent: {
    zIndex: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  crownBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
  },
  heroHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(252, 71, 92, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: LAYOUT.radiusFull,
    marginBottom: SPACING.md,
  },
  promoBadgeText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.white,
  },
  heroCTA: {
    borderRadius: LAYOUT.radiusFull,
    overflow: 'hidden',
    marginTop: 2,
  },
  heroCTAGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCTAText: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  reasonsCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusLg,
    marginHorizontal: SPACING.screenPadding,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  reasonsHeading: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  reasonsList: {
    gap: SPACING.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  reasonIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(252, 71, 92, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  plansSection: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.md,
  },
  plansHeading: {
    fontSize: TYPOGRAPHY.sizeMicro,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: TYPOGRAPHY.letterSpacingWide,
    marginBottom: 4,
    marginLeft: 4,
  },
  planCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardFeatured: {
    backgroundColor: '#1E1217',
  },
  planCardActive: {
    backgroundColor: '#0F261B',
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgSurfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LAYOUT.radiusXs,
    marginBottom: SPACING.sm,
  },
  planBadgeFeatured: {
    backgroundColor: COLORS.accentPrimary,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  planBadgeTextFeatured: {
    color: COLORS.white,
  },
  planInfo: {
    marginBottom: 6,
  },
  planName: {
    fontSize: TYPOGRAPHY.sizeBodyLarge,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  planSub: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: SPACING.md,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  periodText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  subscribeBtn: {
    borderRadius: LAYOUT.radiusFull,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  btnGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
});
