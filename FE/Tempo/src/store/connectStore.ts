/**
 * Connect Store - Quản lý Spotify-style cross-device playback
 * Kết nối Realtime qua Supabase Broadcast Channel 'tempo_connect_channel'
 * Kiến trúc phân tách rõ ràng: Local Audio State vs Remote Device State
 */
import { create } from 'zustand';
import { AppState, AppStateStatus } from 'react-native';
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

export interface RemotePlaybackState {
  deviceId: string;
  deviceName: string;
  currentSong: any | null;
  queue: any[];
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
}

interface ConnectState {
  availableDevices: ConnectedDevice[];
  activeDevice: ConnectedDevice;
  newlyDiscoveredDevice: ConnectedDevice | null;
  isConnectModalVisible: boolean;
  volume: number;
  isInitialized: boolean;
  isSubscribed: boolean;
  remotePlayback: RemotePlaybackState | null;

  initConnect: () => void;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  clearNewlyDiscoveredDevice: () => void;
  selectDevice: (device: ConnectedDevice) => Promise<void>;
  setVolume: (volume: number) => void;
  sendRemoteCommand: (command: string, data?: any) => void;
  broadcastLocalState: (song: any, isPlaying: boolean, positionMs: number, durationMs: number) => void;
  ensureActiveDeviceOrFallback: () => Promise<boolean>;
}

export const THIS_DEVICE: ConnectedDevice = {
  deviceId: 'mobile-app',
  deviceName: 'Điện thoại',
  type: 'mobile',
  isOnline: true,
};

let realtimeChannel: any = null;
let lastResumeTime = Date.now();
let isAppStateListenerAttached = false;
let lastUserVolumeChangeTime = 0;
let lastUserPlayPauseChangeTime = 0;
let lastUserSeekChangeTime = 0;

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

const isTargetedToThisDevice = (payload: any) => {
  const targetDeviceId = payload?.targetDeviceId ?? payload?.data?.targetDeviceId;
  if (!targetDeviceId) return true;
  return targetDeviceId === THIS_DEVICE.deviceId;
};

const handleRemoteDeviceLost = async (lostDeviceId: string, store: any) => {
  const currentActive = store.getState().activeDevice;
  if (currentActive.deviceId !== lostDeviceId && lostDeviceId !== '') return;

  const remote = store.getState().remotePlayback;
  const { usePlayerStore } = require('./playerStore');
  const ps = usePlayerStore.getState();

  const songToPlay = remote?.currentSong || ps.currentSong;
  const posToPlay = remote?.positionMs ?? ps.positionMs;
  const queueToPlay = remote?.queue?.length ? remote.queue : ps.queue;
  const wasPlaying = Boolean(remote?.isPlaying);

  const remaining = store.getState().availableDevices.filter((d: any) => d.deviceId !== lostDeviceId);
  store.setState({
    activeDevice: THIS_DEVICE,
    remotePlayback: null,
    availableDevices: remaining,
  });

  if (songToPlay) {
    if (wasPlaying) {
      // Khi PC ngắt kết nối mà nhạc đang phát -> Tự động nạp và phát tiếp trên điện thoại
      usePlayerStore.setState({
        currentSong: songToPlay,
        queue: queueToPlay,
        positionMs: posToPlay,
        isPlaying: true,
        isLoading: true,
      });
      const success = await audioEngine.loadAndPlay(songToPlay);
      usePlayerStore.setState({ isLoading: false, isPlaying: success });
      if (posToPlay > 0) {
        await audioEngine.seekTo(posToPlay);
      }
    } else {
      // Nếu trước đó đang pause -> Giữ trạng thái pause đúng trên mobile (icon play, không để icon pause ảo)
      usePlayerStore.setState({
        currentSong: songToPlay,
        queue: queueToPlay,
        positionMs: posToPlay,
        isPlaying: false,
        isLoading: false,
      });
    }
  } else {
    usePlayerStore.setState({ isPlaying: false, isLoading: false });
  }

  useToastStore.getState().showToast('Mất kết nối với Máy tính · Đã chuyển về Điện thoại', 'info');
};

