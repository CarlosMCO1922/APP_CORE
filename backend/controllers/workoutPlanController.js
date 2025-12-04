// backend/controllers/workoutPlanController.js
const db = require('../models');
const { Op } = require('sequelize');

// --- Funções para ADMIN gerir Planos de Treino "Modelo" / Globais ---
const createGlobalWorkoutPlan = async (req, res) => {
  const { name, notes, isVisible, exercises } = req.body;
  if (!name) return res.status(400).json({ message: 'O nome do plano de treino é obrigatório.' });

  const transaction = await db.sequelize.transaction();
  try {
    const newWorkoutPlan = await db.WorkoutPlan.create({ name, notes, isVisible: !!isVisible }, { transaction });

    if (exercises && exercises.length > 0) {
      const validExercises = exercises.filter(ex => ex.exerciseId && String(ex.exerciseId).trim() !== '');
      
      if (validExercises.length > 0) {
        const planExercisesToCreate = [];
        let blockOrder = 0;
        let supersetIdCounter = 1;
        const tempGroupToNewGroup = new Map();

        for (let i = 0; i < validExercises.length; i++) {
          const exercise = validExercises[i];
          const prevExercise = i > 0 ? validExercises[i - 1] : null;

          // Incrementa a ordem do bloco se este exercício não for parte da superset anterior
          if (!prevExercise || exercise.supersetGroup !== prevExercise.supersetGroup || !exercise.supersetGroup) {
            blockOrder = (i > 0) ? blockOrder + 1 : 0;
          }

          let finalSupersetGroup = null;
          if (exercise.supersetGroup) {
            if (!tempGroupToNewGroup.has(exercise.supersetGroup)) {
              tempGroupToNewGroup.set(exercise.supersetGroup, supersetIdCounter++);
            }
            finalSupersetGroup = tempGroupToNewGroup.get(exercise.supersetGroup);
          }
          
          const internalOrder = prevExercise && exercise.supersetGroup === prevExercise.supersetGroup 
            ? (planExercisesToCreate[planExercisesToCreate.length - 1].internalOrder + 1)
            : 0;

          planExercisesToCreate.push({
            workoutPlanId: newWorkoutPlan.id,
            exerciseId: parseInt(exercise.exerciseId),
            sets: exercise.sets ? parseInt(exercise.sets) : null,
            reps: exercise.reps || null,
            restSeconds: exercise.restSeconds ? parseInt(exercise.restSeconds) : null,
            notes: exercise.notes || null,
            order: blockOrder,
            internalOrder: internalOrder,
            supersetGroup: finalSupersetGroup,
          });
        }
        
        await db.WorkoutPlanExercise.bulkCreate(planExercisesToCreate, { transaction });
      }
    }

    await transaction.commit();
    const result = await db.WorkoutPlan.findByPk(newWorkoutPlan.id, {
        include: [{ 
            model: db.WorkoutPlanExercise, 
            as: 'planExercises', 
            order: [['order', 'ASC'], ['internalOrder', 'ASC']],
            include: [{model: db.Exercise, as: 'exerciseDetails'}] 
        }]
    });
    res.status(201).json(result);

  } catch (error) {
    await transaction.rollback();
    console.error('Erro (admin) ao criar plano de treino global:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar plano de treino global.', error: error.message });
  }
};


