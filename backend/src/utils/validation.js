const { ZodError } = require('zod');
const { createHttpError } = require('./errors');

function validate(schema, payload) {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw createHttpError(400, 'Invalid request payload', error.errors);
    }
    throw error;
  }
}

module.exports = {
  validate,
};
