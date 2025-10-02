const service = require('./workout.service');

async function createWorkout(req, res, next) {
  try {
    const workout = await service.createWorkout(req.body);
    res.status(201).json({ data: workout });
  } catch (error) {
    next(error);
  }
}

async function getWorkout(req, res, next) {
  try {
    const workout = await service.getWorkout(req.params.workoutId);
    res.json({ data: workout });
  } catch (error) {
    next(error);
  }
}

async function listUserWorkouts(req, res, next) {
  try {
    const workouts = await service.listUserWorkouts(req.params.userId);
    res.json({ data: workouts });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createWorkout,
  getWorkout,
  listUserWorkouts,
};
