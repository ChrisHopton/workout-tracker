const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const app = require('./server');
const { getKnex, destroyKnex } = require('./db/knex');

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  const knex = getKnex();
  try {
    await knex.migrate.latest();
    await knex.seed.run();
    const server = app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(async () => {
        await destroyKnex();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server', error);
    await destroyKnex();
    process.exit(1);
  }
}

bootstrap();
