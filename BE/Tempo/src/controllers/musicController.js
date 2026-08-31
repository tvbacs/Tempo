/**
 * Music Controller - Unifies Zing MP3 and Audius with VIP Fallback
 */
const axios = require('axios');
const zingService = require('../services/zingService');
const audiusService = require('../services/audiusService');
const { successResponse, errorResponse } = require('../utils/response');

const getHome = async (req, res) => {
  try {
    const [zingData, audiusTrending] = await Promise.allSettled([
      zingService.getHome(),
      audiusService.getTrending(null, 15),
    ]);

    const homeData = {
      banners: zingData.status === 'fulfilled' ? zingData.value.banners : [],
      newReleasesVPop: zingData.status === 'fulfilled' ? zingData.value.newRelease : [],
      featuredPlaylists: zingData.status === 'fulfilled' ? zingData.value.playlists : [],
      globalTrending: audiusTrending.status === 'fulfilled' ? audiusTrending.value : [],
    };

    return successResponse(res, homeData);
  } catch (error) {
    console.error('getHome error:', error);
    return errorResponse(res, 'GET_HOME_FAILED', error.message, 500);
  }
};

const getChart = async (req, res) => {
  try {
    const chartData = await zingService.getChart();
    return successResponse(res, chartData);
  } catch (error) {
    console.error('getChart error:', error);
    return errorResponse(res, 'GET_CHART_FAILED', error.message, 500);
  }
};

const fallbackStreamService = require('../services/fallbackStreamService');

const getSongStream = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist } = req.query;
    if (!id) {
      return errorResponse(res, 'INVALID_PARAMS', 'Song ID is required', 400);
    }

    const streamData = await fallbackStreamService.resolveAudioStream(id, title, artist);
    return successResponse(res, streamData);
  } catch (error) {
    console.error('getSongStream error:', error.message);
    return errorResponse(res, 'VIP_RESTRICTED', error.message || 'Bài hát chỉ dành cho tài khoản VIP', 403);
  }
};

const proxyStream = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('Stream URL is required');
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    };
    if (req.headers.range) {
      headers.range = req.headers.range;
    }

    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      responseType: 'stream',
      headers,
    });

    res.status(response.status);
    Object.keys(response.headers).forEach((header) => {
      res.setHeader(header, response.headers[header]);
    });
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');

    response.data.pipe(res);
  } catch (err) {
    console.error('Proxy stream error:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Failed to stream audio');
    }
  }
};

const getLyrics = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, 'INVALID_PARAMS', 'Song ID is required', 400);
    }

    if (id.startsWith('zing_') || !id.includes('_')) {
      const rawId = id.replace('zing_', '');
      const lyricData = await zingService.getLyric(rawId);
      return successResponse(res, lyricData);
    } else {
      return successResponse(res, { lrcUrl: null, sentences: [] });
    }
  } catch (error) {
    console.error('getLyrics error:', error);
    return errorResponse(res, 'LYRICS_FAILED', error.message, 500);
  }
};

const ARTIST_SPELLING_MAP = {
  'issac': 'Isaac',
  'isac': 'Isaac',
  'sontung': 'Sơn Tùng M-TP',
  'son tung': 'Sơn Tùng M-TP',
  'hieuthu2': 'HIEUTHUHAI',
  'hieu thu hai': 'HIEUTHUHAI',
  'bray': 'B Ray',
  'den vau': 'Đen',
  'mck': 'MCK',
  'tlinh': 'tlinh',
  'mono': 'MONO',
  'soobin': 'SOOBIN',
  'karik': 'Karik',
  'erik': 'ERIK',
  'eric': 'ERIK',
  'duc phuc': 'Đức Phúc',
  'miu le': 'Miu Lê',
  'bich phuong': 'Bích Phương',
  'truc nhan': 'Trúc Nhân',
  'chidan': 'Chi Dân',
  'chi dan': 'Chi Dân',
  'jack': 'Jack - J97',
  'j97': 'Jack - J97',
  'khoi': 'Khói',
  'vu': 'Vũ.',
  'vu.': 'Vũ.',
  'charlie puth': 'Charlie Puth',
  'taylor': 'Taylor Swift',
  'bts': 'BTS',
  'blackpink': 'BLACKPINK',
};

