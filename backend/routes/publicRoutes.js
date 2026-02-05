// backend/routes/publicRoutes.js
// Rotas públicas (sem autenticação) para pedidos de consulta e treino experimental.
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/staff-for-appointments', publicController.getStaffForAppointments);
router.get('/available-slots', publicController.getAvailableSlots);
router.post('/appointment-request', publicController.postAppointmentRequest);
router.get('/trainings', publicController.getPublicTrainings);
router.post('/trainings/:trainingId/guest-signup', publicController.postGuestTrainingSignup);

module.exports = router;
