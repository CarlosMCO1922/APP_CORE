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
router.put('/:planId', protect, isAdminStaff, workoutPlanController.updateWorkoutPlan);
// Eliminar um plano de treino específico
router.delete('/:planId', protect, isAdminStaff, workoutPlanController.deleteWorkoutPlan);

// Rotas para Exercícios dentro de um Plano de Treino (WorkoutPlanExercise)
// Adicionar exercício a um plano
router.post('/:planId/exercises', protect, isAdminStaff, workoutPlanExerciseController.addExerciseToWorkoutPlan);
// Listar exercícios de um plano
router.get('/:planId/exercises', protect, workoutPlanExerciseController.getExercisesForWorkoutPlan); // Proteger para cliente/staff poder ver também

// Atualizar um exercício específico num plano
router.put('/exercises/:planExerciseId', protect, isAdminStaff, workoutPlanExerciseController.updateExerciseInWorkoutPlan);
// Remover um exercício específico de um plano
router.delete('/exercises/:planExerciseId', protect, isAdminStaff, workoutPlanExerciseController.removeExerciseFromWorkoutPlan);

module.exports = router;