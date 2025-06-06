// backend/controllers/progressController.js
const db = require('../models'); 
const { Op } = require('sequelize'); 


const logExercisePerformance = async (req, res) => {
  const userId = req.user.id; 
  const {
    trainingId,
    workoutPlanId,
    planExerciseId, 
    performedAt,
    setNumber, 
    performedReps,
    performedWeight,
    performedDurationSeconds,
    notes
  } = req.body;

  if (!workoutPlanId || !planExerciseId || !performedAt) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta: trainingId, workoutPlanId, planExerciseId, performedAt.' });
  }

  try {
    const newPerformance = await db.ClientExercisePerformance.create({
      userId, 
      trainingId: trainingId ? parseInt(trainingId) : null ,
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
          as: 'planExerciseDetails', 
          include: [{ model: db.Exercise, as: 'exerciseDetails' }] 
        }
      ],
      order: [['performedAt', 'DESC'], ['setNumber', 'ASC'], ['createdAt', 'DESC']], // Adicionado createdAt para desempate se performedAt e setNumber forem iguais
    });
    res.status(200).json(performances);
  } catch (error) {
    console.error('Erro ao buscar histórico de desempenho do plano:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};


const getMyPerformanceHistoryForExercise = async (req, res) => {
  const userId = req.user.id;
  const { planExerciseId } = req.params; 

  try {
    const performances = await db.ClientExercisePerformance.findAll({
      where: {
        userId,
        planExerciseId: parseInt(planExerciseId)
      },
      include: [ 
        { model: db.Training, as: 'training', attributes: ['id', 'name', 'date'] }
      ],
      order: [['performedAt', 'DESC'], ['createdAt', 'DESC']], 
    });
    res.status(200).json(performances);
  } catch (error) {
    console.error('Erro ao buscar histórico de desempenho do exercício:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};


const deletePerformanceLog = async (req, res) => {
    try {
        const logIdToDelete = parseInt(req.params.logId, 10);
        const authenticatedUserId = req.user.id; 

        if (isNaN(logIdToDelete)) {
            return res.status(400).json({ message: 'ID do registo inválido.' });
        }

        
        const numberOfDeletedRows = await db.ClientExercisePerformance.destroy({
            where: {
                id: logIdToDelete,
                userId: authenticatedUserId 
            }
        });

        if (numberOfDeletedRows === 0) {
            const logEntry = await db.ClientExercisePerformance.findByPk(logIdToDelete);
            if (!logEntry) {
                return res.status(404).json({ message: 'Registo de desempenho não encontrado.' });
            } else {
                return res.status(403).json({ message: 'Não autorizado a eliminar este registo.' });
            }
        }
        console.log(`Utilizador ${authenticatedUserId} eliminou o registo de log de exercício ${logIdToDelete}`);
        return res.status(204).send();

    } catch (error) {
        console.error('Erro no controlador deletePerformanceLog:', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({ message: 'Não é possível eliminar este registo pois outros dados dependem dele.'});
        }
        return res.status(500).json({ message: 'Erro interno do servidor ao tentar eliminar o registo.' });
    }
};

module.exports = {
  logExercisePerformance,
  getMyPerformanceForWorkoutPlan,
  getMyPerformanceHistoryForExercise,
  deletePerformanceLog, 
};