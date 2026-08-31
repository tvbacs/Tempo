/**
 * Connect Store - Quản lý Spotify-style cross-device playback
 * Kết nối Realtime qua Supabase Broadcast Channel 'tempo_connect_channel'
 * Đảm bảo chỉ gửi qua WebSocket khi channel đã joined, loại bỏ triệt để warning REST fallback
 */
import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { audioEngine } from '../services/audioPlayer';
import { useToastStore } from './toastStore';

export interface ConnectedDevice {
  deviceId: string;
  deviceName: string;
  type: 'mobile' | 'web' | 'desktop';
  isOnline: boolean;
  isPlaying?: boolean;
  currentSong?: any;
  volume?: number;
  lastSeen?: number;
}

interface ConnectState {
  availableDevices: ConnectedDevice[];
  activeDevice: ConnectedDevice;
  newlyDiscoveredDevice: ConnectedDevice | null;
  isConnectModalVisible: boolean;
  volume: number;
  isInitialized: boolean;
  isSubscribed: boolean;

  initConnect: () => void;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  clearNewlyDiscoveredDevice: () => void;
  selectDevice: (device: ConnectedDevice) => Promise<void>;
  setVolume: (volume: number) => void;
  sendRemoteCommand: (command: string, data?: any) => void;
  broadcastLocalState: (song: any, isPlaying: boolean, positionMs: number, durationMs: number) => void;
}

const THIS_DEVICE: ConnectedDevice = {
  deviceId: 'mobile-app',
  deviceName: 'Điện thoại này',
  type: 'mobile',
  isOnline: true,
};

let realtimeChannel: any = null;

const safeBroadcast = (event: string, payload: any) => {
  if (realtimeChannel && realtimeChannel.state === 'joined') {
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event,
        payload,
      });
    } catch (_) {}
  }
};

