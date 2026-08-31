import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { useLibraryStore } from './libraryStore';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  initSession: () => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const syncAllData = () => {
  const lib = useLibraryStore.getState();
  lib.fetchLikedSongs();
  lib.fetchPlaylists();
  lib.fetchFollowedArtists();
  lib.fetchSavedAlbums();
  lib.fetchHistory();
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthModalOpen: false,

  initSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      set({ user, isLoading: false });

      if (user) {
        syncAllData();
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user ?? null;
        set({ user: currentUser });
        if (currentUser) {
          syncAllData();
        }
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  signIn: async (identifier, password) => {
    let targetEmail = identifier.trim();

    // Hỗ trợ đăng nhập bằng username hoặc email như mobile
    if (!targetEmail.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', targetEmail)
        .maybeSingle();

      if (profile?.email) {
        targetEmail = profile.email;
      } else {
        return { success: false, error: 'Tên tài khoản hoặc email không tồn tại trong hệ thống' };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: password.trim(),
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Mật khẩu hoặc tài khoản không chính xác. Vui lòng kiểm tra lại.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra hộp thư.' };
      }
      return { success: false, error: error.message };
    }

    set({ user: data.user, isAuthModalOpen: false });
    syncAllData();
    return { success: true };
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    set({ user: data.user, isAuthModalOpen: false });
    syncAllData();
    return { success: true };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
    useLibraryStore.getState().reset();
  },

  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
}));
