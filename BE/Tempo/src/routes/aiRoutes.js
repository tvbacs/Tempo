const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/dj', aiController.generateSmartDJ);
router.post('/story', aiController.getSongStory);

module.exports = router;
