// backend/routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const {
  logExercisePerformance,
  getMyPerformanceForWorkoutPlan,
  getMyPerformanceHistoryForExercise
} = require('../controllers/progressController');
const { protect, isClientUser } = require('../middleware/authMiddleware'); // Assumindo que isClientUser verifica role 'user'

// Todas as rotas aqui são para clientes autenticados
router.use(protect);
router.use(isClientUser); // Garante que apenas clientes acedem a estas rotas de registo de progresso pessoal

router.post('/log-performance', logExercisePerformance);
router.get('/my-history/training/:trainingId/plan/:workoutPlanId', getMyPerformanceForWorkoutPlan);
router.get('/my-exercise-history/:planExerciseId', getMyPerformanceHistoryForExercise);
// TODO: router.put('/log/:performanceId', updateExercisePerformance);

module.exports = router;