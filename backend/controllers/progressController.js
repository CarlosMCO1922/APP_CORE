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
    notes,
    materialUsed,
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
      notes,
      materialUsed: materialUsed != null && String(materialUsed).trim() !== '' ? String(materialUsed).trim() : null,
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
  const limit = Math.min(parseInt(req.query.limit || '3', 10), 20);
  // Se for para placeholders, buscar as últimas 3 séries ordenadas por setNumber
  const forPlaceholders = req.query.forPlaceholders === 'true';
  // Se excludeTrainingId for fornecido, excluir registos desse treino (treino atual em andamento)
  const excludeTrainingId = req.query.excludeTrainingId ? parseInt(req.query.excludeTrainingId) : null;

  try {
    let performances;
    
    if (forPlaceholders) {
      // Buscar as últimas 3 séries do último treino concluído, ordenadas por setNumber
      // Primeiro, encontrar o último treino concluído deste exercício (excluindo o treino atual se fornecido)
      const whereClause = {
        userId,
        planExerciseId: parseInt(planExerciseId),
        trainingId: { [Op.ne]: null } // Apenas treinos concluídos (com trainingId)
      };
      
      if (excludeTrainingId) {
        whereClause.trainingId = { 
          [Op.and]: [
            { [Op.ne]: null }, 
            { [Op.ne]: excludeTrainingId }
          ] 
        };
      }
      
      const lastTraining = await db.ClientExercisePerformance.findOne({
        where: whereClause,
        order: [['performedAt', 'DESC'], ['createdAt', 'DESC']],
        attributes: ['trainingId'],
        limit: 1
      });

      if (lastTraining && lastTraining.trainingId) {
        // Buscar as séries desse treino, ordenadas por setNumber
        performances = await db.ClientExercisePerformance.findAll({
          where: {
            userId,
            planExerciseId: parseInt(planExerciseId),
            trainingId: lastTraining.trainingId
          },
          include: [ 
            { model: db.Training, as: 'training', attributes: ['id', 'name', 'date'] }
          ],
          order: [['setNumber', 'ASC']], // Ordenar por número da série
          limit: 3, // Máximo 3 séries
        });
      } else {
        // Se não houver treino concluído, buscar as últimas 3 séries gerais (excluindo treino atual se fornecido)
        const generalWhere = {
          userId,
          planExerciseId: parseInt(planExerciseId)
        };
        
        if (excludeTrainingId) {
          generalWhere[Op.or] = [
            { trainingId: null },
            { trainingId: { [Op.ne]: excludeTrainingId } }
          ];
        }
        
        performances = await db.ClientExercisePerformance.findAll({
          where: generalWhere,
          include: [ 
            { model: db.Training, as: 'training', attributes: ['id', 'name', 'date'] }
          ],
          order: [['performedAt', 'DESC'], ['setNumber', 'ASC'], ['createdAt', 'DESC']],    
          limit: 3,
        });
      }
    } else {
      // Comportamento original: últimas 3 séries por data
      performances = await db.ClientExercisePerformance.findAll({
        where: {
          userId,
          planExerciseId: parseInt(planExerciseId)
        },
        include: [ 
          { model: db.Training, as: 'training', attributes: ['id', 'name', 'date'] }
        ],
        order: [['performedAt', 'DESC'], ['createdAt', 'DESC']],    
        limit,
      });
    }
    
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
    const limit = Math.min(parseInt(req.query.limit || '3', 10), 20);
    // Obtém o trainingId a excluir (treino atual em andamento)
    const excludeTrainingId = req.query.excludeTrainingId ? parseInt(req.query.excludeTrainingId) : null;

    if (!userId) {
      return res.status(403).json({ message: "Utilizador não autenticado." });
    }

    // Constrói o objeto where com condições base
    let whereConditions = {
      userId: userId,
      '$planExerciseDetails.exerciseId$': parseInt(exerciseId)
    };

    // Se excludeTrainingId for fornecido, exclui registos desse treino (treino atual em andamento)
    if (excludeTrainingId) {
      // Usa Op.and para combinar todas as condições
      // Inclui registos sem trainingId (null) ou com trainingId diferente do atual
      whereConditions = {
        [Op.and]: [
          { userId: userId },
          { '$planExerciseDetails.exerciseId$': parseInt(exerciseId) },
          {
            [Op.or]: [
              { trainingId: null }, // Inclui registos sem trainingId (treinos antigos ou sem treino associado)
              { trainingId: { [Op.ne]: excludeTrainingId } } // Exclui registos do treino atual
            ]
          }
        ]
      };
    }

    // Procura na tabela de performance (ClientExercisePerformance)
    // A consulta é complexa porque precisamos de encontrar o exerciseId que está noutra tabela
    const history = await db.ClientExercisePerformance.findAll({
      where: whereConditions,
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
      limit, // Limita aos últimos 3 registos
      subQuery: false,
    });

    res.status(200).json(history);

  } catch (error) {
    console.error('Erro ao obter histórico do exercício para o cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


const getMyLastPerformances = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Não autenticado.' });
    }

    const userId = req.user.id;

    const rows = await db.ClientExercisePerformance.findAll({
      where: { userId },
      attributes: [
        'id',
        'planExerciseId',
        'performedAt',
        'performedWeight',
        'performedReps',
        'materialUsed',
      ],
      include: [{
        model: db.WorkoutPlanExercise,
        as: 'planExerciseDetails',
        attributes: ['exerciseId'],
        required: false,
      }],
      order: [['performedAt', 'DESC'], ['createdAt', 'DESC']],
      limit: 200,
    });

    const seen = new Set();
    const out = [];
    for (const r of rows) {
      const plain = r.get ? r.get({ plain: true }) : r;
      const planExerciseId = plain.planExerciseId ?? plain.id;
      const key = planExerciseId;
      if (!seen.has(key)) {
        seen.add(key);
        const exerciseId = plain.planExerciseDetails?.exerciseId ?? null;
        out.push({
          id: plain.id,
          planExerciseId: plain.planExerciseId,
          exerciseId,
          performedAt: plain.performedAt,
          performedWeight: plain.performedWeight,
          performedReps: plain.performedReps,
          materialUsed: plain.materialUsed || null,
        });
      }
    }

    return res.json(out);
  } catch (err) {
    console.error('[getMyLastPerformances] ERRO:', err?.message);
    return res.status(200).json([]); // devolve vazio em vez de 500
  }
};

