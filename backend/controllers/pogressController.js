// backend/controllers/progressController.js
const db = require('../models');
const { Op } = require('sequelize');

// @desc    Cliente regista o seu desempenho num exercício de um plano de treino
// @route   POST /api/progress/log-performance
// @access  Privado (Cliente)
const logExercisePerformance = async (req, res) => {
  const userId = req.user.id; // Do middleware 'protect'
  const {
    trainingId,
    workoutPlanId,
    planExerciseId, // ID do WorkoutPlanExercise
    performedAt, // Data da realização do treino/log
    setNumber,
    performedReps,
    performedWeight,
    performedDurationSeconds,
    notes
  } = req.body;

  if (!trainingId || !workoutPlanId || !planExerciseId || !performedAt) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta: trainingId, workoutPlanId, planExerciseId, performedAt.' });
  }

  try {
    // Validações opcionais: verificar se o user está inscrito no treino, se o plano pertence ao treino, etc.
    // Por simplicidade, vamos assumir que o frontend envia dados válidos.

    const newPerformance = await db.ClientExercisePerformance.create({
      userId,
      trainingId: parseInt(trainingId),
      workoutPlanId: parseInt(workoutPlanId),
      planExerciseId: parseInt(planExerciseId),
      performedAt,
      setNumber: setNumber ? parseInt(setNumber) : null,
      performedReps: performedReps ? parseInt(performedReps) : null,
      performedWeight: performedWeight ? parseFloat(performedWeight) : null,
      performedDurationSeconds: performedDurationSeconds ? parseInt(performedDurationSeconds) : null,
      notes
    });

    res.status(201).json({ message: 'Desempenho registado com sucesso!', performance: newPerformance });
  } catch (error) {
    console.error('Erro ao registar desempenho do exercício:', error);
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao registar desempenho.', errorDetails: error.message });
  }
};

// @desc    Cliente obtém o seu histórico de desempenho para um plano de treino específico dentro de um treino
// @route   GET /api/progress/my-history/training/:trainingId/plan/:workoutPlanId
// @access  Privado (Cliente)
const getMyPerformanceForWorkoutPlan = async (req, res) => {
  const userId = req.user.id;
  const { trainingId, workoutPlanId } = req.params;

  try {
    const performances = await db.ClientExercisePerformance.findAll({
      where: {
        userId,
        trainingId: parseInt(trainingId),
        workoutPlanId: parseInt(workoutPlanId)
      },
      include: [
        {
          model: db.WorkoutPlanExercise,
          as: 'planExerciseDetails', // Para ver os detalhes do exercício prescrito
          include: [{ model: db.Exercise, as: 'exerciseDetails' }] // Para ter o nome do exercício base
        }
      ],
      order: [['performedAt', 'DESC'], ['setNumber', 'ASC']], // Mais recentes primeiro, séries em ordem
    });
    res.status(200).json(performances);
  } catch (error) {
    console.error('Erro ao buscar histórico de desempenho do plano:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};

// @desc    Cliente obtém o seu histórico de desempenho para um exercício específico (de um plano) ao longo do tempo
// @route   GET /api/progress/my-exercise-history/:planExerciseId
// @access  Privado (Cliente)
const getMyPerformanceHistoryForExercise = async (req, res) => {
  const userId = req.user.id;
  const { planExerciseId } = req.params; // ID do WorkoutPlanExercise

  try {
    const performances = await db.ClientExercisePerformance.findAll({
      where: {
        userId,
        planExerciseId: parseInt(planExerciseId)
      },
      include: [ // Opcional: incluir detalhes do treino ou plano se necessário para contexto
        { model: db.Training, as: 'training', attributes: ['id', 'name', 'date'] }
      ],
      order: [['performedAt', 'DESC']],
    });
    res.status(200).json(performances);
  } catch (error) {
    console.error('Erro ao buscar histórico de desempenho do exercício:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};

// TODO (Opcional): Adicionar PUT /api/progress/log/:performanceId para atualizar um registo

module.exports = {
  logExercisePerformance,
  getMyPerformanceForWorkoutPlan,
  getMyPerformanceHistoryForExercise,
};