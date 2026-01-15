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
  adminGetFullExerciseHistoryForUser,
  getExerciseHistoryForClient,
  getMyLastPerformances,
  saveTrainingSessionDraft,
  getTrainingSessionDraft,
  deleteTrainingSessionDraft,
  getTrainingSessionDraftsHistory,
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
router.get('/history/exercise/:exerciseId', protect, isClientUser, getExerciseHistoryForClient);
router.get('/my-last-performances', protect, isClientUser, getMyLastPerformances);

// --- ROTA DE STAFF/ADMIN ---
router.get('/admin/user-records/:userId', protect, isStaff, adminGetUserRecords);
router.get('/admin/exercise-history/:userId/:planExerciseId', protect, isStaff, adminGetFullExerciseHistoryForUser);

// --- ROTAS DE TRAINING SESSION DRAFT ---
router.post('/training-session/draft', protect, isClientUser, saveTrainingSessionDraft);
router.get('/training-session/draft', protect, isClientUser, getTrainingSessionDraft);
router.get('/training-session/drafts/history', protect, isClientUser, getTrainingSessionDraftsHistory);
router.delete('/training-session/draft/:draftId', protect, isClientUser, deleteTrainingSessionDraft);
router.delete('/training-session/draft', protect, isClientUser, deleteTrainingSessionDraft); // Alternativa com query params

module.exports = router;