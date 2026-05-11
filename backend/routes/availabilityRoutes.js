// backend/routes/availabilityRoutes.js
const express = require('express');
const router = express.Router();

const { protect, isStaff } = require('../middleware/authMiddleware');
const availabilityController = require('../controllers/availabilityController');

router.get('/slots', protect, isStaff, availabilityController.getAvailabilitySlots);
router.put('/slots', protect, isStaff, availabilityController.setAvailabilitySlots);

module.exports = router;

