const { getKnex } = require('../../lib/knex');
const userRepository = require('../users/user.repository');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

async function ensureUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
}

async function getSummary(userId) {
  await ensureUser(userId);
  const db = getKnex();

  const totalWorkoutsRow = await db('workout_sessions').where({ user_id: userId }).count({ total_workouts: 'id' }).first();

  const aggregateRow = await db('session_sets as ss')
    .join('session_exercises as se', 'se.id', 'ss.session_exercise_id')
    .join('workout_sessions as ws', 'ws.id', 'se.session_id')
    .where('ws.user_id', userId)
    .select(
      db.raw('COUNT(ss.id) as total_sets'),
      db.raw('COALESCE(SUM(ss.reps), 0) as total_reps'),
      db.raw('COALESCE(SUM(COALESCE(ss.reps, 0) * COALESCE(ss.weight, 0)), 0) as total_volume')
    )
    .first();

  const recentWorkouts = await db('workout_sessions as ws')
    .where('ws.user_id', userId)
    .leftJoin('session_exercises as se', 'se.session_id', 'ws.id')
    .leftJoin('session_sets as ss', 'ss.session_exercise_id', 'se.id')
    .groupBy('ws.id')
    .orderBy('ws.performed_at', 'desc')
    .select(
      'ws.id',
      'ws.title',
      'ws.performed_at',
      db.raw('COUNT(ss.id) as total_sets'),
      db.raw('COALESCE(SUM(COALESCE(ss.reps, 0) * COALESCE(ss.weight, 0)), 0) as total_volume')
    )
    .limit(5);

  return {
    totalWorkouts: Number(totalWorkoutsRow?.total_workouts || 0),
    totalSets: Number(aggregateRow?.total_sets || 0),
    totalReps: Number(aggregateRow?.total_reps || 0),
    totalVolume: Number(aggregateRow?.total_volume || 0),
    recentWorkouts: recentWorkouts.map((workout) => ({
      id: workout.id,
      title: workout.title,
      performedAt: workout.performed_at,
      totalSets: Number(workout.total_sets || 0),
      totalVolume: Number(workout.total_volume || 0),
    })),
  };
}

async function getProgression(userId, filters) {
  await ensureUser(userId);
  const db = getKnex();
  const { exerciseId, exerciseName } = filters;

  if (!exerciseId && !exerciseName) {
    throw new BadRequestError('exerciseId or exerciseName is required');
  }

  const query = db('session_sets as ss')
    .join('session_exercises as se', 'se.id', 'ss.session_exercise_id')
    .join('workout_sessions as ws', 'ws.id', 'se.session_id')
    .where('ws.user_id', userId);

  if (exerciseId) {
    query.andWhere('se.exercise_id', exerciseId);
  }

  if (exerciseName) {
    query.andWhere('se.name', exerciseName);
  }

  const rows = await query
    .select(
      'ws.id as workout_id',
      'ws.title',
      'ws.performed_at',
      'se.name as exercise_name',
      db.raw('COALESCE(SUM(COALESCE(ss.reps, 0) * COALESCE(ss.weight, 0)), 0) as total_volume'),
      db.raw('COALESCE(SUM(COALESCE(ss.reps, 0)), 0) as total_reps'),
      db.raw('MAX(ss.weight) as top_set_weight')
    )
    .groupBy('ws.id')
    .orderBy('ws.performed_at');

  return rows.map((row) => ({
    workoutId: row.workout_id,
    workoutTitle: row.title,
    performedAt: row.performed_at,
    exerciseName: row.exercise_name,
    totalVolume: Number(row.total_volume || 0),
    totalReps: Number(row.total_reps || 0),
    topSetWeight: row.top_set_weight !== null ? Number(row.top_set_weight) : null,
  }));
}

module.exports = {
  getSummary,
  getProgression,
};