// ========== TRAINING SESSION DRAFT ENDPOINTS ==========

/**
 * Guarda ou atualiza um draft de sessão de treino
 * POST /api/progress/training-session/draft
 */
const saveTrainingSessionDraft = async (req, res) => {
  const userId = req.user.id;
  const { trainingId, workoutPlanId, sessionData, startTime } = req.body;

  if (!workoutPlanId || !sessionData || !startTime) {
    return res.status(400).json({ 
      message: 'Campos obrigatórios em falta: workoutPlanId, sessionData, startTime.' 
    });
  }

  try {
    // Calcular data de expiração (24 horas a partir de agora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Verificar se já existe um draft para este utilizador, treino e plano
    const existingDraft = await db.TrainingSessionDraft.findOne({
      where: {
        userId,
        trainingId: trainingId || null,
        workoutPlanId: parseInt(workoutPlanId),
      },
    });

    if (existingDraft) {
      // Atualizar draft existente
      existingDraft.sessionData = sessionData;
      existingDraft.startTime = parseInt(startTime);
      existingDraft.expiresAt = expiresAt;
      await existingDraft.save();

      return res.status(200).json({ 
        message: 'Draft de treino atualizado com sucesso!', 
        draft: existingDraft 
      });
    } else {
      // Criar novo draft
      const newDraft = await db.TrainingSessionDraft.create({
        userId,
        trainingId: trainingId ? parseInt(trainingId) : null,
        workoutPlanId: parseInt(workoutPlanId),
        sessionData,
        startTime: parseInt(startTime),
        expiresAt,
      });

      return res.status(201).json({ 
        message: 'Draft de treino guardado com sucesso!', 
        draft: newDraft 
      });
    }
  } catch (error) {
    console.error('Erro ao guardar draft de treino:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        message: 'Erro de validação', 
        errors: error.errors.map(e => e.message) 
      });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: 'Já existe um draft para este treino e plano de treino.' 
      });
    }
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao guardar draft.', 
      errorDetails: error.message 
    });
  }
};

/**
 * Obtém o draft de sessão de treino do utilizador
 * GET /api/progress/training-session/draft
 * Query params opcionais: trainingId, workoutPlanId, deviceId (para detectar recuperação noutro dispositivo)
 */
const getTrainingSessionDraft = async (req, res) => {
  const userId = req.user.id;
  const { trainingId, workoutPlanId, deviceId } = req.query;

  try {
    const whereClause = { userId };

    if (trainingId) {
      whereClause.trainingId = parseInt(trainingId);
    } else {
      whereClause.trainingId = null; // Apenas treinos sem trainingId específico
    }

    if (workoutPlanId) {
      whereClause.workoutPlanId = parseInt(workoutPlanId);
    }

    const draft = await db.TrainingSessionDraft.findOne({
      where: whereClause,
      include: [
        {
          model: db.Training,
          as: 'training',
          attributes: ['id', 'name', 'date', 'time'],
        },
        {
          model: db.WorkoutPlan,
          as: 'workoutPlan',
          attributes: ['id', 'name'],
        },
      ],
      order: [['updatedAt', 'DESC']], // Mais recente primeiro
    });

    if (!draft) {
      return res.status(404).json({ message: 'Nenhum draft encontrado.' });
    }

    // Verificar se o draft expirou
    if (new Date(draft.expiresAt) < new Date()) {
      // Eliminar draft expirado
      await draft.destroy();
      return res.status(404).json({ message: 'Draft expirado e eliminado.' });
    }

    // NOTIFICAÇÃO: Se deviceId foi fornecido e é diferente do último dispositivo que atualizou
    // Isso indica que o treino foi recuperado noutro dispositivo
    if (deviceId && draft.lastDeviceId && draft.lastDeviceId !== deviceId) {
      const { _internalCreateNotification } = require('./notificationController');
      const workoutName = draft.workoutPlan?.name || draft.sessionData?.name || 'Treino';
      
      // Criar notificação
      await _internalCreateNotification({
        recipientUserId: userId,
        message: `O teu treino "${workoutName}" foi recuperado noutro dispositivo.`,
        type: 'TRAINING_RECOVERED_OTHER_DEVICE',
        relatedResourceId: draft.workoutPlanId,
        relatedResourceType: 'workout_plan',
        link: '/treino/continuar'
      });

      // Atualizar lastDeviceId
      draft.lastDeviceId = deviceId;
      await draft.save();
    } else if (deviceId && !draft.lastDeviceId) {
      // Primeira vez que este draft é acedido - guardar deviceId
      draft.lastDeviceId = deviceId;
      await draft.save();
    }

    return res.status(200).json({ draft });
  } catch (error) {
    console.error('Erro ao obter draft de treino:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao obter draft.', 
      errorDetails: error.message 
    });
  }
};

