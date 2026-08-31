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
const DEVICE_NAME = 'Web Player (PC)';
let realtimeChannel: any = null;

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
        const { command, data } = payload;
        const ps = usePlayerStore.getState();

        if (command === 'transfer_playback' && (data?.targetDeviceId === DEVICE_ID || !data?.targetDeviceId)) {
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
          return;
        }

        if (command === 'next') {
          ps.playNext();
          return;
        }

        if (command === 'prev') {
          ps.playPrev();
          return;
        }

        if (command === 'pause') {
          ps.audioElement?.pause();
          return;
        }

        if (command === 'set_shuffle' && typeof data?.isShuffle === 'boolean') {
          ps.setShuffle(data.isShuffle);
          return;
        }

        if (command === 'set_repeat') {
          ps.setRepeat(data?.repeatMode === 'all' || data?.repeatMode === 'one' || data?.isRepeat === true);
          return;
        }

        if (command === 'resume') {
          ps.audioElement?.play().catch(() => {});
          return;
        }

        if (command === 'seek' && typeof data?.positionMs === 'number') {
          ps.seekTo(data.positionMs / 1000);
          return;
        }

        if (command === 'set_volume' && typeof data?.volume === 'number') {
          ps.setVolume(data.volume);
          return;
        }
      })
      .on('broadcast', { event: 'playback_state' }, ({ payload }: { payload: any }) => {
        if (!payload) return;

        // Nếu điện thoại đang phát
        if (payload.activeDeviceId && payload.activeDeviceId !== DEVICE_ID) {
          set({
            activeDeviceId: payload.activeDeviceId,
            activeDeviceName: payload.activeDeviceName || 'Điện thoại',
          });

          const ps = usePlayerStore.getState();
          // Dừng audio local nếu điện thoại đang phát
          if (ps.audioElement && !ps.audioElement.paused) {
            ps.audioElement.pause();
          }

          // Cập nhật giao diện Web theo điện thoại
          if (payload.currentSong) {
            usePlayerStore.setState({
              currentSong: payload.currentSong,
              isPlaying: payload.isPlaying,
              positionSec: (payload.positionMs || 0) / 1000,
              durationSec: (payload.durationMs || 0) / 1000,
            });
          }
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          set({ isOnline: true });
          get().broadcastPresence();
        }
      });

    setInterval(() => get().broadcastPresence(), 10000);

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
          payload: { command: 'pause' },
        });
      } catch (_) {}
    }
  },

  transferPlaybackToMobile: () => {
    if (!realtimeChannel) return;
    const ps = usePlayerStore.getState();
    if (ps.audioElement) {
      ps.audioElement.pause();
    }
    set({ activeDeviceId: 'mobile-app', activeDeviceName: 'Điện thoại' });
    usePlayerStore.setState({ isPlaying: true });

    if (realtimeChannel.state === 'joined') {
      try {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'command',
          payload: {
            command: 'transfer_to_mobile',
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
