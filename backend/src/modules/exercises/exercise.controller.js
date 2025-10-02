const service = require('./exercise.service');

async function createExercise(req, res, next) {
  try {
    const exercise = await service.createExercise(req.body);
    res.status(201).json({ data: exercise });
  } catch (error) {
    next(error);
  }
}

async function listExercises(req, res, next) {
  try {
    const exercises = await service.listExercises();
    res.json({ data: exercises });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createExercise,
  listExercises,
};
