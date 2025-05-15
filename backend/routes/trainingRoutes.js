// backend/routes/trainingRoutes.js
const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// Listar todos os treinos disponíveis - DEVE SER ACESSÍVEL POR QUALQUER UTILIZADOR AUTENTICADO
router.get('/', protect, trainingController.getAllTrainings); // APENAS 'protect'

// Obter detalhes de um treino específico - DEVE SER ACESSÍVEL POR QUALQUER UTILIZADOR AUTENTICADO
router.get('/:id', protect, trainingController.getTrainingById); // APENAS 'protect'

// Rotas para Clientes (Users autenticados)
router.post('/:id/book', protect, isClientUser, trainingController.bookTraining);
router.delete('/:id/book', protect, isClientUser, trainingController.cancelTrainingBooking);

// Rotas para Admin Staff
router.post('/', protect, isAdminStaff, trainingController.createTraining);
router.put('/:id', protect, isAdminStaff, trainingController.updateTraining);
router.delete('/:id', protect, isAdminStaff, trainingController.deleteTraining);

module.exports = router;
