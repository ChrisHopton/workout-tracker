const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'workouts',
} = process.env;

module.exports = {
  client: 'mysql2',
  connection: {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    dateStrings: true,
    timezone: 'Z',
  },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
  },
  pool: {
    min: 2,
    max: 10,
  },
};
