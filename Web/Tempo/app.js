/**
 * Tempo Web Player & Full Standalone Client
 * Complete music streaming, Supabase Auth & Cloud Sync (Liked Songs, History, Playlists)
 * 100% NO EMOJIS
 */

const SUPABASE_URL = 'https://lrtudzxzytqwhhiiszun.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7TDL7BAku8jkwBtYBfHT1A_yXSQ7o2F';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DEVICE_ID = 'web-player-pc';
const DEVICE_NAME = 'Web Player (PC)';

// State
let currentUser = null;
let currentSong = null;
let currentQueue = [];
let currentIndex = -1;
let isLocalPlaying = false;
let isSeeking = false;
let lyrics = [];
let isShuffle = false;
let isRepeat = false;
let likedSongsMap = new Map();

// Elements
const audio = document.getElementById('audioElement');
const playIconSvg = document.getElementById('playIconSvg');
const pauseIconSvg = document.getElementById('pauseIconSvg');
const btnPlayMain = document.getElementById('btnPlayMain');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnShuffle = document.getElementById('btnShuffle');
const btnRepeat = document.getElementById('btnRepeat');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const labelCurrentTime = document.getElementById('labelCurrentTime');
const labelTotalDuration = document.getElementById('labelTotalDuration');
const volumeSlider = document.getElementById('volumeSlider');
const playerThumb = document.getElementById('playerThumb');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const btnToggleLike = document.getElementById('btnToggleLike');
const heartSvg = document.getElementById('heartSvg');

// Tabs & Views
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const searchResultsList = document.getElementById('searchResultsList');
const searchResultTitle = document.getElementById('searchResultTitle');
const homeChartGrid = document.getElementById('homeChartGrid');
const homeNewReleasesGrid = document.getElementById('homeNewReleasesGrid');
const homeRecommendGrid = document.getElementById('homeRecommendGrid');
const fullChartList = document.getElementById('fullChartList');
const likedSongsList = document.getElementById('likedSongsList');
const historySongsList = document.getElementById('historySongsList');
const lyricsCover = document.getElementById('lyricsCover');
const lyricsTrackTitle = document.getElementById('lyricsTrackTitle');
const lyricsArtistName = document.getElementById('lyricsArtistName');
const lyricsLinesWrap = document.getElementById('lyricsLinesWrap');
const lyricsScroll = document.getElementById('lyricsScroll');
const btnToggleLyrics = document.getElementById('btnToggleLyrics');
const syncStatusLabel = document.getElementById('syncStatusLabel');
const connectDeviceText = document.getElementById('connectDeviceText');
const btnTakeover = document.getElementById('btnTakeover');

// Auth Elements
const authModal = document.getElementById('authModal');
const btnLoginOpen = document.getElementById('btnLoginOpen');
const btnAuthClose = document.getElementById('btnAuthClose');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authErrorMsg = document.getElementById('authErrorMsg');
const authModalTitle = document.getElementById('authModalTitle');
const btnAuthSubmit = document.getElementById('btnAuthSubmit');
const btnAuthToggle = document.getElementById('btnAuthToggle');
const authToggleText = document.getElementById('authToggleText');
const userProfileBadge = document.getElementById('userProfileBadge');
const userAvatarText = document.getElementById('userAvatarText');
const userEmailText = document.getElementById('userEmailText');
const btnLogout = document.getElementById('btnLogout');

let isAuthRegisterMode = false;

// ==========================================
// 1. TABS & NAVIGATION
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const tabViews = document.querySelectorAll('.tab-view');

