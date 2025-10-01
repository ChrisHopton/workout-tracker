const dayjs = require('../src/utils/dayjs');

const exerciseCatalog = [
  { name: 'Bench Press', muscle_group: 'Chest', is_compound: true },
  { name: 'Incline Dumbbell Press', muscle_group: 'Chest', is_compound: true },
  { name: 'Overhead Press', muscle_group: 'Shoulders', is_compound: true },
  { name: 'Lat Pulldown', muscle_group: 'Back', is_compound: true },
  { name: 'Barbell Row', muscle_group: 'Back', is_compound: true },
  { name: 'Seated Row', muscle_group: 'Back', is_compound: false },
  { name: 'Back Squat', muscle_group: 'Legs', is_compound: true },
  { name: 'Leg Press', muscle_group: 'Legs', is_compound: true },
  { name: 'Romanian Deadlift', muscle_group: 'Hamstrings', is_compound: true },
  { name: 'Leg Curl', muscle_group: 'Hamstrings', is_compound: false },
  { name: 'Leg Extension', muscle_group: 'Quads', is_compound: false },
  { name: 'Calf Raise', muscle_group: 'Calves', is_compound: false },
  { name: 'Cable Fly', muscle_group: 'Chest', is_compound: false },
  { name: 'Lateral Raise', muscle_group: 'Shoulders', is_compound: false },
  { name: 'Face Pull', muscle_group: 'Upper Back', is_compound: false },
  { name: 'Triceps Pushdown', muscle_group: 'Triceps', is_compound: false },
  { name: 'Biceps Curl', muscle_group: 'Biceps', is_compound: false },
  { name: 'Hammer Curl', muscle_group: 'Biceps', is_compound: false },
  { name: 'Hip Thrust', muscle_group: 'Glutes', is_compound: true },
  { name: 'Bulgarian Split Squat', muscle_group: 'Legs', is_compound: true },
];

const weightPresets = {
  Male: {
    'Bench Press': 185,
    'Incline Dumbbell Press': 60,
    'Overhead Press': 115,
    'Lat Pulldown': 150,
    'Barbell Row': 165,
    'Seated Row': 140,
    'Back Squat': 245,
    'Leg Press': 400,
    'Romanian Deadlift': 205,
    'Leg Curl': 110,
    'Leg Extension': 120,
    'Calf Raise': 180,
    'Cable Fly': 40,
    'Lateral Raise': 25,
    'Face Pull': 70,
    'Triceps Pushdown': 80,
    'Biceps Curl': 35,
    'Hammer Curl': 40,
    'Hip Thrust': 225,
    'Bulgarian Split Squat': 115,
  },
  Female: {
    'Bench Press': 95,
    'Incline Dumbbell Press': 35,
    'Overhead Press': 65,
    'Lat Pulldown': 110,
    'Barbell Row': 105,
    'Seated Row': 95,
    'Back Squat': 155,
    'Leg Press': 250,
    'Romanian Deadlift': 135,
    'Leg Curl': 80,
    'Leg Extension': 90,
    'Calf Raise': 120,
    'Cable Fly': 25,
    'Lateral Raise': 15,
    'Face Pull': 50,
    'Triceps Pushdown': 55,
    'Biceps Curl': 25,
    'Hammer Curl': 25,
    'Hip Thrust': 185,
    'Bulgarian Split Squat': 75,
  },
};

const workoutTemplates = [
  {
    name: 'Push A',
    dayOffset: 0,
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, rir: 2 },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10, rir: 2 },
      { name: 'Overhead Press', sets: 3, reps: 8, rir: 2 },
      { name: 'Lateral Raise', sets: 3, reps: 12, rir: 1 },
      { name: 'Triceps Pushdown', sets: 3, reps: 12, rir: 1 },
    ],
  },
  {
    name: 'Pull A',
    dayOffset: 1,
    exercises: [
      { name: 'Barbell Row', sets: 4, reps: 8, rir: 2 },
      { name: 'Lat Pulldown', sets: 3, reps: 10, rir: 2 },
      { name: 'Seated Row', sets: 3, reps: 10, rir: 2 },
      { name: 'Face Pull', sets: 3, reps: 15, rir: 1 },
      { name: 'Biceps Curl', sets: 3, reps: 12, rir: 1 },
    ],
  },
  {
    name: 'Legs A',
    dayOffset: 3,
    exercises: [
      { name: 'Back Squat', sets: 4, reps: 8, rir: 2 },
      { name: 'Romanian Deadlift', sets: 3, reps: 8, rir: 2 },
      { name: 'Leg Extension', sets: 3, reps: 12, rir: 1 },
      { name: 'Leg Curl', sets: 3, reps: 12, rir: 1 },
      { name: 'Calf Raise', sets: 4, reps: 15, rir: 1 },
    ],
  },
  {
    name: 'Push B',
    dayOffset: 4,
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 6, rir: 2 },
      { name: 'Cable Fly', sets: 3, reps: 12, rir: 1 },
      { name: 'Overhead Press', sets: 3, reps: 10, rir: 2 },
      { name: 'Lateral Raise', sets: 3, reps: 15, rir: 1 },
      { name: 'Triceps Pushdown', sets: 3, reps: 12, rir: 1 },
    ],
  },
  {
    name: 'Pull B',
    dayOffset: 5,
    exercises: [
      { name: 'Lat Pulldown', sets: 3, reps: 10, rir: 2 },
      { name: 'Seated Row', sets: 3, reps: 10, rir: 2 },
      { name: 'Hammer Curl', sets: 3, reps: 12, rir: 1 },
      { name: 'Face Pull', sets: 3, reps: 15, rir: 1 },
      { name: 'Hip Thrust', sets: 3, reps: 10, rir: 2 },
    ],
  },
];

