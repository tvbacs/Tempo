/**
 * authStore - Supabase Auth + Persistent Local Session Cache
 * Ensures user is never lost or reset on reload
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { useToastStore } from './toastStore';

const FREE_EXTRACT_LIMIT = 5;
const ACTIVE_USER_KEY = 'tempo_active_user_session';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  isVip: boolean;
  vipPlan?: string;
  extractedCount: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initSession: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeVip: (plan: string) => Promise<void>;
  incrementExtractCount: () => Promise<void>;
  canExtract: () => boolean;
  getRemainingExtracts: () => number;
  refreshProfile: () => Promise<void>;
}

const saveLocalUser = async (user: AuthUser | null) => {
  try {
    if (user) {
      await AsyncStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(ACTIVE_USER_KEY);
    }
  } catch (e) {}
};

const fetchProfile = async (userId: string, email: string): Promise<AuthUser> => {
  const cleanEmail = email || '';
  const fallbackUsername = cleanEmail ? cleanEmail.split('@')[0] : 'User';

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      return {
        id: userId,
        email: cleanEmail,
        username: data.username || fallbackUsername,
        isVip: data.is_vip ?? false,
        vipPlan: data.vip_plan,
        extractedCount: data.extract_count ?? 0,
      };
    }

    // Auto-create profile if missing
    await supabase.from('profiles').upsert({
      id: userId,
      username: fallbackUsername,
      email: cleanEmail,
      is_vip: false,
      extract_count: 0,
    });
  } catch (e) {}

  return {
    id: userId,
    email: cleanEmail,
    username: fallbackUsername,
    isVip: false,
    extractedCount: 0,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initSession: async () => {
    // 1. Instantly restore cached session from AsyncStorage for 0ms boot
    try {
      const cached = await AsyncStorage.getItem(ACTIVE_USER_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id) {
          set({ user: parsed, isAuthenticated: true, isLoading: false });
        }
      }
    } catch (e) {}

    // 2. Validate session with Supabase in background
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user = await fetchProfile(session.user.id, session.user.email ?? '');
        set({ user, isAuthenticated: true });
        await saveLocalUser(user);
      } else if (!get().user) {
        set({ user: null, isAuthenticated: false });
        await saveLocalUser(null);
      }
    } catch (e) {
    } finally {
      set({ isLoading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await fetchProfile(session.user.id, session.user.email ?? '');
        set({ user, isAuthenticated: true });
        await saveLocalUser(user);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, isAuthenticated: false });
        await saveLocalUser(null);
      }
    });
  },

  login: async (identifier, password) => {
    let targetEmail = identifier.trim();

    if (!targetEmail.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', targetEmail)
        .maybeSingle();

      if (profile?.email) {
        targetEmail = profile.email;
      } else {
        useToastStore.getState().showToast('Tên tài khoản không tồn tại', 'error');
        return;
      }
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: password.trim(),
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        useToastStore.getState().showToast('Vui lòng tắt "Confirm email" trong Supabase Auth', 'error');
      } else if (error.message.includes('Invalid login credentials')) {
        useToastStore.getState().showToast('Mật khẩu hoặc tài khoản không chính xác', 'error');
      } else {
        useToastStore.getState().showToast(error.message, 'error');
      }
      return;
    }

    if (authData.user) {
      const profile = await fetchProfile(authData.user.id, authData.user.email ?? targetEmail);
      set({ user: profile, isAuthenticated: true });
      await saveLocalUser(profile);
      useToastStore.getState().showToast(`Chào mừng, ${profile.username}!`, 'success');
    }
  },

  register: async (username, email, password) => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (existingUser) {
      useToastStore.getState().showToast('Tên tài khoản này đã được sử dụng', 'error');
      return;
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: { username: cleanUsername },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        useToastStore.getState().showToast('Email này đã được đăng ký tài khoản', 'error');
      } else {
        useToastStore.getState().showToast(error.message, 'error');
      }
      return;
    }

    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        username: cleanUsername,
        email: cleanEmail,
        is_vip: false,
        extract_count: 0,
      });

      if (authData.session) {
        const profile = await fetchProfile(authData.user.id, cleanEmail);
        set({ user: profile, isAuthenticated: true });
        await saveLocalUser(profile);
        useToastStore.getState().showToast('Đăng ký & đăng nhập thành công!', 'success');
        return;
      }

      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!loginErr && loginData?.user) {
        const profile = await fetchProfile(loginData.user.id, cleanEmail);
        set({ user: profile, isAuthenticated: true });
        await saveLocalUser(profile);
        useToastStore.getState().showToast('Đăng ký & đăng nhập thành công!', 'success');
        return;
      }

      useToastStore.getState().showToast('Tạo tài khoản thành công! Hãy đăng nhập.', 'success');
    }
  },

  logout: async () => {
    await saveLocalUser(null);
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  upgradeVip: async (plan) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, isVip: true, vipPlan: plan };
    set({ user: updated });
    await saveLocalUser(updated);
    await supabase.from('profiles').update({ is_vip: true, vip_plan: plan }).eq('id', user.id);
    useToastStore.getState().showToast('Nâng cấp VIP thành công!', 'success');
  },

  incrementExtractCount: async () => {
    const { user } = get();
    if (!user || user.isVip) return;
    const newCount = user.extractedCount + 1;
    const updated = { ...user, extractedCount: newCount };
    set({ user: updated });
    await saveLocalUser(updated);
    await supabase.from('profiles').update({ extract_count: newCount }).eq('id', user.id);
  },

  canExtract: () => {
    const { user } = get();
    if (!user) return false;
    return user.isVip || user.extractedCount < FREE_EXTRACT_LIMIT;
  },

  getRemainingExtracts: () => {
    const { user } = get();
    if (!user) return 0;
    if (user.isVip) return Infinity;
    return Math.max(0, FREE_EXTRACT_LIMIT - user.extractedCount);
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await fetchProfile(user.id, user.email);
    set({ user: profile });
    await saveLocalUser(profile);
  },
}));
