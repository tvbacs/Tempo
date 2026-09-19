import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { usePlayerStore } from './playerStore';
import { useAuthStore } from './authStore';

interface ConnectState {
  isOnline: boolean;
  isMobileOnline: boolean;
  activeDeviceId: string;
  activeDeviceName: string;
  initConnect: () => void;
  syncUserConnect: (userId: string | null) => void;
  broadcastPresence: () => void;
  broadcastState: () => void;
  sendCommand: (command: string, data?: any) => void;
  requestTransferPlayback: () => void;
  transferPlaybackToMobile: () => void;
}

const DEVICE_ID = 'web-player-pc';
const DEVICE_NAME = 'Máy tính (PC)';
let realtimeChannel: any = null;
let currentUserId: string | null = null;
let mobileLastSeen = 0;
let isAuthSubscribed = false;
let presenceInterval: any = null;
let healthCheckInterval: any = null;
let heartbeatInterval: any = null;

const isTargetedToThisDevice = (payload: any) => {
  const targetDeviceId = payload?.targetDeviceId ?? payload?.data?.targetDeviceId;
  if (!targetDeviceId) return true;
  return targetDeviceId === DEVICE_ID;
};

export const useConnectStore = create<ConnectState>((set, get) => ({
  isOnline: false,
  isMobileOnline: false,
  activeDeviceId: DEVICE_ID,
  activeDeviceName: DEVICE_NAME,

  initConnect: () => {
    // 1. Subscribe to auth store changes if not already attached
    if (!isAuthSubscribed) {
      isAuthSubscribed = true;
      useAuthStore.subscribe((state) => {
        const uid = state.user?.id || null;
        if (uid !== currentUserId) {
          get().syncUserConnect(uid);
        }
      });
    }

    // 2. Initial sync with current user or session
    const currentAuthUser = useAuthStore.getState().user;
    if (currentAuthUser?.id) {
      get().syncUserConnect(currentAuthUser.id);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        const uid = data?.session?.user?.id || null;
        get().syncUserConnect(uid);
      }).catch(() => {
        get().syncUserConnect(null);
      });
    }
  },

  syncUserConnect: (userId: string | null) => {
    // If same user and channel is active, do nothing
    if (userId === currentUserId && realtimeChannel) return;

    // 1. Cleanup old channel if exists
    if (realtimeChannel) {
      try {
        if (realtimeChannel.state === 'joined' && currentUserId) {
          realtimeChannel.send({
            type: 'broadcast',
            event: 'device_offline',
            payload: { deviceId: DEVICE_ID, userId: currentUserId },
          });
        }
        supabase.removeChannel(realtimeChannel);
      } catch (_) {}
      realtimeChannel = null;
    }

    if (presenceInterval) { clearInterval(presenceInterval); presenceInterval = null; }
    if (healthCheckInterval) { clearInterval(healthCheckInterval); healthCheckInterval = null; }
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }

    currentUserId = userId;
    mobileLastSeen = 0;

    // 2. If no user is logged in, reset connect state and do not join any channel
    if (!userId) {
      set({
        isOnline: false,
        isMobileOnline: false,
        activeDeviceId: DEVICE_ID,
        activeDeviceName: DEVICE_NAME,
      });
      return;
    }

    // 3. Connect to user-scoped channel: tempo_connect_${userId}
    const channelName = `tempo_connect_${userId}`;
    realtimeChannel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    realtimeChannel
      .on('broadcast', { event: 'device_presence' }, ({ payload }: { payload: any }) => {
        if (payload?.userId && payload.userId !== currentUserId) return;
        if (!payload?.deviceId || payload.deviceId === DEVICE_ID) return;
        mobileLastSeen = Date.now();
        set({
          isMobileOnline: true,
          ...(get().activeDeviceId !== DEVICE_ID ? { activeDeviceName: payload.deviceName || 'Điện thoại' } : {}),
        });
      })
      .on('broadcast', { event: 'device_offline' }, ({ payload }: { payload: any }) => {
        if (payload?.userId && payload.userId !== currentUserId) return;
        if (!payload?.deviceId || payload.deviceId === DEVICE_ID) return;
        mobileLastSeen = 0;
        set({
          isMobileOnline: false,
          activeDeviceId: DEVICE_ID,
          activeDeviceName: DEVICE_NAME,
        });
      })
      .on('broadcast', { event: 'device_presence_query' }, ({ payload }: { payload: any }) => {
        if (payload?.userId && payload.userId !== currentUserId) return;
        get().broadcastPresence();
      })
      .on('broadcast', { event: 'command' }, ({ payload }: { payload: any }) => {
        if (!payload) return;
        if (payload.userId && payload.userId !== currentUserId) return;
        if (!isTargetedToThisDevice(payload)) return;

        const { command, data = {} } = payload;
        const ps = usePlayerStore.getState();

        if (command === 'transfer_playback') {
          set({ activeDeviceId: DEVICE_ID, activeDeviceName: DEVICE_NAME });
          if (data?.song) {
            ps.playSong(data.song, data.queue, (data.positionMs || 0) / 1000);
          } else if (ps.currentSong) {
            ps.audioElement?.play().catch(() => {});
          }
          return;
        }

        if (command === 'play_track' && data?.song) {
          set({ activeDeviceId: DEVICE_ID, activeDeviceName: DEVICE_NAME });
          ps.playSong(data.song, data.queue, (data.positionMs || 0) / 1000);
          return;
        }

        if (command === 'toggle_play_pause') {
          ps.togglePlayPause();
          get().broadcastState();
          return;
        }

        if (command === 'next') {
          ps.playNext();
          get().broadcastState();
          return;
        }

        if (command === 'prev') {
          ps.playPrev();
          get().broadcastState();
          return;
        }

        if (command === 'pause') {
          ps.audioElement?.pause();
          usePlayerStore.setState({ isPlaying: false });
          set({ activeDeviceId: 'mobile-app', activeDeviceName: 'Điện thoại' });
          get().broadcastState();
          return;
        }

        if (command === 'set_shuffle' && typeof data?.isShuffle === 'boolean') {
          ps.setShuffle(data.isShuffle);
          get().broadcastState();
          return;
        }

        if (command === 'set_repeat') {
          ps.setRepeat(data?.repeatMode === 'all' || data?.repeatMode === 'one' || data?.isRepeat === true);
          get().broadcastState();
          return;
        }

        if (command === 'resume') {
          ps.audioElement?.play().catch(() => {});
          get().broadcastState();
          return;
        }

        if (command === 'seek' && typeof data?.positionMs === 'number') {
          ps.seekTo(data.positionMs / 1000);
          get().broadcastState();
          return;
        }

        if (command === 'set_volume' && typeof data?.volume === 'number') {
          ps.setVolume(data.volume);
          get().broadcastState();
          return;
        }
      })
      .on('broadcast', { event: 'playback_state_query' }, ({ payload }: { payload: any }) => {
        if (payload?.userId && payload.userId !== currentUserId) return;
        get().broadcastPresence();
        if (get().activeDeviceId === DEVICE_ID) {
          get().broadcastState();
        }
      })
      .on('broadcast', { event: 'playback_state' }, ({ payload }: { payload: any }) => {
        if (!payload) return;
        if (payload.userId && payload.userId !== currentUserId) return;

        // Bỏ qua nếu là state của chính PC
        if (!payload.activeDeviceId || payload.activeDeviceId === DEVICE_ID) return;

        mobileLastSeen = Date.now();
        // Điện thoại đang phát -> PC nhường ngay
        const cleanDeviceName = (payload.activeDeviceName || 'Điện thoại').replace(/ này/g, '').trim();
        set({
          isMobileOnline: true,
          activeDeviceId: payload.activeDeviceId,
          activeDeviceName: cleanDeviceName || 'Điện thoại',
        });

        const ps = usePlayerStore.getState();
        // Dừng audio local nếu PC đang phát
        if (ps.audioElement && !ps.audioElement.paused) {
          ps.audioElement.pause();
        }

        // Cập nhật giao diện Web theo điện thoại (chỉ UI, không play audio)
        if (payload.currentSong) {
          usePlayerStore.setState({
            currentSong: payload.currentSong,
            isPlaying: payload.isPlaying,
            positionSec: (payload.positionMs || 0) / 1000,
            durationSec: (payload.durationMs || 0) / 1000,
          });
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          set({ isOnline: true });
          get().broadcastPresence();

          // Hỏi xem thiết bị nào đang phát / online
          if (realtimeChannel && realtimeChannel.state === 'joined') {
            try {
              realtimeChannel.send({
                type: 'broadcast',
                event: 'device_presence_query',
                payload: { userId: currentUserId },
              });
              realtimeChannel.send({
                type: 'broadcast',
                event: 'playback_state_query',
                payload: { userId: currentUserId },
              });
            } catch (_) {}
          }

          setTimeout(() => {
            if (get().activeDeviceId === DEVICE_ID) {
              get().broadcastState();
            }
          }, 1500);

          const notifyOffline = () => {
            if (realtimeChannel && realtimeChannel.state === 'joined' && currentUserId) {
              try {
                realtimeChannel.send({
                  type: 'broadcast',
                  event: 'device_offline',
                  payload: { deviceId: DEVICE_ID, userId: currentUserId },
                });
              } catch (_) {}
            }
          };

          window.addEventListener('beforeunload', notifyOffline);
          window.addEventListener('pagehide', notifyOffline);
        }
      });

    presenceInterval = setInterval(() => get().broadcastPresence(), 8000);

    // Kiểm tra điện thoại có còn online không (timeout 16s)
    healthCheckInterval = setInterval(() => {
      if (mobileLastSeen > 0 && Date.now() - mobileLastSeen > 16000) {
        if (get().isMobileOnline) {
          set({ isMobileOnline: false });
          if (get().activeDeviceId !== DEVICE_ID) {
            set({ activeDeviceId: DEVICE_ID, activeDeviceName: DEVICE_NAME });
          }
        }
      }
    }, 4000);

    // Heartbeat phát nhạc sang điện thoại mỗi 2s khi đang phát trên PC
    heartbeatInterval = setInterval(() => {
      const ps = usePlayerStore.getState();
      if (ps.currentSong && ps.isPlaying && get().activeDeviceId === DEVICE_ID) {
        get().broadcastState();
      }
    }, 2000);
  },

  broadcastPresence: () => {
    if (!realtimeChannel || realtimeChannel.state !== 'joined' || !currentUserId) return;
    const ps = usePlayerStore.getState();
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'device_presence',
        payload: {
          deviceId: DEVICE_ID,
          deviceName: DEVICE_NAME,
          type: 'web',
          isOnline: true,
          isPlaying: ps.isPlaying,
          currentSong: ps.currentSong,
          volume: ps.volume,
          userId: currentUserId,
        },
      });
    } catch (_) {}
  },

  broadcastState: () => {
    if (!realtimeChannel || realtimeChannel.state !== 'joined' || !currentUserId) return;
    const ps = usePlayerStore.getState();
    const isLocalActive = get().activeDeviceId === DEVICE_ID;
    if (!isLocalActive) return;

    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'playback_state',
        payload: {
          activeDeviceId: DEVICE_ID,
          activeDeviceName: DEVICE_NAME,
          isPlaying: ps.isPlaying,
          positionMs: Math.floor((ps.positionSec || 0) * 1000),
          durationMs: Math.floor((ps.durationSec || ps.currentSong?.duration || 0) * 1000),
          currentSong: ps.currentSong,
          queue: ps.queue,
          volume: ps.volume,
          userId: currentUserId,
        },
      });
    } catch (_) {}
  },

  sendCommand: (command: string, data?: any) => {
    if (!realtimeChannel || realtimeChannel.state !== 'joined' || !currentUserId) return;
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'command',
        payload: { command, data, userId: currentUserId },
      });
    } catch (_) {}
  },

  requestTransferPlayback: () => {
    if (get().activeDeviceId === DEVICE_ID) return; // Đã đang active trên Web -> Không làm gì cả
    if (!realtimeChannel || !currentUserId) return;
    const ps = usePlayerStore.getState();
    set({ activeDeviceId: DEVICE_ID, activeDeviceName: DEVICE_NAME });

    if (ps.currentSong) {
      ps.playSong(ps.currentSong, ps.queue, ps.positionSec);
    }

    if (realtimeChannel.state === 'joined') {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'command',
          payload: { command: 'pause', targetDeviceId: 'mobile-app', userId: currentUserId },
        });
      } catch (_) {}
    }
  },

  transferPlaybackToMobile: () => {
    if (get().activeDeviceId !== DEVICE_ID) return; // Đã đang active trên Mobile -> Không làm gì cả
    if (!realtimeChannel || !currentUserId) return;
    const ps = usePlayerStore.getState();
    if (ps.audioElement) {
      ps.audioElement.pause();
    }
    set({ activeDeviceId: 'mobile-app', activeDeviceName: 'Điện thoại' });
    usePlayerStore.setState({ isPlaying: false });

    if (realtimeChannel.state === 'joined') {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'command',
          payload: {
            command: 'transfer_playback',
            targetDeviceId: 'mobile-app',
            userId: currentUserId,
            data: {
              song: ps.currentSong,
              queue: ps.queue,
              positionMs: Math.floor((ps.positionSec || 0) * 1000),
            },
          },
        });
      } catch (_) {}
    }
  },
}));