const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return successResponse(res, { songs: [], artists: [], playlists: [] });
    }

    const rawQuery = q.trim();
    // 1. Tách và làm sạch các từ nối tiếng Việt / tiếng Anh (của, by, bởi, hát bởi, bài hát, ca sĩ, ...)
    let cleanedQuery = rawQuery
      .replace(/\b(của|bởi|hát bởi|bài hát|ca sĩ|by|feat\.?|ft\.?)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 2. Tự động chuẩn hóa lỗi chính tả tên ca sĩ (VD: issac -> Isaac, sontung -> Sơn Tùng M-TP)
    let correctedQuery = cleanedQuery;
    for (const [misspell, correct] of Object.entries(ARTIST_SPELLING_MAP)) {
      const regex = new RegExp(`\\b${misspell}\\b`, 'gi');
      if (regex.test(correctedQuery)) {
        correctedQuery = correctedQuery.replace(regex, correct);
      }
    }

    // 3. Tìm kiếm song song trên Zing với query chuẩn hóa & query gốc
    const searchQueries = Array.from(new Set([correctedQuery, cleanedQuery, rawQuery].filter(Boolean)));
    const zingPromises = searchQueries.map((query) => zingService.search(query));
    const audiusPromise = audiusService.search(correctedQuery || cleanedQuery || rawQuery, 10);

    const [zingResults, audiusResults] = await Promise.allSettled([
      Promise.all(zingPromises),
      audiusPromise,
    ]);

    const allZingData = zingResults.status === 'fulfilled' ? zingResults.value : [];
    const audiusSongs = audiusResults.status === 'fulfilled' ? audiusResults.value : [];

    // Gộp kết quả bài hát Zing không trùng lặp
    const mergedZingMap = new Map();
    allZingData.forEach((zing) => {
      (zing.songs || []).forEach((s) => {
        if (!mergedZingMap.has(s.id)) mergedZingMap.set(s.id, s);
      });
    });

    const mergedZingSongs = Array.from(mergedZingMap.values());

    // Gộp nghệ sĩ & sắp xếp theo độ phổ biến / có avatar
    const mergedArtistsMap = new Map();
    allZingData.forEach((zing) => {
      (zing.artists || []).forEach((a) => {
        const key = (a.id || a.name || '').toLowerCase();
        if (!mergedArtistsMap.has(key)) mergedArtistsMap.set(key, a);
      });
    });

    const sortedArtists = Array.from(mergedArtistsMap.values()).sort((a, b) => {
      const aFollow = a.totalFollow || (a.thumbnail ? 500 : 0);
      const bFollow = b.totalFollow || (b.thumbnail ? 500 : 0);
      return bFollow - aFollow;
    });

    // Gộp playlist
    const mergedPlaylistsMap = new Map();
    allZingData.forEach((zing) => {
      (zing.playlists || []).forEach((p) => {
        if (!mergedPlaylistsMap.has(p.id || p.title)) mergedPlaylistsMap.set(p.id || p.title, p);
      });
    });

    // Lọc bài Audius phù hợp
    const searchTerms = (correctedQuery || cleanedQuery || rawQuery).toLowerCase().split(' ').filter((w) => w.length > 1);
    const filteredAudius = audiusSongs.filter((song) => {
      const titleLower = (song.title || '').toLowerCase();
      const artistLower = (song.artistsNames || '').toLowerCase();
      return searchTerms.some((term) => titleLower.includes(term) || artistLower.includes(term));
    });

    const allSongs = [...mergedZingSongs, ...filteredAudius];

    return successResponse(res, {
      songs: allSongs,
      artists: sortedArtists,
      playlists: Array.from(mergedPlaylistsMap.values()),
    });
  } catch (error) {
    console.error('search error:', error);
    return errorResponse(res, 'SEARCH_FAILED', error.message, 500);
  }
};

const getPlaylistDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, 'INVALID_PARAMS', 'Playlist ID is required', 400);
    }

    const playlist = await zingService.getPlaylistDetail(id);
    return successResponse(res, playlist);
  } catch (error) {
    console.error('getPlaylistDetail error:', error);
    return errorResponse(res, 'PLAYLIST_NOT_FOUND', error.message, 404);
  }
};

const getArtistInfo = async (req, res) => {
  try {
    const { alias } = req.params;
    if (!alias) {
      return errorResponse(res, 'INVALID_PARAMS', 'Artist alias is required', 400);
    }
    const artist = await zingService.getArtistInfo(alias);
    return successResponse(res, artist);
  } catch (error) {
    console.error('getArtistInfo error:', error);
    return errorResponse(res, 'ARTIST_NOT_FOUND', error.message, 404);
  }
};

const ytDlpService = require('../services/ytDlpService');

const extractYouTube = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return errorResponse(res, 'INVALID_PARAMS', 'Vui lòng cung cấp URL video YouTube', 400);
    }
    const extractedData = await ytDlpService.extractYouTubeMetadata(url);
    return successResponse(res, extractedData);
  } catch (error) {
    console.error('extractYouTube error:', error);
    return errorResponse(res, 'YOUTUBE_EXTRACT_FAILED', error.message || 'Trích xuất nhạc thất bại', 500);
  }
};

module.exports = {
  getHome,
  getChart,
  getSongStream,
  proxyStream,
  getLyrics,
  search,
  getPlaylistDetail,
  getArtistInfo,
  extractYouTube,
};
