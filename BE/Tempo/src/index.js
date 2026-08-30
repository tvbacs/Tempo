require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const musicRoutes = require('./routes/musicRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5050;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/music', musicRoutes);
app.use('/api/ai', aiRoutes);

// Root & Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'Tempo Music API Engine',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      music: '/api/music',
      ai: '/api/ai',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'Tempo Music Backend',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Tempo Backend Server is running on port ${PORT}`);
  });
}

module.exports = app;
