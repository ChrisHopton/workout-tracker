const { z } = require('zod');

const createExerciseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  muscleGroup: z.string().min(1, 'Muscle group is required'),
  equipment: z.string().optional(),
});

module.exports = {
  createExerciseSchema,
};
