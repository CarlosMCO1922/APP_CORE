// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// --- Rotas do Administrador (Staff com role 'admin') ---
// Criar um novo pagamento para um utilizador
router.post(
    '/',
    protect,
    isAdminStaff,
    paymentController.adminCreatePayment
);

// Listar todos os pagamentos (com filtros)
router.get(
    '/', 
    protect, 
    isAdminStaff, 
    paymentController.adminGetAllPayments
);

// Obter o total de pagamentos com status 'pago'
router.get(
    '/total-paid', 
    protect, 
    isAdminStaff, 
    paymentController.adminGetTotalPaid
);

// Admin atualiza o status de um pagamento
router.patch(
    '/:paymentId/status',
    protect,
    isAdminStaff,
    paymentController.adminUpdatePaymentStatus
);

// Admin elimina um pagamento (NOVA ROTA ADICIONADA SE FALTAR)
router.delete(
    '/:paymentId', 
    protect,
    isAdminStaff,
    paymentController.adminDeletePayment 
);


// --- Rotas do Cliente (User autenticado) ---
// Cliente lista os seus próprios pagamentos
router.get(
    '/my-payments', 
    protect,
    isClientUser,
    paymentController.clientGetMyPayments
);

router.get(
    '/my-payments/pending',
    protect,
    isClientUser,
    paymentController.clientGetMyPendingPayments
);

// Cliente "aceita" um pagamento pendente 
router.patch(
    '/:paymentId/accept', 
    protect,
    isClientUser,
    paymentController.clientAcceptPayment 
);

// Cliente cria uma intenção de pagamento Stripe
router.post(
    '/:paymentId/create-stripe-intent',
    protect,
    isClientUser,
    paymentController.createStripePaymentIntent
);

// Webhook do Stripe
router.post(
  '/stripe-webhook',
  express.raw({type: 'application/json'}),
  paymentController.stripeWebhookHandler
);

module.exports = router;