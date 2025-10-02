const service = require('./user.service');

async function createUser(req, res, next) {
  try {
    const user = await service.createUser(req.body);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await service.getUser(req.params.userId);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  getUser,
};