function switchTab(tabId) {
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabId);
  });
  tabViews.forEach(view => {
    view.classList.toggle('active', view.id === `tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  });

  if (tabId === 'liked') loadLikedSongs();
  if (tabId === 'history') loadHistorySongs();
}

navItems.forEach(item => {
  item.addEventListener('click', () => switchTab(item.dataset.tab));
});

btnToggleLyrics.addEventListener('click', () => switchTab('lyrics'));
document.getElementById('seeAllChart')?.addEventListener('click', () => switchTab('chart'));

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// ==========================================
// 2. SUPABASE AUTH & CLOUD USER DATA
// ==========================================

async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    onUserLoggedIn(session.user);
  } else {
    onUserLoggedOut();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      onUserLoggedIn(session.user);
    } else {
      onUserLoggedOut();
    }
  });
}

function onUserLoggedIn(user) {
  currentUser = user;
  btnLoginOpen.style.display = 'none';
  userProfileBadge.style.display = 'flex';
  userEmailText.textContent = user.email || 'Thành viên Tempo';
  userAvatarText.textContent = (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  authModal.style.display = 'none';

  loadLikedSongs();
  loadHistorySongs();
}

function onUserLoggedOut() {
  currentUser = null;
  btnLoginOpen.style.display = 'block';
  userProfileBadge.style.display = 'none';
  likedSongsMap.clear();
  updateHeartUI();
}

btnLoginOpen.addEventListener('click', () => {
  authModal.style.display = 'flex';
  authErrorMsg.style.display = 'none';
});

btnAuthClose.addEventListener('click', () => {
  authModal.style.display = 'none';
});

btnAuthToggle.addEventListener('click', () => {
  isAuthRegisterMode = !isAuthRegisterMode;
  if (isAuthRegisterMode) {
    authModalTitle.textContent = 'Tạo tài khoản Tempo mới';
    btnAuthSubmit.textContent = 'Đăng ký';
    authToggleText.textContent = 'Đã có tài khoản?';
    btnAuthToggle.textContent = 'Đăng nhập';
  } else {
    authModalTitle.textContent = 'Đăng nhập tài khoản Tempo';
    btnAuthSubmit.textContent = 'Đăng nhập';
    authToggleText.textContent = 'Chưa có tài khoản?';
    btnAuthToggle.textContent = 'Đăng ký ngay';
  }
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErrorMsg.style.display = 'none';
  const email = authEmail.value.trim();
  const password = authPassword.value;

  btnAuthSubmit.textContent = 'Đang xử lý...';
  btnAuthSubmit.disabled = true;

  try {
    if (isAuthRegisterMode) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        onUserLoggedIn(data.user);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        onUserLoggedIn(data.user);
      }
    }
  } catch (err) {
    authErrorMsg.textContent = err.message || 'Lỗi đăng nhập, vui lòng thử lại';
    authErrorMsg.style.display = 'block';
  } finally {
    btnAuthSubmit.textContent = isAuthRegisterMode ? 'Đăng ký' : 'Đăng nhập';
    btnAuthSubmit.disabled = false;
  }
});

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut();
  onUserLoggedOut();
});

// Liked Songs Sync
async function loadLikedSongs() {
  if (!likedSongsList) return;
  if (!currentUser) {
    likedSongsList.innerHTML = '<p class="empty-hint">Đăng nhập tài khoản để đồng bộ danh sách bài hát đã thích từ điện thoại</p>';
    return;
  }

  likedSongsList.innerHTML = '<div class="loading-spinner">Đang tải bài hát đã thích...</div>';
  try {
    const { data, error } = await supabase
      .from('liked_songs')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    likedSongsMap.clear();
    if (data && data.length > 0) {
      data.forEach(r => {
        likedSongsMap.set(r.song_id, {
          id: r.song_id,
          title: r.title,
          artistsNames: r.artists_names,
          thumbnail: r.thumbnail,
          duration: r.duration,
          source: r.source || 'zing',
        });
      });

      renderLikedSongsList(Array.from(likedSongsMap.values()));
    } else {
      likedSongsList.innerHTML = '<p class="empty-hint">Chưa có bài hát nào trong mục Yêu thích</p>';
    }
    updateHeartUI();
  } catch (e) {
    likedSongsList.innerHTML = '<p class="empty-hint">Không thể tải danh sách bài hát đã thích</p>';
  }
}

function renderLikedSongsList(songs) {
  if (!likedSongsList) return;
  likedSongsList.innerHTML = songs.map((song, idx) => `
    <div class="song-card-item" style="margin-bottom: 8px;" onclick="playLikedTrack('${song.id}')">
      <span class="song-rank">${idx + 1}</span>
      <img src="${song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}" alt="Thumb" class="song-thumb">
      <div class="song-info">
        <h4 class="song-name">${song.title}</h4>
        <p class="song-artists">${song.artistsNames}</p>
      </div>
      <span style="font-size: 12px; color: var(--text-muted); margin-right: 12px;">${formatTime(song.duration || 0)}</span>
      <div class="play-hover-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </div>
    </div>
  `).join('');
}

window.playLikedTrack = function(songId) {
  const s = likedSongsMap.get(songId);
  if (s) {
    playSongDirectly(s, Array.from(likedSongsMap.values()));
  }
};

// Toggle Like Button
btnToggleLike.addEventListener('click', async () => {
  if (!currentSong) return;
  if (!currentUser) {
    authModal.style.display = 'flex';
    return;
  }

  const songId = currentSong.encodeId || currentSong.id;
  const isCurrentlyLiked = likedSongsMap.has(songId);

  if (isCurrentlyLiked) {
    likedSongsMap.delete(songId);
    updateHeartUI();
    await supabase.from('liked_songs').delete().eq('user_id', currentUser.id).eq('song_id', songId);
  } else {
    const newLiked = {
      user_id: currentUser.id,
      song_id: songId,
      title: currentSong.title,
      artists_names: currentSong.artistsNames || '',
      thumbnail: currentSong.thumbnail || currentSong.thumbnailM || '',
      duration: currentSong.duration || 0,
      source: currentSong.source || 'zing',
    };
    likedSongsMap.set(songId, newLiked);
    updateHeartUI();
    await supabase.from('liked_songs').upsert(newLiked);
  }
});

function updateHeartUI() {
  if (!currentSong) {
    btnToggleLike.classList.remove('liked');
    return;
  }
  const songId = currentSong.encodeId || currentSong.id;
  const isLiked = likedSongsMap.has(songId);
  btnToggleLike.classList.toggle('liked', isLiked);
}

// History Sync
async function loadHistorySongs() {
  if (!historySongsList) return;
  if (!currentUser) {
    historySongsList.innerHTML = '<p class="empty-hint">Đăng nhập tài khoản để xem lịch sử nghe nhạc</p>';
    return;
  }

  historySongsList.innerHTML = '<div class="loading-spinner">Đang tải lịch sử nghe...</div>';
  try {
    const { data, error } = await supabase
      .from('listening_history')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    if (data && data.length > 0) {
      historySongsList.innerHTML = data.map((song, idx) => `
        <div class="song-card-item" style="margin-bottom: 8px;" onclick="playSongDirectly({ id: '${song.song_id}', title: '${song.title?.replace(/'/g, "\\'")}', artistsNames: '${song.artists_names?.replace(/'/g, "\\'")}', thumbnail: '${song.thumbnail}', duration: ${song.duration} })">
          <span class="song-rank">${idx + 1}</span>
          <img src="${song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}" alt="Thumb" class="song-thumb">
          <div class="song-info">
            <h4 class="song-name">${song.title}</h4>
            <p class="song-artists">${song.artists_names}</p>
          </div>
          <span style="font-size: 12px; color: var(--text-muted); margin-right: 12px;">${formatTime(song.duration || 0)}</span>
          <div class="play-hover-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
      `).join('');
    } else {
      historySongsList.innerHTML = '<p class="empty-hint">Chưa có bài hát nào trong lịch sử nghe</p>';
    }
  } catch (e) {
    historySongsList.innerHTML = '<p class="empty-hint">Không thể tải lịch sử nghe nhạc</p>';
  }
}

async function recordPlayHistory(song) {
  if (!currentUser || !song) return;
  try {
    const songId = song.encodeId || song.id;
    await supabase.from('listening_history').upsert({
      user_id: currentUser.id,
      song_id: songId,
      title: song.title,
      artists_names: song.artistsNames || '',
      thumbnail: song.thumbnail || song.thumbnailM || '',
      duration: song.duration || 0,
      source: song.source || 'zing',
      updated_at: new Date().toISOString(),
    });
  } catch (_) {}
}

// ==========================================
// 3. DATA FETCHING (Home, Chart, Search)
// ==========================================

async function loadHomeData() {
  try {
    const res = await fetch('/api/music/chart');
    const json = await res.json();
    if (json.success && json.data?.songs) {
      window._chartSongs = json.data.songs;
      renderHomeChart(json.data.songs.slice(0, 9));
      renderFullChart(json.data.songs);
    }
  } catch (err) {
    if (homeChartGrid) homeChartGrid.innerHTML = '<p class="empty-hint">Không thể tải bảng xếp hạng</p>';
  }

  try {
    const resHome = await fetch('/api/music/home');
    const jsonHome = await resHome.json();
    if (jsonHome.success && jsonHome.data) {
      if (jsonHome.data.newReleases && jsonHome.data.newReleases.length > 0) {
        window._newReleases = jsonHome.data.newReleases;
        renderNewReleases(jsonHome.data.newReleases.slice(0, 6));
      }
      if (jsonHome.data.featuredPlaylists && jsonHome.data.featuredPlaylists.length > 0) {
        renderHomePlaylists(jsonHome.data.featuredPlaylists);
      } else if (jsonHome.data.globalTrending && jsonHome.data.globalTrending.length > 0) {
        renderGlobalTrending(jsonHome.data.globalTrending.slice(0, 6));
      }
    }
  } catch (_) {}
}

function renderHomeChart(songs) {
  if (!homeChartGrid) return;
  homeChartGrid.innerHTML = songs.map((song, idx) => `
    <div class="song-card-item" onclick="playChartTrack(${idx})">
      <span class="song-rank">${idx + 1}</span>
      <img src="${song.thumbnail || song.thumbnailM}" alt="Thumb" class="song-thumb">
      <div class="song-info">
        <h4 class="song-name">${song.title}</h4>
        <p class="song-artists">${song.artistsNames || ''}</p>
      </div>
      <div class="play-hover-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </div>
    </div>
  `).join('');
}

window.playChartTrack = function(index) {
  if (window._chartSongs && window._chartSongs[index]) {
    playSongDirectly(window._chartSongs[index], window._chartSongs);
  }
};

function renderFullChart(songs) {
  if (!fullChartList) return;
  fullChartList.innerHTML = songs.map((song, idx) => `
    <div class="song-card-item" style="margin-bottom: 8px;" onclick="playChartTrack(${idx})">
      <span class="song-rank">${idx + 1}</span>
      <img src="${song.thumbnail || song.thumbnailM}" alt="Thumb" class="song-thumb">
      <div class="song-info">
        <h4 class="song-name">${song.title}</h4>
        <p class="song-artists">${song.artistsNames || ''}</p>
      </div>
      <span style="font-size: 12px; color: var(--text-muted); margin-right: 12px;">${formatTime(song.duration || 0)}</span>
      <div class="play-hover-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </div>
    </div>
  `).join('');
}

function renderNewReleases(songs) {
  if (!homeNewReleasesGrid) return;
  homeNewReleasesGrid.innerHTML = songs.map((song, idx) => `
    <div class="song-card-item" onclick="playNewReleaseTrack(${idx})">
      <img src="${song.thumbnail || song.thumbnailM}" alt="Thumb" class="song-thumb">
      <div class="song-info">
        <h4 class="song-name">${song.title}</h4>
        <p class="song-artists">${song.artistsNames || ''}</p>
      </div>
      <div class="play-hover-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </div>
    </div>
  `).join('');
}

window.playNewReleaseTrack = function(index) {
  if (window._newReleases && window._newReleases[index]) {
    playSongDirectly(window._newReleases[index], window._newReleases);
  }
};

function renderHomePlaylists(sections) {
  if (!homeRecommendGrid) return;
  const list = [];
  sections.forEach(sec => {
    if (sec.items && Array.isArray(sec.items)) {
      sec.items.forEach(p => {
        if (p.encodeId && p.title && list.length < 8) list.push(p);
      });
    }
  });
  if (list.length === 0) return;

  homeRecommendGrid.innerHTML = list.map(p => `
    <div class="album-card" onclick="loadAndPlayPlaylist('${p.encodeId}')">
      <img src="${p.thumbnailM || p.thumbnail}" alt="Thumb" class="album-thumb">
      <h4 class="album-title">${p.title}</h4>
      <p class="album-sub">${p.sortDescription || 'Tuyển tập đặc sắc'}</p>
    </div>
  `).join('');
}

function renderGlobalTrending(songs) {
  if (!homeRecommendGrid) return;
  homeRecommendGrid.innerHTML = songs.map(s => `
    <div class="album-card" onclick="playSongDirectly({ id: '${s.id}', title: '${s.title.replace(/'/g, "\\'")}', artistsNames: '${s.artistsNames.replace(/'/g, "\\'")}', thumbnail: '${s.thumbnail}', duration: ${s.duration}, audioUrl: '${s.audioUrl}' })">
      <img src="${s.thumbnail}" alt="Thumb" class="album-thumb">
      <h4 class="album-title">${s.title}</h4>
      <p class="album-sub">${s.artistsNames}</p>
    </div>
  `).join('');
}

// Search with Debounce
let searchTimeout = null;
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  searchClear.style.display = query ? 'block' : 'none';
  if (!query) {
    searchResultsList.innerHTML = '<p class="empty-hint">Nhập từ khóa bài hát hoặc nghệ sĩ vào thanh tìm kiếm ở trên để bắt đầu</p>';
    return;
  }
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => executeSearch(query), 400);
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.style.display = 'none';
  searchResultsList.innerHTML = '<p class="empty-hint">Nhập từ khóa bài hát hoặc nghệ sĩ vào thanh tìm kiếm ở trên để bắt đầu</p>';
});

searchInput.addEventListener('focus', () => {
  switchTab('search');
});

async function executeSearch(query) {
  switchTab('search');
  searchResultsList.innerHTML = '<div class="loading-spinner">Đang tìm kiếm...</div>';
  searchResultTitle.textContent = `Kết quả cho "${query}"`;
  try {
    const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (json.success && json.data?.songs && json.data.songs.length > 0) {
      window._lastSearchResults = json.data.songs;
      searchResultsList.innerHTML = json.data.songs.map((song, idx) => `
        <div class="song-card-item" style="margin-bottom: 8px;" onclick="playSearchTrack(${idx})">
          <img src="${song.thumbnail || song.thumbnailM}" alt="Thumb" class="song-thumb">
          <div class="song-info">
            <h4 class="song-name">${song.title}</h4>
            <p class="song-artists">${song.artistsNames || ''}</p>
          </div>
          <span style="font-size: 12px; color: var(--text-muted); margin-right: 12px;">${formatTime(song.duration || 0)}</span>
          <div class="play-hover-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
      `).join('');
    } else {
      searchResultsList.innerHTML = `<p class="empty-hint">Không tìm thấy bài hát nào cho "${query}"</p>`;
    }
  } catch (err) {
    searchResultsList.innerHTML = '<p class="empty-hint">Lỗi tìm kiếm, vui lòng thử lại</p>';
  }
}

window.playSearchTrack = function(index) {
  if (window._lastSearchResults && window._lastSearchResults[index]) {
    const s = window._lastSearchResults[index];
    playSongDirectly({
      id: s.encodeId || s.id,
      title: s.title,
      artistsNames: s.artistsNames || '',
      thumbnail: s.thumbnail || s.thumbnailM,
      duration: s.duration,
      audioUrl: s.audioUrl,
    }, window._lastSearchResults);
  }
};

window.loadAndPlayPlaylist = async function(playlistId) {
  try {
    const res = await fetch(`/api/music/playlist/${playlistId}`);
    const json = await res.json();
    if (json.success && json.data?.song?.items?.length > 0) {
      const items = json.data.song.items;
      playSongDirectly(items[0], items);
    }
  } catch (e) {}
};

// ==========================================
// 4. PLAYBACK ENGINE
// ==========================================

async function playSongDirectly(song, queue = null, startPosMs = 0) {
  currentSong = song;
  if (queue) currentQueue = queue;
  currentIndex = currentQueue.findIndex(s => (s.encodeId || s.id) === (song.encodeId || song.id));

  updateTrackMeta(song);
  updateHeartUI();
  recordPlayHistory(song);
  loadLyrics(song.encodeId || song.id);

  let streamUrl = song.audioUrl;
  if (!streamUrl || streamUrl.startsWith('file://')) {
    try {
      const enc = encodeURIComponent;
      const songId = song.encodeId || song.id;
      const res = await fetch(`/api/music/song/${songId}?title=${enc(song.title)}&artist=${enc(song.artistsNames || '')}`);
      const json = await res.json();
      streamUrl = json.data?.audioUrl;
    } catch (e) {
      console.error('Failed to fetch stream URL:', e);
    }
  }

  if (streamUrl) {
    audio.src = streamUrl;
    audio.currentTime = startPosMs / 1000;
    audio.play().then(() => {
      isLocalPlaying = true;
      updatePlayPauseUI(true);
      connectDeviceText.textContent = `Đang phát: ${song.title}`;
      broadcastState();
    }).catch(err => {
      console.warn('Autoplay restricted:', err);
      updatePlayPauseUI(false);
    });
  }
}

function updateTrackMeta(song) {
  playerTitle.textContent = song.title || 'Chưa chọn bài hát';
  playerArtist.textContent = song.artistsNames || 'Tempo Music';
  playerThumb.src = song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120';

  if (lyricsCover) lyricsCover.src = song.thumbnail || song.thumbnailM || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';
  if (lyricsTrackTitle) lyricsTrackTitle.textContent = song.title || 'Chưa chọn bài hát';
  if (lyricsArtistName) lyricsArtistName.textContent = song.artistsNames || 'Tempo Music';
}

function updatePlayPauseUI(isPlaying) {
  playIconSvg.style.display = isPlaying ? 'none' : 'block';
  pauseIconSvg.style.display = isPlaying ? 'block' : 'none';
}

// Audio Events
audio.addEventListener('timeupdate', () => {
  if (!isSeeking && audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${pct}%`;
    progressHandle.style.left = `${pct}%`;
    labelCurrentTime.textContent = formatTime(audio.currentTime);
    labelTotalDuration.textContent = formatTime(audio.duration);
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
  playNextTrack();
});

