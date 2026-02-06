// backend/routes/trainingRoutes.js
const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const workoutPlanController = require('../controllers/workoutPlanController'); // Adicionar
const { protect, isAdminStaff, isClientUser, isStaff } = require('../middleware/authMiddleware');

// --- Inscrições de visitantes (treino experimental) - rotas antes de /:id ---
router.get('/guest-signups/pending', protect, isStaff, trainingController.getGuestSignupsPending);
router.patch('/guest-signups/:id/respond', protect, isStaff, trainingController.respondToGuestSignup);
router.patch('/guest-signups/:id/propose-reschedule', protect, isStaff, trainingController.proposeGuestSignupReschedule);

// --- Rotas de Treino (Training) ---
// Rota pública para lista (sem auth) - mesma data que o calendário, para página /marcar
router.get('/public-list', trainingController.getAllTrainingsPublic);
router.get('/', protect, trainingController.getAllTrainings);
router.post('/', protect, isAdminStaff, trainingController.createTraining);
router.get('/:id', protect, trainingController.getTrainingById);
router.post('/:id/book', protect, isClientUser, trainingController.bookTraining);
router.delete('/:id/book', protect, isClientUser, trainingController.cancelTrainingBooking);
router.put('/:id', protect, isAdminStaff, trainingController.updateTraining);
router.get('/:id/check-recurring', protect, trainingController.checkRecurringTrainings);
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

router.get(
    '/stats/today-enrollments-count',
    protect,
    isAdminStaff,
    trainingController.getTodayTrainingsEnrollmentsCount
);

// --- Rotas para Planos de Treino (WorkoutPlan) aninhadas sob um Treino específico ---
router.get(
  '/:trainingId/workout-plans',
  protect, 
  workoutPlanController.getWorkoutPlansForTraining
);

router.get(
    '/:trainingId/waitlist',
    protect,
    isAdminStaff,
    trainingController.adminGetTrainingWaitlist
);
router.post( 
    '/:trainingId/waitlist/promote',
    protect,
    isAdminStaff,
    trainingController.adminPromoteFromWaitlist
);
module.exports = router;