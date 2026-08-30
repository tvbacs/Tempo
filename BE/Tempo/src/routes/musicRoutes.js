/**
 * Music API Routes
 */
const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');

router.get('/home', musicController.getHome);
router.get('/chart', musicController.getChart);
router.get('/song/:id', musicController.getSongStream);
router.get('/stream-proxy', musicController.proxyStream);
router.get('/lyrics/:id', musicController.getLyrics);
router.get('/search', musicController.search);
router.get('/playlist/:id', musicController.getPlaylistDetail);
router.get('/artist/:alias', musicController.getArtistInfo);
router.post('/extract-youtube', musicController.extractYouTube);

module.exports = router;