export const useConnectStore = create<ConnectState>((set, get) => ({
  availableDevices: [THIS_DEVICE],
  activeDevice: THIS_DEVICE,
  newlyDiscoveredDevice: null,
  isConnectModalVisible: false,
  volume: 0.8,
  isInitialized: false,
  isSubscribed: false,

  clearNewlyDiscoveredDevice: () => set({ newlyDiscoveredDevice: null }),

  initConnect: () => {
    if (realtimeChannel) return;

    try {
      realtimeChannel = supabase.channel('tempo_connect_channel', {
        config: { broadcast: { self: false } },
      });

      realtimeChannel
        .on('broadcast', { event: 'device_presence' }, ({ payload }: { payload: ConnectedDevice }) => {
          if (!payload?.deviceId || payload.deviceId === 'mobile-app') return;
          const isNewlyOnline = !get().availableDevices.some((d) => d.deviceId === payload.deviceId);
          const currentList = get().availableDevices.filter((d) => d.deviceId !== payload.deviceId);
          const updated = [...currentList, { ...payload, isOnline: true, lastSeen: Date.now() }];
          set({
            availableDevices: updated,
            ...(isNewlyOnline ? { newlyDiscoveredDevice: payload } : {}),
          });

          // Yêu cầu lấy ngay bài hát và trạng thái từ Web Player
          safeBroadcast('playback_state_query', {});
        })
        .on('broadcast', { event: 'device_presence_query' }, () => {
          safeBroadcast('device_presence', THIS_DEVICE);
        })
        .on('broadcast', { event: 'playback_state_query' }, () => {
          const { usePlayerStore } = require('./playerStore');
          const ps = usePlayerStore.getState();
          if (get().activeDevice.deviceId === 'mobile-app' && ps.currentSong) {
            get().broadcastLocalState(ps.currentSong, ps.isPlaying, ps.positionMs, ps.durationMs);
          }
        })
        .on('broadcast', { event: 'playback_state' }, ({ payload }: { payload: any }) => {
          if (!payload) return;

          // Nếu thiết bị đang phát là máy tính / thiết bị khác
          if (payload.activeDeviceId && payload.activeDeviceId !== 'mobile-app') {
            const dev: ConnectedDevice = {
              deviceId: payload.activeDeviceId,
              deviceName: payload.activeDeviceName || 'Web Player (PC)',
              type: 'web',
              isOnline: true,
              lastSeen: Date.now(),
            };
            set({ activeDevice: dev });

            // Cập nhật trạng thái phát nhạc từ máy tính về điện thoại ngay lập tức
            const { usePlayerStore } = require('./playerStore');
            if (payload.currentSong) {
              usePlayerStore.setState({
                isPlaying: Boolean(payload.isPlaying),
                positionMs: payload.positionMs || 0,
                durationMs: payload.durationMs || (payload.currentSong.duration ? payload.currentSong.duration * 1000 : 0),
                currentSong: payload.currentSong,
                queue: payload.queue || [payload.currentSong],
              });
            }
          }
        })
        .on('broadcast', { event: 'command' }, ({ payload }: { payload: any }) => {
          const { command, data } = payload;
          const { usePlayerStore } = require('./playerStore');
          if (command === 'next') usePlayerStore.getState().playNext();
          if (command === 'prev') usePlayerStore.getState().playPrev();
          if (command === 'toggle_play_pause') usePlayerStore.getState().togglePlayPause();
          if (command === 'pause') audioEngine.stopAndUnload();
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            set({ isInitialized: true, isSubscribed: true });
            // Gửi sự hiện diện và hỏi thăm các thiết bị đang online qua WebSocket
            safeBroadcast('device_presence', THIS_DEVICE);
            safeBroadcast('device_presence_query', {});
            safeBroadcast('playback_state_query', {});

            // Tự động broadcast state mỗi khi playerStore thay đổi (dùng subscribe)
            setTimeout(() => {
              try {
                const { usePlayerStore } = require('./playerStore');

                // Subscribe playerStore để detect thay đổi bài hát / trạng thái
                usePlayerStore.subscribe(
                  (state: any, prevState: any) => {
                    const { currentSong, isPlaying, positionMs, durationMs } = state;
                    const connectState = get();
                    if (connectState.activeDevice.deviceId !== 'mobile-app') return;
                    if (!currentSong) return;
                    if (prevState.currentSong?.id !== currentSong.id || prevState.isPlaying !== isPlaying) {
                      connectState.broadcastLocalState(currentSong, isPlaying, positionMs, durationMs);
                    }
                  }
                );

                // Heartbeat position mỗi 2 giây khi đang phát
                setInterval(() => {
                  try {
                    const { usePlayerStore: ps } = require('./playerStore');
                    const { currentSong, isPlaying, positionMs, durationMs } = ps.getState();
                    const connectState = get();
                    if (connectState.activeDevice.deviceId !== 'mobile-app') return;
                    if (currentSong && isPlaying) {
                      connectState.broadcastLocalState(currentSong, isPlaying, positionMs, durationMs);
                    }
                  } catch (_) {}
                }, 2000);

                // Tự động kiểm tra và loại bỏ thiết bị đã offline (không nhận tín hiệu > 25s)
                setInterval(() => {
                  const now = Date.now();
                  const valid = get().availableDevices.filter(d => {
                    if (d.deviceId === 'mobile-app') return true;
                    return d.lastSeen && (now - d.lastSeen < 25000);
                  });
                  if (valid.length !== get().availableDevices.length) {
                    set({ availableDevices: valid });
                    const curActive = get().activeDevice;
                    if (curActive.deviceId !== 'mobile-app' && !valid.some(d => d.deviceId === curActive.deviceId)) {
                      set({ activeDevice: THIS_DEVICE });
                    }
                  }
                }, 10000);
              } catch (e) {
                console.warn('[ConnectStore] subscribe error:', e);
              }
            }, 300);
          } else {
            set({ isSubscribed: false });
          }
        });

    } catch (e) {
      console.warn('[ConnectStore] Failed to init connect channel:', e);
    }
  },

  openConnectModal: () => {
    get().initConnect();
    safeBroadcast('device_presence_query', {});
    set({ isConnectModalVisible: true });
  },

  closeConnectModal: () => set({ isConnectModalVisible: false }),

  selectDevice: async (device: ConnectedDevice) => {
    const prevDevice = get().activeDevice;
    if (prevDevice.deviceId === device.deviceId) return;

    set({ activeDevice: device, isConnectModalVisible: false });
    const { usePlayerStore } = require('./playerStore');
    const playerState = usePlayerStore.getState();
    const song = playerState.currentSong;
    const pos = playerState.positionMs;

    if (device.type === 'web') {
      // 1. Chuyển quyền phát sang Loa Máy Tính - Giải phóng hoàn toàn audio local trên mobile
      await audioEngine.stopAndUnload();
      usePlayerStore.setState({ isPlaying: true });
      useToastStore.getState().showToast(`Đang nghe trên ${device.deviceName}`, 'info');

      if (song) {
        safeBroadcast('command', {
          command: 'transfer_playback',
          data: {
            targetDeviceId: 'web-player-pc',
            song,
            queue: playerState.queue,
            positionMs: pos,
          },
        });
      }
    } else {
      // 2. Chuyển ngược lại về Loa Điện Thoại
      useToastStore.getState().showToast('Đang phát qua Điện thoại này', 'info');
      safeBroadcast('command', { command: 'pause' });
      if (song) {
        await audioEngine.loadAndPlay(song);
        await audioEngine.seekTo(pos);
      }
    }
  },

  setVolume: (volume: number) => {
    set({ volume });
    get().sendRemoteCommand('set_volume', { volume });
  },

  sendRemoteCommand: (command: string, data?: any) => {
    safeBroadcast('command', { command, data });
  },

  broadcastLocalState: (song, isPlaying, positionMs, durationMs) => {
    if (get().activeDevice.deviceId === 'mobile-app') {
      safeBroadcast('playback_state', {
        activeDeviceId: 'mobile-app',
        activeDeviceName: 'Điện thoại',
        isPlaying,
        positionMs,
        durationMs,
        currentSong: song,
      });
    }
  },
}));