const getAllGlobalWorkoutPlans = async (req, res) => {
  try {
    const workoutPlans = await db.WorkoutPlan.findAll({
      order: [['name', 'ASC']],
      include: [{
        model: db.WorkoutPlanExercise,
        as: 'planExercises',
        required: false, // LEFT JOIN para não excluir planos sem exercícios
        include: [{ 
          model: db.Exercise, 
          as: 'exerciseDetails', 
          attributes: ['id', 'name'],
          required: false // LEFT JOIN para não excluir exercícios sem detalhes
        }]
      }]
    });
    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error('Erro (admin) ao listar planos de treino globais:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


const getGlobalWorkoutPlanById = async (req, res) => {
    const { planId } = req.params;
    try {
        const workoutPlan = await db.WorkoutPlan.findByPk(planId, {
            include: [{
                model: db.WorkoutPlanExercise,
                as: 'planExercises',
                order: [['order', 'ASC'], ['internalOrder', 'ASC']],
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


const updateGlobalWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  const { name, notes, isVisible, exercises } = req.body;

  const transaction = await db.sequelize.transaction();
  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(parseInt(planId), { transaction });
    if (!workoutPlan) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
    }

    await workoutPlan.update({ name, notes, isVisible }, { transaction });

    if (exercises && Array.isArray(exercises)) {
      await db.WorkoutPlanExercise.destroy({ where: { workoutPlanId: planId }, transaction });

      const validExercises = exercises.filter(ex => ex.exerciseId && String(ex.exerciseId).trim() !== '');

      if (validExercises.length > 0) {
        const planExercisesToCreate = [];
        let blockOrder = 0;
        let supersetIdCounter = 1;
        const tempGroupToNewGroup = new Map();

        for (let i = 0; i < validExercises.length; i++) {
          const exercise = validExercises[i];
          const prevExercise = i > 0 ? validExercises[i - 1] : null;

          if (!prevExercise || exercise.supersetGroup !== prevExercise.supersetGroup || !exercise.supersetGroup) {
            blockOrder = (i > 0) ? blockOrder + 1 : 0;
          }
          
          let finalSupersetGroup = null;
          if (exercise.supersetGroup) {
            if (!tempGroupToNewGroup.has(exercise.supersetGroup)) {
              tempGroupToNewGroup.set(exercise.supersetGroup, supersetIdCounter++);
            }
            finalSupersetGroup = tempGroupToNewGroup.get(exercise.supersetGroup);
          }

          const internalOrder = prevExercise && exercise.supersetGroup === prevExercise.supersetGroup 
            ? (planExercisesToCreate[planExercisesToCreate.length - 1].internalOrder + 1)
            : 0;

          planExercisesToCreate.push({
            workoutPlanId: parseInt(planId),
            exerciseId: parseInt(exercise.exerciseId || exercise.exerciseDetails?.id),
            sets: exercise.sets ? parseInt(exercise.sets) : null,
            reps: exercise.reps || null,
            restSeconds: exercise.restSeconds ? parseInt(exercise.restSeconds) : null,
            notes: exercise.notes || null,
            order: blockOrder,
            internalOrder: internalOrder,
            supersetGroup: finalSupersetGroup,
          });
        }
        
        await db.WorkoutPlanExercise.bulkCreate(planExercisesToCreate, { transaction });
      }
    }

    await transaction.commit();
    const updatedPlan = await db.WorkoutPlan.findByPk(parseInt(planId), {
        include: [{ 
            model: db.WorkoutPlanExercise, 
            as: 'planExercises',
            order: [['order', 'ASC'], ['internalOrder', 'ASC']],
            include: [{model: db.Exercise, as: 'exerciseDetails'}] 
        }]
    });
    res.status(200).json(updatedPlan);

  } catch (error) {
    await transaction.rollback();
    console.error('Erro (admin) ao atualizar plano de treino global:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

const deleteGlobalWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  const transaction = await db.sequelize.transaction();
  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(parseInt(planId), { transaction });
    if (!workoutPlan) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
    }
    await db.TrainingWorkoutPlan.destroy({ where: { workoutPlanId: planId }, transaction });
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
const assignPlanToTraining = async (req, res) => {
  const { planId, trainingId } = req.params;
  const { orderInTraining } = req.body;
  try {
    const plan = await db.WorkoutPlan.findByPk(parseInt(planId));
    if (!plan) return res.status(404).json({ message: 'Plano de treino não encontrado.' });
    const training = await db.Training.findByPk(parseInt(trainingId));
    if (!training) return res.status(404).json({ message: 'Treino não encontrado.' });
    const existingAssociation = await db.TrainingWorkoutPlan.findOne({
      where: { workoutPlanId: parseInt(planId), trainingId: parseInt(trainingId) }
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

const removePlanFromTraining = async (req, res) => {
  const { planId, trainingId } = req.params;
  try {
    const result = await db.TrainingWorkoutPlan.destroy({
      where: { workoutPlanId: parseInt(planId), trainingId: parseInt(trainingId) }
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
const getWorkoutPlansForTraining = async (req, res) => {
  const { trainingId } = req.params;
  try {
    const training = await db.Training.findByPk(parseInt(trainingId));
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }
    let canView = false;
    if (req.staff && req.staff.role === 'admin') canView = true;
    else if (req.user) { const isUserParticipant = await training.hasParticipant(req.user); if (isUserParticipant) canView = true; }
    else if (req.staff && training.instructorId === req.staff.id) canView = true;

    if (!canView) return res.status(403).json({ message: 'Acesso negado para ver planos deste treino.' });

    const associatedPlans = await training.getWorkoutPlans({
      include: [{
        model: db.WorkoutPlanExercise,
        as: 'planExercises',
        required: false, // LEFT JOIN para não excluir planos sem exercícios
        include: [{ 
          model: db.Exercise, 
          as: 'exerciseDetails',
          required: false // LEFT JOIN para não excluir exercícios sem detalhes
        }]
      }],
      joinTableAttributes: ['orderInTraining'],
      order: [
        db.sequelize.literal(`"TrainingWorkoutPlan"."orderInTraining"`),
        ['order', 'ASC']
      ]
    });

    // Ordenar os exercícios de cada plano manualmente
    const plansWithOrderedExercises = (associatedPlans || []).map(plan => {
      try {
        const planJSON = plan.toJSON ? plan.toJSON() : plan;
        if (planJSON.planExercises && Array.isArray(planJSON.planExercises)) {
          planJSON.planExercises.sort((a, b) => {
            // Primeiro por order (bloco), depois por internalOrder (ordem dentro do bloco)
            const orderA = a.order !== null && a.order !== undefined ? a.order : 0;
            const orderB = b.order !== null && b.order !== undefined ? b.order : 0;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            // Se estão no mesmo bloco, ordenar por internalOrder
            const internalOrderA = a.internalOrder !== null && a.internalOrder !== undefined ? a.internalOrder : 0;
            const internalOrderB = b.internalOrder !== null && b.internalOrder !== undefined ? b.internalOrder : 0;
            return internalOrderA - internalOrderB;
          });
        }
        return planJSON;
      } catch (err) {
        console.error('Erro ao processar plano:', err);
        return plan.toJSON ? plan.toJSON() : plan;
      }
    });

    res.status(200).json(plansWithOrderedExercises);
  } catch (error) {
    console.error('Erro ao listar planos para o treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

const getVisibleWorkoutPlans = async (req, res) => {
  const { searchTerm } = req.query;
  const whereClause = { isVisible: true };
  if (searchTerm) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${searchTerm}%` } }, { notes: { [Op.iLike]: `%${searchTerm}%` } },
    ];
  }
  try {
    const workoutPlans = await db.WorkoutPlan.findAll({
      where: whereClause, order: [['name', 'ASC']],
      include: [{
        model: db.WorkoutPlanExercise, as: 'planExercises', order: [['order', 'ASC'], ['internalOrder', 'ASC']],
        include: [{ model: db.Exercise, as: 'exerciseDetails', attributes: ['id', 'name', 'muscleGroup', 'imageUrl', 'videoUrl'] }]
      }]
    });
    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error('Erro ao listar planos visíveis:', error);
    res.status(500).json({ message: 'Erro interno.', errorDetails: error.message });
  }
};

// --- Funções para gerir EXERCÍCIOS dentro de um Plano de Treino "Modelo" / Global ---
const addExerciseToGlobalWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  const { exerciseId, sets, reps, durationSeconds, restSeconds, order, notes } = req.body;
  if (!exerciseId || order === undefined) return res.status(400).json({ message: 'ID do exercício e ordem são obrigatórios.' });
  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(parseInt(planId));
    if (!workoutPlan) return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
    const exercise = await db.Exercise.findByPk(parseInt(exerciseId));
    if (!exercise) return res.status(404).json({ message: 'Exercício base não encontrado.' });
    const newPlanExercise = await db.WorkoutPlanExercise.create({
      workoutPlanId: parseInt(planId), exerciseId: parseInt(exerciseId),
      sets, reps, durationSeconds, restSeconds, order: parseInt(order), notes,
    });
    res.status(201).json(newPlanExercise);
  } catch (error) {
    console.error('Erro (admin) ao adicionar exercício a plano global:', error);
    if (error.name === 'SequelizeValidationError') return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    res.status(500).json({ message: 'Erro interno.', error: error.message });
  }
};

const getExercisesForGlobalWorkoutPlan = async (req, res) => {
    const { planId } = req.params;
    try {
        const workoutPlan = await db.WorkoutPlan.findByPk(parseInt(planId));
        if (!workoutPlan) return res.status(404).json({ message: 'Plano de treino global não encontrado.' });
        const exercises = await db.WorkoutPlanExercise.findAll({
            where: { workoutPlanId: parseInt(planId) }, order: [['order', 'ASC'], ['internalOrder', 'ASC']],
            include: [{ model: db.Exercise, as: 'exerciseDetails' }]
        });
        res.status(200).json(exercises);
    } catch (error) {
        console.error('Erro ao listar exercícios de plano global:', error);
        res.status(500).json({ message: 'Erro interno.', error: error.message });
    }
};

const updateExerciseInGlobalWorkoutPlan = async (req, res) => {
  const { planExerciseId } = req.params;
  const { sets, reps, durationSeconds, restSeconds, order, notes, exerciseId } = req.body;
  try {
    const planExercise = await db.WorkoutPlanExercise.findByPk(parseInt(planExerciseId));
    if (!planExercise) return res.status(404).json({ message: 'Exercício do plano não encontrado.' });
    if (exerciseId !== undefined) {
        const baseExercise = await db.Exercise.findByPk(parseInt(exerciseId));
        if (!baseExercise) return res.status(404).json({ message: 'Exercício base para atualização não encontrado.' });
        planExercise.exerciseId = parseInt(exerciseId);
    }
    if (sets !== undefined) planExercise.sets = sets ? parseInt(sets) : null;
    if (reps !== undefined) planExercise.reps = reps;
    if (durationSeconds !== undefined) planExercise.durationSeconds = durationSeconds ? parseInt(durationSeconds) : null;
    if (restSeconds !== undefined) planExercise.restSeconds = restSeconds ? parseInt(restSeconds) : null;
    if (order !== undefined) planExercise.order = parseInt(order);
    if (notes !== undefined) planExercise.notes = notes;
    await planExercise.save();
    const updatedPlanExercise = await db.WorkoutPlanExercise.findByPk(planExercise.id, {
        include: [{model: db.Exercise, as: 'exerciseDetails'}]
    });
    res.status(200).json(updatedPlanExercise);
  } catch (error) {
    console.error('Erro (admin) ao atualizar exercício no plano global:', error);
    if (error.name === 'SequelizeValidationError') return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    res.status(500).json({ message: 'Erro interno.', error: error.message });
  }
};

const removeExerciseFromGlobalWorkoutPlan = async (req, res) => {
  const { planExerciseId } = req.params; 
  try {
    const planExercise = await db.WorkoutPlanExercise.findByPk(parseInt(planExerciseId));
    if (!planExercise) return res.status(404).json({ message: 'Exercício do plano não encontrado.' });
    await planExercise.destroy();
    res.status(200).json({ message: 'Exercício removido do plano com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao remover exercício do plano global:', error);
    res.status(500).json({ message: 'Erro interno.', error: error.message });
  }
};


const getVisibleGlobalWorkoutPlanByIdForClient = async (req, res) => {
    const { planId } = req.params;
    try {
        const workoutPlan = await db.WorkoutPlan.findOne({
            where: { id: parseInt(planId), isVisible: true },
            include: [{
                model: db.WorkoutPlanExercise,
                as: 'planExercises',
                order: [['order', 'ASC'], ['internalOrder', 'ASC']], 
                include: [{ model: db.Exercise, as: 'exerciseDetails' }]
            }]
        });

        if (!workoutPlan) { /* ... */ }
        res.status(200).json(workoutPlan);
    } catch (error) { /* ... */ }
};

module.exports = {
  createGlobalWorkoutPlan,
  getAllGlobalWorkoutPlans,
  getGlobalWorkoutPlanById,
  updateGlobalWorkoutPlan,
  deleteGlobalWorkoutPlan,
  assignPlanToTraining,
  removePlanFromTraining,
  getWorkoutPlansForTraining,
  getVisibleWorkoutPlans,
  addExerciseToGlobalWorkoutPlan,
  getExercisesForGlobalWorkoutPlan,
  updateExerciseInGlobalWorkoutPlan,
  removeExerciseFromGlobalWorkoutPlan,
  getVisibleGlobalWorkoutPlanByIdForClient,
};