// backend/controllers/workoutPlanController.js
const db = require('../models');
const { Op } = require('sequelize');

// @desc    Admin cria um novo plano de treino para um treino existente
// @route   POST /api/trainings/:trainingId/workout-plans
// @access  Privado (Admin Staff)
const createWorkoutPlan = async (req, res) => {
  const { trainingId } = req.params;
  const { name, order, notes, isVisible} = req.body;

  if (!name || order === undefined) {
    return res.status(400).json({ message: 'Nome e ordem do plano de treino são obrigatórios.' });
  }

  try {
    const training = await db.Training.findByPk(trainingId);
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    const newWorkoutPlanData = await db.WorkoutPlan.create({
      trainingId,
      name,
      order,
      notes,
    });
    if (isVisible !== undefined) { // Só adiciona se for explicitamente enviado
        newWorkoutPlanData.isVisible = !!isVisible; // Converte para booleano
    }
    const newWorkoutPlan = await db.WorkoutPlan.create(newWorkoutPlanData);
    res.status(201).json(newWorkoutPlan);
  } catch (error) {
    console.error('Erro (admin) ao criar plano de treino:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar plano de treino.', error: error.message });
  }
};

// @desc    Lista todos os planos de treino de um treino específico (Admin ou Cliente inscrito)
// @route   GET /api/trainings/:trainingId/workout-plans
// @access  Privado (Admin Staff, Cliente inscrito no treino)
const getWorkoutPlansForTraining = async (req, res) => {
  const { trainingId } = req.params;
  try {
    const training = await db.Training.findByPk(trainingId);
    if (!training) {
      return res.status(404).json({ message: 'Treino não encontrado.' });
    }

    // Lógica de permissão:
    // Admin pode ver todos.
    // Cliente só pode ver se estiver inscrito no treino.
    let canView = false;
    if (req.staff && req.staff.role === 'admin') {
      canView = true;
    } else if (req.user) {
      const isUserParticipant = await training.hasParticipant(req.user);
      if (isUserParticipant) {
        canView = true;
      }
    }
    // Se for um staff (não admin) a tentar aceder a planos de treinos de outros,
    // ou um cliente não inscrito, esta lógica pode precisar de ajuste
    // dependendo se staff não admin pode ver todos os planos de treino.
    // Por agora, vamos simplificar: Admin vê tudo, cliente inscrito vê.

    if (!canView && !(req.staff && ['trainer', 'physiotherapist'].includes(req.staff.role))) { // Permitir trainer/physio ver também
         // Se req.staff existir e tiver um role que permita ver (ex: trainer do treino)
         if (req.staff && training.instructorId === req.staff.id) {
            canView = true;
        } else {
            return res.status(403).json({ message: 'Acesso negado. Não tem permissão para ver os planos deste treino.' });
        }
    }


    const workoutPlans = await db.WorkoutPlan.findAll({
      where: { trainingId },
      order: [['order', 'ASC']],
      include: [ // Incluir os exercícios de cada plano
        {
          model: db.WorkoutPlanExercise,
          as: 'planExercises',
          order: [['order', 'ASC']], // Ordenar exercícios dentro de cada plano
          include: [
            {
              model: db.Exercise,
              as: 'exerciseDetails', // Para obter nome, imagem, video do exercício base
              attributes: ['id', 'name', 'description', 'imageUrl', 'videoUrl', 'muscleGroup']
            }
          ]
        }
      ]
    });
    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error('Erro ao listar planos de treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar planos de treino.', error: error.message });
  }
};

