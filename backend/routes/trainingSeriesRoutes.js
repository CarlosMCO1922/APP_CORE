// backend/routes/trainingSeriesRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

const trainingSeriesController = require('../controllers/trainingSeriesController');
const seriesSubscriptionController = require('../controllers/seriesSubscriptionController');

// --- Rota para Clientes verem TrainingSeries ---
// <<< ALTERAÇÃO AQUI: Rota adicionada para o cliente obter a lista de séries >>>
router.get(
    '/',
    protect,
    isClientUser,
    trainingSeriesController.getAllActiveSeries
);

// --- Rota para Admin gerir TrainingSeries ---
router.post(
    '/',
    protect,
    isAdminStaff,
    trainingSeriesController.createTrainingSeries
);

// --- Rota para Clientes se inscreverem ---
router.post(
    '/subscriptions',
    protect,
    isClientUser,
    seriesSubscriptionController.createSeriesSubscription
);

module.exports = router;