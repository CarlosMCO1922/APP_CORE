// backend/controllers/workoutPlanExerciseController.js
const db = require('../models');
const { Op } = require('sequelize');

// @desc    Admin adiciona um exercício a um plano de treino
// @route   POST /api/trainings/workout-plans/:planId/exercises
// @access  Privado (Admin Staff)
const addExerciseToWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  const { exerciseId, sets, reps, durationSeconds, restSeconds, order, notes } = req.body;

  if (!exerciseId || order === undefined) {
    return res.status(400).json({ message: 'ID do exercício e ordem são obrigatórios.' });
  }

  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(planId);
    if (!workoutPlan) {
      return res.status(404).json({ message: 'Plano de treino não encontrado.' });
    }

    const exercise = await db.Exercise.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercício base não encontrado.' });
    }

    const newPlanExercise = await db.WorkoutPlanExercise.create({
      workoutPlanId: planId,
      exerciseId,
      sets,
      reps,
      durationSeconds,
      restSeconds,
      order,
      notes,
    });
    res.status(201).json(newPlanExercise);
  } catch (error) {
    console.error('Erro (admin) ao adicionar exercício ao plano:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin (ou cliente/staff com acesso ao plano) lista exercícios de um plano de treino
// @route   GET /api/trainings/workout-plans/:planId/exercises
// @access  Privado (Ver lógica no getWorkoutPlansForTraining para acesso ao plano pai)
const getExercisesForWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(planId, {
      include: [{
        model: db.Training,
        as: 'trainingSession' // Para verificar permissões do treino pai
      }]
    });

    if (!workoutPlan) {
      return res.status(404).json({ message: 'Plano de treino não encontrado.' });
    }
    
    // Lógica de permissão similar à getWorkoutPlansForTraining, verificando acesso ao treino pai
    const training = workoutPlan.trainingSession;
    let canView = false;
    if (req.staff && req.staff.role === 'admin') {
        canView = true;
    } else if (req.user) {
        const isUserParticipant = await training.hasParticipant(req.user);
        if (isUserParticipant) canView = true;
    } else if (req.staff && training.instructorId === req.staff.id) {
        canView = true;
    }

    if (!canView) {
        return res.status(403).json({ message: 'Acesso negado para ver exercícios deste plano.' });
    }

    const exercises = await db.WorkoutPlanExercise.findAll({
      where: { workoutPlanId: planId },
      order: [['order', 'ASC']],
      include: [{ model: db.Exercise, as: 'exerciseDetails' }]
    });
    res.status(200).json(exercises);
  } catch (error) {
    console.error('Erro ao listar exercícios do plano:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin atualiza um exercício num plano de treino
// @route   PUT /api/trainings/workout-plans/exercises/:planExerciseId
// @access  Privado (Admin Staff)
const updateExerciseInWorkoutPlan = async (req, res) => {
  const { planExerciseId } = req.params;
  const { sets, reps, durationSeconds, restSeconds, order, notes, exerciseId } = req.body;

  try {
    const planExercise = await db.WorkoutPlanExercise.findByPk(planExerciseId);
    if (!planExercise) {
      return res.status(404).json({ message: 'Exercício do plano não encontrado.' });
    }

    // Opcional: Verificar permissões sobre o plano/treino pai

    if (exerciseId !== undefined) {
        const baseExercise = await db.Exercise.findByPk(exerciseId);
        if (!baseExercise) return res.status(404).json({ message: 'Exercício base para atualização não encontrado.' });
        planExercise.exerciseId = exerciseId;
    }
    if (sets !== undefined) planExercise.sets = sets;
    if (reps !== undefined) planExercise.reps = reps;
    if (durationSeconds !== undefined) planExercise.durationSeconds = durationSeconds;
    if (restSeconds !== undefined) planExercise.restSeconds = restSeconds;
    if (order !== undefined) planExercise.order = order;
    if (notes !== undefined) planExercise.notes = notes;

    await planExercise.save();
    res.status(200).json(planExercise);
  } catch (error) {
    console.error('Erro (admin) ao atualizar exercício no plano:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin remove um exercício de um plano de treino
// @route   DELETE /api/trainings/workout-plans/exercises/:planExerciseId
// @access  Privado (Admin Staff)
const removeExerciseFromWorkoutPlan = async (req, res) => {
  const { planExerciseId } = req.params;
  try {
    const planExercise = await db.WorkoutPlanExercise.findByPk(planExerciseId);
    if (!planExercise) {
      return res.status(404).json({ message: 'Exercício do plano não encontrado.' });
    }

    // Opcional: Verificar permissões

    await planExercise.destroy();
    res.status(200).json({ message: 'Exercício removido do plano com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao remover exercício do plano:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

module.exports = {
  addExerciseToWorkoutPlan,
  getExercisesForWorkoutPlan,
  updateExerciseInWorkoutPlan,
  removeExerciseFromWorkoutPlan,
};