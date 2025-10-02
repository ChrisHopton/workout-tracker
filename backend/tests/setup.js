const { getKnex, destroyKnex } = require('../src/lib/knex');

disableConsoleNoise();

beforeAll(async () => {
  const db = getKnex();
  await db.migrate.latest();
});

beforeEach(async () => {
  const db = getKnex();
  await db('session_sets').del();
  await db('session_exercises').del();
  await db('workout_sessions').del();
  await db('exercises').del();
  await db('users').del();
});

afterAll(async () => {
  await destroyKnex();
});

function disableConsoleNoise() {
  const originalError = console.error; // eslint-disable-line no-console
  const originalWarn = console.warn; // eslint-disable-line no-console
  beforeAll(() => {
    console.error = jest.fn(); // eslint-disable-line no-console
    console.warn = jest.fn(); // eslint-disable-line no-console
  });
  afterAll(() => {
    console.error = originalError; // eslint-disable-line no-console
    console.warn = originalWarn; // eslint-disable-line no-console
  });
}
