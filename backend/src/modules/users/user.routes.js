const { Router } = require('express');
const controller = require('./user.controller');
const workoutController = require('../workouts/workout.controller');
const statsRoutes = require('../stats/stats.routes');

const router = Router();

router.post('/', controller.createUser);
router.get('/:userId/workouts', workoutController.listUserWorkouts);
router.get('/:userId', controller.getUser);
router.use('/:userId/stats', statsRoutes);

module.exports = router;
