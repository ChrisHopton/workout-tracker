const { Router } = require('express');
const controller = require('./workout.controller');

const router = Router();

router.post('/', controller.createWorkout);
router.get('/:workoutId', controller.getWorkout);

module.exports = router;