/**
 * Elimina um draft de sessão de treino
 * DELETE /api/progress/training-session/draft/:draftId
 * ou DELETE /api/progress/training-session/draft?trainingId=X&workoutPlanId=Y
 */
const deleteTrainingSessionDraft = async (req, res) => {
  const userId = req.user.id;
  const { draftId } = req.params;
  const { trainingId, workoutPlanId } = req.query;

  try {
    let draft;

    if (draftId) {
      // Eliminar por ID
      draft = await db.TrainingSessionDraft.findOne({
        where: { id: parseInt(draftId), userId },
      });
    } else if (trainingId && workoutPlanId) {
      // Eliminar por trainingId e workoutPlanId
      draft = await db.TrainingSessionDraft.findOne({
        where: {
          userId,
          trainingId: parseInt(trainingId),
          workoutPlanId: parseInt(workoutPlanId),
        },
      });
    } else {
      return res.status(400).json({ 
        message: 'É necessário fornecer draftId ou trainingId + workoutPlanId.' 
      });
    }

    if (!draft) {
      return res.status(404).json({ message: 'Draft não encontrado.' });
    }

    await draft.destroy();

    return res.status(200).json({ message: 'Draft eliminado com sucesso!' });
  } catch (error) {
    console.error('Erro ao eliminar draft de treino:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao eliminar draft.', 
      errorDetails: error.message 
    });
  }
};

/**
 * Obtém histórico de todos os drafts do utilizador
 * GET /api/progress/training-session/drafts/history
 */
const getTrainingSessionDraftsHistory = async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;

  try {
    const { count, rows } = await db.TrainingSessionDraft.findAndCountAll({
      where: { userId },
      include: [
        {
          model: db.Training,
          as: 'training',
          attributes: ['id', 'name', 'date', 'time'],
        },
        {
          model: db.WorkoutPlan,
          as: 'workoutPlan',
          attributes: ['id', 'name'],
        },
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Filtrar drafts expirados (mas não eliminá-los ainda)
    const validDrafts = rows.filter(draft => new Date(draft.expiresAt) >= new Date());
    const expiredDrafts = rows.filter(draft => new Date(draft.expiresAt) < new Date());

    res.status(200).json({
      drafts: validDrafts.map(draft => ({
        id: draft.id,
        trainingId: draft.trainingId,
        workoutPlanId: draft.workoutPlanId,
        workoutPlanName: draft.workoutPlan?.name || draft.sessionData?.name || 'Treino',
        trainingName: draft.training?.name,
        trainingDate: draft.training?.date,
        startTime: draft.startTime,
        lastUpdated: draft.updatedAt,
        expiresAt: draft.expiresAt,
        setsCount: draft.sessionData?.setsData ? Object.keys(draft.sessionData.setsData).length : 0,
        isExpired: false,
      })),
      expiredDrafts: expiredDrafts.map(draft => ({
        id: draft.id,
        workoutPlanName: draft.workoutPlan?.name || draft.sessionData?.name || 'Treino',
        lastUpdated: draft.updatedAt,
        expiresAt: draft.expiresAt,
        isExpired: true,
      })),
      total: count,
      validCount: validDrafts.length,
      expiredCount: expiredDrafts.length,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Erro ao obter histórico de drafts:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor ao obter histórico.', 
      errorDetails: error.message 
    });
  }
};

/**
 * Limpeza automática de drafts expirados
 * Pode ser chamado por um cron job ou middleware
 */
const cleanupExpiredDrafts = async () => {
  try {
    const deletedCount = await db.TrainingSessionDraft.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(), // Menor que data atual = expirado
        },
      },
    });

    console.log(`Limpeza automática: ${deletedCount} draft(s) expirado(s) eliminado(s).`);
    return deletedCount;
  } catch (error) {
    console.error('Erro na limpeza automática de drafts:', error);
    throw error;
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
  // Training Session Draft endpoints
  saveTrainingSessionDraft,
  getTrainingSessionDraft,
  deleteTrainingSessionDraft,
  getTrainingSessionDraftsHistory,
  cleanupExpiredDrafts,
};