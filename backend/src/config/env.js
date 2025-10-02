const path = require('path');
const dotenv = require('dotenv');

let loaded = false;

function loadEnv() {
  if (loaded) {
    return;
  }

  const envPath = process.env.ENV_PATH || path.resolve(__dirname, '../../.env');
  dotenv.config({ path: envPath });
  loaded = true;
}

module.exports = {
  loadEnv,
};
