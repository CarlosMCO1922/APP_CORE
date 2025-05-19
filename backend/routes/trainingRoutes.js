// backend/routes/trainingRoutes.js
const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const workoutPlanController = require('../controllers/workoutPlanController'); // Adicionar
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// --- Rotas de Treino (Training) ---
router.get('/', protect, trainingController.getAllTrainings);
router.get('/:id', protect, trainingController.getTrainingById);
router.post('/:id/book', protect, isClientUser, trainingController.bookTraining);
router.delete('/:id/book', protect, isClientUser, trainingController.cancelTrainingBooking);
router.post('/', protect, isAdminStaff, trainingController.createTraining);
router.put('/:id', protect, isAdminStaff, trainingController.updateTraining);
router.delete('/:id', protect, isAdminStaff, trainingController.deleteTraining);

// --- Rotas para Planos de Treino (WorkoutPlan) aninhadas sob um Treino específico ---
router.post(
  '/:trainingId/workout-plans',
  protect,
  isAdminStaff,
  workoutPlanController.createWorkoutPlan
);
router.get(
  '/:trainingId/workout-plans',
  protect, // Permissão verificada no controlador
  workoutPlanController.getWorkoutPlansForTraining
);
// As rotas PUT e DELETE para WorkoutPlan e todas as rotas para WorkoutPlanExercise
// podem ser montadas num router separado '/api/workout-plans' (como no workoutPlanRoutes.js acima)
// para evitar URLs excessivamente longas como /api/trainings/:trainingId/workout-plans/:planId/exercises/:exerciseId

module.exports = router;