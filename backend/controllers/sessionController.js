// backend/controllers/sessionController.js
const db = require('../models');
const { Op } = require('sequelize');

/**
 * Criar uma nova sessão de treino ao finalizar
 * POST /api/sessions/create
 */
const createSession = async (req, res) => {
  const userId = req.user.id;
  const { trainingId, workoutPlanId, startTime, endTime, performanceIds, notes, metadata } = req.body;

  // Validação
  if (!workoutPlanId || !startTime || !endTime) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios em falta: workoutPlanId, startTime, endTime.' 
    });
  }

  if (!Array.isArray(performanceIds) || performanceIds.length === 0) {
    return res.status(400).json({ 
      message: 'É necessário fornecer pelo menos uma performance (série).' 
    });
  }

  try {
    // Buscar performances para calcular totais e validar ownership
    const performances = await db.ClientExercisePerformance.findAll({
      where: { 
        id: performanceIds, 
        userId // Garantir que o utilizador é dono das performances
      },
    });

    if (performances.length === 0) {
      return res.status(400).json({ 
        message: 'Nenhuma performance válida encontrada.' 
      });
    }

    if (performances.length !== performanceIds.length) {
      console.warn(`Utilizador ${userId} tentou criar sessão com performances que não lhe pertencem`);
      return res.status(403).json({ 
        message: 'Algumas performances não pertencem ao utilizador.' 
      });
    }

    // Calcular totais
    const totalSets = performances.length;
    const totalVolume = performances.reduce((sum, p) => {
      const weight = parseFloat(p.performedWeight || 0);
      const reps = parseInt(p.performedReps || 0);
      return sum + (weight * reps);
    }, 0);
    const totalDurationSeconds = Math.floor((parseInt(endTime) - parseInt(startTime)) / 1000);

    // Criar sessão numa transação
    const session = await db.sequelize.transaction(async (t) => {
      // Criar a sessão
      const newSession = await db.TrainingSession.create({
        userId,
        trainingId: trainingId ? parseInt(trainingId) : null,
        workoutPlanId: parseInt(workoutPlanId),
        startTime: parseInt(startTime),
        endTime: parseInt(endTime),
        totalDurationSeconds,
        totalVolume: parseFloat(totalVolume.toFixed(2)),
        totalSets,
        notes: notes || null,
        metadata: metadata || {},
        status: 'completed',
        completedAt: new Date(),
      }, { transaction: t });

      // Atualizar todas as performances com sessionId
      await db.ClientExercisePerformance.update(
        { sessionId: newSession.id },
        { 
          where: { 
            id: performanceIds, 
            userId // Segurança extra
          },
          transaction: t
        }
      );

      return newSession;
    });

    console.log(`Sessão ${session.id} criada com sucesso para utilizador ${userId}`);
    
    return res.status(201).json({ 
      message: 'Sessão criada com sucesso!', 
      session: {
        id: session.id,
        workoutPlanId: session.workoutPlanId,
        totalVolume: session.totalVolume,
        totalSets: session.totalSets,
        totalDurationSeconds: session.totalDurationSeconds,
        completedAt: session.completedAt,
      }
    });
  } catch (error) {
    console.error('Erro ao criar sessão de treino:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Erro de validação', 
        errors: error.errors.map(e => e.message) 
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: 'Erro de integridade referencial. Verifique se o workoutPlanId é válido.',
        errorDetails: error.message
      });
    }
    
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao criar sessão.', 
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obter histórico de sessões do utilizador
 * GET /api/sessions/history
 * Query params: limit, offset, workoutPlanId, startDate, endDate
 */
