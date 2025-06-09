// backend/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, isAdminStaff, isClientUser, isStaff } = require('../middleware/authMiddleware');


router.get('/', protect, appointmentController.getAllAppointments); 

router.get('/available-slots', protect, isClientUser, appointmentController.getAvailableSlotsForProfessional);

router.get(
    '/stats/today-count',
    protect,
    isAdminStaff,
    appointmentController.getTodayAppointmentsCount
);

router.get('/:id', protect, appointmentController.getAppointmentById);

router.post('/request', protect, isClientUser, appointmentController.clientRequestAppointment);
router.post('/:appointmentId/book', protect, isClientUser, appointmentController.clientBookAppointment);
router.delete('/:appointmentId/book', protect, isClientUser, appointmentController.clientCancelAppointmentBooking);


router.patch('/:appointmentId/respond', protect, isStaff, appointmentController.staffRespondToAppointmentRequest);

router.post('/', protect, isAdminStaff, appointmentController.adminCreateAppointment);
router.put('/:id', protect, isAdminStaff, appointmentController.adminUpdateAppointment);
router.delete('/:id', protect, isAdminStaff, appointmentController.adminDeleteAppointment);

module.exports = router;
