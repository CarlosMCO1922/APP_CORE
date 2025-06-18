// backend/routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const {
  logExercisePerformance,
  getMyPerformanceForWorkoutPlan,
  getMyPerformanceHistoryForExercise,
  deletePerformanceLog,
  checkPersonalRecords,
  getMyPersonalRecords,
  updatePerformanceLog,
  adminGetUserRecords,
} = require('../controllers/progressController');

const { protect, isClientUser, isStaff } = require('../middleware/authMiddleware');

// Todas as rotas aqui já estão protegidas e verificam se é um cliente
//router.use(protect);
//router.use(isClientUser); 

// --- ROTAS DE CLIENTE ---
router.post('/log-performance', protect, isClientUser, logExercisePerformance);
router.patch('/log/:logId', protect, isClientUser, updatePerformanceLog);
router.delete('/log/:logId', protect, isClientUser, deletePerformanceLog);
router.get('/my-history/training/:trainingId/plan/:workoutPlanId', protect, isClientUser, getMyPerformanceForWorkoutPlan);
router.get('/my-exercise-history/:planExerciseId', protect, isClientUser, getMyPerformanceHistoryForExercise);
router.post('/check-prs', protect, isClientUser, checkPersonalRecords);
router.get('/my-records', protect, isClientUser, getMyPersonalRecords);

// --- ROTA DE STAFF/ADMIN ---
router.get('/admin/user-records/:userId', protect, isStaff, adminGetUserRecords);



module.exports = router;