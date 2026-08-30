/**
 * AI Controller - Gemini Pro integration for DJ and Song Stories
 */
const geminiService = require('../services/geminiService');
const zingService = require('../services/zingService');
const audiusService = require('../services/audiusService');
const { successResponse, errorResponse } = require('../utils/response');

const generateSmartDJ = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return errorResponse(res, 'INVALID_PROMPT', 'Prompt text is required', 400);
    }

    const aiAnalysis = await geminiService.generateSmartDJPlaylist(prompt);
    
    // Search tracks matching AI keywords
    const keywords = aiAnalysis.keywords || [];
    const searchPromises = keywords.slice(0, 4).map(kw => zingService.search(kw));
    const searchResults = await Promise.allSettled(searchPromises);

    const matchedSongs = [];
    const songIds = new Set();

    searchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value.songs) {
        result.value.songs.slice(0, 3).forEach(song => {
          if (!songIds.has(song.id)) {
            songIds.add(song.id);
            matchedSongs.push(song);
          }
        });
      }
    });

    return successResponse(res, {
      playlistTitle: aiAnalysis.playlistTitle,
      moodDescription: aiAnalysis.moodDescription,
      genres: aiAnalysis.genres,
      songs: matchedSongs,
    });
  } catch (error) {
    console.error('generateSmartDJ error:', error);
    return errorResponse(res, 'AI_DJ_FAILED', error.message, 500);
  }
};

const getSongStory = async (req, res) => {
  try {
    const { title, artist } = req.body;
    if (!title) {
      return errorResponse(res, 'INVALID_PARAMS', 'Song title is required', 400);
    }

    const story = await geminiService.getSongStory(title, artist || 'Unknown');
    return successResponse(res, { story });
  } catch (error) {
    console.error('getSongStory error:', error);
    return errorResponse(res, 'AI_STORY_FAILED', error.message, 500);
  }
};

module.exports = {
  generateSmartDJ,
  getSongStory,
};
