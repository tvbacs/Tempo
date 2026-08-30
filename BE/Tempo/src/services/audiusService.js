/**
 * Audius API Service Adapter for International / EDM / Global Tracks
 * Standardizes Audius tracks into UnifiedSong schema
 */
const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600 });
const APP_NAME = 'TEMPO_MUSIC_APP';
const BASE_URL = 'https://discoveryprovider.audius.co/v1';

const formatAudiusSong = (item) => {
  if (!item || !item.id) return null;
  const artwork = item.artwork ? (item.artwork['480x480'] || item.artwork['150x150'] || Object.values(item.artwork)[0]) : '';

  return {
    id: `audius_${item.id}`,
    rawId: item.id,
    source: 'audius',
    title: item.title || 'Untitled',
    artistsNames: item.user?.name || item.user?.handle || 'Unknown Artist',
    artists: item.user ? [{
      id: item.user.id,
      name: item.user.name,
      handle: item.user.handle,
      thumbnail: item.user.profile_picture ? (item.user.profile_picture['150x150'] || item.user.profile_picture['480x480']) : '',
    }] : [],
    thumbnail: artwork || '',
    duration: item.duration || 0,
    hasLyric: false,
    genre: item.genre || 'International',
    playCount: item.play_count || 0,
    isVip: false,
    audioUrl: `${BASE_URL}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
  };
};

const getTrending = async (genre = null, limit = 25) => {
  const cacheKey = `audius_trending_${genre || 'all'}_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let url = `${BASE_URL}/tracks/trending?app_name=${APP_NAME}&limit=${limit}`;
  if (genre) {
    url += `&genre=${encodeURIComponent(genre)}`;
  }

  const res = await axios.get(url, { timeout: 8000 });
  const rawItems = res.data?.data || [];
  const songs = rawItems.map(formatAudiusSong).filter(Boolean);

  cache.set(cacheKey, songs, 600);
  return songs;
};

const search = async (query, limit = 20) => {
  if (!query || !query.trim()) return [];
  const cacheKey = `audius_search_${query}_${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/tracks/search?app_name=${APP_NAME}&query=${encodeURIComponent(query.trim())}&limit=${limit}`;
  const res = await axios.get(url, { timeout: 8000 });
  const rawItems = res.data?.data || [];
  const songs = rawItems.map(formatAudiusSong).filter(Boolean);

  cache.set(cacheKey, songs, 300);
  return songs;
};

module.exports = {
  formatAudiusSong,
  getTrending,
  search,
};
