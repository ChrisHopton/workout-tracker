const express = require('express');
const {
  getOverview,
  getVolumeTrend,
  getExerciseE1RM,
  getSetsPerMuscle,
  getIntensityDistribution,
} = require('../services/statsService');
const { createHttpError } = require('../utils/errors');

const router = express.Router();

router.get('/profiles/:id/overview', async (req, res, next) => {
  try {
    const profileId = Number(req.params.id);
    if (!profileId) {
      throw createHttpError(400, 'Invalid profile id');
    }
    const windowParam = req.query.window || 'weeks:4';
    const match = /^weeks:(\d+)$/.exec(windowParam);
    const weeks = match ? Number(match[1]) : 4;
    const data = await getOverview(profileId, weeks);
    res.json({ data: { window_weeks: weeks, ...data } });
  } catch (error) {
    next(error);
  }
});

router.get('/profiles/:id/volume', async (req, res, next) => {
  try {
    const profileId = Number(req.params.id);
    if (!profileId) {
      throw createHttpError(400, 'Invalid profile id');
    }
    const weeks = req.query.weeks ? Number(req.query.weeks) : 12;
    const granularity = req.query.granularity || 'week';
    if (granularity !== 'week') {
      throw createHttpError(400, 'Unsupported granularity');
    }
    const data = await getVolumeTrend(profileId, weeks);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/profiles/:id/e1rm', async (req, res, next) => {
  try {
    const profileId = Number(req.params.id);
    const exerciseId = Number(req.query.exercise_id);
    if (!profileId || !exerciseId) {
      throw createHttpError(400, 'Profile id and exercise id are required');
    }
    const weeks = req.query.weeks ? Number(req.query.weeks) : 12;
    const data = await getExerciseE1RM(profileId, exerciseId, weeks);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/profiles/:id/sets-per-muscle', async (req, res, next) => {
  try {
    const profileId = Number(req.params.id);
    if (!profileId) {
      throw createHttpError(400, 'Invalid profile id');
    }
    const weeks = req.query.weeks ? Number(req.query.weeks) : 8;
    const data = await getSetsPerMuscle(profileId, weeks);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

router.get('/profiles/:id/intensity', async (req, res, next) => {
  try {
    const profileId = Number(req.params.id);
    if (!profileId) {
      throw createHttpError(400, 'Invalid profile id');
    }
    const weeks = req.query.weeks ? Number(req.query.weeks) : 8;
    const data = await getIntensityDistribution(profileId, weeks);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
