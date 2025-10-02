const { getKnex } = require('../../lib/knex');

function table(trx) {
  return (trx || getKnex())('exercises');
}

async function create(exercise, trx) {
  await table(trx).insert(exercise);
  return findById(exercise.id, trx);
}

function findById(id, trx) {
  return table(trx).where({ id }).first();
}

function findByName(name, trx) {
  return table(trx).whereRaw('lower(name) = ?', [name.toLowerCase()]).first();
}

function listAll(trx) {
  return table(trx).orderBy('name');
}

module.exports = {
  create,
  findById,
  findByName,
  listAll,
};
