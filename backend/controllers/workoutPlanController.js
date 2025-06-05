// backend/controllers/workoutPlanController.js
const db = require('../models');
const { Op } = require('sequelize');

// --- Funções para ADMIN gerir Planos de Treino "Modelo" / Globais ---

// @desc    Admin cria um novo plano de treino "modelo" (global)
// @route   POST /api/workout-plans/global
// @access  Privado (Admin Staff)
const createGlobalWorkoutPlan = async (req, res) => {
  const { name, notes, isVisible, exercises } = req.body; // exercises é um array de WorkoutPlanExercise

  if (!name) {
    return res.status(400).json({ message: 'O nome do plano de treino é obrigatório.' });
  }

  const transaction = await db.sequelize.transaction();
  try {
    const newWorkoutPlan = await db.WorkoutPlan.create({
      name,
      notes,
      isVisible: !!isVisible, // Garante que é booleano
      // trainingId é NULO aqui, pois é um plano modelo/global
    }, { transaction });

    if (exercises && exercises.length > 0) {
      const planExercisesData = exercises.map(ex => ({
        ...ex,
        workoutPlanId: newWorkoutPlan.id,
      }));
      await db.WorkoutPlanExercise.bulkCreate(planExercisesData, { transaction });
    }

    await transaction.commit();
    // Retorna o plano com os exercícios, se foram criados
    const result = await db.WorkoutPlan.findByPk(newWorkoutPlan.id, {
        include: [{ model: db.WorkoutPlanExercise, as: 'planExercises' }],
        transaction: null // Nova transação ou sem transação para esta leitura pós-commit
    });
    res.status(201).json(result);

  } catch (error) {
    await transaction.rollback();
    console.error('Erro (admin) ao criar plano de treino global:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar plano de treino global.', error: error.message });
  }
};

