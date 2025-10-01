const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');
const { notFound, errorHandler } = require('./utils/errors');

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'];

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api/v1', routes);

// Serve frontend build if available
const frontendDir = path.resolve(__dirname, '..', 'public');
const indexHtmlPath = path.join(frontendDir, 'index.html');
app.use(express.static(frontendDir));

if (fs.existsSync(indexHtmlPath)) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(indexHtmlPath);
  });
} else {
  console.warn(
    'SPA index.html not found in public directory; skipping frontend fallback.'
  );
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
