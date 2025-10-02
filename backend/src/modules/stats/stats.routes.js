const { Router } = require('express');
const controller = require('./stats.controller');

const router = Router({ mergeParams: true });

router.get('/summary', controller.getSummary);
router.get('/progression', controller.getProgression);

module.exports = router;
