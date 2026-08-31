import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification } from '../types/notification';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const STORAGE_KEY = 'tempo_user_notifications';

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_connect_ready',
    type: 'system',
    title: 'Tính năng Spotify Connect đã sẵn sàng',
    message: 'Bạn có thể chuyển đổi phát nhạc liền mạch giữa Điện thoại và Máy tính (PC Web Player).',
    createdAt: Date.now() - 1000 * 60 * 30, // 30 phút trước
    isRead: false,
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    data: {
      screen: 'Home',
    },
  },
  {
    id: 'notif_ariana_release',
    type: 'release',
    title: 'Ariana Grande vừa ra mắt ca khúc mới',
    message: 'Thưởng thức ngay bản nhạc trích xuất chất lượng cao trên Tempo Music.',
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 giờ trước
    isRead: false,
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    data: {
      artistName: 'Ariana Grande',
      artistAlias: 'ariana-grande',
      screen: 'ArtistDetail',
    },
  },
  {
    id: 'notif_sontung_release',
    type: 'release',
    title: 'Sơn Tùng M-TP phát hành bản phối mới',
    message: 'Nghe lại những ca khúc đình đám được yêu thích nhất trong tuần.',
    createdAt: Date.now() - 1000 * 60 * 60 * 18, // 18 giờ trước
    isRead: false,
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    data: {
      artistName: 'Sơn Tùng M-TP',
      artistAlias: 'son-tung-m-tp',
      screen: 'ArtistDetail',
    },
  },
  {
    id: 'notif_vip_perks',
    type: 'vip',
    title: 'Nâng cấp trải nghiệm với Tempo VIP',
    message: 'Mở khóa toàn bộ kho nhạc quốc tế độc quyền, nghe ngoại tuyến và chất lượng Lossless.',
    createdAt: Date.now() - 1000 * 60 * 60 * 48, // 2 ngày trước
    isRead: true,
    data: {
      screen: 'UpgradeScreen',
    },
  },
  {
    id: 'notif_weekly_mix',
    type: 'playlist',
    title: 'Danh sách phát tuyển chọn dành riêng cho bạn',
    message: 'Khám phá hàng chục giai điệu phù hợp với gu âm nhạc gần đây của bạn.',
    createdAt: Date.now() - 1000 * 60 * 60 * 72, // 3 ngày trước
    isRead: true,
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
    data: {
      screen: 'Home',
    },
  },
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let list: AppNotification[] = [];

      if (raw) {
        list = JSON.parse(raw);
      } else {
        list = DEFAULT_NOTIFICATIONS;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }

      const unreadCount = list.filter((n) => !n.isRead).length;
      set({ notifications: list, unreadCount, isLoading: false });
    } catch (e) {
      console.error('Failed to load notifications:', e);
      set({ notifications: DEFAULT_NOTIFICATIONS, unreadCount: 3, isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    const list = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    const unreadCount = list.filter((n) => !n.isRead).length;
    set({ notifications: list, unreadCount });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  },

  markAllAsRead: async () => {
    const list = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: list, unreadCount: 0 });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  },

  deleteNotification: async (id: string) => {
    const list = get().notifications.filter((n) => n.id !== id);
    const unreadCount = list.filter((n) => !n.isRead).length;
    set({ notifications: list, unreadCount });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (_) {}
  },
}));
