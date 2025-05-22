// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// --- Rotas do Administrador (Staff com role 'admin') ---
router.post(
    '/', 
    protect,
    isAdminStaff,
    paymentController.adminCreatePayment
);

router.get(
    '/', 
    protect, 
    isAdminStaff, 
    paymentController.adminGetAllPayments
);

router.get(
    '/total-paid', 
    protect, 
    isAdminStaff, 
    paymentController.adminGetTotalPaid
);

router.patch(
    '/:paymentId/status',
    protect,
    isAdminStaff,
    paymentController.adminUpdatePaymentStatus
);

router.delete(
    '/:paymentId',
    protect,
    isAdminStaff,
    paymentController.adminDeletePayment
);


// --- Rotas do Cliente (User autenticado) ---
router.get(
    '/my-payments', 
    protect,
    isClientUser,
    paymentController.clientGetMyPayments
);

router.patch(
    '/:paymentId/accept',
    protect,
    isClientUser,
    paymentController.clientAcceptPayment // Nota: no controller isto é clientAcceptNonStripePayment
);

router.post(
    '/:paymentId/create-stripe-intent',
    protect,
    isClientUser,
    paymentController.createStripePaymentIntent
);

// Webhook do Stripe
router.post(
  '/stripe-webhook',
  express.raw({type: 'application/json'}), // Middleware para obter o raw body para este endpoint
  paymentController.stripeWebhookHandler   // Chama o controller com os logs detalhados
);

module.exports = router;