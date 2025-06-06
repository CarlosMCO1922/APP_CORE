// backend/controllers/progressController.js
const db = require('../models'); // Seu acesso aos modelos Sequelize
const { Op } = require('sequelize'); // Se precisar de operadores Sequelize

// @desc    Cliente regista o seu desempenho num exercício de um plano de treino
// @route   POST /api/progress/log-performance
// @access  Privado (Cliente)
const logExercisePerformance = async (req, res) => {
  const userId = req.user.id; // Do middleware 'protect' e 'isClientUser'
  const {
    trainingId,
    workoutPlanId,
    planExerciseId, // ID do WorkoutPlanExercise
    performedAt, // Data da realização do treino/log
    setNumber, // Opcional, mas bom para tracking de séries individuais
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
      userId, // Certifique-se que este campo existe no seu modelo ClientExercisePerformance e corresponde ao ID do utilizador
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

// @desc    Cliente obtém o seu histórico de desempenho para um exercício específico (de um plano) ao longo do tempo
// @route   GET /api/progress/my-exercise-history/:planExerciseId
// @access  Privado (Cliente)
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
      order: [['performedAt', 'DESC'], ['createdAt', 'DESC']], // Adicionado createdAt para desempate
    });
    res.status(200).json(performances);
  } catch (error) {
    console.error('Erro ao buscar histórico de desempenho do exercício:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};

// --- NOVA FUNÇÃO PARA ELIMINAR UM REGISTO DE PERFORMANCE ---
// @desc    Cliente elimina um registo de desempenho específico
// @route   DELETE /api/progress/log/:logId
// @access  Privado (Cliente)
const deletePerformanceLog = async (req, res) => {
    try {
        const logIdToDelete = parseInt(req.params.logId, 10);
        const authenticatedUserId = req.user.id; 

        if (isNaN(logIdToDelete)) {
            return res.status(400).json({ message: 'ID do registo inválido.' });
        }

        // Tenta eliminar o registo, garantindo que pertence ao utilizador autenticado.
        // Confirme que 'userId' é o nome correto da foreign key no seu modelo ClientExercisePerformance.
        const numberOfDeletedRows = await db.ClientExercisePerformance.destroy({
            where: {
                id: logIdToDelete,
                userId: authenticatedUserId 
            }
        });

        if (numberOfDeletedRows === 0) {
            // Nenhuma linha eliminada: verificar se o registo existia mas não pertencia ao utilizador, ou se não existia de todo.
            const logEntry = await db.ClientExercisePerformance.findByPk(logIdToDelete);
            if (!logEntry) {
                return res.status(404).json({ message: 'Registo de desempenho não encontrado.' });
            } else {
                // O registo existe, mas não pertence ao utilizador autenticado.
                return res.status(403).json({ message: 'Não autorizado a eliminar este registo.' });
            }
        }
        
        // Pelo menos uma linha foi eliminada.
        console.log(`Utilizador ${authenticatedUserId} eliminou o registo de log de exercício ${logIdToDelete}`);
        
        // Resposta de sucesso: 204 No Content (sem corpo na resposta)
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
  deletePerformanceLog, // <<< ADICIONAR A NOVA FUNÇÃO AOS EXPORTS
};