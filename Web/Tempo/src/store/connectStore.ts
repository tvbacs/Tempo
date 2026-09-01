import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { usePlayerStore } from './playerStore';

interface ConnectState {
  isOnline: boolean;
  activeDeviceId: string;
  activeDeviceName: string;
  initConnect: () => void;
  broadcastPresence: () => void;
  broadcastState: () => void;
  sendCommand: (command: string, data?: any) => void;
  requestTransferPlayback: () => void;
  transferPlaybackToMobile: () => void;
}

const DEVICE_ID = 'web-player-pc';
const DEVICE_NAME = 'Máy tính (PC)';
let realtimeChannel: any = null;

const isTargetedToThisDevice = (payload: any) => {
  const targetDeviceId = payload?.targetDeviceId ?? payload?.data?.targetDeviceId;
  if (!targetDeviceId) return true;
  return targetDeviceId === DEVICE_ID;
};

export const useConnectStore = create<ConnectState>((set, get) => ({
  isOnline: false,
  activeDeviceId: DEVICE_ID,
  activeDeviceName: DEVICE_NAME,

  initConnect: () => {
    if (realtimeChannel) return;

    realtimeChannel = supabase.channel('tempo_connect_channel', {
      config: { broadcast: { self: false } },
    });

    realtimeChannel
      .on('broadcast', { event: 'device_presence_query' }, () => {
        get().broadcastPresence();
      })
      .on('broadcast', { event: 'command' }, ({ payload }: { payload: any }) => {
        if (!payload) return;
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
      .on('broadcast', { event: 'device_presence_query' }, () => {
        get().broadcastPresence();
        if (get().activeDeviceId === DEVICE_ID) {
          get().broadcastState();
        }
      })
      .on('broadcast', { event: 'playback_state_query' }, () => {
        get().broadcastPresence();
        if (get().activeDeviceId === DEVICE_ID) {
          get().broadcastState();
        }
      })
      .on('broadcast', { event: 'playback_state' }, ({ payload }: { payload: any }) => {
        if (!payload) return;

        // Bỏ qua nếu là state của chính PC
        if (!payload.activeDeviceId || payload.activeDeviceId === DEVICE_ID) return;

        // Điện thoại đang phát → PC nhường ngay
        const cleanDeviceName = (payload.activeDeviceName || 'Điện thoại').replace(/ này/g, '').trim();
        set({
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

          // Hỏi xem thiết bị nào đang phát — đợi 1.5s để nhận phản hồi
          // Nếu không ai trả lời (mobile offline), PC mới broadcast state của mình
          if (realtimeChannel && realtimeChannel.state === 'joined') {
            try {
              realtimeChannel.send({
                type: 'broadcast',
                event: 'playback_state_query',
                payload: {},
              });
            } catch (_) {}
          }

          setTimeout(() => {
            // Chỉ broadcast nếu sau 1.5s vẫn là active device (mobile chưa trả lời)
            if (get().activeDeviceId === DEVICE_ID) {
              get().broadcastState();
            }
          }, 1500);

          // Gửi tín hiệu offline ngay khi người dùng đóng tab, reload hoặc tắt trình duyệt
          const notifyOffline = () => {
            if (realtimeChannel && realtimeChannel.state === 'joined') {
              try {
                realtimeChannel.send({
                  type: 'broadcast',
                  event: 'device_offline',
                  payload: { deviceId: DEVICE_ID },
                });
              } catch (_) {}
            }
          };

          window.addEventListener('beforeunload', notifyOffline);
          window.addEventListener('pagehide', notifyOffline);
        }
      });

    setInterval(() => get().broadcastPresence(), 8000);

    // Heartbeat phát nhạc sang điện thoại mỗi 2s khi đang phát trên PC
    setInterval(() => {
      const ps = usePlayerStore.getState();
      if (ps.currentSong && ps.isPlaying && get().activeDeviceId === DEVICE_ID) {
        get().broadcastState();
      }
    }, 2000);
  },

  broadcastPresence: () => {
    if (!realtimeChannel || realtimeChannel.state !== 'joined') return;
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
        },
      });
    } catch (_) {}
  },

  broadcastState: () => {
    if (!realtimeChannel || realtimeChannel.state !== 'joined') return;
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
        },
      });
    } catch (_) {}
  },

  sendCommand: (command: string, data?: any) => {
    if (!realtimeChannel || realtimeChannel.state !== 'joined') return;
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'command',
        payload: { command, data },
      });
    } catch (_) {}
  },

  requestTransferPlayback: () => {
    if (get().activeDeviceId === DEVICE_ID) return; // Đã đang active trên Web -> Không làm gì cả
    if (!realtimeChannel) return;
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
          payload: { command: 'pause', targetDeviceId: 'mobile-app' },
        });
      } catch (_) {}
    }
  },

  transferPlaybackToMobile: () => {
    if (get().activeDeviceId !== DEVICE_ID) return; // Đã đang active trên Mobile -> Không làm gì cả
    if (!realtimeChannel) return;
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
