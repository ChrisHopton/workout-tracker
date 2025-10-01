const express = require('express');
const profilesRouter = require('./profiles');
const workoutsRouter = require('./workouts');
const sessionsRouter = require('./sessions');
const statsRouter = require('./stats');
const exercisesRouter = require('./exercises');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/profiles', profilesRouter);
router.use('/workouts', workoutsRouter);
router.use('/sessions', sessionsRouter);
router.use('/stats', statsRouter);
router.use('/exercises', exercisesRouter);

module.exports = router;
