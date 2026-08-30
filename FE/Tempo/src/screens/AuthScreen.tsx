/**
 * AuthScreen - Màn hình Đăng Nhập / Đăng Ký bắt buộc
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Music,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Headphones,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AuthScreen: React.FC = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuthStore();

  const handleSubmit = async () => {
    const toast = useToastStore.getState();

    if (isLoginTab) {
      const loginId = username.trim() || email.trim();
      if (!loginId) {
        toast.showToast('Vui lòng nhập Tên tài khoản hoặc Email', 'error');
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
        await login(loginId, password.trim());
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Register validation
      if (!username.trim()) {
        toast.showToast('Vui lòng nhập Tên tài khoản', 'error');
        return;
      }
      if (username.trim().length < 3) {
        toast.showToast('Tên tài khoản phải có ít nhất 3 ký tự', 'error');
        return;
      }
      if (!email.trim()) {
        toast.showToast('Vui lòng nhập địa chỉ Email', 'error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
        await register(username.trim(), email.trim(), password.trim());
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Ambient gradient top glow */}
      <LinearGradient
        colors={['rgba(252,71,92,0.18)', 'rgba(252,101,90,0.08)', 'transparent']}
        locations={[0, 0.45, 1]}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

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
          {/* Brand Header */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.appLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>Tempo Music</Text>
            <Text style={styles.brandSubtitle}>
              {isLoginTab
                ? 'Đăng nhập để tiếp tục nghe nhạc và truy cập thư viện cá nhân'
                : 'Tạo tài khoản mới để lưu trữ bài hát, playlist và trải nghiệm không giới hạn'}
            </Text>
          </View>

          {/* Mode Switch Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsLoginTab(true)}
              style={[styles.tabBtn, isLoginTab && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, isLoginTab && styles.tabTextActive]}>
                Đăng Nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsLoginTab(false)}
              style={[styles.tabBtn, !isLoginTab && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, !isLoginTab && styles.tabTextActive]}>
                Đăng Ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Form */}
          <View style={styles.formCard}>
            {/* Username Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {isLoginTab ? 'Tên đăng nhập hoặc Email' : 'Tên tài khoản'}
              </Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={COLORS.textSecondary} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder={isLoginTab ? 'Nhập username hoặc email...' : 'Ví dụ: tempo_listener'}
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.inputField}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Field (Only on Register) */}
            {!isLoginTab && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color={COLORS.textSecondary} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    placeholderTextColor={COLORS.textMuted}
                    style={styles.inputField}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={COLORS.textSecondary} />
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={18} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password (Only on Register) */}
            {!isLoginTab && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <ShieldCheck size={18} color={COLORS.textSecondary} />
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

            {/* Submit Action Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitBtn}
            >
              <LinearGradient
                colors={[COLORS.accentPrimary, COLORS.accentSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isLoginTab ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: 0,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  appLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: SPACING.md,
  },
  brandTitle: {
    fontSize: TYPOGRAPHY.sizeHero,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  brandSubtitle: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSurfaceSecondary,
    borderRadius: LAYOUT.radiusFull,
    padding: 4,
    marginBottom: SPACING.xl,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: LAYOUT.radiusFull,
  },
  tabBtnActive: {
    backgroundColor: COLORS.bgSurface,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusLg,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizeCaption,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurfaceSecondary,
    borderRadius: LAYOUT.radiusMd,
    paddingHorizontal: SPACING.md,
    height: 50,
    gap: SPACING.sm,
  },
  inputField: {
    flex: 1,
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizeBodySmall,
  },
  submitBtn: {
    borderRadius: LAYOUT.radiusFull,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: TYPOGRAPHY.sizeBody,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  perksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.bgSurfaceSecondary,
  },
  dividerText: {
    fontSize: TYPOGRAPHY.sizeCaption,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: LAYOUT.radiusFull,
    paddingVertical: 14,
    gap: SPACING.sm,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  googleBtnText: {
    fontSize: TYPOGRAPHY.sizeBodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
