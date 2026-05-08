// backend/routes/publicRoutes.js
// Rotas públicas (sem autenticação) para pedidos de consulta e treino experimental.
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/staff-for-appointments', publicController.getStaffForAppointments);
router.get('/available-slots', publicController.getAvailableSlots);
router.post('/appointment-request', publicController.postAppointmentRequest);
router.get('/payments/:token', publicController.getPublicPaymentByToken);
router.post('/payments/:token/create-stripe-intent', publicController.createStripeIntentPublicByToken);
router.get('/trainings', publicController.getPublicTrainings);
router.post('/trainings/:trainingId/guest-signup', publicController.postGuestTrainingSignup);
router.get('/confirm-appointment-reschedule', publicController.confirmAppointmentReschedule);
router.get('/confirm-training-reschedule', publicController.confirmTrainingReschedule);

module.exports = router;
