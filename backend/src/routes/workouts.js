const express = require('express');
const { z } = require('zod');
const { getKnex } = require('../db/knex');
const { validate } = require('../utils/validation');
const { createHttpError } = require('../utils/errors');

const router = express.Router();

const workoutSchema = z.object({
  profile_id: z.number().int().positive(),
  name: z.string().min(1),
  scheduled_for: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  exercises: z
    .array(
      z.object({
        exercise_id: z.number().int().positive(),
        order_index: z.number().int().nonnegative(),
        prescriptions: z.array(
          z.object({
            set_number: z.number().int().positive(),
            target_reps: z.number().int().positive(),
            target_weight: z.number().nonnegative(),
            rir: z.number().int().nullable().optional(),
            tempo: z.string().nullable().optional(),
          })
        ),
      })
    )
    .min(1),
});

router.post('/', async (req, res, next) => {
  try {
    const body = validate(workoutSchema, req.body);
    const knex = getKnex();

    const [workoutId] = await knex('workouts').insert({
      profile_id: body.profile_id,
      name: body.name,
      scheduled_for: body.scheduled_for,
    });

    for (const exercise of body.exercises) {
      const [workoutExerciseId] = await knex('workout_exercises').insert({
        workout_id: workoutId,
        exercise_id: exercise.exercise_id,
        order_index: exercise.order_index,
      });

      if (exercise.prescriptions?.length) {
        const rows = exercise.prescriptions.map((p) => ({
          workout_exercise_id: workoutExerciseId,
          set_number: p.set_number,
          target_reps: p.target_reps,
          target_weight: p.target_weight,
          rir: p.rir ?? null,
          tempo: p.tempo ?? null,
        }));
        await knex('prescriptions').insert(rows);
      }
    }

    const workout = await knex('workouts').where({ id: workoutId }).first();
    res.status(201).json({ data: workout });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const workoutId = Number(req.params.id);
    if (!workoutId) {
      throw createHttpError(400, 'Invalid workout id');
    }
    const knex = getKnex();

    const workout = await knex('workouts').where({ id: workoutId }).first();
    if (!workout) {
      throw createHttpError(404, 'Workout not found');
    }

    const rows = await knex('workout_exercises as we')
      .leftJoin('exercises as e', 'we.exercise_id', 'e.id')
      .leftJoin('prescriptions as p', 'p.workout_exercise_id', 'we.id')
      .select(
        'we.id as workout_exercise_id',
        'we.order_index',
        'e.id as exercise_id',
        'e.name as exercise_name',
        'e.muscle_group',
        'e.is_compound',
        'p.id as prescription_id',
        'p.set_number',
        'p.target_reps',
        'p.target_weight',
        'p.rir',
        'p.tempo'
      )
      .where('we.workout_id', workoutId)
      .orderBy('we.order_index')
      .orderBy('p.set_number');

    const exercises = [];
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.workout_exercise_id)) {
        const exercise = {
          workout_exercise_id: row.workout_exercise_id,
          exercise_id: row.exercise_id,
          name: row.exercise_name,
          muscle_group: row.muscle_group,
          is_compound: !!row.is_compound,
          order_index: row.order_index,
          prescriptions: [],
        };
        map.set(row.workout_exercise_id, exercise);
        exercises.push(exercise);
      }
      const exercise = map.get(row.workout_exercise_id);
      if (row.prescription_id) {
        exercise.prescriptions.push({
          id: row.prescription_id,
          set_number: row.set_number,
          target_reps: row.target_reps,
          target_weight: Number(row.target_weight),
          rir: row.rir,
          tempo: row.tempo,
        });
      }
    }

    res.json({ data: { ...workout, exercises } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
