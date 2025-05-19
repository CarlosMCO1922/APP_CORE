// backend/routes/exerciseRoutes.js
const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { protect, isAdminStaff } = require('../middleware/authMiddleware');

// Criar novo exercício (Admin)
router.post('/', protect, isAdminStaff, exerciseController.createExercise);

// Listar todos os exercícios (Qualquer utilizador autenticado pode ver)
router.get('/', protect, exerciseController.getAllExercises);

// Obter um exercício por ID (Qualquer utilizador autenticado)
router.get('/:id', protect, exerciseController.getExerciseById);

// Atualizar exercício (Admin)
router.put('/:id', protect, isAdminStaff, exerciseController.updateExercise);

// Eliminar exercício (Admin)
router.delete('/:id', protect, isAdminStaff, exerciseController.deleteExercise);

module.exports = router;