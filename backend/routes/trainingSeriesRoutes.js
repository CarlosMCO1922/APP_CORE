// backend/routes/trainingSeriesRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// Controladores (crie estes ficheiros ou adicione a controladores existentes)
const trainingSeriesController = require('../controllers/trainingSeriesController');
const seriesSubscriptionController = require('../controllers/seriesSubscriptionController');

// --- Rotas para Admin gerir TrainingSeries ---
router.post(
    '/', // POST /api/training-series (assumindo que monta este router em /api/training-series)
    protect,
    isAdminStaff,
    trainingSeriesController.createTrainingSeries
);
// Adicionar GET (listar todas as séries), GET /:id, PUT /:id, DELETE /:id para TrainingSeries, protegidas por isAdminStaff


// --- Rotas para Clientes verem TrainingSeries e se inscreverem ---
// router.get('/', protect, trainingSeriesController.getAllActiveTrainingSeriesForClients); // Exemplo: listar séries ativas

router.post(
    '/subscriptions', // POST /api/training-series/subscriptions
    protect,
    isClientUser,
    seriesSubscriptionController.createSeriesSubscription
);
// Adicionar GET /me/subscriptions, DELETE /subscriptions/:id para SeriesSubscription, protegidas por isClientUser


module.exports = router;