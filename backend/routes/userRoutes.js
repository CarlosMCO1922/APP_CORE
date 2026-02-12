// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, isClientUser, isAdminStaff, isStaff } = require('../middleware/authMiddleware');

// --- Rotas para CLIENTES (já existentes) ---
router.get('/me', protect, isClientUser, userController.getMe);
router.put('/me', protect, isClientUser, userController.updateMe);
router.get('/me/bookings', protect, isClientUser, userController.getMyBookings);


// --- Rotas para ADMINISTRAÇÃO de Utilizadores (Clientes): staff (admin, osteopata, employee, etc.) pode ver/gerir ---
router.get('/', protect, isStaff, userController.getAllUsersAsAdmin);
router.post('/', protect, isStaff, userController.createUserAsAdmin);
router.get('/:id', protect, isStaff, userController.getUserByIdAsAdmin);
router.put('/:id', protect, isStaff, userController.updateUserAsAdmin);
router.patch('/:id/approve', protect, isStaff, userController.approveUserAsAdmin);
router.delete('/:id', protect, isStaff, userController.deleteUserAsAdmin);
router.get('/:userId/trainings', protect, isStaff, userController.adminGetUserTrainings);
router.get('/:userId/appointments', protect, isStaff, userController.adminGetUserAppointments);


module.exports = router;
