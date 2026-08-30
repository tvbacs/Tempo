// Tempo Connect Web Player Client Engine
const SUPABASE_URL = 'https://lrtudzxzytqwhhiiszun.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7TDL7BAku8jkwBtYBfHT1A_yXSQ7o2F';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DEVICE_ID = 'web-player-pc';
const DEVICE_NAME = 'Web Player (PC)';

const audio = document.getElementById('audioElement');
const coverImg = document.getElementById('coverImg');
const miniCover = document.getElementById('miniCover');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');
const btnPlayPause = document.getElementById('btnPlayPause');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const progressTrack = document.getElementById('progressTrack');
const currentTimeLabel = document.getElementById('currentTime');
const totalDurationLabel = document.getElementById('totalDuration');
const volumeSlider = document.getElementById('volumeSlider');
const deviceStatus = document.getElementById('deviceStatus');
const deviceStatusText = document.getElementById('deviceStatusText');
const takeoverBtn = document.getElementById('takeoverBtn');
const lyricsContainer = document.getElementById('lyricsContainer');

let currentSong = null;
let isLocalPlaying = false;
let isSeeking = false;
let lyrics = [];

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// 1. Kết nối Supabase Realtime Broadcast Channel
const channel = supabase.channel('tempo_connect_channel', {
  config: { broadcast: { self: false } }
});

channel
  .on('broadcast', { event: 'device_presence_query' }, () => {
    broadcastPresence();
  })
  .on('broadcast', { event: 'command' }, ({ payload }) => {
    handleRemoteCommand(payload);
  })
  .on('broadcast', { event: 'playback_state' }, ({ payload }) => {
    handleRemoteState(payload);
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      deviceStatus.classList.add('online');
      deviceStatusText.textContent = '🟢 Đã kết nối Tempo Connect';
      broadcastPresence();
      console.log('[Tempo Connect] Web Player Online:', DEVICE_ID);
    }
  });

function broadcastPresence() {
  channel.send({
    type: 'broadcast',
    event: 'device_presence',
    payload: {
      deviceId: DEVICE_ID,
      deviceName: DEVICE_NAME,
      type: 'web',
      isOnline: true,
      isPlaying: !audio.paused && !!audio.src,
      currentSong: currentSong,
      volume: audio.volume,
    }
  });
}

// Gửi tín hiệu sống mỗi 10 giây
setInterval(broadcastPresence, 10000);

// 2. Xử lý lệnh từ điện thoại (Remote Commands)
async function handleRemoteCommand(payload) {
  console.log('[Remote Command Received]:', payload);
  const { command, data } = payload;

  if (command === 'transfer_playback' && data?.targetDeviceId === DEVICE_ID) {
    if (data.song) {
      playSongLocally(data.song, data.positionMs || 0);
    }
    return;
  }

  if (command === 'play_track' && data?.song) {
    playSongLocally(data.song, data.positionMs || 0);
    return;
  }

  if (command === 'pause') {
    audio.pause();
    updatePlayPauseUI(false);
    return;
  }

  if (command === 'resume') {
    audio.play().catch(() => {});
    updatePlayPauseUI(true);
    return;
  }

  if (command === 'seek' && typeof data?.positionMs === 'number') {
    audio.currentTime = data.positionMs / 1000;
    return;
  }

  if (command === 'set_volume' && typeof data?.volume === 'number') {
    audio.volume = Math.max(0, Math.min(1, data.volume));
    if (volumeSlider) volumeSlider.value = audio.volume;
    return;
  }
}

// 3. Xử lý khi điện thoại đang tự phát (Mirroring State UI)
function handleRemoteState(state) {
  if (state.activeDeviceId && state.activeDeviceId !== DEVICE_ID) {
    isLocalPlaying = false;
    if (!audio.paused) audio.pause();

    deviceStatus.classList.add('online');
    deviceStatusText.textContent = `📱 Đang nghe trên ${state.activeDeviceName || 'Điện thoại'}`;

    if (state.currentSong) {
      updateTrackMeta(state.currentSong);
    }

    updatePlayPauseUI(state.isPlaying);

    if (state.durationMs > 0 && !isSeeking) {
      const pct = (state.positionMs / state.durationMs) * 100;
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressHandle) progressHandle.style.left = `${pct}%`;
      if (currentTimeLabel) currentTimeLabel.textContent = formatTime(state.positionMs / 1000);
      if (totalDurationLabel) totalDurationLabel.textContent = formatTime(state.durationMs / 1000);
    }
  }
}

async function playSongLocally(song, startPosMs = 0) {
  currentSong = song;
  updateTrackMeta(song);
  loadLyrics(song.id);

  let streamUrl = song.audioUrl;
  if (!streamUrl || streamUrl.startsWith('file://')) {
    try {
      const encoded = encodeURIComponent;
      const res = await fetch(`/api/music/song/?title=${encoded(song.title)}&artist=${encoded(song.artistsNames || '')}`);
      const json = await res.json();
      streamUrl = json.data?.audioUrl;
    } catch (e) {
      console.error('Failed to resolve stream URL on Web Player:', e);
    }
  }

  if (streamUrl) {
    audio.src = streamUrl;
    audio.currentTime = startPosMs / 1000;
    audio.play().then(() => {
      isLocalPlaying = true;
      updatePlayPauseUI(true);
      deviceStatusText.textContent = '🔊 Đang phát qua Loa Máy Tính';
      broadcastState();
    }).catch(err => {
      console.warn('Audio play autoplay restricted, click to interact:', err);
      updatePlayPauseUI(false);
    });
  }
}

