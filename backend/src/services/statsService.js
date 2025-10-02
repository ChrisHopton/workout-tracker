const dayjs = require('../utils/dayjs');
const { getKnex } = require('../db/knex');

function getWeekWindow(weeks = 4) {
  const safeWeeks = Math.max(1, Number(weeks) || 1);
  const end = dayjs().utc().endOf('isoWeek');
  const start = end.subtract(safeWeeks - 1, 'week').startOf('isoWeek');
  return { start, end };
}

async function getOverview(profileId, weeks = 4) {
  const knex = getKnex();
  const { start, end } = getWeekWindow(weeks);

  const tonnageRow = await knex('session_sets as ss')
    .join('sessions as s', 'ss.session_id', 's.id')
    .where('s.profile_id', profileId)
    .whereBetween('s.started_at', [start.toISOString(), end.toISOString()])
    .whereNotNull('ss.actual_reps')
    .whereNotNull('ss.actual_weight')
    .sum({ tonnage: knex.raw('ss.actual_reps * ss.actual_weight') })
    .first();

  const completedSetsRow = await knex('session_sets as ss')
    .join('sessions as s', 'ss.session_id', 's.id')
    .where('s.profile_id', profileId)
    .whereBetween('s.started_at', [start.toISOString(), end.toISOString()])
    .whereNotNull('ss.actual_reps')
    .whereNotNull('ss.actual_weight')
    .count({ count: '*' })
    .first();

  const totalSetsRow = await knex('sessions as s')
    .join('workouts as w', 's.workout_id', 'w.id')
    .join('workout_exercises as we', 'we.workout_id', 'w.id')
    .join('prescriptions as p', 'p.workout_exercise_id', 'we.id')
    .where('s.profile_id', profileId)
    .whereBetween('s.started_at', [start.toISOString(), end.toISOString()])
    .count({ count: 'p.id' })
    .first();

  const bestE1RMRows = await knex('session_sets as ss')
    .join('sessions as s', 'ss.session_id', 's.id')
    .join('exercises as e', 'ss.exercise_id', 'e.id')
    .where('s.profile_id', profileId)
    .whereBetween('s.started_at', [start.toISOString(), end.toISOString()])
    .whereNotNull('ss.actual_reps')
    .whereNotNull('ss.actual_weight')
    .select(
      'e.id as exercise_id',
      'e.name as exercise_name',
      knex.raw('MAX(ss.actual_weight * (1 + ss.actual_reps / 30)) as best_e1rm')
    )
    .groupBy('e.id', 'e.name')
    .orderBy('best_e1rm', 'desc')
    .limit(3);

  const totalSets = Number(totalSetsRow?.count || 0);
  const completedSets = Number(completedSetsRow?.count || 0);
  const topExercises = bestE1RMRows.map((row) => ({
    exercise_id: row.exercise_id,
    exercise_name: row.exercise_name,
    value: Number(row.best_e1rm || 0),
  }));

  return {
    tonnage: Number(tonnageRow?.tonnage || 0),
    adherence_percentage:
      totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : null,
    best_e1rm: topExercises[0] || null,
    top_exercises: topExercises,
  };
}

async function getVolumeTrend(profileId, weeks = 12) {
  const knex = getKnex();
  const { start, end } = getWeekWindow(weeks);
  const rows = await knex('session_sets as ss')
    .join('sessions as s', 'ss.session_id', 's.id')
    .where('s.profile_id', profileId)
    .whereBetween('s.started_at', [start.toISOString(), end.toISOString()])
    .whereNotNull('ss.actual_reps')
    .whereNotNull('ss.actual_weight')
    .select({
      week_start: knex.raw(
        'DATE_SUB(DATE(s.started_at), INTERVAL WEEKDAY(s.started_at) DAY)'
      ),
      tonnage: knex.raw('SUM(ss.actual_reps * ss.actual_weight)')
    })
    .groupBy('week_start')
    .orderBy('week_start');

  return rows.map((row) => ({
    week_start: dayjs(row.week_start).format('YYYY-MM-DD'),
    tonnage: Number(row.tonnage || 0),
  }));
}

async function getExerciseE1RM(profileId, exerciseId, weeks = 12) {
  const knex = getKnex();
  const { start, end } = getWeekWindow(weeks);
  const rows = await knex('session_sets as ss')
    .join('sessions as s', 'ss.session_id', 's.id')
    .where('s.profile_id', profileId)
    .where('ss.exercise_id', exerciseId)
    .whereBetween('s.started_at', [start.toISOString(), end.toISOString()])
    .whereNotNull('ss.actual_reps')
    .whereNotNull('ss.actual_weight')
    .select({
      performed_at: knex.raw('DATE(s.started_at)'),
      e1rm: knex.raw('MAX(ss.actual_weight * (1 + ss.actual_reps / 30))'),
    })
    .groupBy(knex.raw('DATE(s.started_at)'))
    .orderBy('performed_at');

  return rows.map((row) => ({
    performed_at: row.performed_at,
    e1rm: Number(row.e1rm || 0),
  }));
}

async function getSetsPerMuscle(profileId, weeks = 8) {
  const knex = getKnex();
  const { start, end } = getWeekWindow(weeks);
  const rows = await knex('session_sets as ss')
    .join('sessions as s', 'ss.session_id', 's.id')
    .join('exercises as e', 'ss.exercise_id', 'e.id')
    .where('s.profile_id', profileId)
    .whereBetween('s.started_at', [start.toISOString(), end.toISOString()])
    .whereNotNull('ss.actual_reps')
    .whereNotNull('ss.actual_weight')
    .select('e.muscle_group')
    .count({ completed_sets: '*' })
    .groupBy('e.muscle_group')
    .orderBy('completed_sets', 'desc');

  return rows.map((row) => ({
    muscle_group: row.muscle_group,
    sets: Number(row.completed_sets || 0),
  }));
}

async function getIntensityDistribution(profileId, weeks = 8) {
  const knex = getKnex();
  const { start, end } = getWeekWindow(weeks);
  const rows = await knex('session_sets as ss')
    .join('sessions as s', 'ss.session_id', 's.id')
    .where('s.profile_id', profileId)
    .whereBetween('s.started_at', [start.toISOString(), end.toISOString()])
    .whereNotNull('ss.actual_reps')
    .whereNotNull('ss.actual_weight')
    .select('ss.actual_reps');

  const buckets = [
    { label: '5-8', min: 5, max: 8, count: 0 },
    { label: '8-12', min: 9, max: 12, count: 0 },
    { label: '12-15', min: 13, max: 15, count: 0 },
    { label: '15+', min: 16, max: Infinity, count: 0 },
  ];

  rows.forEach((row) => {
    const reps = Number(row.actual_reps);
    const bucket = buckets.find((b) => reps >= b.min && reps <= b.max);
    if (bucket) {
      bucket.count += 1;
    }
  });

  return buckets.map((bucket) => ({ label: bucket.label, sets: bucket.count }));
}

module.exports = {
  getOverview,
  getVolumeTrend,
  getExerciseE1RM,
  getSetsPerMuscle,
  getIntensityDistribution,
};
