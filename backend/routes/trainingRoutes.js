// backend/routes/trainingRoutes.js
const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const workoutPlanController = require('../controllers/workoutPlanController'); // Adicionar
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// --- Rotas de Treino (Training) ---
router.get('/', protect, trainingController.getAllTrainings);
router.post('/', protect, isAdminStaff, trainingController.createTraining);
router.get('/:id', protect, trainingController.getTrainingById);
router.post('/:id/book', protect, isClientUser, trainingController.bookTraining);
router.delete('/:id/book', protect, isClientUser, trainingController.cancelTrainingBooking);
router.put('/:id', protect, isAdminStaff, trainingController.updateTraining);
router.delete('/:id', protect, isAdminStaff, trainingController.deleteTraining);

router.post('/:masterTrainingId/subscribe-recurring', /* protect, isClientUser, */ trainingController.subscribeToRecurringTrainingService);

router.post(
    '/:trainingId/admin-book-client',
    protect,
    isAdminStaff,
    trainingController.adminBookClientForTraining
);
router.delete(
    '/:trainingId/admin-cancel-booking/:userId', // :userId para identificar qual cliente remover
    protect,
    isAdminStaff,
    trainingController.adminCancelClientBooking
);

router.get(
    '/stats/current-week-signups',
    protect,
    isAdminStaff,
    trainingController.getCurrentWeekSignups
);

router.get(
    '/stats/today-count',
    protect,
    isAdminStaff,
    trainingController.getTodayTrainingsCount
);

// --- Rotas para Planos de Treino (WorkoutPlan) aninhadas sob um Treino específico ---
/*router.post(
  '/:trainingId/workout-plans', 
  protect,
  isAdminStaff,
  workoutPlanController.createWorkoutPlan
);*/
router.get(
  '/:trainingId/workout-plans',
  protect, // Permissão verificada no controlador
  workoutPlanController.getWorkoutPlansForTraining
);

router.get(
    '/:trainingId/waitlist',
    protect,
    isAdminStaff,
    trainingController.adminGetTrainingWaitlist
);
router.post( // Usar POST para uma ação de 'promover' que modifica estado
    '/:trainingId/waitlist/promote',
    protect,
    isAdminStaff,
    trainingController.adminPromoteFromWaitlist
);
// As rotas PUT e DELETE para WorkoutPlan e todas as rotas para WorkoutPlanExercise
// podem ser montadas num router separado '/api/workout-plans' (como no workoutPlanRoutes.js acima)
// para evitar URLs excessivamente longas como /api/trainings/:trainingId/workout-plans/:planId/exercises/:exerciseId

module.exports = router;