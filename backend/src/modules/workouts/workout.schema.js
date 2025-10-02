const { z } = require('zod');

const setSchema = z.object({
  setNumber: z.coerce.number().int().min(1).optional(),
  reps: z.coerce.number().int().min(0, 'Reps must be zero or greater'),
  weight: z
    .union([z.null(), z.coerce.number().nonnegative('Weight must be zero or greater')])
    .optional()
    .transform((value) => (value === undefined ? null : value)),
  rir: z
    .union([z.null(), z.coerce.number().int()])
    .optional()
    .transform((value) => (value === undefined ? null : value)),
});

const exerciseSchema = z
  .object({
    exerciseId: z.string().uuid().optional(),
    name: z.string().min(1, 'Exercise name is required').optional(),
    notes: z.string().max(2000).optional(),
    sets: z.array(setSchema).min(1, 'At least one set is required'),
  })
  .refine((value) => value.exerciseId || value.name, {
    message: 'Exercise name is required when exerciseId is not provided',
    path: ['name'],
  });

const createWorkoutSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  notes: z.string().max(4000).optional(),
  performedAt: z.preprocess((value) => {
    if (!value) {
      return new Date();
    }
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }
    return parsed;
  }, z.date()),
  exercises: z.array(exerciseSchema).min(1, 'At least one exercise is required'),
});

module.exports = {
  createWorkoutSchema,
};
