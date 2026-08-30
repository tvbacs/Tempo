/**
 * Tempo Connect State Store (Spotify Connect Real-time Clone)
 * Manages Cross-Device Playback Sync via Supabase Realtime Broadcast
 */
import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { UnifiedSong } from '../types/music';
import { audioEngine } from '../services/audioPlayer';
import { useToastStore } from './toastStore';

export interface ConnectedDevice {
  deviceId: string;
  deviceName: string;
  type: 'mobile' | 'web' | 'other';
  isOnline: boolean;
  isPlaying?: boolean;
  currentSong?: UnifiedSong | null;
  volume?: number;
  lastSeen?: number;
}

interface ConnectState {
  availableDevices: ConnectedDevice[];
  activeDevice: ConnectedDevice;
  isConnectModalVisible: boolean;
  volume: number; // 0..1
  isInitialized: boolean;

  // Actions
  initConnect: () => void;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  selectDevice: (device: ConnectedDevice) => Promise<void>;
  setVolume: (volume: number) => void;
  sendRemoteCommand: (command: string, data?: any) => void;
  broadcastLocalState: (song: UnifiedSong | null, isPlaying: boolean, positionMs: number, durationMs: number) => void;
}

const THIS_DEVICE: ConnectedDevice = {
  deviceId: 'mobile-app',
  deviceName: 'Điện thoại này',
  type: 'mobile',
  isOnline: true,
};

let realtimeChannel: any = null;

export const useConnectStore = create<ConnectState>((set, get) => ({
  availableDevices: [THIS_DEVICE],
  activeDevice: THIS_DEVICE,
  isConnectModalVisible: false,
  volume: 0.8,
  isInitialized: false,

  initConnect: () => {
    if (get().isInitialized || realtimeChannel) return;

    try {
      realtimeChannel = supabase.channel('tempo_connect_channel', {
        config: { broadcast: { self: false } },
      });

      realtimeChannel
        .on('broadcast', { event: 'device_presence' }, ({ payload }: { payload: ConnectedDevice }) => {
          if (!payload?.deviceId || payload.deviceId === 'mobile-app') return;
          const currentList = get().availableDevices.filter((d) => d.deviceId !== payload.deviceId);
          const updated = [...currentList, { ...payload, isOnline: true, lastSeen: Date.now() }];
          set({ availableDevices: updated });
        })
        .on('broadcast', { event: 'playback_state' }, ({ payload }: { payload: any }) => {
          if (get().activeDevice.deviceId === payload.activeDeviceId) {
            // Cập nhật trạng thái phát nhạc từ máy tính về điện thoại
            const { usePlayerStore } = require('./playerStore');
            if (payload.currentSong) {
              usePlayerStore.setState({
                isPlaying: payload.isPlaying,
                positionMs: payload.positionMs,
                durationMs: payload.durationMs,
                currentSong: payload.currentSong,
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
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            set({ isInitialized: true });
            // Hỏi thăm các thiết bị đang online
            realtimeChannel.send({
              type: 'broadcast',
              event: 'device_presence_query',
              payload: {},
            });

            // Tự động broadcast state mỗi khi playerStore thay đổi (dùng subscribe)
            setTimeout(() => {
              try {
                const { usePlayerStore } = require('./playerStore');
                let broadcastInterval: any = null;

                // Subscribe playerStore để detect thay đổi bài hát / trạng thái
                usePlayerStore.subscribe(
                  (state: any, prevState: any) => {
                    const { currentSong, isPlaying, positionMs, durationMs } = state;
                    const connectState = get();
                    // Chỉ broadcast khi đang phát từ điện thoại này
                    if (connectState.activeDevice.deviceId !== 'mobile-app') return;
                    if (!currentSong) return;
                    // Tránh flood: chỉ broadcast khi bài thay đổi hoặc isPlaying thay đổi
                    if (prevState.currentSong?.id !== currentSong.id || prevState.isPlaying !== isPlaying) {
                      connectState.broadcastLocalState(currentSong, isPlaying, positionMs, durationMs);
                    }
                  }
                );

                // Heartbeat position mỗi 2 giây khi đang phát
                broadcastInterval = setInterval(() => {
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
              } catch (e) {
                console.warn('[ConnectStore] subscribe error:', e);
              }
            }, 500);
          }

        });
    } catch (e) {
      console.warn('[ConnectStore] Failed to init connect channel:', e);
    }
  },

  openConnectModal: () => {
    get().initConnect();
    // Gửi tín hiệu tìm thiết bị
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'device_presence_query',
        payload: {},
      });
    }
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
      // 1. Chuyển quyền phát sang Loa Máy Tính
      await audioEngine.pause();
      useToastStore.getState().showToast(Đang nghe trên , 'info');

      if (realtimeChannel && song) {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'command',
          payload: {
            command: 'transfer_playback',
            data: {
              targetDeviceId: device.deviceId,
              song,
              positionMs: pos,
            },
          },
        });
      }
    } else {
      // 2. Chuyển ngược lại về Loa Điện Thoại
      useToastStore.getState().showToast('Đang phát qua Điện thoại này', 'info');
      if (realtimeChannel) {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'command',
          payload: { command: 'pause' },
        });
      }
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
    if (realtimeChannel) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'command',
        payload: { command, data },
      });
    }
  },

  broadcastLocalState: (song, isPlaying, positionMs, durationMs) => {
    if (realtimeChannel && get().activeDevice.deviceId === 'mobile-app') {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'playback_state',
        payload: {
          activeDeviceId: 'mobile-app',
          activeDeviceName: 'Điện thoại',
          isPlaying,
          positionMs,
          durationMs,
          currentSong: song,
        },
      });
    }
  },
}));
