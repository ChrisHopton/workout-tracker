const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('A valid email is required'),
});

module.exports = {
  createUserSchema,
};