function updateTrackMeta(song) {
  if (trackTitle) trackTitle.textContent = song.title || 'Chưa có bài hát';
  if (trackArtist) trackArtist.textContent = song.artistsNames || 'Tempo Music';
  if (miniTitle) miniTitle.textContent = song.title || 'Chưa có bài hát';
  if (miniArtist) miniArtist.textContent = song.artistsNames || 'Tempo Music';

  const cover = song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';
  if (coverImg) coverImg.src = cover;
  if (miniCover) miniCover.src = cover;
}

function updatePlayPauseUI(isPlaying) {
  if (btnPlayPause) btnPlayPause.textContent = isPlaying ? '⏸' : '▶';
}

function broadcastState() {
  channel.send({
    type: 'broadcast',
    event: 'playback_state',
    payload: {
      activeDeviceId: DEVICE_ID,
      activeDeviceName: DEVICE_NAME,
      isPlaying: !audio.paused,
      positionMs: Math.floor(audio.currentTime * 1000),
      durationMs: Math.floor((audio.duration || 0) * 1000) || (currentSong?.duration ? currentSong.duration * 1000 : 0),
      currentSong: currentSong,
      volume: audio.volume,
    }
  });
}

// 4. Các sự kiện Audio Element
audio.addEventListener('timeupdate', () => {
  if (!isSeeking && audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressHandle) progressHandle.style.left = `${pct}%`;
    if (currentTimeLabel) currentTimeLabel.textContent = formatTime(audio.currentTime);
    if (totalDurationLabel) totalDurationLabel.textContent = formatTime(audio.duration);
    syncLyrics(audio.currentTime * 1000);
  }
});

audio.addEventListener('play', () => {
  updatePlayPauseUI(true);
  broadcastState();
});

audio.addEventListener('pause', () => {
  updatePlayPauseUI(false);
  broadcastState();
});

audio.addEventListener('ended', () => {
  channel.send({
    type: 'broadcast',
    event: 'command',
    payload: { command: 'next' }
  });
});

// 5. Điều khiển từ giao diện Web Player
if (btnPlayPause) {
  btnPlayPause.addEventListener('click', () => {
    if (audio.src && !audio.paused) {
      audio.pause();
    } else if (audio.src) {
      audio.play();
    } else {
      channel.send({
        type: 'broadcast',
        event: 'command',
        payload: { command: 'toggle_play_pause' }
      });
    }
  });
}

if (btnNext) {
  btnNext.addEventListener('click', () => {
    channel.send({ type: 'broadcast', event: 'command', payload: { command: 'next' } });
  });
}

if (btnPrev) {
  btnPrev.addEventListener('click', () => {
    channel.send({ type: 'broadcast', event: 'command', payload: { command: 'prev' } });
  });
}

if (volumeSlider) {
  volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
    broadcastState();
  });
}

if (progressTrack) {
  progressTrack.addEventListener('click', (e) => {
    const rect = progressTrack.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = pct * audio.duration;
      broadcastState();
    } else {
      const posMs = pct * (currentSong?.duration ? currentSong.duration * 1000 : 0);
      channel.send({
        type: 'broadcast',
        event: 'command',
        payload: { command: 'seek', data: { positionMs: posMs } }
      });
    }
  });
}

if (takeoverBtn) {
  takeoverBtn.addEventListener('click', () => {
    channel.send({
      type: 'broadcast',
      event: 'command',
      payload: { command: 'transfer_playback', data: { targetDeviceId: DEVICE_ID } }
    });
    deviceStatusText.textContent = '🔊 Đang yêu cầu phát qua Loa Máy Tính...';
  });
}

// 6. Lời bài hát (Lyrics)
async function loadLyrics(songId) {
  if (!lyricsContainer) return;
  lyricsContainer.innerHTML = '<p class="lyrics-placeholder">Đang tải lời bài hát...</p>';
  try {
    const res = await fetch(`/api/music/lyrics/${songId}`);
    const json = await res.json();
    if (json.success && json.data?.sentences?.length > 0) {
      lyrics = json.data.sentences;
      renderLyrics(lyrics);
    } else {
      lyricsContainer.innerHTML = '<p class="lyrics-placeholder">Chưa có lời bài hát cho bản nhạc này</p>';
    }
  } catch (e) {
    lyricsContainer.innerHTML = '<p class="lyrics-placeholder">Không thể tải lời bài hát</p>';
  }
}

function renderLyrics(sentences) {
  if (!lyricsContainer) return;
  lyricsContainer.innerHTML = sentences.map((s, idx) =>
    `<div class="lyric-line" data-idx="${idx}" data-start="${s.startMs || s.start || 0}">${s.words || s.text || ''}</div>`
  ).join('');
}

function syncLyrics(currentMs) {
  if (!lyrics || lyrics.length === 0) return;
  const lines = document.querySelectorAll('.lyric-line');
  lines.forEach(line => {
    const start = parseInt(line.getAttribute('data-start') || '0', 10);
    if (currentMs >= start && currentMs <= start + 4000) {
      line.classList.add('active');
      line.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      line.classList.remove('active');
    }
  });
}
