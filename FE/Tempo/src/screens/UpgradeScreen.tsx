/**
 * UpgradeScreen - Giao diện Nâng Cấp VIP cao cấp phong cách SoundCloud Pro
 * Gradient nền sâu, Hero Card nổi bật với đầy đủ Checklist đặc quyền, Nút đăng ký tương phản cao
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Crown,
  Check,
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlanItem {
  id: 'monthly' | 'yearly' | 'lifetime';
  categoryTag: string;
  periodTag: string;
  badge?: string;
  name: string;
  price: string;
  period: string;
  subPrice: string;
  features: string[];
  featured?: boolean;
}

const PLANS: PlanItem[] = [
  {
    id: 'yearly',
    categoryTag: 'TIẾT KIỆM NHẤT',
    periodTag: 'Gói 1 Năm',
    badge: 'TIẾT KIỆM 30%',
    name: 'Tempo VIP Pro',
    price: '499.000 đ',
    period: '/ năm',
    subPrice: 'Khoảng 41.000 đ / tháng',
    featured: true,
    features: [
      'Trích xuất bài hát không giới hạn',
      'Tải nhạc ngoại tuyến không giới hạn',
      'Tự do Bật / Tắt chế độ Trộn bài',
      'Chất lượng âm thanh Lossless 320kbps',
    ],
  },
  {
    id: 'monthly',
    categoryTag: 'LINH HOẠT',
    periodTag: 'Gói 1 Tháng',
    name: 'Tempo VIP Monthly',
    price: '59.000 đ',
    period: '/ tháng',
    subPrice: 'Thanh toán hàng tháng · Hủy bất cứ lúc nào',
    features: [
      'Trích xuất bài hát không giới hạn',
      'Tải nhạc ngoại tuyến không giới hạn',
      'Tự do Bật / Tắt chế độ Trộn bài',
      'Chất lượng âm thanh Lossless 320kbps',
    ],
  },
  {
    id: 'lifetime',
    categoryTag: 'MỘT LẦN DUY NHẤT',
    periodTag: 'Trọn Đời',
    badge: 'VĨNH VIỄN',
    name: 'Tempo VIP Lifetime',
    price: '999.000 đ',
    period: ' trọn đời',
    subPrice: 'Sở hữu vĩnh viễn không bao giờ hết hạn',
    features: [
      'Trích xuất bài hát không giới hạn',
      'Tải nhạc ngoại tuyến không giới hạn',
      'Tự do Bật / Tắt chế độ Trộn bài',
      'Toàn quyền truy cập mọi tính năng mới',
      'Chất lượng âm thanh Lossless 320kbps',
    ],
  },
];

export const UpgradeScreen: React.FC = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<'yearly' | 'monthly' | 'lifetime'>('yearly');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user, upgradeVip } = useAuthStore();
  const insets = useSafeAreaInsets();

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];
  const isUserVip = !!user?.isVip;

  const handleSelectPlan = async (plan: PlanItem) => {
    if (isUserVip) return;
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
        <LinearGradient
          colors={['#5A122A', '#2D0A16', '#14060B', COLORS.bgPrimary]}
          locations={[0, 0.35, 0.65, 1]}
          style={[styles.heroGradientBackground, { paddingTop: topSafePadding + SPACING.lg }]}
        >
          <View style={styles.glowAura} pointerEvents="none" />

          <View style={styles.brandRow}>
            <View style={styles.crownBox}>
              <Crown size={14} color={COLORS.white} fill={COLORS.white} />
            </View>
            <Text style={styles.brandText}>TEMPO VIP</Text>
          </View>

          <Text style={styles.heroHeadline}>
            {`Trải nghiệm âm nhạc\nĐỉnh cao trên Tempo`}
          </Text>

          <View style={styles.planSelectorRow}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPlanId(plan.id)}
                  style={[
                    styles.planTabBtn,
                    isSelected && styles.planTabBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.planTabText,
                      isSelected && styles.planTabTextActive,
                    ]}
                  >
                    {plan.periodTag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.showcaseCard}>
            <View style={styles.cardTagsRow}>
              <View style={styles.categoryTagPill}>
                <Text style={styles.categoryTagText}>{selectedPlan.categoryTag}</Text>
              </View>
              <View style={styles.periodTagPill}>
                <Text style={styles.periodTagText}>{selectedPlan.periodTag}</Text>
              </View>
              {isUserVip && (
                <View style={[styles.periodTagPill, { backgroundColor: '#065F46' }]}>
                  <Text style={[styles.periodTagText, { color: '#6EE7B7' }]}>ĐÃ KÍCH HOẠT</Text>
                </View>
              )}
            </View>

            <View style={styles.planTitleRow}>
              <Text style={styles.cardPlanName}>{selectedPlan.name}</Text>
              <View style={styles.orangeCrownBadge}>
                <Crown size={11} color={COLORS.white} fill={COLORS.white} />
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceBigText}>{selectedPlan.price}</Text>
              <Text style={styles.periodSmallText}>{selectedPlan.period}</Text>
            </View>
            <Text style={styles.subPriceText}>{selectedPlan.subPrice}</Text>

            <View style={styles.cardDivider} />

            <View style={styles.checklistContainer}>
              {selectedPlan.features.map((feature, idx) => (
                <View key={idx} style={styles.checkItemRow}>
                  <View style={styles.checkIconWrap}>
                    <Check size={15} color={COLORS.white} strokeWidth={2.8} />
                  </View>
                  <Text style={styles.checkItemText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleSelectPlan(selectedPlan)}
              disabled={processingId !== null || isUserVip}
              style={[styles.primaryActionButton, isUserVip && { backgroundColor: '#10B981' }]}
            >
              {processingId === selectedPlan.id ? (
                <ActivityIndicator size="small" color={COLORS.black} />
              ) : isUserVip ? (
                <View style={styles.btnInnerRow}>
                  <Check size={18} color={COLORS.white} strokeWidth={3} />
                  <Text style={[styles.primaryActionText, { color: COLORS.white }]}>
                    Đang Hoạt Động
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryActionText}>Đăng ký ngay</Text>
              )}
            </TouchableOpacity>

            {!isUserVip ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleSelectPlan(selectedPlan)}
                disabled={processingId !== null}
                style={styles.secondaryActionButton}
              >
                <Text style={styles.secondaryActionText}>Mở khóa tức thì</Text>
                <View style={styles.saveGreenBadge}>
                  <Text style={styles.saveGreenBadgeText}>TIẾT KIỆM 10%</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={styles.disclaimerContainer}>
              <Text style={styles.cancelAnytimeText}>
                {isUserVip ? 'Tài khoản của bạn có quyền truy cập toàn bộ tính năng VIP.' : 'Hủy bất kỳ lúc nào.'}
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.termsLinkText}>Chính sách và điều khoản áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

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
  heroGradientBackground: {
    position: 'relative',
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.xxl,
    overflow: 'hidden',
  },
  glowAura: {
    position: 'absolute',
    top: -80,
    left: '10%',
    width: '80%',
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(252, 71, 92, 0.18)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  crownBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentPrimary,
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: SPACING.md,
  },
  planSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  planTabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: LAYOUT.radiusFull,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTabBtnActive: {
    backgroundColor: COLORS.white,
  },
  planTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  planTabTextActive: {
    color: COLORS.black,
    fontWeight: '700',
  },
  showcaseCard: {
    backgroundColor: '#121218',
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.md + 2,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  categoryTagPill: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.4,
  },
  periodTagPill: {
    backgroundColor: '#581C87',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  periodTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#E9D5FF',
    letterSpacing: 0.4,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  cardPlanName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
  },
  orangeCrownBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  priceBigText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.4,
  },
  periodSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subPriceText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: SPACING.sm + 2,
  },
  checklistContainer: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  checkIconWrap: {
    marginTop: 2,
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkItemText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#E4E4E7',
    lineHeight: 18.5,
  },
  primaryActionButton: {
    backgroundColor: COLORS.white,
    borderRadius: LAYOUT.radiusFull,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E1E26',
    borderRadius: LAYOUT.radiusFull,
    paddingVertical: 11,
    marginBottom: SPACING.sm + 2,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveGreenBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveGreenBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.4,
  },
  disclaimerContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  cancelAnytimeText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  termsLinkText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '600',
    color: '#60A5FA',
  },
});
