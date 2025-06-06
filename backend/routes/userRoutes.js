// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, isClientUser, isAdminStaff } = require('../middleware/authMiddleware');

// --- Rotas para CLIENTES (já existentes) ---
router.get('/me', protect, isClientUser, userController.getMe);
router.put('/me', protect, isClientUser, userController.updateMe);
router.get('/me/bookings', protect, isClientUser, userController.getMyBookings);


// --- Rotas para ADMINISTRAÇÃO de Utilizadores (Clientes) ---
router.get('/', protect, isAdminStaff, userController.getAllUsersAsAdmin);
router.post('/', protect, isAdminStaff, userController.createUserAsAdmin);
router.get('/:id', protect, isAdminStaff, userController.getUserByIdAsAdmin);
router.put('/:id', protect, isAdminStaff, userController.updateUserAsAdmin);
router.delete('/:id', protect, isAdminStaff, userController.deleteUserAsAdmin);
router.get('/:userId/trainings', protect, isAdminStaff, userController.adminGetUserTrainings);
router.get('/:userId/appointments', protect, isAdminStaff, userController.adminGetUserAppointments);


module.exports = router;
