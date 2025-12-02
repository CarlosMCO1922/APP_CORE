// backend/routes/workoutPlanRoutes.js
const express = require('express');
const router = express.Router();
const workoutPlanController = require('../controllers/workoutPlanController');
const { protect, isAdminStaff } = require('../middleware/authMiddleware');

// Rota para CLIENTES listarem/pesquisarem planos visíveis
router.get(
  '/visible', 
  protect,
  workoutPlanController.getVisibleWorkoutPlans
);

router.get(
  '/visible/:planId',
  protect, 
  workoutPlanController.getVisibleGlobalWorkoutPlanByIdForClient
);

// --- Rotas para Admin gerir Planos de Treino "Modelo" / Globais ---
router.post(
  '/global', 
  protect,
  isAdminStaff,
  workoutPlanController.createGlobalWorkoutPlan
);
router.get(
  '/global', 
  protect,
  isAdminStaff,
  workoutPlanController.getAllGlobalWorkoutPlans
);
router.get(
  '/global/:planId', 
  protect,
  isAdminStaff,
  workoutPlanController.getGlobalWorkoutPlanById
);
router.put(
  '/global/:planId', 
  protect,
  isAdminStaff,
  workoutPlanController.updateGlobalWorkoutPlan
);
router.delete(
  '/global/:planId', 
  protect,
  isAdminStaff,
  workoutPlanController.deleteGlobalWorkoutPlan
);

// --- Rotas para gerir EXERCÍCIOS dentro de um Plano de Treino "Modelo" / Global ---
router.post(
  '/global/:planId/exercises', 
  protect,
  isAdminStaff,
  workoutPlanController.addExerciseToGlobalWorkoutPlan 
);
router.get(
  '/global/:planId/exercises', 
  protect, 
  workoutPlanController.getExercisesForGlobalWorkoutPlan 
);
router.put(
  '/global/exercises/:planExerciseId', 
  protect,
  isAdminStaff,
  workoutPlanController.updateExerciseInGlobalWorkoutPlan 
);
router.delete(
  '/global/exercises/:planExerciseId', 
  protect,
  isAdminStaff,
  workoutPlanController.removeExerciseFromGlobalWorkoutPlan
);

// --- Rotas para ASSOCIAR/DESASSOCIAR Planos "Modelo" a Treinos Específicos ---
router.post(
  '/:planId/assign-to-training/:trainingId', 
  protect,
  isAdminStaff,
  workoutPlanController.assignPlanToTraining
);
router.delete(
  '/:planId/remove-from-training/:trainingId', 
  protect,
  isAdminStaff,
  workoutPlanController.removePlanFromTraining
);
module.exports = router;