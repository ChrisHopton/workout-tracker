const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';

let instance;

function getKnex() {
  if (!instance) {
    const config = knexConfig[environment];
    if (!config) {
      throw new Error(`No knex configuration found for environment ${environment}`);
    }
    instance = knex(config);
  }
  return instance;
}

async function destroyKnex() {
  if (instance) {
    await instance.destroy();
    instance = undefined;
  }
}

module.exports = {
  getKnex,
  destroyKnex,
};
