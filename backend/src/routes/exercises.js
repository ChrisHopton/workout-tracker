const express = require('express');
const { z } = require('zod');
const { getKnex } = require('../db/knex');
const { validate } = require('../utils/validation');
const { createHttpError } = require('../utils/errors');

const router = express.Router();

const exerciseSchema = z.object({
  name: z.string().min(1),
  muscle_group: z.string().min(1),
  is_compound: z.boolean(),
});

router.get('/', async (req, res, next) => {
  try {
    const knex = getKnex();
    const exercises = await knex('exercises')
      .select('id', 'name', 'muscle_group', 'is_compound')
      .orderBy('name');
    res.json({ data: exercises });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = validate(exerciseSchema, req.body);
    const knex = getKnex();
    const [id] = await knex('exercises').insert(body);
    const exercise = await knex('exercises').where({ id }).first();
    res.status(201).json({ data: exercise });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      next(createHttpError(409, 'Exercise already exists'));
      return;
    }
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      throw createHttpError(400, 'Invalid exercise id');
    }
    const knex = getKnex();
    const exercise = await knex('exercises').where({ id }).first();
    if (!exercise) {
      throw createHttpError(404, 'Exercise not found');
    }
    res.json({ data: exercise });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
