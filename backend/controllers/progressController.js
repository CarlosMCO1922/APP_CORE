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

const adminGetUserRecords = async (req, res) => {
    const { userId } = req.params; // ID do cliente que o staff quer consultar

    try {
        // 1. Encontrar todos os exercícios únicos que o utilizador já realizou
        const allPerformances = await db.ClientExercisePerformance.findAll({
            where: { userId: parseInt(userId) },
            attributes: ['planExerciseId'],
            include: [{
                model: db.WorkoutPlanExercise,
                as: 'planExerciseDetails',
                attributes: ['id'],
                required: true,
                include: [{
                    model: db.Exercise,
                    as: 'exerciseDetails',
                    attributes: ['name'],
                    required: true,
                }]
            }],
        });

        // 2. Criar uma lista de exercícios únicos em JavaScript
        const uniqueExercisesMap = new Map();
        allPerformances.forEach(p => {
            if (p.planExerciseId && !uniqueExercisesMap.has(p.planExerciseId)) {
                uniqueExercisesMap.set(p.planExerciseId, {
                    exerciseName: p.planExerciseDetails?.exerciseDetails?.name || 'Exercício Desconhecido'
                });
            }
        });
        
        const uniqueExercises = Array.from(uniqueExercisesMap.entries()).map(([planExerciseId, details]) => ({
            planExerciseId,
            exerciseName: details.exerciseName
        }));

        if (uniqueExercises.length === 0) {
            return res.status(200).json([]);
        }

        const recordsByExercise = [];

        // 3. Para cada exercício único, encontrar os diferentes tipos de PRs
        for (const exercise of uniqueExercises) {
            const { planExerciseId, exerciseName } = exercise;
            
            const records = [];

            // PR de Peso Máximo (agrupado por nº de repetições)
            const maxWeights = await db.ClientExercisePerformance.findAll({
                where: { userId: parseInt(userId), planExerciseId },
                attributes: [
                    'performedReps',
                    [db.Sequelize.fn('MAX', db.Sequelize.col('performedWeight')), 'maxWeight']
                ],
                group: ['performedReps'],
                order: [['performedReps', 'ASC']],
                raw: true
            });
            maxWeights.forEach(pr => {
                if(pr.performedReps && pr.maxWeight > 0) records.push({ type: `Peso Máx. (${pr.performedReps} reps)`, value: `${pr.maxWeight} kg` });
            });

            // PR de Volume Máximo (peso * reps) numa única série
            const maxVolumeResult = await db.ClientExercisePerformance.findOne({
                where: { userId: parseInt(userId), planExerciseId },
                attributes: [[db.Sequelize.literal('"performedWeight" * "performedReps"'), 'volume']],
                order: [[db.Sequelize.literal('volume'), 'DESC NULLS LAST']],
                limit: 1,
                raw: true
            });
            if (maxVolumeResult && maxVolumeResult.volume > 0) {
                records.push({ type: 'Volume Máximo (1 Série)', value: `${Number(maxVolumeResult.volume).toFixed(2)} kg` });
            }

            if (records.length > 0) {
                recordsByExercise.push({
                    planExerciseId,
                    exerciseName,
                    records
                });
            }
        }

        res.status(200).json(recordsByExercise);

    } catch (error) {
        console.error(`Erro ao buscar recordes para o user ${userId}:`, error);
        res.status(500).json({ message: 'Erro interno ao buscar recordes do cliente.' });
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

const checkPersonalRecords = async (req, res) => {
  const userId = req.user.id;
  const completedSets = req.body; 

  if (!Array.isArray(completedSets) || completedSets.length === 0) {
    return res.status(200).json({ records: [] }); 
  }

  try {
    const newRecords = [];
    const checkedPRs = new Set(); 

    for (const set of completedSets) {
      if (!set.id || !set.planExerciseId || !set.performedWeight || !set.performedReps) {
        continue;
      }
      
      const { id, planExerciseId, performedWeight, performedReps } = set;
      const commonWhereClause = {
        userId,
        planExerciseId,
        id: { [Op.ne]: id } 
      };

      const previousMaxWeightForReps = await db.ClientExercisePerformance.max('performedWeight', {
        where: {
          ...commonWhereClause,
          performedReps: performedReps
        }
      });

      if (previousMaxWeightForReps === null || performedWeight > previousMaxWeightForReps) {
        const prKey = `weight-${performedReps}`;
        if (!checkedPRs.has(prKey)) {
            newRecords.push({
              type: 'Peso Máximo',
              value: `${performedWeight} kg x ${performedReps} reps`,
              planExerciseId: planExerciseId
            });
            checkedPRs.add(prKey);
        }
      }

      const previousMaxRepsForWeight = await db.ClientExercisePerformance.max('performedReps', {
        where: {
          ...commonWhereClause,
          performedWeight: performedWeight
        }
      });
      
      if (previousMaxRepsForWeight === null || performedReps > previousMaxRepsForWeight) {
        const prKey = `reps-${performedWeight}`;
        if (!checkedPRs.has(prKey)) {
            newRecords.push({
              type: 'Máximo de Reps',
              value: `${performedReps} reps com ${performedWeight} kg`,
              planExerciseId: planExerciseId
            });
            checkedPRs.add(prKey);
        }
      }
    }
    
    res.status(200).json({ records: newRecords });
  } catch (error) {
    console.error('Erro ao verificar recordes pessoais:', error);
    res.status(500).json({ message: 'Erro interno ao verificar recordes.' });
  }
};

const getMyPersonalRecords = async (req, res) => {
  const userId = req.user.id;
  try {
    // 1. Encontrar todos os exercícios únicos que o utilizador já realizou
    // Abordagem corrigida: Primeiro obtemos todos os logs e depois filtramos para únicos em JS
    const allPerformances = await db.ClientExercisePerformance.findAll({
        where: { userId },
        attributes: ['planExerciseId'],
        include: [{
            model: db.WorkoutPlanExercise,
            as: 'planExerciseDetails',
            attributes: ['id'],
            required: true, // Garante que só vêm logs com um exercício de plano válido
            include: [{
                model: db.Exercise,
                as: 'exerciseDetails',
                attributes: ['name'],
                required: true,
            }]
        }],
        order: [['performedAt', 'DESC']]
    });

    // Criar uma lista de exercícios únicos a partir de todos os desempenhos
    const uniqueExercisesMap = new Map();
    allPerformances.forEach(p => {
      // Usamos o ID do exercício do plano como chave para garantir a unicidade
      if (p.planExerciseId && !uniqueExercisesMap.has(p.planExerciseId)) {
        uniqueExercisesMap.set(p.planExerciseId, {
          exerciseName: p.planExerciseDetails?.exerciseDetails?.name || 'Exercício Desconhecido'
        });
      }
    });
    
    const uniqueExercises = Array.from(uniqueExercisesMap.entries()).map(([planExerciseId, details]) => ({
        planExerciseId,
        exerciseName: details.exerciseName
    }));


    if (uniqueExercises.length === 0) {
      return res.status(200).json([]);
    }

    const recordsByExercise = [];

    // 2. Para cada exercício único, encontrar os diferentes tipos de PRs
    for (const exercise of uniqueExercises) {
      const { planExerciseId, exerciseName } = exercise;
      
      const records = [];

      // PR de Peso Máximo (Agrupado por nº de repetições)
      const maxWeights = await db.ClientExercisePerformance.findAll({
        where: { userId, planExerciseId },
        attributes: [
          'performedReps',
          [db.Sequelize.fn('MAX', db.Sequelize.col('performedWeight')), 'maxWeight']
        ],
        group: ['performedReps'],
        order: [['performedReps', 'ASC']],
        raw: true
      });
      maxWeights.forEach(pr => {
        if(pr.performedReps && pr.maxWeight > 0) records.push({ type: `Peso Máx. (${pr.performedReps} reps)`, value: `${pr.maxWeight} kg` });
      });

      // PR de Volume Máximo (peso * reps) numa única série
      const maxVolumeResult = await db.ClientExercisePerformance.findOne({
        where: { userId, planExerciseId },
        attributes: [[db.Sequelize.literal('"performedWeight" * "performedReps"'), 'volume']],
        order: [[db.Sequelize.literal('volume'), 'DESC NULLS LAST']],
        limit: 1,
        raw: true
      });
      if (maxVolumeResult && maxVolumeResult.volume > 0) {
        records.push({ type: 'Volume Máximo (1 Série)', value: `${Number(maxVolumeResult.volume).toFixed(2)}` });
      }

      if (records.length > 0) {
        recordsByExercise.push({
          planExerciseId,
          exerciseName,
          records
        });
      }
    }

    res.status(200).json(recordsByExercise);

  } catch (error) {
    console.error("Erro ao buscar recordes pessoais:", error);
    res.status(500).json({ message: 'Erro interno ao buscar recordes pessoais.' });
  }
};

const updatePerformanceLog = async (req, res) => {
    const logIdToUpdate = parseInt(req.params.logId, 10);
    const authenticatedUserId = req.user.id;
    const { performedReps, performedWeight, notes } = req.body;

    if (isNaN(logIdToUpdate)) {
        return res.status(400).json({ message: 'ID do registo inválido.' });
    }

    try {
        const log = await db.ClientExercisePerformance.findByPk(logIdToUpdate);

        if (!log) {
            return res.status(404).json({ message: 'Registo de desempenho não encontrado.' });
        }

        // Verificação de segurança: O utilizador só pode editar os seus próprios registos.
        if (log.userId !== authenticatedUserId) {
            return res.status(403).json({ message: 'Não autorizado a editar este registo.' });
        }

        // Atualiza os campos fornecidos
        if (performedReps !== undefined) {
            log.performedReps = performedReps ? parseInt(performedReps, 10) : null;
        }
        if (performedWeight !== undefined) {
            log.performedWeight = performedWeight ? parseFloat(performedWeight) : null;
        }
        if (notes !== undefined) {
            log.notes = notes;
        }
        
        const updatedLog = await log.save();

        res.status(200).json({ message: 'Registo atualizado com sucesso!', performance: updatedLog });

    } catch (error) {
        console.error('Erro no controlador updatePerformanceLog:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar atualizar o registo.' });
    }
};

const adminGetFullExerciseHistoryForUser = async (req, res) => {
    const { planExerciseId, userId } = req.params;
    try {
        const performances = await db.ClientExercisePerformance.findAll({
            where: {
                userId: parseInt(userId),
                planExerciseId: parseInt(planExerciseId)
            },
            order: [['performedAt', 'ASC']], // Ordenado por data para o gráfico
        });
        res.status(200).json(performances);
    } catch (error) {
        console.error('Erro ao buscar histórico completo para admin:', error);
        res.status(500).json({ message: 'Erro interno ao buscar histórico completo do exercício.' });
    }
};

const getExerciseHistoryForClient = async (req, res) => {
  try {
    // Obtém o ID do exercício a partir do URL (ex: /api/progress/history/exercise/15)
    const { exerciseId } = req.params;
    // Obtém o ID do utilizador que está autenticado (através do middleware 'protect')
    const userId = req.user.id;

    if (!userId) {
      return res.status(403).json({ message: "Utilizador não autenticado." });
    }

    // Procura na tabela de performance (ClientExercisePerformance)
    // A consulta é complexa porque precisamos de encontrar o exerciseId que está noutra tabela
    const history = await db.ClientExercisePerformance.findAll({
      where: {
        userId: userId,
        '$planExerciseDetails.exerciseId$': parseInt(exerciseId)
      },
      // Inclui a tabela de "exercício do plano" para podermos filtrar pelo ID do exercício base
      include: [{
        model: db.WorkoutPlanExercise,
        as: 'planExerciseDetails',
        attributes: [] // Não precisamos dos atributos desta tabela, só de a usar para o filtro
      }],
      order: [
        ['performedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ], // Ordena pelos registos mais recentes com desempate por criação
      limit: 3, // Limita aos últimos 3 registos
      subQuery: false,
    });

    res.status(200).json(history);

  } catch (error) {
    console.error('Erro ao obter histórico do exercício para o cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

const getMyLastPerformances = async (req, res) => {
  const userId = req.user.id;
  try {
    const [results] = await db.sequelize.query(`
      SELECT * FROM (
        SELECT
          p."performedWeight",
          p."performedReps",
          wpe."exerciseId",
          ROW_NUMBER() OVER(PARTITION BY wpe."exerciseId" ORDER BY p."performedAt" DESC) as rn
        FROM
          "ClientExercisePerformances" as p
        JOIN "workout_plan_exercises" as wpe ON p."planExerciseId" = wpe.id
        WHERE
          p."userId" = :userId AND p."performedWeight" IS NOT NULL AND p."performedReps" IS NOT NULL
      ) as sub
      WHERE rn = 1
    `, {
      replacements: { userId: userId },
      type: db.sequelize.QueryTypes.SELECT
    });
    res.status(200).json(results);
  } catch (error) {
    console.error('Erro ao obter últimas performances:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = {
  logExercisePerformance,
  getMyPerformanceForWorkoutPlan,
  getMyPerformanceHistoryForExercise,
  deletePerformanceLog, 
  checkPersonalRecords,
  getMyPersonalRecords,
  updatePerformanceLog,
  adminGetUserRecords,
  adminGetFullExerciseHistoryForUser,
  getExerciseHistoryForClient,
  getMyLastPerformances,
};