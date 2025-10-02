const { getKnex } = require('../../lib/knex');
const { createId } = require('../../lib/ids');
const { validate } = require('../../utils/validation');
const { NotFoundError } = require('../../utils/errors');
const userRepository = require('../users/user.repository');
const exerciseRepository = require('../exercises/exercise.repository');
const repository = require('./workout.repository');
const { createWorkoutSchema } = require('./workout.schema');

async function ensureUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
}

async function createWorkout(payload) {
  const data = validate(createWorkoutSchema, payload);
  await ensureUser(data.userId);

  const db = getKnex();
  const sessionId = createId();
  const now = new Date().toISOString();
  const performedAtIso = data.performedAt.toISOString();

  await db.transaction(async (trx) => {
    await repository.insertSession(
      {
        id: sessionId,
        user_id: data.userId,
        title: data.title,
        notes: data.notes || null,
        performed_at: performedAtIso,
        created_at: now,
        updated_at: now,
      },
      trx
    );

    for (let index = 0; index < data.exercises.length; index += 1) {
      const exerciseInput = data.exercises[index];
      let exerciseName = exerciseInput.name;
      let exerciseId = exerciseInput.exerciseId || null;

      if (exerciseId) {
        const exercise = await exerciseRepository.findById(exerciseId, trx);
        if (!exercise) {
          throw new NotFoundError(`Exercise ${exerciseId} not found`);
        }
        if (!exerciseName) {
          exerciseName = exercise.name;
        }
      }

      const sessionExerciseId = createId();
      await repository.insertSessionExercise(
        {
          id: sessionExerciseId,
          session_id: sessionId,
          exercise_id: exerciseId,
          name: exerciseName,
          notes: exerciseInput.notes || null,
          position: index,
          created_at: now,
          updated_at: now,
        },
        trx
      );

      for (let setIndex = 0; setIndex < exerciseInput.sets.length; setIndex += 1) {
        const setInput = exerciseInput.sets[setIndex];
        const setNumber = setInput.setNumber || setIndex + 1;
        await repository.insertSessionSet(
          {
            id: createId(),
            session_exercise_id: sessionExerciseId,
            set_number: setNumber,
            reps: setInput.reps,
            weight: setInput.weight ?? null,
            rir: setInput.rir ?? null,
            created_at: now,
            updated_at: now,
          },
          trx
        );
      }
    }
  });

  return getWorkout(sessionId);
}

async function getWorkout(id) {
  const data = await repository.findSessionById(id);
  if (!data) {
    throw new NotFoundError('Workout not found');
  }

  const { session, exercises } = data;
  return {
    id: session.id,
    userId: session.user_id,
    title: session.title,
    notes: session.notes,
    performedAt: session.performed_at,
    exercises: exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exercise_id,
      name: exercise.name,
      notes: exercise.notes,
      position: exercise.position,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        setNumber: set.set_number,
        reps: set.reps,
        weight: set.weight,
        rir: set.rir,
      })),
    })),
  };
}

async function listUserWorkouts(userId) {
  await ensureUser(userId);
  const sessions = await repository.listSessionsByUser(userId);
  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    performedAt: session.performed_at,
    notes: session.notes,
    totalExercises: Number(session.total_exercises || 0),
    totalSets: Number(session.total_sets || 0),
    totalVolume: Number(session.total_volume || 0),
  }));
}

module.exports = {
  createWorkout,
  getWorkout,
  listUserWorkouts,
};
