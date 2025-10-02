const { v4: uuid } = require('uuid');

exports.seed = async function seed(knex) {
  await knex('session_sets').del();
  await knex('session_exercises').del();
  await knex('workout_sessions').del();
  await knex('exercises').del();
  await knex('users').del();

  const now = new Date().toISOString();

  const users = [
    { id: uuid(), name: 'Avery Athlete', email: 'avery@example.com', created_at: now, updated_at: now },
    { id: uuid(), name: 'Sam Strength', email: 'sam@example.com', created_at: now, updated_at: now },
  ];

  await knex('users').insert(users);

  const exercises = [
    { id: uuid(), name: 'Back Squat', muscle_group: 'Legs', equipment: 'Barbell', created_at: now, updated_at: now },
    { id: uuid(), name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', created_at: now, updated_at: now },
    { id: uuid(), name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell', created_at: now, updated_at: now },
  ];

  await knex('exercises').insert(exercises);

  const squat = exercises[0];
  const bench = exercises[1];

  const workoutOneId = uuid();
  const workoutTwoId = uuid();

  await knex('workout_sessions').insert([
    {
      id: workoutOneId,
      user_id: users[0].id,
      title: 'Lower Body Power',
      notes: 'Felt strong today',
      performed_at: new Date('2024-12-01T10:00:00Z').toISOString(),
      created_at: now,
      updated_at: now,
    },
    {
      id: workoutTwoId,
      user_id: users[0].id,
      title: 'Upper Body Volume',
      notes: 'Focus on tempo',
      performed_at: new Date('2024-12-05T10:00:00Z').toISOString(),
      created_at: now,
      updated_at: now,
    },
  ]);

  const squatExerciseId = uuid();
  const benchExerciseId = uuid();
  const inclineExerciseId = uuid();

  await knex('session_exercises').insert([
    {
      id: squatExerciseId,
      session_id: workoutOneId,
      exercise_id: squat.id,
      name: squat.name,
      notes: 'Pause at the bottom',
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: benchExerciseId,
      session_id: workoutTwoId,
      exercise_id: bench.id,
      name: bench.name,
      notes: '3 second eccentric',
      position: 0,
      created_at: now,
      updated_at: now,
    },
    {
      id: inclineExerciseId,
      session_id: workoutTwoId,
      exercise_id: null,
      name: 'Incline Dumbbell Press',
      notes: null,
      position: 1,
      created_at: now,
      updated_at: now,
    },
  ]);

  await knex('session_sets').insert([
    {
      id: uuid(),
      session_exercise_id: squatExerciseId,
      set_number: 1,
      reps: 5,
      weight: 140,
      rir: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      session_exercise_id: squatExerciseId,
      set_number: 2,
      reps: 5,
      weight: 145,
      rir: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      session_exercise_id: squatExerciseId,
      set_number: 3,
      reps: 5,
      weight: 150,
      rir: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      session_exercise_id: benchExerciseId,
      set_number: 1,
      reps: 8,
      weight: 90,
      rir: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      session_exercise_id: benchExerciseId,
      set_number: 2,
      reps: 8,
      weight: 90,
      rir: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      session_exercise_id: inclineExerciseId,
      set_number: 1,
      reps: 12,
      weight: 32.5,
      rir: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuid(),
      session_exercise_id: inclineExerciseId,
      set_number: 2,
      reps: 12,
      weight: 32.5,
      rir: 0,
      created_at: now,
      updated_at: now,
    },
  ]);
};
