const knex = require('knex');
const knexConfig = require('../../knexfile');

let instance;

function getKnex() {
  if (!instance) {
    instance = knex(knexConfig);
  }
  return instance;
}

async function destroyKnex() {
  if (instance) {
    await instance.destroy();
    instance = null;
  }
}

module.exports = {
  getKnex,
  destroyKnex,
};
