/**
 * AuthScreen - Màn hình Đăng Nhập / Đăng Ký Siêu Cấp (Visual Artwork & Glassmorphism)
 * Thiết kế chuẩn Spotify / Apple Music, 100% Tokenized, Zero Borders, No Emojis
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuthStore();

  const handleTabChange = (loginTab: boolean) => {
    if (isLoginTab !== loginTab) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
      setIsLoginTab(loginTab);
    }
  };

  const handleSubmit = async () => {
    const toast = useToastStore.getState();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isLoginTab) {
      if (!email.trim()) {
        toast.showToast('Vui lòng nhập Email', 'error');
        return;
      }
      if (!emailRegex.test(email.trim())) {
        toast.showToast('Định dạng Email không đúng (VD: ten@gmail.com)', 'error');
        return;
      }
      if (!password.trim()) {
        toast.showToast('Vui lòng nhập mật khẩu', 'error');
        return;
      }
      if (password.trim().length < 6) {
        toast.showToast('Mật khẩu phải có tối thiểu 6 ký tự', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        await login(email.trim(), password.trim());
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!email.trim()) {
        toast.showToast('Vui lòng nhập địa chỉ Email', 'error');
        return;
      }
      if (!emailRegex.test(email.trim())) {
        toast.showToast('Định dạng Email không đúng (VD: ten@gmail.com)', 'error');
        return;
      }
      if (!password.trim()) {
        toast.showToast('Vui lòng nhập mật khẩu', 'error');
        return;
      }
      if (password.trim().length < 6) {
        toast.showToast('Mật khẩu phải có tối thiểu 6 ký tự', 'error');
        return;
      }
      if (password.trim() !== confirmPassword.trim()) {
        toast.showToast('Mật khẩu xác nhận không trùng khớp', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        await register('', email.trim(), password.trim());
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <View style={styles.rootContainer}>
      {/* 1. Full-Bleed Artwork Hero Background with Floating Diagonal Cards */}
      <View style={styles.heroBackgroundContainer} pointerEvents="none">
        {/* Floating Capsule 1 (Left Tilt) */}
        <View style={[styles.floatingArtworkCard, styles.cardLeft]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80' }}
            style={styles.artworkImg}
            resizeMode="cover"
          />
        </View>

        {/* Floating Capsule 2 (Center High) */}
        <View style={[styles.floatingArtworkCard, styles.cardCenter]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80' }}
            style={styles.artworkImg}
            resizeMode="cover"
          />
        </View>

        {/* Floating Capsule 3 (Right Tilt) */}
        <View style={[styles.floatingArtworkCard, styles.cardRight]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80' }}
            style={styles.artworkImg}
            resizeMode="cover"
          />
        </View>

        {/* Ambient Neon Glow Orbs */}
        <View style={[styles.glowOrb, { top: insets.top + 20, left: -40, backgroundColor: 'rgba(252, 71, 92, 0.35)' }]} />
        <View style={[styles.glowOrb, { top: insets.top + 60, right: -40, backgroundColor: 'rgba(124, 58, 237, 0.3)' }]} />
        <View style={[styles.glowOrb, { top: insets.top + 180, left: SCREEN_WIDTH * 0.3, backgroundColor: 'rgba(6, 182, 212, 0.2)' }]} />

        {/* Smooth Dark Gradient Vignette Overlay */}
        <LinearGradient
          colors={[
            'rgba(10, 10, 14, 0.3)',
            'rgba(10, 10, 14, 0.75)',
            'rgba(10, 10, 14, 0.96)',
            COLORS.bgPrimary,
          ]}
          locations={[0, 0.28, 0.55, 0.82]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 2. Brand Hero Section */}
            <View style={styles.brandHeroSection}>
              <View style={styles.logoBadgeWrap}>
                <LinearGradient
                  colors={['#FC475C', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoRingGradient}
                >
                  <View style={styles.logoInnerBox}>
                    <Image
                      source={require('../../assets/logo.png')}
                      style={styles.appLogo}
                      resizeMode="contain"
                    />
                  </View>
                </LinearGradient>
              </View>

              <Text style={styles.brandTitle}>Tempo Music</Text>
              <Text style={styles.brandTagline}>Âm Nhạc Không Giới Hạn</Text>
            </View>

            {/* 3. Glassmorphic Form Card */}
            <View style={styles.formGlassCard}>
              {/* Segmented Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleTabChange(true)}
                  style={[styles.tabBtn, isLoginTab && styles.tabBtnActive]}
                >
                  {isLoginTab && (
                    <LinearGradient
                      colors={[COLORS.accentPrimary, COLORS.accentSecondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.tabText, isLoginTab && styles.tabTextActive]}>
                    Đăng Nhập
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleTabChange(false)}
                  style={[styles.tabBtn, !isLoginTab && styles.tabBtnActive]}
                >
                  {!isLoginTab && (
                    <LinearGradient
                      colors={[COLORS.accentPrimary, COLORS.accentSecondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.tabText, !isLoginTab && styles.tabTextActive]}>
                    Tạo Tài Khoản
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Input Fields */}
              <View style={styles.inputsStack}>
                {/* Email Field (always visible) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconBox}>
                      <Mail size={18} color={COLORS.textSecondary} />
                    </View>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="tenban@gmail.com"
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.inputField}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>


                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MẬT KHẨU</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconBox}>
                      <Lock size={18} color={COLORS.textSecondary} />
                    </View>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Tối thiểu 6 ký tự..."
                      placeholderTextColor={COLORS.textMuted}
                      style={styles.inputField}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={COLORS.textSecondary} />
                      ) : (
                        <Eye size={18} color={COLORS.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Field (Only for Register) */}
                {!isLoginTab && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU</Text>
                    <View style={styles.inputWrapper}>
                      <View style={styles.inputIconBox}>
                        <ShieldCheck size={18} color={COLORS.textSecondary} />
                      </View>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Nhập lại mật khẩu..."
                        placeholderTextColor={COLORS.textMuted}
                        style={styles.inputField}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                {/* Main Submit Action Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={styles.submitBtn}
                >
                  <LinearGradient
                    colors={[COLORS.accentPrimary, '#FF6B6B', COLORS.accentSecondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <View style={styles.submitContentRow}>
                        <Text style={styles.submitBtnText}>
                          {isLoginTab ? 'Đăng Nhập Ngay' : 'Bắt Đầu Trải Nghiệm'}
                        </Text>
                        <ArrowRight size={18} color={COLORS.white} strokeWidth={2.5} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Bottom Trust & Guarantee Badges */}
            <View style={styles.trustSection}>
              <View style={styles.trustItem}>
                <View style={styles.trustDot} />
                <Text style={styles.trustText}>Bảo mật mã hóa 100%</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <View style={styles.trustDot} />
                <Text style={styles.trustText}>Không quảng cáo chen ngang</Text>
              </View>
              <View style={styles.trustDivider} />
              <View style={styles.trustItem}>
                <View style={styles.trustDot} />
                <Text style={styles.trustText}>Đồng bộ tức thì</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  heroBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingArtworkCard: {
    position: 'absolute',
    borderRadius: LAYOUT.radiusLg,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
    opacity: 0.45,
  },
  cardLeft: {
    width: 140,
    height: 180,
    top: 20,
    left: -20,
    transform: [{ rotate: '-14deg' }],
  },
  cardCenter: {
    width: 160,
    height: 200,
    top: -10,
    left: SCREEN_WIDTH * 0.35,
    transform: [{ rotate: '6deg' }],
  },
  cardRight: {
    width: 140,
    height: 180,
    top: 40,
    right: -25,
    transform: [{ rotate: '18deg' }],
  },
  artworkImg: {
    width: '100%',
    height: '100%',
  },
  glowOrb: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    filter: 'blur(40px)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  brandHeroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.xs,
  },
  logoBadgeWrap: {
    marginBottom: SPACING.md,
  },
  logoRingGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  logoInnerBox: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#0F0F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogo: {
    width: 44,
    height: 44,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  formGlassCard: {
    backgroundColor: 'rgba(24, 24, 30, 0.88)',
    borderRadius: 24,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: SPACING.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: LAYOUT.radiusFull,
    padding: 3,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LAYOUT.radiusFull,
    overflow: 'hidden',
    position: 'relative',
  },
  tabBtnActive: {},
  tabText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  inputsStack: {
    gap: SPACING.md,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: LAYOUT.radiusMd,
    paddingHorizontal: SPACING.sm + 2,
    height: 48,
    gap: 10,
  },
  inputIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 4,
  },
  submitBtn: {
    borderRadius: LAYOUT.radiusFull,
    overflow: 'hidden',
    marginTop: SPACING.xs,
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  trustSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: SPACING.sm,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  trustText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  trustDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
