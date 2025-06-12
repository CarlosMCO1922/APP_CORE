// backend/routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const {
  logExercisePerformance,
  getMyPerformanceForWorkoutPlan,
  getMyPerformanceHistoryForExercise,
  deletePerformanceLog,
  checkPersonalRecords,
} = require('../controllers/progressController');
const { protect, isClientUser } = require('../middleware/authMiddleware');

// Todas as rotas aqui já estão protegidas e verificam se é um cliente
router.use(protect);
router.use(isClientUser); 

router.post('/log-performance', logExercisePerformance);
router.get('/my-history/training/:trainingId/plan/:workoutPlanId', getMyPerformanceForWorkoutPlan);
router.get('/my-exercise-history/:planExerciseId', getMyPerformanceHistoryForExercise);
router.post('/check-prs', checkPersonalRecords);

// --- NOVA ROTA PARA ELIMINAR ---
router.delete('/log/:logId', deletePerformanceLog);


module.exports = router;