// @desc    Admin lista todos os planos de treino "modelo" (globais)
// @route   GET /api/workout-plans/global
// @access  Privado (Admin Staff)
const getAllGlobalWorkoutPlans = async (req, res) => {
  try {
    const workoutPlans = await db.WorkoutPlan.findAll({
      // Poderia adicionar filtros aqui se necessário (ex: por isVisible, nome)
      order: [['name', 'ASC']],
      include: [{
        model: db.WorkoutPlanExercise,
        as: 'planExercises',
        include: [{ model: db.Exercise, as: 'exerciseDetails', attributes: ['id', 'name'] }]
      }]
    });
    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error('Erro (admin) ao listar planos de treino globais:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin obtém um plano de treino "modelo" (global) por ID
// @route   GET /api/workout-plans/global/:planId
// @access  Privado (Admin Staff)
const getGlobalWorkoutPlanById = async (req, res) => {
    const { planId } = req.params;
    try {
        const workoutPlan = await db.WorkoutPlan.findByPk(planId, {
            include: [{
                model: db.WorkoutPlanExercise,
                as: 'planExercises',
                order: [['order', 'ASC']],
                include: [{ model: db.Exercise, as: 'exerciseDetails' }]
            }]
        });
        if (!workoutPlan) {
            return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
        }
        res.status(200).json(workoutPlan);
    } catch (error) {
        console.error('Erro (admin) ao buscar plano de treino global por ID:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
};

// @desc    Admin atualiza um plano de treino "modelo" (global)
// @route   PUT /api/workout-plans/global/:planId
// @access  Privado (Admin Staff)
const updateGlobalWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  const { name, notes, isVisible, exercises } = req.body; // exercises é um array de WorkoutPlanExercise

  const transaction = await db.sequelize.transaction();
  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(planId, { transaction });
    if (!workoutPlan) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
    }

    if (name !== undefined) workoutPlan.name = name;
    if (notes !== undefined) workoutPlan.notes = notes;
    if (isVisible !== undefined) workoutPlan.isVisible = !!isVisible;

    await workoutPlan.save({ transaction });

    // Atualizar WorkoutPlanExercises: apaga os existentes e recria com os novos
    // Esta é a forma mais simples de garantir consistência.
    // Uma lógica de diff seria mais complexa.
    if (exercises && Array.isArray(exercises)) {
      await db.WorkoutPlanExercise.destroy({ where: { workoutPlanId: planId }, transaction });
      const planExercisesData = exercises.map(ex => ({
        ...ex,
        exerciseId: ex.exerciseId || ex.exerciseDetails?.id, // Garante que temos o exerciseId
        workoutPlanId: planId,
      }));
      await db.WorkoutPlanExercise.bulkCreate(planExercisesData, { transaction, validate: true });
    }

    await transaction.commit();
    const updatedPlan = await db.WorkoutPlan.findByPk(planId, {
        include: [{ model: db.WorkoutPlanExercise, as: 'planExercises' }]
    });
    res.status(200).json(updatedPlan);

  } catch (error) {
    await transaction.rollback();
    console.error('Erro (admin) ao atualizar plano de treino global:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin elimina um plano de treino "modelo" (global)
// @route   DELETE /api/workout-plans/global/:planId
// @access  Privado (Admin Staff)
const deleteGlobalWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  const transaction = await db.sequelize.transaction();
  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(planId, { transaction });
    if (!workoutPlan) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
    }

    // Remover associações na tabela TrainingWorkoutPlans
    await db.TrainingWorkoutPlan.destroy({ where: { workoutPlanId: planId }, transaction });

    // WorkoutPlanExercises são apagados em cascata devido ao onDelete: 'CASCADE' no modelo WorkoutPlan
    await workoutPlan.destroy({ transaction });

    await transaction.commit();
    res.status(200).json({ message: 'Plano de treino global e suas associações eliminados com sucesso.' });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro (admin) ao eliminar plano de treino global:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


// --- Funções para ASSOCIAR/DESASSOCIAR Planos a Treinos Específicos ---

// @desc    Admin associa um plano de treino a um treino específico
// @route   POST /api/workout-plans/:planId/assign-to-training/:trainingId
// @access  Privado (Admin Staff)
const assignPlanToTraining = async (req, res) => {
  const { planId, trainingId } = req.params;
  const { orderInTraining } = req.body; // Ordem do plano dentro do treino específico

  try {
    const plan = await db.WorkoutPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ message: 'Plano de treino não encontrado.' });

    const training = await db.Training.findByPk(trainingId);
    if (!training) return res.status(404).json({ message: 'Treino não encontrado.' });

    // Verifica se a associação já existe
    const existingAssociation = await db.TrainingWorkoutPlan.findOne({
      where: { workoutPlanId: planId, trainingId: trainingId }
    });

    if (existingAssociation) {
      return res.status(409).json({ message: 'Este plano de treino já está associado a este treino.' });
    }

    await db.TrainingWorkoutPlan.create({
      trainingId: parseInt(trainingId),
      workoutPlanId: parseInt(planId),
      orderInTraining: orderInTraining !== undefined ? parseInt(orderInTraining) : 0
    });

    res.status(201).json({ message: 'Plano de treino associado ao treino com sucesso.' });
  } catch (error) {
    console.error('Erro ao associar plano a treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};

// @desc    Admin remove a associação de um plano de treino de um treino específico
// @route   DELETE /api/workout-plans/:planId/remove-from-training/:trainingId
// @access  Privado (Admin Staff)
const removePlanFromTraining = async (req, res) => {
  const { planId, trainingId } = req.params;
  try {
    const result = await db.TrainingWorkoutPlan.destroy({
      where: {
        workoutPlanId: planId,
        trainingId: trainingId
      }
    });
    if (result === 0) {
      return res.status(404).json({ message: 'Associação entre plano e treino não encontrada.' });
    }
    res.status(200).json({ message: 'Associação do plano ao treino removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover associação de plano a treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};


// --- Funções para CLIENTES e visualização específica de Treinos ---

// @desc    Lista os planos de treino especificamente ASSOCIADOS a um treino
//          (para Cliente participante ou Admin/Instrutor do treino)
// @route   GET /api/trainings/:trainingId/workout-plans
// @access  Privado (Permissão verificada)
const getWorkoutPlansForTraining = async (req, res) => {
  const { trainingId } = req.params;
  try {
    const training = await db.Training.findByPk(trainingId, {
      include: [{
        model: db.WorkoutPlan,
        as: 'workoutPlans', // Usar o alias da associação M:N
        through: { attributes: ['orderInTraining'] }, // Para obter a ordem do plano neste treino
        include: [{ // Para obter os exercícios de cada plano
          model: db.WorkoutPlanExercise,
          as: 'planExercises',
          include: [{ model: db.Exercise, as: 'exerciseDetails' }]
        }]
      }]
    });

    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    // Lógica de permissão (admin, cliente participante, instrutor do treino) - rever e simplificar se necessário
    let canView = false;
    if (req.staff && req.staff.role === 'admin') { // Admin staff vê tudo
        canView = true;
    } else if (req.user) { // Se for um cliente
        const isUserParticipant = await training.hasParticipant(req.user);
        if (isUserParticipant) canView = true;
    } else if (req.staff && training.instructorId === req.staff.id) { // Se for o instrutor do treino
        canView = true;
    }

    if (!canView) {
        return res.status(403).json({ message: 'Acesso negado para ver planos deste treino.' });
    }

    // Ordena os planos pela orderInTraining da tabela de junção
    const sortedPlans = training.workoutPlans ? training.workoutPlans.sort((a, b) => {
        const orderA = a.TrainingWorkoutPlans?.orderInTraining ?? 0;
        const orderB = b.TrainingWorkoutPlans?.orderInTraining ?? 0;
        return orderA - orderB;
    }) : [];

    res.status(200).json(sortedPlans); // Retorna os planos associados a este treino
  } catch (error) {
    console.error('Erro ao listar planos de treino para o treino específico:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


// @desc    Lista planos de treino VISÍVEIS para clientes (biblioteca com pesquisa)
// @route   GET /api/workout-plans/visible
// @access  Privado (Cliente ou qualquer autenticado)
const getVisibleWorkoutPlans = async (req, res) => {
  const { searchTerm } = req.query;
  const whereClause = {
    isVisible: true,
  };

  if (searchTerm) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${searchTerm}%` } },
      { notes: { [Op.iLike]: `%${searchTerm}%` } },
      // Para pesquisa mais avançada (ex: por nome de exercício), seria necessário um include e where no include
    ];
  }

  try {
    const workoutPlans = await db.WorkoutPlan.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
      include: [
        {
          model: db.WorkoutPlanExercise,
          as: 'planExercises',
          order: [['order', 'ASC']],
          include: [
            {
              model: db.Exercise,
              as: 'exerciseDetails',
              attributes: ['id', 'name', 'muscleGroup', 'imageUrl', 'videoUrl']
            }
          ]
        }
      ]
    });
    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error('Erro ao listar planos de treino visíveis:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};

// --- Funções para gerir EXERCÍCIOS dentro de um Plano de Treino "Modelo" ---
// Estas funções são chamadas por rotas como /api/workout-plans/global/:planId/exercises
// e são muito similares às que já tinhas, mas agora operam em planos "modelo"
// As rotas para estas devem estar em workoutPlanRoutes.js

// @desc    Admin adiciona um exercício a um plano de treino "modelo"
// @route   POST /api/workout-plans/global/:planId/exercises
// @access  Privado (Admin Staff)
const addExerciseToGlobalWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  const { exerciseId, sets, reps, durationSeconds, restSeconds, order, notes } = req.body;

  if (!exerciseId || order === undefined) {
    return res.status(400).json({ message: 'ID do exercício e ordem são obrigatórios.' });
  }

  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(planId);
    if (!workoutPlan) {
      return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
    }

    const exercise = await db.Exercise.findByPk(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercício base não encontrado.' });
    }

    const newPlanExercise = await db.WorkoutPlanExercise.create({
      workoutPlanId: parseInt(planId),
      exerciseId: parseInt(exerciseId),
      sets, reps, durationSeconds, restSeconds, order, notes,
    });
    res.status(201).json(newPlanExercise);
  } catch (error) {
    console.error('Erro (admin) ao adicionar exercício a plano global:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin (ou qualquer com acesso) lista exercícios de um plano "modelo"
// @route   GET /api/workout-plans/global/:planId/exercises
// @access  Privado
const getExercisesForGlobalWorkoutPlan = async (req, res) => {
    const { planId } = req.params;
    try {
        const workoutPlan = await db.WorkoutPlan.findByPk(planId);
        if (!workoutPlan) {
            return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
        }
        // Adicionar lógica de permissão se necessário (ex: só admin pode ver todos os globais,
        // ou se isVisible=false, só pode ser visto por admins)

        const exercises = await db.WorkoutPlanExercise.findAll({
            where: { workoutPlanId: planId },
            order: [['order', 'ASC']],
            include: [{ model: db.Exercise, as: 'exerciseDetails' }]
        });
        res.status(200).json(exercises);
    } catch (error) {
        console.error('Erro ao listar exercícios de plano global:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
};


// @desc    Admin atualiza um exercício num plano de treino "modelo"
// @route   PUT /api/workout-plans/global/exercises/:planExerciseId
// @access  Privado (Admin Staff)
const updateExerciseInGlobalWorkoutPlan = async (req, res) => {
  const { planExerciseId } = req.params;
  const { sets, reps, durationSeconds, restSeconds, order, notes, exerciseId } = req.body;

  try {
    const planExercise = await db.WorkoutPlanExercise.findByPk(planExerciseId);
    if (!planExercise) {
      return res.status(404).json({ message: 'Exercício do plano não encontrado.' });
    }

    if (exerciseId !== undefined) {
        const baseExercise = await db.Exercise.findByPk(parseInt(exerciseId));
        if (!baseExercise) return res.status(404).json({ message: 'Exercício base para atualização não encontrado.' });
        planExercise.exerciseId = parseInt(exerciseId);
    }
    if (sets !== undefined) planExercise.sets = sets;
    if (reps !== undefined) planExercise.reps = reps;
    if (durationSeconds !== undefined) planExercise.durationSeconds = durationSeconds;
    if (restSeconds !== undefined) planExercise.restSeconds = restSeconds;
    if (order !== undefined) planExercise.order = order;
    if (notes !== undefined) planExercise.notes = notes;

    await planExercise.save();
    const updatedPlanExercise = await db.WorkoutPlanExercise.findByPk(planExercise.id, {
        include: [{model: db.Exercise, as: 'exerciseDetails'}]
    });
    res.status(200).json(updatedPlanExercise);
  } catch (error) {
    console.error('Erro (admin) ao atualizar exercício no plano global:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin remove um exercício de um plano de treino "modelo"
// @route   DELETE /api/workout-plans/global/exercises/:planExerciseId
// @access  Privado (Admin Staff)
const removeExerciseFromGlobalWorkoutPlan = async (req, res) => {
  const { planExerciseId } = req.params;
  try {
    const planExercise = await db.WorkoutPlanExercise.findByPk(planExerciseId);
    if (!planExercise) {
      return res.status(404).json({ message: 'Exercício do plano não encontrado.' });
    }
    await planExercise.destroy();
    res.status(200).json({ message: 'Exercício removido do plano com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao remover exercício do plano global:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

module.exports = {
  createGlobalWorkoutPlan,
  getAllGlobalWorkoutPlans,
  getGlobalWorkoutPlanById,
  updateGlobalWorkoutPlan,
  deleteGlobalWorkoutPlan,
  assignPlanToTraining,
  removePlanFromTraining,
  getWorkoutPlansForTraining, // Usada por /trainings/:trainingId/workout-plans
  getVisibleWorkoutPlans,     // Usada por /workout-plans/visible
  addExerciseToGlobalWorkoutPlan,
  getExercisesForGlobalWorkoutPlan,
  updateExerciseInGlobalWorkoutPlan,
  removeExerciseFromGlobalWorkoutPlan,
  // Manter as funções originais se ainda forem usadas por rotas diretas a :planId
  // que não sejam os globais, mas com a refatoração M:N, a lógica delas mudaria.
  // Por agora, focamos nas "globais" e nas que vêm de um :trainingId.
};