// backend/controllers/exerciseController.js
const db = require('../models');
const { Op } = require('sequelize');

// @desc    Admin cria um novo exercício
// @route   POST /exercises 
// @access  Privado (Admin Staff)
const createExercise = async (req, res) => {
  const { name, description, imageUrl, videoUrl, muscleGroup } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'O nome do exercício é obrigatório.' });
  }

  try {
    const existingExercise = await db.Exercise.findOne({ where: { name } });
    if (existingExercise) {
      return res.status(400).json({ message: 'Já existe um exercício com este nome.' });
    }

    const newExercise = await db.Exercise.create({
      name,
      description,
      imageUrl,
      videoUrl,
      muscleGroup,
    });
    res.status(201).json(newExercise);
  } catch (error) {
    console.error('Erro (admin) ao criar exercício:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar exercício.', error: error.message });
  }
};

// @desc    Lista todos os exercícios (com filtros opcionais)
// @route   GET /exercises
// @access  Privado (Qualquer utilizador autenticado pode ver, para seleção)
const getAllExercises = async (req, res) => {
  const { muscleGroup, name } = req.query; // Filtros opcionais
  const whereClause = {};

  if (muscleGroup) {
    whereClause.muscleGroup = { [Op.iLike]: `%${muscleGroup}%` }; // Case-insensitive like
  }
  if (name) {
    whereClause.name = { [Op.iLike]: `%${name}%` }; // Case-insensitive like
  }

  try {
    const exercises = await db.Exercise.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });
    res.status(200).json(exercises);
  } catch (error) {
    console.error('Erro ao listar exercícios:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar exercícios.', error: error.message });
  }
};

// @desc    Obtém um exercício por ID
// @route   GET /exercises/:id
// @access  Privado (Qualquer utilizador autenticado)
const getExerciseById = async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await db.Exercise.findByPk(id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercício não encontrado.' });
    }
    res.status(200).json(exercise);
  } catch (error) {
    console.error('Erro ao obter exercício por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};

// @desc    Admin atualiza um exercício
// @route   PUT /exercises/:id
// @access  Privado (Admin Staff)
const updateExercise = async (req, res) => {
  const { id } = req.params;
  const { name, description, imageUrl, videoUrl, muscleGroup } = req.body;

  try {
    const exercise = await db.Exercise.findByPk(id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercício não encontrado.' });
    }

    if (name && name !== exercise.name) {
      const existingExercise = await db.Exercise.findOne({ where: { name, id: { [Op.ne]: id } } });
      if (existingExercise) {
        return res.status(400).json({ message: 'Já existe outro exercício com este nome.' });
      }
      exercise.name = name;
    }

    // Permite atualizar campos para null ou string vazia se o modelo permitir (allowNull: true)
    if (description !== undefined) exercise.description = description;
    if (imageUrl !== undefined) exercise.imageUrl = imageUrl;
    if (videoUrl !== undefined) exercise.videoUrl = videoUrl;
    if (muscleGroup !== undefined) exercise.muscleGroup = muscleGroup;

    await exercise.save();
    res.status(200).json(exercise);
  } catch (error) {
    console.error('Erro (admin) ao atualizar exercício:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar exercício.', error: error.message });
  }
};

// @desc    Admin elimina um exercício
// @route   DELETE /exercises/:id
// @access  Privado (Admin Staff)
const deleteExercise = async (req, res) => {
  const { id } = req.params;
  try {
    const exercise = await db.Exercise.findByPk(id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercício não encontrado.' });
    }

    const usageCount = await db.WorkoutPlanExercise.count({ where: { exerciseId: id } });
    if (usageCount > 0) {
      return res.status(400).json({ message: `Não é possível eliminar. Este exercício está a ser usado em ${usageCount} plano(s) de treino. Remova-o dos planos primeiro.` });
    }

    await exercise.destroy();
    res.status(200).json({ message: 'Exercício eliminado com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao eliminar exercício:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar exercício.', error: error.message });
  }
};

module.exports = {
  createExercise,
  getAllExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
};