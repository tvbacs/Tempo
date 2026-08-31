export type NotificationType = 'release' | 'system' | 'playlist' | 'vip';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: number;
  isRead: boolean;
  thumbnail?: string;
  data?: {
    songId?: string;
    songTitle?: string;
    artistName?: string;
    artistAlias?: string;
    playlistId?: string;
    screen?: string;
  };
}
