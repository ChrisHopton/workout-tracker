const express = require('express');
const dayjs = require('../utils/dayjs');
const { getKnex } = require('../db/knex');
const { createHttpError } = require('../utils/errors');
const { toSqlDateTime } = require('../utils/sql');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const knex = getKnex();
    const profiles = await knex('profiles').select('id', 'name');
    res.json({ data: profiles });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/week', async (req, res, next) => {
  try {
    const knex = getKnex();
    const profileId = Number(req.params.id);
    if (!profileId) {
      throw createHttpError(400, 'Invalid profile id');
    }

    const startParam = req.query.start;
    const startDate = startParam
      ? dayjs(startParam).utc().startOf('day')
      : dayjs().utc().startOf('isoWeek');
    const endDate = startDate.add(6, 'day');

    const rows = await knex('workouts as w')
      .leftJoin('workout_exercises as we', 'we.workout_id', 'w.id')
      .leftJoin('exercises as e', 'we.exercise_id', 'e.id')
      .leftJoin('prescriptions as p', 'p.workout_exercise_id', 'we.id')
      .select(
        'w.id as workout_id',
        'w.name as workout_name',
        'w.scheduled_for',
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
      .where('w.profile_id', profileId)
      .whereBetween('w.scheduled_for', [
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD'),
      ])
      .orderBy('w.scheduled_for')
      .orderBy('we.order_index')
      .orderBy('p.set_number');

    const workoutsMap = new Map();

    for (const row of rows) {
      if (!row.workout_id) continue;
      if (!workoutsMap.has(row.workout_id)) {
        workoutsMap.set(row.workout_id, {
          id: row.workout_id,
          name: row.workout_name,
          scheduled_for: row.scheduled_for,
          exercises: [],
        });
      }
      const workout = workoutsMap.get(row.workout_id);
      if (row.workout_exercise_id) {
        let exercise = workout.exercises.find(
          (ex) => ex.workout_exercise_id === row.workout_exercise_id
        );
        if (!exercise) {
          exercise = {
            workout_exercise_id: row.workout_exercise_id,
            exercise_id: row.exercise_id,
            name: row.exercise_name,
            muscle_group: row.muscle_group,
            is_compound: !!row.is_compound,
            order_index: row.order_index,
            prescriptions: [],
          };
          workout.exercises.push(exercise);
        }
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
    }

    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const date = startDate.add(i, 'day');
      const isoDate = date.format('YYYY-MM-DD');
      const dayWorkouts = Array.from(workoutsMap.values()).filter(
        (w) => w.scheduled_for === isoDate
      );
      dayWorkouts.forEach((w) => {
        w.exercises.sort((a, b) => a.order_index - b.order_index);
      });
      days.push({
        date: isoDate,
        workouts: dayWorkouts,
      });
    }

    res.json({
      data: {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD'),
        days,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/sessions', async (req, res, next) => {
  try {
    const knex = getKnex();
    const profileId = Number(req.params.id);
    if (!profileId) {
      throw createHttpError(400, 'Invalid profile id');
    }

    const from = req.query.from ? dayjs(req.query.from).utc().startOf('day') : dayjs().utc().subtract(4, 'week').startOf('isoWeek');
    const to = req.query.to ? dayjs(req.query.to).utc().endOf('day') : dayjs().utc().endOf('day');

    const sessions = await knex('sessions as s')
      .leftJoin('workouts as w', 's.workout_id', 'w.id')
      .where('s.profile_id', profileId)
      .whereBetween('s.started_at', [toSqlDateTime(from), toSqlDateTime(to)])
      .select(
        's.id',
        's.started_at',
        's.ended_at',
        's.notes',
        'w.name as workout_name',
        'w.id as workout_id'
      )
      .orderBy('s.started_at', 'desc');

    res.json({ data: sessions });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/summary', async (req, res, next) => {
  try {
    const knex = getKnex();
    const profileId = Number(req.params.id);
    if (!profileId) {
      throw createHttpError(400, 'Invalid profile id');
    }

    const profile = await knex('profiles').where({ id: profileId }).first();
    if (!profile) {
      throw createHttpError(404, 'Profile not found');
    }

    const end = dayjs().utc();
    const start = end.subtract(7, 'day').startOf('day');

    const lastSession = await knex('sessions')
      .where({ profile_id: profileId })
      .orderBy([{ column: 'ended_at', order: 'desc' }, { column: 'started_at', order: 'desc' }])
      .first();

    const tonnageRow = await knex('session_sets as ss')
      .join('sessions as s', 'ss.session_id', 's.id')
      .where('s.profile_id', profileId)
      .whereBetween('s.started_at', [toSqlDateTime(start), toSqlDateTime(end)])
      .whereNotNull('ss.actual_reps')
      .whereNotNull('ss.actual_weight')
      .sum({ tonnage: knex.raw('ss.actual_reps * ss.actual_weight') })
      .first();

    const completedSetsRow = await knex('session_sets as ss')
      .join('sessions as s', 'ss.session_id', 's.id')
      .where('s.profile_id', profileId)
      .whereBetween('s.started_at', [toSqlDateTime(start), toSqlDateTime(end)])
      .whereNotNull('ss.actual_reps')
      .whereNotNull('ss.actual_weight')
      .count({ count: '*' })
      .first();

    const totalSetsRow = await knex('sessions as s')
      .join('workouts as w', 's.workout_id', 'w.id')
      .join('workout_exercises as we', 'we.workout_id', 'w.id')
      .join('prescriptions as p', 'p.workout_exercise_id', 'we.id')
      .where('s.profile_id', profileId)
      .whereBetween('s.started_at', [toSqlDateTime(start), toSqlDateTime(end)])
      .count({ count: 'p.id' })
      .first();

    const totalSets = Number(totalSetsRow?.count || 0);
    const completedSets = Number(completedSetsRow?.count || 0);

    res.json({
      data: {
        id: profile.id,
        name: profile.name,
        last_session_at: lastSession
          ? (lastSession.ended_at || lastSession.started_at)
          : null,
        last_week_tonnage: tonnageRow?.tonnage
          ? Number(tonnageRow.tonnage)
          : 0,
        adherence_percentage:
          totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
