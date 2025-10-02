const { ZodError } = require('zod');
const { BadRequestError } = require('../utils/errors');

function validate(schema, payload) {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestError('Validation failed', {
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    throw error;
  }
}

module.exports = {
  validate,
};
