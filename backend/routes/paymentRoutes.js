// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// --- Rotas do Administrador (Staff com role 'admin') ---
// Criar um novo pagamento para um utilizador
router.post(
    '/',
    express.join(),
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
    '/:paymentId', // Assumindo que a rota para eliminar é DELETE /payments/:paymentId
    protect,
    isAdminStaff,
    paymentController.adminDeletePayment // Garante que esta função existe no controller
);


// --- Rotas do Cliente (User autenticado) ---
// Cliente lista os seus próprios pagamentos
router.get(
    '/my-payments', 
    protect,
    isClientUser,
    paymentController.clientGetMyPayments
);

// Cliente "aceita" um pagamento pendente (LEGADO - para pagamentos não-Stripe)
router.patch(
    '/:paymentId/accept', // Endpoint para aceitar pagamento não-Stripe
    protect,
    isClientUser,
    paymentController.clientAcceptPayment // Deve ser clientAcceptNonStripePayment no controller
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
  express.raw({type: 'application/json'}), // Middleware para obter o raw body para este endpoint
  paymentController.stripeWebhookHandler
);

module.exports = router;