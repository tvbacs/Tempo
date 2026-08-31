import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { useLibraryStore } from './libraryStore';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  initSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthModalOpen: false,

  initSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ user: session?.user ?? null, isLoading: false });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null });
        if (session?.user) {
          useLibraryStore.getState().fetchLikedSongs();
          useLibraryStore.getState().fetchHistory();
        }
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    set({ user: data.user, isAuthModalOpen: false });
    return { success: true };
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    set({ user: data.user, isAuthModalOpen: false });
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