const getSessionsHistory = async (req, res) => {
  const userId = req.user.id;
  const { 
    limit = 20, 
    offset = 0, 
    workoutPlanId, 
    startDate, 
    endDate,
    status = 'completed'
  } = req.query;

  try {
    // Construir cláusula where
    const where = { userId, status };
    
    if (workoutPlanId) {
      where.workoutPlanId = parseInt(workoutPlanId);
    }
    
    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) {
        where.completedAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.completedAt[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await db.TrainingSession.findAndCountAll({
      where,
      include: [
        { 
          model: db.WorkoutPlan, 
          as: 'workoutPlan', 
          attributes: ['id', 'name', 'description'] 
        },
        { 
          model: db.Training, 
          as: 'training', 
          attributes: ['id', 'name', 'date', 'time'],
          required: false
        },
      ],
      order: [['completedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.status(200).json({
      sessions: rows.map(session => ({
        id: session.id,
        workoutPlanId: session.workoutPlanId,
        workoutPlanName: session.workoutPlan?.name || 'Plano Desconhecido',
        trainingId: session.trainingId,
        trainingName: session.training?.name,
        trainingDate: session.training?.date,
        startTime: session.startTime,
        endTime: session.endTime,
        totalDurationSeconds: session.totalDurationSeconds,
        totalVolume: parseFloat(session.totalVolume || 0),
        totalSets: session.totalSets,
        completedAt: session.completedAt,
        status: session.status,
        notes: session.notes,
        metadata: session.metadata,
      })),
      pagination: {
        total: count,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(count / limit),
        limit: parseInt(limit),
        offset: parseInt(offset),
      }
    });
  } catch (error) {
    console.error('Erro ao obter histórico de sessões:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao obter histórico.', 
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obter detalhes completos de uma sessão específica
 * GET /api/sessions/:sessionId
 */
const getSessionDetails = async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  try {
    const session = await db.TrainingSession.findOne({
      where: { 
        id: parseInt(sessionId), 
        userId // Garantir que só vê as suas próprias sessões
      },
      include: [
        { 
          model: db.WorkoutPlan, 
          as: 'workoutPlan', 
          attributes: ['id', 'name', 'description'] 
        },
        { 
          model: db.Training, 
          as: 'training', 
          attributes: ['id', 'name', 'date', 'time'],
          required: false
        },
        { 
          model: db.ClientExercisePerformance, 
          as: 'performances',
          include: [
            { 
              model: db.WorkoutPlanExercise, 
              as: 'planExerciseDetails',
              include: [
                { 
                  model: db.Exercise, 
                  as: 'exerciseDetails',
                  attributes: ['id', 'name', 'description', 'videoUrl', 'muscleGroup']
                }
              ]
            }
          ],
          order: [['planExerciseId', 'ASC'], ['setNumber', 'ASC']]
        },
      ],
    });

    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada.' });
    }

    // Agrupar performances por exercício
    const exerciseGroups = {};
    session.performances.forEach(perf => {
      const planExerciseId = perf.planExerciseId;
      if (!exerciseGroups[planExerciseId]) {
        exerciseGroups[planExerciseId] = {
          planExerciseId,
          exerciseName: perf.planExerciseDetails?.exerciseDetails?.name || 'Exercício Desconhecido',
          exerciseId: perf.planExerciseDetails?.exerciseId,
          sets: []
        };
      }
      exerciseGroups[planExerciseId].sets.push({
        id: perf.id,
        setNumber: perf.setNumber,
        performedWeight: parseFloat(perf.performedWeight || 0),
        performedReps: parseInt(perf.performedReps || 0),
        performedAt: perf.performedAt,
        notes: perf.notes,
      });
    });

    const sessionDetails = {
      id: session.id,
      workoutPlanId: session.workoutPlanId,
      workoutPlanName: session.workoutPlan?.name || 'Plano Desconhecido',
      trainingId: session.trainingId,
      trainingName: session.training?.name,
      trainingDate: session.training?.date,
      startTime: session.startTime,
      endTime: session.endTime,
      totalDurationSeconds: session.totalDurationSeconds,
      totalVolume: parseFloat(session.totalVolume || 0),
      totalSets: session.totalSets,
      completedAt: session.completedAt,
      status: session.status,
      notes: session.notes,
      metadata: session.metadata,
      exercises: Object.values(exerciseGroups),
    };

    return res.status(200).json(sessionDetails);
  } catch (error) {
    console.error('Erro ao obter detalhes da sessão:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao obter sessão.', 
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obter última sessão de um plano específico (para usar como base)
 * GET /api/sessions/last-for-plan/:workoutPlanId
 */
const getLastSessionForPlan = async (req, res) => {
  const userId = req.user.id;
  const { workoutPlanId } = req.params;

  try {
    const session = await db.TrainingSession.findOne({
      where: { 
        userId, 
        workoutPlanId: parseInt(workoutPlanId),
        status: 'completed'
      },
      include: [
        { 
          model: db.ClientExercisePerformance, 
          as: 'performances',
          include: [
            { 
              model: db.WorkoutPlanExercise, 
              as: 'planExerciseDetails',
              attributes: ['id', 'exerciseId', 'order']
            }
          ],
          order: [['planExerciseId', 'ASC'], ['setNumber', 'ASC']]
        },
      ],
      order: [['completedAt', 'DESC']],
      limit: 1,
    });

    if (!session) {
      return res.status(404).json({ message: 'Nenhuma sessão anterior encontrada para este plano.' });
    }

    // Agrupar por exercício para facilitar uso como placeholders
    const exerciseData = {};
    session.performances.forEach(perf => {
      const planExerciseId = perf.planExerciseId;
      if (!exerciseData[planExerciseId]) {
        exerciseData[planExerciseId] = [];
      }
      exerciseData[planExerciseId].push({
        setNumber: perf.setNumber,
        weight: parseFloat(perf.performedWeight || 0),
        reps: parseInt(perf.performedReps || 0),
      });
    });

    return res.status(200).json({
      sessionId: session.id,
      completedAt: session.completedAt,
      totalVolume: parseFloat(session.totalVolume || 0),
      totalSets: session.totalSets,
      exerciseData, // { planExerciseId: [{ setNumber, weight, reps }, ...] }
    });
  } catch (error) {
    console.error('Erro ao obter última sessão do plano:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor.', 
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Atualizar notas/metadata de uma sessão
 * PATCH /api/sessions/:sessionId
 */
const updateSession = async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;
  const { notes, metadata } = req.body;

  try {
    const session = await db.TrainingSession.findOne({
      where: { id: parseInt(sessionId), userId }
    });

    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada.' });
    }

    // Atualizar apenas campos permitidos
    if (notes !== undefined) {
      session.notes = notes;
    }
    
    if (metadata !== undefined) {
      session.metadata = { ...session.metadata, ...metadata };
    }

    await session.save();

    return res.status(200).json({ 
      message: 'Sessão atualizada com sucesso!', 
      session: {
        id: session.id,
        notes: session.notes,
        metadata: session.metadata,
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao atualizar sessão.', 
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Eliminar uma sessão (soft delete - muda status para cancelled)
 * DELETE /api/sessions/:sessionId
 */
const deleteSession = async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;
  const { permanent = false } = req.query; // Se true, elimina permanentemente

  try {
    const session = await db.TrainingSession.findOne({
      where: { id: parseInt(sessionId), userId }
    });

    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada.' });
    }

    if (permanent === 'true') {
      // Eliminar permanentemente (também remove sessionId das performances via ON DELETE SET NULL)
      await session.destroy();
      return res.status(200).json({ message: 'Sessão eliminada permanentemente.' });
    } else {
      // Soft delete - apenas marcar como cancelled
      session.status = 'cancelled';
      await session.save();
      return res.status(200).json({ message: 'Sessão marcada como cancelada.' });
    }
  } catch (error) {
    console.error('Erro ao eliminar sessão:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao eliminar sessão.', 
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obter estatísticas de sessões do utilizador
 * GET /api/sessions/stats
 */
const getSessionStats = async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, workoutPlanId } = req.query;

  try {
    const where = { userId, status: 'completed' };
    
    if (workoutPlanId) {
      where.workoutPlanId = parseInt(workoutPlanId);
    }
    
    if (startDate || endDate) {
      where.completedAt = {};
      if (startDate) where.completedAt[Op.gte] = new Date(startDate);
      if (endDate) where.completedAt[Op.lte] = new Date(endDate);
    }

    const sessions = await db.TrainingSession.findAll({
      where,
      attributes: [
        'id',
        'completedAt',
        'totalVolume',
        'totalSets',
        'totalDurationSeconds'
      ],
      order: [['completedAt', 'ASC']]
    });

    const stats = {
      totalSessions: sessions.length,
      totalVolume: sessions.reduce((sum, s) => sum + parseFloat(s.totalVolume || 0), 0),
      totalSets: sessions.reduce((sum, s) => sum + parseInt(s.totalSets || 0), 0),
      totalTimeSeconds: sessions.reduce((sum, s) => sum + parseInt(s.totalDurationSeconds || 0), 0),
      averageVolume: 0,
      averageSets: 0,
      averageDuration: 0,
    };

    if (sessions.length > 0) {
      stats.averageVolume = parseFloat((stats.totalVolume / sessions.length).toFixed(2));
      stats.averageSets = Math.round(stats.totalSets / sessions.length);
      stats.averageDuration = Math.round(stats.totalTimeSeconds / sessions.length);
    }

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor.', 
      errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createSession,
  getSessionsHistory,
  getSessionDetails,
  getLastSessionForPlan,
  updateSession,
  deleteSession,
  getSessionStats,
};
