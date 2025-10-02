const { Router } = require('express');
const controller = require('./exercise.controller');

const router = Router();

router.post('/', controller.createExercise);
router.get('/', controller.listExercises);

module.exports = router;
