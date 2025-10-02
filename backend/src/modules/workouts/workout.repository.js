const { getKnex } = require('../../lib/knex');

function sessionsTable(trx) {
  return (trx || getKnex())('workout_sessions');
}

function sessionExercisesTable(trx) {
  return (trx || getKnex())('session_exercises');
}

function sessionSetsTable(trx) {
  return (trx || getKnex())('session_sets');
}

async function insertSession(session, trx) {
  await sessionsTable(trx).insert(session);
  return session;
}

async function insertSessionExercise(exercise, trx) {
  await sessionExercisesTable(trx).insert(exercise);
  return exercise;
}

async function insertSessionSet(set, trx) {
  await sessionSetsTable(trx).insert(set);
  return set;
}

async function findSessionById(id) {
  const session = await sessionsTable().where({ id }).first();
  if (!session) {
    return null;
  }

  const exercises = await sessionExercisesTable()
    .where({ session_id: id })
    .orderBy('position');

  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets = exerciseIds.length
    ? await sessionSetsTable()
        .whereIn('session_exercise_id', exerciseIds)
        .orderBy('session_exercise_id')
        .orderBy('set_number', 'asc')
    : [];

  return {
    session,
    exercises: exercises.map((exercise) => ({
      ...exercise,
      sets: sets.filter((set) => set.session_exercise_id === exercise.id),
    })),
  };
}

async function listSessionsByUser(userId) {
  const db = getKnex();
  return db('workout_sessions as ws')
    .leftJoin('session_exercises as se', 'se.session_id', 'ws.id')
    .leftJoin('session_sets as ss', 'ss.session_exercise_id', 'se.id')
    .where('ws.user_id', userId)
    .groupBy('ws.id')
    .orderBy('ws.performed_at', 'desc')
    .select(
      'ws.id',
      'ws.title',
      'ws.performed_at',
      'ws.notes',
      db.raw('COUNT(DISTINCT se.id) as total_exercises'),
      db.raw('COUNT(ss.id) as total_sets'),
      db.raw('COALESCE(SUM(COALESCE(ss.reps, 0) * COALESCE(ss.weight, 0)), 0) as total_volume')
    );
}

module.exports = {
  insertSession,
  insertSessionExercise,
  insertSessionSet,
  findSessionById,
  listSessionsByUser,
};
