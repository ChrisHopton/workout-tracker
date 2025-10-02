process.env.NODE_ENV = 'test';

const request = require('supertest');
const { createApp } = require('../src/app');

jest.setTimeout(20000);

const app = createApp();

async function createUser(overrides = {}) {
  const response = await request(app).post('/api/users').send({
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  });
  return response.body.data;
}

async function createExercise(overrides = {}) {
  const response = await request(app).post('/api/exercises').send({
    name: 'Test Exercise',
    muscleGroup: 'Arms',
    equipment: 'Dumbbell',
    ...overrides,
  });
  return response.body.data;
}

describe('Workout tracker API', () => {
  test('creates a user and prevents duplicate emails', async () => {
    const firstResponse = await request(app).post('/api/users').send({
      name: 'Jordan Lifter',
      email: 'jordan@example.com',
    });

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.data).toMatchObject({
      name: 'Jordan Lifter',
      email: 'jordan@example.com',
    });

    const duplicateResponse = await request(app).post('/api/users').send({
      name: 'Jordan Lifter',
      email: 'jordan@example.com',
    });

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.error).toMatch(/already registered/i);
  });

  test('creates workouts with nested exercises and retrieves them', async () => {
    const user = await createUser({ email: 'nested@example.com' });
    const exercise = await createExercise({ name: 'Back Squat', muscleGroup: 'Legs' });

    const workoutPayload = {
      userId: user.id,
      title: 'Leg Day',
      notes: 'Heavy triples',
      performedAt: '2025-01-01T12:00:00Z',
      exercises: [
        {
          exerciseId: exercise.id,
          sets: [
            { reps: 3, weight: 180, rir: 2 },
            { reps: 3, weight: 185, rir: 1 },
          ],
        },
        {
          name: 'Walking Lunges',
          notes: 'Bodyweight finisher',
          sets: [
            { reps: 12, weight: null },
          ],
        },
      ],
    };

    const createResponse = await request(app).post('/api/workouts').send(workoutPayload);
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.exercises).toHaveLength(2);

    const workoutId = createResponse.body.data.id;
    const getResponse = await request(app).get(`/api/workouts/${workoutId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data).toMatchObject({
      id: workoutId,
      userId: user.id,
      title: 'Leg Day',
    });
    expect(getResponse.body.data.exercises[0].sets).toHaveLength(2);

    const listResponse = await request(app).get(`/api/users/${user.id}/workouts`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]).toMatchObject({
      totalVolume: 180 * 3 + 185 * 3,
      totalSets: 3,
    });
  });

  test('calculates stats summary and progression', async () => {
    const user = await createUser({ email: 'stats@example.com' });
    const squat = await createExercise({ name: 'Front Squat', muscleGroup: 'Legs' });

    const workouts = [
      {
        title: 'Front Squat Focus',
        performedAt: '2025-01-10T12:00:00Z',
        sets: [
          { reps: 5, weight: 120 },
          { reps: 5, weight: 125 },
        ],
      },
      {
        title: 'Front Squat Volume',
        performedAt: '2025-01-17T12:00:00Z',
        sets: [
          { reps: 6, weight: 115 },
          { reps: 6, weight: 115 },
          { reps: 6, weight: 115 },
        ],
      },
    ];

    for (const workout of workouts) {
      await request(app).post('/api/workouts').send({
        userId: user.id,
        title: workout.title,
        performedAt: workout.performedAt,
        exercises: [
          {
            exerciseId: squat.id,
            sets: workout.sets,
          },
        ],
      });
    }

    const summaryResponse = await request(app).get(`/api/users/${user.id}/stats/summary`);
    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.data).toMatchObject({
      totalWorkouts: 2,
      totalSets: 5,
    });
    expect(summaryResponse.body.data.totalVolume).toBeCloseTo(120 * 5 + 125 * 5 + 115 * 6 * 3);

    const progressionResponse = await request(app)
      .get(`/api/users/${user.id}/stats/progression`)
      .query({ exerciseId: squat.id });

    expect(progressionResponse.status).toBe(200);
    expect(progressionResponse.body.data).toHaveLength(2);
    expect(progressionResponse.body.data[0]).toMatchObject({
      totalReps: 10,
      topSetWeight: 125,
    });
  });
});
