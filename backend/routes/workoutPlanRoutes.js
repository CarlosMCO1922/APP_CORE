// backend/routes/workoutPlanRoutes.js
const express = require('express');
const router = express.Router(); // Use { mergeParams: true } se esta rota for montada aninhada e precisar dos params da rota pai
const workoutPlanController = require('../controllers/workoutPlanController');
const workoutPlanExerciseController = require('../controllers/workoutPlanExerciseController');
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware'); // Adicionar isClientUser se necessário para visualização

// As rotas para workout plans são relativas a um treino específico,
// então faz mais sentido aninhá-las em trainingRoutes.js.
// Se preferires um ficheiro dedicado para workout plans, as rotas aqui seriam algo como:
// router.post('/trainings/:trainingId/workout-plans', ...);
// router.get('/trainings/:trainingId/workout-plans', ...);
// Mas para simplificar e manter a relação clara, vamos integrar em trainingRoutes.js

// No entanto, se quisermos rotas diretas para :planId e :planExerciseId sem o /trainings/:trainingId/ no URL base:
// Ex: /api/workout-plans/:planId e /api/workout-plan-exercises/:planExerciseId
// Estas rotas abaixo seriam para gerir planos e exercícios de planos diretamente pelos seus IDs,
// assumindo que a autorização é feita dentro do controlador para verificar se o admin
// tem permissão sobre o treino ao qual o plano pertence.

// Rotas para Planos de Treino (WorkoutPlan)
// GET /api/workout-plans (Listar todos os planos - talvez não seja necessário, planos são contextuais a treinos)
// POST /api/workout-plans (Criar um plano - precisaria de trainingId no body)

// Atualizar um plano de treino específico
//router.put('/:planId', protect, isAdminStaff, workoutPlanController.updateWorkoutPlan);
// Eliminar um plano de treino específico
//router.delete('/:planId', protect, isAdminStaff, workoutPlanController.deleteWorkoutPlan);

// Rotas para Exercícios dentro de um Plano de Treino (WorkoutPlanExercise)
// Adicionar exercício a um plano
router.post('/:planId/exercises', protect, isAdminStaff, workoutPlanExerciseController.addExerciseToGlobalWorkoutPlan);
// Listar exercícios de um plano
router.get('/:planId/exercises', protect, workoutPlanExerciseController.getExercisesForGlobalWorkoutPlan); // Proteger para cliente/staff poder ver também

// Atualizar um exercício específico num plano
router.put('/exercises/:planExerciseId', protect, isAdminStaff, workoutPlanExerciseController.updateExerciseInGlobalWorkoutPlan);
// Remover um exercício específico de um plano
router.delete('/exercises/:planExerciseId', protect, isAdminStaff, workoutPlanExerciseController.removeExerciseFromGlobalWorkoutPlan);
// Rota para CLIENTES listarem/pesquisarem planos visíveis
router.get(
  '/visible', // GET /api/workout-plans/visible
  protect,    // Qualquer utilizador autenticado (ou isClientUser se for só para clientes)
  workoutPlanController.getVisibleWorkoutPlans // Nova função no controlador
);

// Rotas para Admin gerir Planos de Treino "Modelo" / Globais
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

// Rotas para associar/desassociar planos de treinos específicos
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

// A rota GET /api/workout-plans/visible (para clientes) que já discutimos continua válida
router.get(
  '/visible',
  protect, // Acesso para clientes
  workoutPlanController.getVisibleWorkoutPlans // Função que criaste para listar planos com isVisible: true
);

module.exports = router;