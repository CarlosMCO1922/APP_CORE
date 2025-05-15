// backend/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, isAdminStaff, isClientUser, isStaff } = require('../middleware/authMiddleware');

// Listar consultas (lógica de filtragem no controlador com base no papel)
// DEVE SER ACESSÍVEL POR QUALQUER UTILIZADOR AUTENTICADO
router.get('/', protect, appointmentController.getAllAppointments); // APENAS 'protect'

// Obter detalhes de uma consulta (lógica de permissão no controlador)
router.get('/:id', protect, appointmentController.getAppointmentById);

// --- Rotas para Clientes (Users autenticados) ---
router.post('/request', protect, isClientUser, appointmentController.clientRequestAppointment);
router.post('/:appointmentId/book', protect, isClientUser, appointmentController.clientBookAppointment);
router.delete('/:appointmentId/book', protect, isClientUser, appointmentController.clientCancelAppointmentBooking);

// --- Rotas para Staff (Admin ou o profissional da consulta) ---
router.patch('/:appointmentId/respond', protect, isStaff, appointmentController.staffRespondToAppointmentRequest);

// --- Rotas apenas para Admin Staff (para gestão completa de horários) ---
router.post('/', protect, isAdminStaff, appointmentController.adminCreateAppointment);
router.put('/:id', protect, isAdminStaff, appointmentController.adminUpdateAppointment);
router.delete('/:id', protect, isAdminStaff, appointmentController.adminDeleteAppointment);

module.exports = router;