function playNextTrack() {
  if (currentQueue.length === 0) return;
  if (isShuffle) {
    const nextIdx = Math.floor(Math.random() * currentQueue.length);
    playSongDirectly(currentQueue[nextIdx], currentQueue);
    return;
  }
  if (currentIndex + 1 < currentQueue.length) {
    playSongDirectly(currentQueue[currentIndex + 1], currentQueue);
  } else if (isRepeat) {
    playSongDirectly(currentQueue[0], currentQueue);
  }
}

function playPrevTrack() {
  if (currentQueue.length === 0) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  if (currentIndex > 0) {
    playSongDirectly(currentQueue[currentIndex - 1], currentQueue);
  }
}

// Controls
btnPlayMain.addEventListener('click', () => {
  if (audio.src) {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  } else {
    channel.send({ type: 'broadcast', event: 'command', payload: { command: 'toggle_play_pause' } });
  }
});

btnNext.addEventListener('click', () => {
  if (currentQueue.length > 0) {
    playNextTrack();
  } else {
    channel.send({ type: 'broadcast', event: 'command', payload: { command: 'next' } });
  }
});

btnPrev.addEventListener('click', () => {
  if (currentQueue.length > 0) {
    playPrevTrack();
  } else {
    channel.send({ type: 'broadcast', event: 'command', payload: { command: 'prev' } });
  }
});

