const path = require('path');
const { loadEnv } = require('./src/config/env');

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
const DB_FILENAME = process.env.DB_FILENAME || path.join(__dirname, 'var', 'development.sqlite3');

const shared = {
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
  },
};

function withForeignKeys(config) {
  return {
    ...config,
    pool: {
      afterCreate: (conn, done) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  };
}

module.exports = {
  development: withForeignKeys({
    client: 'sqlite3',
    connection: {
      filename: DB_FILENAME,
    },
    useNullAsDefault: true,
    ...shared,
  }),
  test: withForeignKeys({
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    ...shared,
  }),
  production: DATABASE_URL
    ? withForeignKeys({
        client: 'sqlite3',
        connection: {
          filename: DATABASE_URL,
        },
        useNullAsDefault: true,
        ...shared,
      })
    : undefined,
};
