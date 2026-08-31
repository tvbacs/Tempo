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
  requestTransferPlayback: () => void;
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
          if (data?.song) {
            ps.playSong(data.song, undefined, (data.positionMs || 0) / 1000);
          }
        }
        if (command === 'pause') {
          ps.audioElement?.pause();
        }
        if (command === 'resume') {
          ps.audioElement?.play();
        }
        if (command === 'seek' && typeof data?.positionMs === 'number') {
          ps.seekTo(data.positionMs / 1000);
        }
        if (command === 'set_volume' && typeof data?.volume === 'number') {
          ps.setVolume(data.volume);
        }
      })
      .on('broadcast', { event: 'playback_state' }, ({ payload }: { payload: any }) => {
        if (payload.activeDeviceId && payload.activeDeviceId !== DEVICE_ID) {
          set({
            activeDeviceId: payload.activeDeviceId,
            activeDeviceName: payload.activeDeviceName || 'Điện thoại',
          });
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          set({ isOnline: true });
          get().broadcastPresence();
        }
      });

    setInterval(() => get().broadcastPresence(), 10000);
  },

  broadcastPresence: () => {
    if (!realtimeChannel) return;
    const ps = usePlayerStore.getState();
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
  },

  broadcastState: () => {
    if (!realtimeChannel) return;
    const ps = usePlayerStore.getState();
    realtimeChannel.send({
      type: 'broadcast',
      event: 'playback_state',
      payload: {
        activeDeviceId: DEVICE_ID,
        activeDeviceName: DEVICE_NAME,
        isPlaying: ps.isPlaying,
        positionMs: Math.floor(ps.positionSec * 1000),
        durationMs: Math.floor(ps.durationSec * 1000),
        currentSong: ps.currentSong,
        volume: ps.volume,
      },
    });
  },

  requestTransferPlayback: () => {
    if (!realtimeChannel) return;
    realtimeChannel.send({
      type: 'broadcast',
      event: 'command',
      payload: {
        command: 'transfer_playback',
        data: { targetDeviceId: DEVICE_ID },
      },
    });
  },
}));