// @desc    Admin atualiza um plano de treino
// @route   PUT /api/trainings/workout-plans/:planId
// @access  Privado (Admin Staff)
const updateWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  const { name, order, notes, isVisible} = req.body;

  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(planId);
    if (!workoutPlan) {
      return res.status(404).json({ message: 'Plano de treino não encontrado.' });
    }

    // Opcional: Verificar se o admin que está a atualizar tem permissão sobre o treino associado
    // const training = await db.Training.findByPk(workoutPlan.trainingId);
    // if (req.staff.role !== 'admin' && training.instructorId !== req.staff.id) {
    //   return res.status(403).json({ message: 'Não tem permissão para alterar este plano de treino.' });
    // }

    if (name !== undefined) workoutPlan.name = name;
    if (order !== undefined) workoutPlan.order = order;
    if (notes !== undefined) workoutPlan.notes = notes;
    if (isVisible !== undefined) { // Permite atualizar o campo isVisible
      workoutPlan.isVisible = !!isVisible; // Converte para booleano
    }

    await workoutPlan.save();
    res.status(200).json(workoutPlan);
  } catch (error) {
    console.error('Erro (admin) ao atualizar plano de treino:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar plano de treino.', error: error.message });
  }
};

// @desc    Admin elimina um plano de treino
// @route   DELETE /api/trainings/workout-plans/:planId
// @access  Privado (Admin Staff)
const deleteWorkoutPlan = async (req, res) => {
  const { planId } = req.params;
  try {
    const workoutPlan = await db.WorkoutPlan.findByPk(planId);
    if (!workoutPlan) {
      return res.status(404).json({ message: 'Plano de treino não encontrado.' });
    }

    // Opcional: Verificar permissões semelhantes à atualização

    // A associação `WorkoutPlan.hasMany(models.WorkoutPlanExercise)` tem `onDelete: 'CASCADE'`
    // por isso, os WorkoutPlanExercises associados devem ser eliminados automaticamente.
    await workoutPlan.destroy();
    res.status(200).json({ message: 'Plano de treino eliminado com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao eliminar plano de treino:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar plano de treino.', error: error.message });
  }
};

// @desc    Lista planos de treino visíveis para clientes (com pesquisa)
// @route   GET /api/workout-plans/visible
// @access  Privado (Cliente ou qualquer autenticado)
const getVisibleWorkoutPlans = async (req, res) => {
  const { searchTerm, muscleGroup, createdByStaffId } = req.query; // Exemplos de filtros
  const whereClause = {
    isVisible: true, // APENAS PLANOS VISÍVEIS
  };

  if (searchTerm) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${searchTerm}%` } },
      { notes: { [Op.iLike]: `%${searchTerm}%` } },
      // Para pesquisar por nome de exercício dentro do plano, a query fica mais complexa,
      // envolvendo um include e where no include. Simplificaremos por agora.
    ];
  }

  // Filtro por grupo muscular exigiria um JOIN com Exercícios através de WorkoutPlanExercise
  // Para simplificar, vamos omitir este filtro por agora ou considerar uma forma mais simples
  // Se 'muscleGroup' fosse um campo no próprio WorkoutPlan, seria mais fácil.

  // Filtro por quem criou (se WorkoutPlan tiver um campo creatorStaffId)
  // if (createdByStaffId) {
  //   whereClause.creatorStaffId = createdByStaffId;
  // }

  try {
    const workoutPlans = await db.WorkoutPlan.findAll({
      where: whereClause,
      order: [['name', 'ASC']], // Ou por data de criação, etc.
      include: [
        {
          model: db.WorkoutPlanExercise,
          as: 'planExercises',
          include: [
            {
              model: db.Exercise,
              as: 'exerciseDetails',
              attributes: ['id', 'name', 'muscleGroup'] // Adiciona os atributos que queres mostrar
            }
          ]
        },
        // Opcional: incluir o instrutor que criou o treino original (se relevante)
        // {
        //   model: db.Training,
        //   as: 'trainingSession',
        //   include: [{ model: db.Staff, as: 'instructor', attributes: ['id', 'firstName', 'lastName'] }]
        // }
      ]
    });
    res.status(200).json(workoutPlans);
  } catch (error) {
    console.error('Erro ao listar planos de treino visíveis:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', errorDetails: error.message });
  }
};

module.exports = {
  createWorkoutPlan,
  getWorkoutPlansForTraining,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getVisibleWorkoutPlans,
};