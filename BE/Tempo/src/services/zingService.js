/**
 * Zing MP3 Service Adapter
 * Standardizes Zing MP3 responses into UnifiedSong schema
 */
const { ZingMp3 } = require('zingmp3-api-full');
const NodeCache = require('node-cache');

// Cache TTL: 10 minutes (600 seconds)
const cache = new NodeCache({ stdTTL: 600 });

const formatZingSong = (item) => {
  if (!item || !item.encodeId) return null;
  return {
    id: `zing_${item.encodeId}`,
    rawId: item.encodeId,
    source: 'zing',
    title: item.title || 'Untitled',
    artistsNames: item.artistsNames || (item.artists ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist'),
    artists: item.artists?.map(a => ({
      id: a.id,
      name: a.name,
      link: a.link,
      thumbnail: a.thumbnail || a.thumbnailM,
    })) || [],
    thumbnail: item.thumbnailM || item.thumbnail || '',
    duration: item.duration || 0,
    hasLyric: item.hasLyric || false,
    album: item.album ? {
      id: item.album.encodeId,
      title: item.album.title,
      thumbnail: item.album.thumbnailM || item.album.thumbnail,
      artistsNames: item.album.artistsNames,
    } : null,
    isVip: item.streamingStatus === 2,
  };
};

const getHome = async () => {
  const cacheKey = 'zing_home';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const res = await ZingMp3.getHome();
  if (res.err !== 0 || !res.data || !res.data.items) {
    throw new Error(res.msg || 'Failed to fetch Zing home data');
  }

  // Parse banners, new releases, and curated playlists
  const banners = [];
  const newRelease = [];
  const playlists = [];

  res.data.items.forEach(section => {
    if (section.sectionType === 'banner' && section.items) {
      banners.push(...section.items.map(b => ({
        id: b.encodeId,
        title: b.title,
        description: b.description,
        cover: b.cover || b.banner,
        type: b.type,
      })));
    } else if (section.sectionType === 'new-release' && section.items) {
      const allSongs = section.items.all || section.items.vPop || [];
      newRelease.push(...allSongs.map(formatZingSong).filter(Boolean));
    } else if (section.sectionType === 'playlist' && section.items) {
      playlists.push({
        title: section.title,
        link: section.link,
        items: section.items.map(p => ({
          id: p.encodeId,
          title: p.title,
          thumbnail: p.thumbnailM || p.thumbnail,
          artistsNames: p.artistsNames,
          sortDescription: p.sortDescription,
        })),
      });
    }
  });

  const payload = { banners, newRelease: newRelease.slice(0, 20), playlists };
  cache.set(cacheKey, payload);
  return payload;
};

const getChart = async () => {
  const cacheKey = 'zing_chart';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const res = await ZingMp3.getChartHome();
  if (res.err !== 0 || !res.data || !res.data.RTChart) {
    throw new Error(res.msg || 'Failed to fetch Zing chart');
  }

  const items = res.data.RTChart.items?.map((song, index) => ({
    ...formatZingSong(song),
    rank: index + 1,
    score: song.score || 0,
  })).filter(Boolean) || [];

  const payload = {
    chartTime: res.data.RTChart.chartTime,
    items: items.slice(0, 50),
  };

  cache.set(cacheKey, payload, 300); // 5 minutes cache
  return payload;
};

const getSongStream = async (encodeId) => {
  const cacheKey = `zing_stream_${encodeId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const res = await ZingMp3.getSong(encodeId);
  if (res.err !== 0 || !res.data) {
    throw new Error(res.msg || 'Audio stream not found or restricted');
  }

  const audioUrl = res.data['128'] || (res.data['320'] !== 'VIP' ? res.data['320'] : null);
  if (!audioUrl) {
    throw new Error('This track requires VIP or is not available for streaming');
  }

  const payload = {
    audioUrl,
    quality: '128kbps',
    expiresAt: res.timestamp ? res.timestamp + 3600000 : null,
  };

  cache.set(cacheKey, payload, 1800); // 30 minutes cache
  return payload;
};

const getLyric = async (encodeId) => {
  const cacheKey = `zing_lyric_${encodeId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const res = await ZingMp3.getLyric(encodeId);
  if (res.err !== 0 || !res.data) {
    return { lrcUrl: null, sentences: [] };
  }

  const payload = {
    lrcUrl: res.data.file || null,
    sentences: res.data.sentences || [],
  };

  cache.set(cacheKey, payload, 3600); // 1 hour cache
  return payload;
};

const search = async (query) => {
  if (!query || !query.trim()) return { songs: [], artists: [], playlists: [] };
  
  const res = await ZingMp3.search(query.trim());
  if (res.err !== 0 || !res.data) {
    return { songs: [], artists: [], playlists: [] };
  }

  const songs = (res.data.songs || []).map(formatZingSong).filter(Boolean);
  const artists = (res.data.artists || []).map(a => ({
    id: a.id,
    name: a.name,
    thumbnail: a.thumbnailM || a.thumbnail,
    totalFollow: a.totalFollow || 0,
  }));
  const playlists = (res.data.playlists || []).map(p => ({
    id: p.encodeId,
    title: p.title,
    thumbnail: p.thumbnailM || p.thumbnail,
    artistsNames: p.artistsNames,
  }));

  return { songs, artists, playlists };
};

const getPlaylistDetail = async (id) => {
  const cacheKey = `zing_playlist_${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const res = await ZingMp3.getDetailPlaylist(id);
  if (res.err !== 0 || !res.data) {
    throw new Error(res.msg || 'Playlist not found');
  }

  const playlistData = res.data;
  const songs = (playlistData.song?.items || []).map(formatZingSong).filter(Boolean);

  const payload = {
    id: playlistData.encodeId,
    title: playlistData.title,
    thumbnail: playlistData.thumbnailM || playlistData.thumbnail,
    artistsNames: playlistData.artistsNames,
    description: playlistData.sortDescription || playlistData.description || '',
    songCount: songs.length,
    songs,
  };

  cache.set(cacheKey, payload, 600);
  return payload;
};

const getArtistInfo = async (alias) => {
  if (!alias) throw new Error('Artist alias is required');
  const cacheKey = `zing_artist_${alias}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const res = await ZingMp3.getArtist(alias);
    if (res && res.err === 0 && res.data) {
      const d = res.data;
      const payload = {
        id: d.id || alias,
        name: d.name || alias.replace(/-/g, ' '),
        alias: d.alias || alias,
        thumbnail: d.thumbnailM || d.thumbnail || '',
        cover: d.cover || '',
        biography: (d.biography || '').replace(/<br>/gi, '\n').replace(/<[^>]+>/g, '').trim(),
        sortBiography: (d.sortBiography || '').replace(/<[^>]+>/g, '').trim(),
        totalFollow: d.totalFollow || 0,
        national: d.national || '',
        realname: d.realname || d.name,
      };
      cache.set(cacheKey, payload, 1800); // 30 min cache
      return payload;
    }
  } catch (err) {
    // Zing API can fail for non-Zing artists
  }

  // Graceful fallback for non-Zing / Audius / custom artists
  const cleanName = decodeURIComponent(alias).replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const fallbackPayload = {
    id: alias,
    name: cleanName,
    alias: alias,
    thumbnail: '',
    cover: '',
    biography: `Nghệ sĩ ${cleanName}`,
    sortBiography: '',
    totalFollow: 0,
    national: 'Việt Nam',
    realname: cleanName,
  };
  cache.set(cacheKey, fallbackPayload, 600);
  return fallbackPayload;
};


module.exports = {
  formatZingSong,
  getHome,
  getChart,
  getSongStream,
  getLyric,
  search,
  getPlaylistDetail,
  getArtistInfo,
};
