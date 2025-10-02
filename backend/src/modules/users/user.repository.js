const { getKnex } = require('../../lib/knex');

function table() {
  return getKnex()('users');
}

async function create(user) {
  await table().insert(user);
  return findById(user.id);
}

function findById(id) {
  return table().where({ id }).first();
}

function findByEmail(email) {
  return table().where({ email }).first();
}

module.exports = {
  create,
  findById,
  findByEmail,
};
