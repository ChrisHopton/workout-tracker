const express = require('express');
const { z } = require('zod');
const dayjs = require('../utils/dayjs');
const { getKnex } = require('../db/knex');
const { validate } = require('../utils/validation');
const { createHttpError } = require('../utils/errors');

const router = express.Router();

const createSessionSchema = z.object({
  profile_id: z.number().int().positive(),
  workout_id: z.number().int().positive(),
  started_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const body = validate(createSessionSchema, req.body);
    const knex = getKnex();

    const startedAt = (body.started_at ? dayjs(body.started_at) : dayjs())
      .utc()
      .format('YYYY-MM-DD HH:mm:ss');

    const [sessionId] = await knex('sessions').insert({
      profile_id: body.profile_id,
      workout_id: body.workout_id,
      started_at: startedAt,
      notes: body.notes || null,
    });

    const session = await knex('sessions').where({ id: sessionId }).first();
    res.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
});

const parseRequiredNumber = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return value;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const parseOptionalNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? value : parsed;
  }
  if (typeof value === 'number') {
    return value;
  }
  return value;
};

const setSchema = z.object({
  exercise_id: z.preprocess(
    parseRequiredNumber,
    z.number().int().positive()
  ),
  set_number: z.preprocess(parseRequiredNumber, z.number().int().positive()),
  actual_reps: z
    .preprocess(
      parseOptionalNumber,
      z.union([z.number().int().min(0), z.null()])
    )
    .transform((value) => (value ?? null)),
  actual_weight: z
    .preprocess(
      parseOptionalNumber,
      z.union([z.number().min(0), z.null()])
    )
    .transform((value) => (value ?? null)),
});

router.post('/:id/sets/bulk', async (req, res, next) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) {
      throw createHttpError(400, 'Invalid session id');
    }
    const knex = getKnex();
    const session = await knex('sessions').where({ id: sessionId }).first();
    if (!session) {
      throw createHttpError(404, 'Session not found');
    }

    const payloadSchema = z.object({ sets: z.array(setSchema).min(1) });
    const body = validate(payloadSchema, req.body);

    const rows = body.sets.map((set) => ({
      session_id: sessionId,
      exercise_id: set.exercise_id,
      set_number: set.set_number,
      actual_reps: set.actual_reps ?? null,
      actual_weight: set.actual_weight ?? null,
    }));

    if (rows.length) {
      await knex.transaction(async (trx) => {
        for (const row of rows) {
          const updated = await trx('session_sets')
            .where({
              session_id: row.session_id,
              exercise_id: row.exercise_id,
              set_number: row.set_number,
            })
            .update({
              actual_reps: row.actual_reps,
              actual_weight: row.actual_weight,
            });

          if (!updated) {
            await trx('session_sets').insert(row);
          }
        }
      });
    }

    const updatedSets = await knex('session_sets')
      .where({ session_id: sessionId })
      .orderBy(['exercise_id', 'set_number']);

    res.json({ data: updatedSets });
  } catch (error) {
    next(error);
  }
});

const finishSchema = z.object({
  ended_at: z.string().datetime().optional(),
  notes: z.string().optional(),
});

router.post('/:id/finish', async (req, res, next) => {
  try {
    const sessionId = Number(req.params.id);
    if (!sessionId) {
      throw createHttpError(400, 'Invalid session id');
    }

    const body = validate(finishSchema, req.body ?? {});
    const knex = getKnex();
    const endedAt = (body.ended_at ? dayjs(body.ended_at) : dayjs())
      .utc()
      .format('YYYY-MM-DD HH:mm:ss');

    const updated = await knex('sessions')
      .where({ id: sessionId })
      .update({
        ended_at: endedAt,
        notes: body.notes ?? null,
      });

    if (!updated) {
      throw createHttpError(404, 'Session not found');
    }

    const session = await knex('sessions').where({ id: sessionId }).first();
    res.json({ data: session });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
