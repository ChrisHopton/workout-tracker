const { createApp } = require('./app');
const { loadEnv } = require('./config/env');
const logger = require('./lib/logger');
const { getKnex } = require('./lib/knex');

loadEnv();

const port = Number(process.env.PORT || 3001);
const app = createApp();

app.listen(port, () => {
  getKnex();
  logger.info(`Server listening on port ${port}`);
});
