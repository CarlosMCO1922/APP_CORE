// backend/routes/trainingSeriesRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');


const trainingSeriesController = require('../controllers/trainingSeriesController');
const seriesSubscriptionController = require('../controllers/seriesSubscriptionController');

// --- Rotas para Admin gerir TrainingSeries ---
router.post(
    '/',
    protect,
    isAdminStaff,
    trainingSeriesController.createTrainingSeries
);

router.post(
    '/subscriptions', // POST /api/training-series/subscriptions
    protect,
    isClientUser,
    seriesSubscriptionController.createSeriesSubscription
);


module.exports = router;