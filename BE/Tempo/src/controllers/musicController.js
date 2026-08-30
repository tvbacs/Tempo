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

const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return successResponse(res, { songs: [], artists: [], playlists: [] });
    }

    const [zingResults, audiusResults] = await Promise.allSettled([
      zingService.search(q),
      audiusService.search(q, 10),
    ]);

    const zing = zingResults.status === 'fulfilled' ? zingResults.value : { songs: [], artists: [], playlists: [] };
    const audiusSongs = audiusResults.status === 'fulfilled' ? audiusResults.value : [];

    const mergedSongs = [...zing.songs, ...audiusSongs];

    return successResponse(res, {
      songs: mergedSongs,
      artists: zing.artists,
      playlists: zing.playlists,
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
