const { Router } = require('express');
const userRoutes = require('../modules/users/user.routes');
const exerciseRoutes = require('../modules/exercises/exercise.routes');
const workoutRoutes = require('../modules/workouts/workout.routes');

const router = Router();

router.use('/users', userRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/workouts', workoutRoutes);

module.exports = router;