btnShuffle.addEventListener('click', () => {
  isShuffle = !isShuffle;
  btnShuffle.classList.toggle('active', isShuffle);
});

btnRepeat.addEventListener('click', () => {
  isRepeat = !isRepeat;
  btnRepeat.classList.toggle('active', isRepeat);
});

volumeSlider.addEventListener('input', (e) => {
  audio.volume = e.target.value;
  broadcastState();
});

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

// ==========================================
// 5. LYRICS (Karaoke Synced)
// ==========================================

async function loadLyrics(songId) {
  if (!lyricsLinesWrap) return;
  lyricsLinesWrap.innerHTML = '<p class="lyrics-placeholder">Đang tải lời bài hát...</p>';
  try {
    const res = await fetch(`/api/music/lyrics/${songId}`);
    const json = await res.json();
    if (json.success && json.data?.sentences?.length > 0) {
      lyrics = json.data.sentences;
      renderLyrics(lyrics);
    } else {
      lyricsLinesWrap.innerHTML = '<p class="lyrics-placeholder">Chưa có lời bài hát cho bản nhạc này</p>';
    }
  } catch (e) {
    lyricsLinesWrap.innerHTML = '<p class="lyrics-placeholder">Không thể tải lời bài hát</p>';
  }
}

function renderLyrics(sentences) {
  if (!lyricsLinesWrap) return;
  lyricsLinesWrap.innerHTML = sentences.map((s, idx) =>
    `<div class="lyrics-line" data-idx="${idx}" data-start="${s.startMs || s.start || 0}" onclick="seekToLyric(${s.startMs || s.start || 0})">${s.words || s.text || ''}</div>`
  ).join('');
}

