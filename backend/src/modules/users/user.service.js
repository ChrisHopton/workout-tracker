const { createId } = require('../../lib/ids');
const { validate } = require('../../utils/validation');
const { createUserSchema } = require('./user.schema');
const repository = require('./user.repository');
const { BadRequestError, NotFoundError } = require('../../utils/errors');

async function createUser(payload) {
  const data = validate(createUserSchema, payload);
  const existing = await repository.findByEmail(data.email);
  if (existing) {
    throw new BadRequestError('Email is already registered');
  }

  const user = {
    id: createId(),
    name: data.name,
    email: data.email.toLowerCase(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return repository.create(user);
}

async function getUser(id) {
  const user = await repository.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
}

module.exports = {
  createUser,
  getUser,
};