export const useConnectStore = create<ConnectState>((set, get) => ({
  availableDevices: [THIS_DEVICE],
  activeDevice: THIS_DEVICE,
  newlyDiscoveredDevice: null,
  isConnectModalVisible: false,
  volume: 0.8,
  isInitialized: false,
  isSubscribed: false,
  remotePlayback: null,

  clearNewlyDiscoveredDevice: () => set({ newlyDiscoveredDevice: null }),

  initConnect: () => {
    if (realtimeChannel) return;

    try {
      realtimeChannel = supabase.channel('tempo_connect_channel', {
        config: { broadcast: { self: false } },
      });

      realtimeChannel
        .on('broadcast', { event: 'device_presence' }, ({ payload }: { payload: ConnectedDevice }) => {
          if (!payload?.deviceId || payload.deviceId === THIS_DEVICE.deviceId) return;
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
        .on('broadcast', { event: 'device_offline' }, ({ payload }: { payload: { deviceId: string } }) => {
          if (!payload?.deviceId) return;
          handleRemoteDeviceLost(payload.deviceId, useConnectStore);
        })
        .on('broadcast', { event: 'device_presence_query' }, () => {
          safeBroadcast('device_presence', THIS_DEVICE);
        })
        .on('broadcast', { event: 'playback_state_query' }, () => {
          const { usePlayerStore } = require('./playerStore');
          const ps = usePlayerStore.getState();
          if (get().activeDevice.deviceId === THIS_DEVICE.deviceId && ps.currentSong) {
            get().broadcastLocalState(ps.currentSong, ps.isPlaying, ps.positionMs, ps.durationMs);
          }
        })
        .on('broadcast', { event: 'playback_state' }, ({ payload }: { payload: any }) => {
          if (!payload?.activeDeviceId) return;

          // Bỏ qua broadcast của chính mình
          if (payload.activeDeviceId === THIS_DEVICE.deviceId) return;

          const remoteDevice: ConnectedDevice = {
            deviceId: payload.activeDeviceId,
            deviceName: payload.activeDeviceName || 'Web Player (PC)',
            type: 'web',
            isOnline: true,
            isPlaying: Boolean(payload.isPlaying),
            currentSong: payload.currentSong,
            lastSeen: Date.now(),
          };

          const now = Date.now();
          const shouldUpdateVolume = typeof payload.volume === 'number' && (now - lastUserVolumeChangeTime > 3000);
          const shouldUpdateIsPlaying = (now - lastUserPlayPauseChangeTime > 2500);
          const shouldUpdatePosition = (now - lastUserSeekChangeTime > 2500);
          const currentRemote = get().remotePlayback;

          // Lưu riêng biệt vào remotePlayback — TUYỆT ĐỐI KHÔNG GHI ĐÈ playerStore CỦA MOBILE
          set({
            ...(shouldUpdateVolume ? { volume: payload.volume } : {}),
            remotePlayback: {
              deviceId: payload.activeDeviceId,
              deviceName: payload.activeDeviceName || 'Web Player (PC)',
              currentSong: payload.currentSong || null,
              queue: payload.queue || [],
              isPlaying: shouldUpdateIsPlaying ? Boolean(payload.isPlaying) : (currentRemote?.isPlaying ?? Boolean(payload.isPlaying)),
              positionMs: shouldUpdatePosition ? (payload.positionMs || 0) : (currentRemote?.positionMs ?? 0),
              durationMs: payload.durationMs || (payload.currentSong?.duration ? payload.currentSong.duration * 1000 : 0),
            },
          });

          const devices = get().availableDevices;
          const exists = devices.some((d) => d.deviceId === remoteDevice.deviceId);
          set({
            availableDevices: exists
              ? devices.map((d) => (d.deviceId === remoteDevice.deviceId ? remoteDevice : d))
              : [...devices, remoteDevice],
          });
        })
        .on('broadcast', { event: 'command' }, async ({ payload }: { payload: any }) => {
          if (!payload) return;

          // Bỏ qua nếu lệnh không dành cho thiết bị này
          if (!isTargetedToThisDevice(payload)) return;

          const { command, data = {} } = payload;
          const { usePlayerStore } = require('./playerStore');
          const ps = usePlayerStore.getState();

          switch (command) {
            case 'next':
              await ps.playNext();
              break;

            case 'prev':
              await ps.playPrev();
              break;

            case 'toggle_play_pause':
              await ps.togglePlayPause();
              break;

            case 'pause':
              await audioEngine.stopAndUnload();
              usePlayerStore.setState({ isPlaying: false });
              break;

            case 'transfer_playback':
              if (!data?.song) return;
              await audioEngine.stopAndUnload();
              usePlayerStore.setState({
                currentSong: data.song,
                queue: data.queue || [data.song],
                isPlaying: true,
                positionMs: data.positionMs || 0,
                durationMs: data.song.duration ? data.song.duration * 1000 : 0,
              });
              await audioEngine.loadAndPlay(data.song);
              if (data.positionMs > 0) {
                await audioEngine.seekTo(data.positionMs);
              }
              break;

            case 'play_track':
              if (!data?.song) return;
              await audioEngine.stopAndUnload();
              usePlayerStore.setState({
                currentSong: data.song,
                queue: data.queue || [data.song],
                isPlaying: true,
                positionMs: data.positionMs || 0,
                durationMs: data.song.duration ? data.song.duration * 1000 : 0,
              });
              await audioEngine.loadAndPlay(data.song);
              if (data.positionMs > 0) {
                await audioEngine.seekTo(data.positionMs);
              }
              break;
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            set({ isInitialized: true, isSubscribed: true });
            safeBroadcast('device_presence', THIS_DEVICE);
            safeBroadcast('device_presence_query', {});
            safeBroadcast('playback_state_query', {});

            setTimeout(() => {
              try {
                const { usePlayerStore } = require('./playerStore');

                usePlayerStore.subscribe(
                  (state: any, prevState: any) => {
                    const { currentSong, isPlaying, positionMs, durationMs } = state;
                    const connectState = get();
                    if (connectState.activeDevice.deviceId !== THIS_DEVICE.deviceId) return;
                    if (!currentSong) return;
                    if (prevState.currentSong?.id !== currentSong.id || prevState.isPlaying !== isPlaying) {
                      connectState.broadcastLocalState(currentSong, isPlaying, positionMs, durationMs);
                    }
                  }
                );

                // Heartbeat position mỗi 2 giây khi đang phát trên Điện thoại
                setInterval(() => {
                  try {
                    const { usePlayerStore: ps } = require('./playerStore');
                    const { currentSong, isPlaying, positionMs, durationMs } = ps.getState();
                    const connectState = get();
                    if (connectState.activeDevice.deviceId !== THIS_DEVICE.deviceId) return;
                    if (currentSong && isPlaying) {
                      connectState.broadcastLocalState(currentSong, isPlaying, positionMs, durationMs);
                    }
                  } catch (_) {}
                }, 2000);

                // Lắng nghe AppState khi người dùng mở lại app từ Background
                if (!isAppStateListenerAttached) {
                  isAppStateListenerAttached = true;
                  AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
                    if (nextAppState === 'active') {
                      lastResumeTime = Date.now();
                      // Re-query ngay lập tức từ PC Web Player
                      safeBroadcast('device_presence', THIS_DEVICE);
                      safeBroadcast('device_presence_query', {});
                      safeBroadcast('playback_state_query', {});
                    }
                  });
                }

                // Tự động dọn dẹp thiết bị offline (> 18s, có grace period 8s khi vừa mở lại app)
                setInterval(() => {
                  const now = Date.now();
                  // Nếu app vừa thức dậy từ background chưa đầy 8 giây, bỏ qua để đợi phản hồi từ PC
                  if (now - lastResumeTime < 8000) return;

                  const valid = get().availableDevices.filter((d) => {
                    if (d.deviceId === THIS_DEVICE.deviceId) return true;
                    return d.lastSeen && now - d.lastSeen < 18000;
                  });
                  if (valid.length !== get().availableDevices.length) {
                    set({ availableDevices: valid });
                    const curActive = get().activeDevice;
                    if (curActive.deviceId !== THIS_DEVICE.deviceId && !valid.some((d) => d.deviceId === curActive.deviceId)) {
                      set({ activeDevice: THIS_DEVICE, remotePlayback: null });
                      useToastStore.getState().showToast('Mất kết nối với máy tính, chuyển về điện thoại', 'info');
                    }
                  }
                }, 4000);
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
    const previousDevice = get().activeDevice;

    // Nếu thiết bị được chọn đã và đang là activeDevice -> Chỉ đóng modal và KHÔNG làm gì cả
    if (previousDevice.deviceId === device.deviceId) {
      set({ isConnectModalVisible: false });
      return;
    }

    const { usePlayerStore } = require('./playerStore');
    const playerState = usePlayerStore.getState();

    // ==========================================
    // 1. CHUYỂN MOBILE → PC (Web Player)
    // ==========================================
    if (device.type === 'web' || device.deviceId !== THIS_DEVICE.deviceId) {
      // Khi chuyển từ Mobile sang PC: BẮT BUỘC LẤY BÀI ĐANG PHÁT TRÊN MOBILE (playerState)
      const songToTransfer = playerState.currentSong;
      const posToTransfer = playerState.positionMs;
      const queueToTransfer = playerState.queue;

      // Mobile dừng audio thật
      await audioEngine.stopAndUnload();
      usePlayerStore.setState({ isPlaying: false });

      set({
        activeDevice: device,
        isConnectModalVisible: false,
        remotePlayback: songToTransfer ? {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          currentSong: songToTransfer,
          queue: queueToTransfer,
          isPlaying: true,
          positionMs: posToTransfer,
          durationMs: songToTransfer.duration ? songToTransfer.duration * 1000 : 0,
        } : null,
      });

      if (songToTransfer) {
        safeBroadcast('command', {
          command: 'transfer_playback',
          targetDeviceId: device.deviceId,
          data: {
            song: songToTransfer,
            queue: queueToTransfer,
            positionMs: posToTransfer,
          },
        });
      }

      useToastStore.getState().showToast(`Đang nghe trên ${device.deviceName}`, 'info');
      return;
    }

    // ==========================================
    // 2. CHUYỂN PC → MOBILE
    // ==========================================
    const songFromPC = get().remotePlayback?.currentSong || playerState.currentSong;
    const posFromPC = get().remotePlayback?.positionMs ?? playerState.positionMs;
    const queueFromPC = get().remotePlayback?.queue?.length ? get().remotePlayback!.queue : playerState.queue;

    set({
      activeDevice: THIS_DEVICE,
      remotePlayback: null,
      isConnectModalVisible: false,
    });

    // Gửi lệnh dừng nhắm đúng target là PC trước đó
    if (previousDevice.deviceId !== THIS_DEVICE.deviceId) {
      safeBroadcast('command', {
        command: 'pause',
        targetDeviceId: previousDevice.deviceId,
      });
    }

    if (songFromPC) {
      usePlayerStore.setState({
        currentSong: songFromPC,
        queue: queueFromPC,
        positionMs: posFromPC,
        isPlaying: true,
        isLoading: true,
      });
      const success = await audioEngine.loadAndPlay(songFromPC);
      usePlayerStore.setState({ isLoading: false, isPlaying: success });
      if (posFromPC > 0) {
        await audioEngine.seekTo(posFromPC);
      }
    }

    useToastStore.getState().showToast('Đang phát qua Điện thoại này', 'info');
  },

  setVolume: (volume: number) => {
    lastUserVolumeChangeTime = Date.now();
    set({ volume });
    get().sendRemoteCommand('set_volume', { volume });
  },

  sendRemoteCommand: (command: string, data?: any) => {
    const activeDevice = get().activeDevice;
    if (!activeDevice || activeDevice.deviceId === THIS_DEVICE.deviceId) return;
    safeBroadcast('command', {
      command,
      targetDeviceId: activeDevice.deviceId,
      data,
    });
  },

  broadcastLocalState: (song, isPlaying, positionMs, durationMs) => {
    if (get().activeDevice.deviceId !== THIS_DEVICE.deviceId) return;
    const { usePlayerStore } = require('./playerStore');
    const ps = usePlayerStore.getState();

    safeBroadcast('playback_state', {
      activeDeviceId: THIS_DEVICE.deviceId,
      activeDeviceName: THIS_DEVICE.deviceName,
      isPlaying,
      positionMs,
      durationMs,
      currentSong: song,
      queue: ps.queue,
    });
  },

  ensureActiveDeviceOrFallback: async () => {
    const active = get().activeDevice;
    if (!active || active.deviceId === THIS_DEVICE.deviceId) return true;

    // Kiểm tra xem thiết bị có còn trong danh sách và phản hồi trong 12s không
    const found = get().availableDevices.find((d) => d.deviceId === active.deviceId);
    const isAlive = found && found.isOnline && (!found.lastSeen || Date.now() - found.lastSeen < 12000);

    if (!isAlive) {
      await handleRemoteDeviceLost(active.deviceId, useConnectStore);
      return false;
    }

    // Thiết bị còn sống -> Gửi ping duy trì kết nối
    safeBroadcast('device_presence_query', {});
    return true;
  },
}));

/**
 * useActivePlayback - Hook duy nhất để UI (MiniPlayer, FullPlayer, v.v.)
 * tiêu thụ thông tin phát nhạc độc quyền mà không cần quan tâm là Local hay Remote.
 */
export const useActivePlayback = (withProgress = false) => {
  const activeDevice = useConnectStore((s) => s.activeDevice);
  const remotePlayback = useConnectStore((s) => s.remotePlayback);
  const isRemote = activeDevice.deviceId !== THIS_DEVICE.deviceId;

  const { usePlayerStore } = require('./playerStore');
  const localCurrentSong = usePlayerStore((s: any) => s.currentSong);
  const localIsPlaying = usePlayerStore((s: any) => s.isPlaying);
  const localPositionMs = usePlayerStore((s: any) => (withProgress ? s.positionMs : 0));
  const localDurationMs = usePlayerStore((s: any) => (withProgress ? s.durationMs : 0));
  const localQueue = usePlayerStore((s: any) => s.queue);
  const localIsLoading = usePlayerStore((s: any) => s.isLoading);

  const song = isRemote ? (remotePlayback?.currentSong || localCurrentSong) : localCurrentSong;
  const isPlaying = isRemote ? Boolean(remotePlayback?.isPlaying) : localIsPlaying;
  const positionMs = isRemote ? (remotePlayback?.positionMs || 0) : localPositionMs;
  const durationMs = isRemote
    ? (remotePlayback?.durationMs || (song?.duration ? song.duration * 1000 : 0))
    : localDurationMs;
  const queue = isRemote ? (remotePlayback?.queue?.length ? remotePlayback.queue : localQueue) : localQueue;
  const isLoading = isRemote ? false : localIsLoading;

  const togglePlayPause = async () => {
    if (isRemote) {
      const isStillRemote = await useConnectStore.getState().ensureActiveDeviceOrFallback();
      if (isStillRemote) {
        // Cập nhật Optimistic tức thì 0ms trên Mobile
        const curRemote = useConnectStore.getState().remotePlayback;
        if (curRemote) {
          useConnectStore.setState({
            remotePlayback: {
              ...curRemote,
              isPlaying: !curRemote.isPlaying,
            },
          });
        }
        lastUserPlayPauseChangeTime = Date.now();
        useConnectStore.getState().sendRemoteCommand('toggle_play_pause');
        return;
      }
    }
    await usePlayerStore.getState().togglePlayPause();
  };

  const playNext = async () => {
    if (isRemote) {
      const isStillRemote = await useConnectStore.getState().ensureActiveDeviceOrFallback();
      if (isStillRemote) {
        useConnectStore.getState().sendRemoteCommand('next');
        return;
      }
    }
    await usePlayerStore.getState().playNext();
  };

  const playPrev = async () => {
    if (isRemote) {
      const isStillRemote = await useConnectStore.getState().ensureActiveDeviceOrFallback();
      if (isStillRemote) {
        useConnectStore.getState().sendRemoteCommand('prev');
        return;
      }
    }
    await usePlayerStore.getState().playPrev();
  };

  const seekTo = async (posMs: number) => {
    if (isRemote) {
      const isStillRemote = await useConnectStore.getState().ensureActiveDeviceOrFallback();
      if (isStillRemote) {
        const curRemote = useConnectStore.getState().remotePlayback;
        if (curRemote) {
          useConnectStore.setState({
            remotePlayback: {
              ...curRemote,
              positionMs: posMs,
            },
          });
        }
        lastUserSeekChangeTime = Date.now();
        useConnectStore.getState().sendRemoteCommand('seek', { positionMs: posMs });
        return;
      }
    }
    await usePlayerStore.getState().seekTo(posMs);
  };

  return {
    isRemote,
    song,
    isPlaying,
    positionMs,
    durationMs,
    queue,
    isLoading,
    device: isRemote ? activeDevice : THIS_DEVICE,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
  };
};
