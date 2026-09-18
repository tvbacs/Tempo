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

const FALLBACK_LYRICS_DB = {
  'Q9DQD1HC5veZ': [
    { startMs: 0, endMs: 13000, words: [{ data: "荒 - 郑鱼 (Hoang - Trịnh Ngư)", startTime: 0, endTime: 13000 }] },
    { startMs: 13500, endMs: 16800, words: [{ data: "我以傲骨震大地", startTime: 13500, endTime: 16800 }] },
    { startMs: 17200, endMs: 20500, words: [{ data: "以道纹凌九天", startTime: 17200, endTime: 20500 }] },
    { startMs: 21000, endMs: 24500, words: [{ data: "手取山川祭圆缺", startTime: 21000, endTime: 24500 }] },
    { startMs: 25000, endMs: 28800, words: [{ data: "不渡命数诡谲", startTime: 25000, endTime: 28800 }] },
    { startMs: 29200, endMs: 32800, words: [{ data: "何惧这绝境回旋", startTime: 29200, endTime: 32800 }] },
    { startMs: 33200, endMs: 36500, words: [{ data: "等风起夙夜", startTime: 33200, endTime: 36500 }] },
    { startMs: 37000, endMs: 40200, words: [{ data: "此去不朽", startTime: 37000, endTime: 40200 }] },
    { startMs: 40800, endMs: 44500, words: [{ data: "此去无歇", startTime: 40800, endTime: 44500 }] },
    { startMs: 45000, endMs: 48500, words: [{ data: "一念间天荒仙灭", startTime: 45000, endTime: 48500 }] },
    { startMs: 49000, endMs: 52500, words: [{ data: "我仍立八荒间", startTime: 49000, endTime: 52500 }] },
    { startMs: 53000, endMs: 57000, words: [{ data: "踏碎凌霄又葬下了天", startTime: 53000, endTime: 57000 }] },
    { startMs: 57500, endMs: 61000, words: [{ data: "我欲横剑天啸", startTime: 57500, endTime: 61000 }] },
    { startMs: 61500, endMs: 65000, words: [{ data: "此去沧海落扶摇", startTime: 61500, endTime: 65000 }] },
    { startMs: 65500, endMs: 69500, words: [{ data: "万古梦回涅槃何道", startTime: 65500, endTime: 69500 }] },
    { startMs: 70000, endMs: 73500, words: [{ data: "一念间多少云烟", startTime: 70000, endTime: 73500 }] },
    { startMs: 74000, endMs: 77800, words: [{ data: "焚天灭海俱消多寂寥", startTime: 74000, endTime: 77800 }] },
    { startMs: 78200, endMs: 81800, words: [{ data: "只见山与月颠倒", startTime: 78200, endTime: 81800 }] },
    { startMs: 82200, endMs: 85500, words: [{ data: "我欲尽付江潮", startTime: 82200, endTime: 85500 }] },
    { startMs: 86000, endMs: 89500, words: [{ data: "漫随因果自飘渺", startTime: 86000, endTime: 89500 }] },
    { startMs: 90000, endMs: 94500, words: [{ data: "此生不了剑不回鞘", startTime: 90000, endTime: 94500 }] },
    { startMs: 95000, endMs: 98800, words: [{ data: "我自纵横覆乾坤", startTime: 95000, endTime: 98800 }] },
    { startMs: 99200, endMs: 103000, words: [{ data: "九死百转护凡尘", startTime: 99200, endTime: 103000 }] },
    { startMs: 103500, endMs: 107800, words: [{ data: "唯负天下有谁人的苦等", startTime: 103500, endTime: 107800 }] },
    { startMs: 108200, endMs: 112000, words: [{ data: "我本应劫惹神愤", startTime: 108200, endTime: 112000 }] },
    { startMs: 112500, endMs: 116200, words: [{ data: "孤绝一生流离人", startTime: 112500, endTime: 116200 }] },
    { startMs: 116800, endMs: 121500, words: [{ data: "如有因果尽加吾身", startTime: 116800, endTime: 121500 }] },
    { startMs: 122000, endMs: 125800, words: [{ data: "我破苍穹一个人", startTime: 122000, endTime: 125800 }] },
    { startMs: 126200, endMs: 130000, words: [{ data: "独断天命自浮沉", startTime: 126200, endTime: 130000 }] },
    { startMs: 130500, endMs: 135000, words: [{ data: "穷碧落深入宿世谁饮恨", startTime: 130500, endTime: 135000 }] },
    { startMs: 135500, endMs: 139200, words: [{ data: "我悬世外敛痴嗔", startTime: 135500, endTime: 139200 }] },
    { startMs: 139800, endMs: 143500, words: [{ data: "回首过往多少瞬", startTime: 139800, endTime: 143500 }] },
    { startMs: 144000, endMs: 149000, words: [{ data: "轮回再深不过封尘", startTime: 144000, endTime: 149000 }] }
  ]
};

const getLyrics = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist } = req.query;
    if (!id) {
      return errorResponse(res, 'INVALID_PARAMS', 'Song ID is required', 400);
    }

    const rawId = id.replace('zing_', '');

    // 1. Kiểm tra cache / fallback DB nội bộ trước
    if (FALLBACK_LYRICS_DB[rawId]) {
      return successResponse(res, { lrcUrl: null, sentences: FALLBACK_LYRICS_DB[rawId] });
    }

    // Nếu tiêu đề/ca sĩ liên quan đến bài Hoang / Trịnh Ngư
    const queryStr = `${title || ''} ${artist || ''}`.toLowerCase();
    if (queryStr.includes('hoang') && (queryStr.includes('trịnh ngư') || queryStr.includes('trinh ngu') || queryStr.includes('zheng yu'))) {
      return successResponse(res, { lrcUrl: null, sentences: FALLBACK_LYRICS_DB['Q9DQD1HC5veZ'] });
    }

    // 2. Truy vấn từ Zing MP3 API
    if (id.startsWith('zing_') || !id.includes('_')) {
      const lyricData = await zingService.getLyric(rawId);
      if (lyricData && lyricData.sentences && lyricData.sentences.length > 0) {
        return successResponse(res, lyricData);
      }
    }

    return successResponse(res, { lrcUrl: null, sentences: [] });
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
