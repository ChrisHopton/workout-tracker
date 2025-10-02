const service = require('./stats.service');

async function getSummary(req, res, next) {
  try {
    const data = await service.getSummary(req.params.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function getProgression(req, res, next) {
  try {
    const data = await service.getProgression(req.params.userId, req.query);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
  getProgression,
};