async function ensureProfiles(knex) {
  for (const name of ['Male', 'Female']) {
    const existing = await knex('profiles').where({ name }).first();
    if (!existing) {
      await knex('profiles').insert({ name });
    }
  }
  const profiles = await knex('profiles').select('id', 'name');
  return profiles.reduce((acc, profile) => {
    acc[profile.name] = profile.id;
    return acc;
  }, {});
}

async function ensureExercises(knex) {
  for (const exercise of exerciseCatalog) {
    const existing = await knex('exercises').where({ name: exercise.name }).first();
    if (!existing) {
      await knex('exercises').insert(exercise);
    }
  }
  const exercises = await knex('exercises').select('id', 'name');
  return exercises.reduce((acc, exercise) => {
    acc[exercise.name] = exercise.id;
    return acc;
  }, {});
}

async function seedWeekPlan(knex, profileId, profileName, exerciseIds, weekStart) {
  for (const template of workoutTemplates) {
    const scheduledFor = weekStart.add(template.dayOffset, 'day').format('YYYY-MM-DD');
    const existing = await knex('workouts')
      .where({ profile_id: profileId, name: template.name, scheduled_for: scheduledFor })
      .first();
    if (existing) {
      continue;
    }
    const [workoutId] = await knex('workouts').insert({
      profile_id: profileId,
      name: template.name,
      scheduled_for: scheduledFor,
    });

    let orderIndex = 0;
    for (const exercise of template.exercises) {
      const exerciseId = exerciseIds[exercise.name];
      if (!exerciseId) continue;
      const [workoutExerciseId] = await knex('workout_exercises').insert({
        workout_id: workoutId,
        exercise_id: exerciseId,
        order_index: orderIndex,
      });
      orderIndex += 1;

      const baseWeight = weightPresets[profileName][exercise.name] || 50;
      const prescriptions = [];
      for (let set = 1; set <= exercise.sets; set += 1) {
        prescriptions.push({
          workout_exercise_id: workoutExerciseId,
          set_number: set,
          target_reps: exercise.reps,
          target_weight: baseWeight,
          rir: exercise.rir,
          tempo: null,
        });
      }
      if (prescriptions.length) {
        await knex('prescriptions').insert(prescriptions);
      }
    }
  }
}

async function seedDemoSessions(knex, profileId, weekStart) {
  const sampleWorkout = await knex('workouts')
    .where({ profile_id: profileId })
    .andWhere('scheduled_for', weekStart.format('YYYY-MM-DD'))
    .first();

  if (!sampleWorkout) {
    return;
  }
  const existing = await knex('sessions')
    .where({ profile_id: profileId, workout_id: sampleWorkout.id })
    .first();
  if (existing) {
    return;
  }

  const startedAt = weekStart.subtract(3, 'day').hour(17).minute(0).second(0).utc().toISOString();
  const endedAt = weekStart.subtract(3, 'day').hour(18).minute(0).second(0).utc().toISOString();

  const [sessionId] = await knex('sessions').insert({
    profile_id: profileId,
    workout_id: sampleWorkout.id,
    started_at: startedAt,
    ended_at: endedAt,
    notes: 'Sample session for charts',
  });

  const workoutExercises = await knex('workout_exercises')
    .where({ workout_id: sampleWorkout.id })
    .select('id', 'exercise_id');

  for (const workoutExercise of workoutExercises) {
    const prescriptions = await knex('prescriptions')
      .where({ workout_exercise_id: workoutExercise.id })
      .orderBy('set_number');
    for (const prescription of prescriptions) {
      await knex('session_sets').insert({
        session_id: sessionId,
        exercise_id: workoutExercise.exercise_id,
        set_number: prescription.set_number,
        actual_reps: prescription.target_reps,
        actual_weight: prescription.target_weight,
      });
    }
  }
}

exports.seed = async function (knex) {
  const profileIds = await ensureProfiles(knex);
  const exerciseIds = await ensureExercises(knex);

  const weekStart = dayjs().utc().startOf('isoWeek');

  for (const [profileName, profileId] of Object.entries(profileIds)) {
    await seedWeekPlan(knex, profileId, profileName, exerciseIds, weekStart);
    await seedDemoSessions(knex, profileId, weekStart);
  }

  const settingsExists = await knex('settings').where({ key: 'units' }).first();
  if (!settingsExists) {
    await knex('settings').insert({ key: 'units', value: 'lbs' });
  }
};
