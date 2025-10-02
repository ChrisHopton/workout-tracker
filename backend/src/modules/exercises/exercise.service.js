const { createId } = require('../../lib/ids');
const { validate } = require('../../utils/validation');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const repository = require('./exercise.repository');
const { createExerciseSchema } = require('./exercise.schema');

async function createExercise(payload) {
  const data = validate(createExerciseSchema, payload);
  const existing = await repository.findByName(data.name);
  if (existing) {
    throw new BadRequestError('Exercise already exists');
  }

  const now = new Date().toISOString();
  return repository.create({
    id: createId(),
    name: data.name,
    muscle_group: data.muscleGroup,
    equipment: data.equipment || null,
    created_at: now,
    updated_at: now,
  });
}

async function listExercises() {
  const rows = await repository.listAll();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
  }));
}

async function getExercise(id) {
  const exercise = await repository.findById(id);
  if (!exercise) {
    throw new NotFoundError('Exercise not found');
  }
  return exercise;
}

module.exports = {
  createExercise,
  listExercises,
  getExercise,
};
