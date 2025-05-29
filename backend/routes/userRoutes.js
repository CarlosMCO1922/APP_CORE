// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// Precisamos de isAdminStaff para proteger as rotas de administração de utilizadores
const { protect, isClientUser, isAdminStaff } = require('../middleware/authMiddleware');

// --- Rotas para CLIENTES (já existentes) ---
// @route   GET /api/users/me
router.get('/me', protect, isClientUser, userController.getMe);
// @route   PUT /api/users/me
router.put('/me', protect, isClientUser, userController.updateMe);
// @route   GET /api/users/me/bookings
router.get('/me/bookings', protect, isClientUser, userController.getMyBookings);


// --- Rotas para ADMINISTRAÇÃO de Utilizadores (Clientes) ---
// Estas rotas devem ser protegidas para serem acessíveis apenas por Admin Staff

// @route   GET /api/users
// @desc    Admin lista todos os utilizadores
router.get('/', protect, isAdminStaff, userController.getAllUsersAsAdmin);

// @route   POST /api/users
// @desc    Admin cria um novo utilizador
router.post('/', protect, isAdminStaff, userController.createUserAsAdmin);

// @route   GET /api/users/:id
// @desc    Admin obtém detalhes de um utilizador específico
router.get('/:id', protect, isAdminStaff, userController.getUserByIdAsAdmin);

// @route   PUT /api/users/:id
// @desc    Admin atualiza um utilizador
router.put('/:id', protect, isAdminStaff, userController.updateUserAsAdmin);

// @route   DELETE /api/users/:id
// @desc    Admin elimina um utilizador
router.delete('/:id', protect, isAdminStaff, userController.deleteUserAsAdmin);

router.get('/:userId/trainings', protect, isAdminStaff, adminGetUserTrainings);
router.get('/:userId/appointments', protect, isAdminStaff, adminGetUserAppointments);


module.exports = router;