window.seekToLyric = function(ms) {
  if (audio.duration) {
    audio.currentTime = ms / 1000;
  }
};

function syncLyrics(currentMs) {
  if (!lyrics || lyrics.length === 0) return;
  const lines = document.querySelectorAll('.lyrics-line');
  lines.forEach(line => {
    const start = parseInt(line.getAttribute('data-start') || '0', 10);
    if (currentMs >= start && currentMs <= start + 4500) {
      if (!line.classList.contains('active')) {
        line.classList.add('active');
        line.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      line.classList.remove('active');
    }
  });
}

// ==========================================
// 6. SUPABASE REALTIME (Tempo Connect Sync)
// ==========================================

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
      syncStatusLabel.textContent = 'Đã kết nối Connect';
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

setInterval(broadcastPresence, 10000);

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

async function handleRemoteCommand(payload) {
  const { command, data } = payload;
  if (command === 'transfer_playback' && (data?.targetDeviceId === DEVICE_ID || !data?.targetDeviceId)) {
    if (data?.song) {
      playSongDirectly(data.song, null, data.positionMs || 0);
    } else if (currentSong) {
      audio.play().catch(() => {});
      updatePlayPauseUI(true);
    }
    return;
  }

  if (command === 'play_track' && data?.song) {
    playSongDirectly(data.song, null, data.positionMs || 0);
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
    volumeSlider.value = audio.volume;
    return;
  }
}

function handleRemoteState(state) {
  if (state.activeDeviceId && state.activeDeviceId !== DEVICE_ID) {
    isLocalPlaying = false;
    if (!audio.paused) audio.pause();

    connectDeviceText.textContent = `Đang phát trên: ${state.activeDeviceName || 'Điện thoại'}`;

    if (state.currentSong) {
      updateTrackMeta(state.currentSong);
      currentSong = state.currentSong;
      updateHeartUI();
    }

    updatePlayPauseUI(state.isPlaying);

    if (state.durationMs > 0 && !isSeeking) {
      const pct = (state.positionMs / state.durationMs) * 100;
      progressFill.style.width = `${pct}%`;
      progressHandle.style.left = `${pct}%`;
      labelCurrentTime.textContent = formatTime(state.positionMs / 1000);
      labelTotalDuration.textContent = formatTime(state.durationMs / 1000);
    }
  }
}

btnTakeover.addEventListener('click', () => {
  channel.send({
    type: 'broadcast',
    event: 'command',
    payload: {
      command: 'transfer_playback',
      data: { targetDeviceId: DEVICE_ID }
    }
  });
  connectDeviceText.textContent = 'Đang chuyển quyền phát sang máy tính...';
});

// Init
initAuth();
loadHomeData();
