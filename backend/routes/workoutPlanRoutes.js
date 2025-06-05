// backend/routes/workoutPlanRoutes.js
const express = require('express');
const router = express.Router();
const workoutPlanController = require('../controllers/workoutPlanController');
// const workoutPlanExerciseController = require('../controllers/workoutPlanExerciseController'); // << REMOVER SE NÃO FOR MAIS USADO DIRETAMENTE
const { protect, isAdminStaff } = require('../middleware/authMiddleware');

// Rota para CLIENTES listarem/pesquisarem planos visíveis
router.get(
  '/visible', // GET /api/workout-plans/visible
  protect,
  workoutPlanController.getVisibleWorkoutPlans
);

// --- Rotas para Admin gerir Planos de Treino "Modelo" / Globais ---
router.post(
  '/global', // POST /api/workout-plans/global
  protect,
  isAdminStaff,
  workoutPlanController.createGlobalWorkoutPlan
);
router.get(
  '/global', // GET /api/workout-plans/global
  protect,
  isAdminStaff,
  workoutPlanController.getAllGlobalWorkoutPlans
);
router.get(
  '/global/:planId', // GET /api/workout-plans/global/:planId
  protect,
  isAdminStaff,
  workoutPlanController.getGlobalWorkoutPlanById
);
router.put(
  '/global/:planId', // PUT /api/workout-plans/global/:planId
  protect,
  isAdminStaff,
  workoutPlanController.updateGlobalWorkoutPlan
);
router.delete(
  '/global/:planId', // DELETE /api/workout-plans/global/:planId
  protect,
  isAdminStaff,
  workoutPlanController.deleteGlobalWorkoutPlan
);

// --- Rotas para gerir EXERCÍCIOS dentro de um Plano de Treino "Modelo" / Global ---
router.post(
  '/global/:planId/exercises', // POST /api/workout-plans/global/:planId/exercises
  protect,
  isAdminStaff,
  workoutPlanController.addExerciseToGlobalWorkoutPlan // Handler do workoutPlanController
);
router.get(
  '/global/:planId/exercises', // GET /api/workout-plans/global/:planId/exercises
  protect, // Considerar acesso de cliente aqui se necessário
  workoutPlanController.getExercisesForGlobalWorkoutPlan // Handler do workoutPlanController
);
router.put(
  '/global/exercises/:planExerciseId', // PUT /api/workout-plans/global/exercises/:planExerciseId
  protect,
  isAdminStaff,
  workoutPlanController.updateExerciseInGlobalWorkoutPlan // Handler do workoutPlanController
);
router.delete(
  '/global/exercises/:planExerciseId', // DELETE /api/workout-plans/global/exercises/:planExerciseId
  protect,
  isAdminStaff,
  workoutPlanController.removeExerciseFromGlobalWorkoutPlan // Handler do workoutPlanController
);

// --- Rotas para ASSOCIAR/DESASSOCIAR Planos "Modelo" a Treinos Específicos ---
router.post(
  '/:planId/assign-to-training/:trainingId', // POST /api/workout-plans/:planId/assign-to-training/:trainingId
  protect,
  isAdminStaff,
  workoutPlanController.assignPlanToTraining
);
router.delete(
  '/:planId/remove-from-training/:trainingId', // DELETE /api/workout-plans/:planId/remove-from-training/:trainingId
  protect,
  isAdminStaff,
  workoutPlanController.removePlanFromTraining
);

// As rotas que estavam antes, como PUT /:planId e DELETE /:planId (sem /global)
// podem ser removidas se toda a gestão de planos passar a ser "global" ou através de um treino.
// Se as mantiveres, certifica-te que as funções workoutPlanController.updateWorkoutPlan
// e workoutPlanController.deleteWorkoutPlan (sem "Global" no nome) existem e fazem sentido
// no contexto de um plano não global. Dado a refatoração para M:N, estas provavelmente devem ser removidas
// ou redirecionar para as globais se fizer sentido. Por agora, comentei-as para evitar conflitos.

// router.put('/:planId', protect, isAdminStaff, workoutPlanController.updateOldPlan); // Exemplo: se houvesse uma updateOldPlan
// router.delete('/:planId', protect, isAdminStaff, workoutPlanController.deleteOldPlan); // Exemplo

module.exports = router;