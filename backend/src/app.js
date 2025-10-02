const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { AppError } = require('./utils/errors');
const logger = require('./lib/logger');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', routes);

  app.use((req, res, next) => {
    next(new AppError('Not Found', 404));
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) {
      logger.error(err.message, { stack: err.stack });
    }
    res.status(status).json({
      error: err.message,
      details: err.details,
    });
  });

  return app;
}

module.exports = { createApp };
