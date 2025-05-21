// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// --- Rotas do Administrador (Staff com role 'admin') ---
// Criar um novo pagamento para um utilizador
router.post(
    '/', 
    protect,         // Garante que quem faz o pedido está autenticado (seja user ou staff)
    isAdminStaff,    // Garante que é um staff com role 'admin'
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


// --- Rotas do Cliente (User autenticado) ---
// Cliente lista os seus próprios pagamentos
router.get(
    '/my-payments', 
    protect,       // Garante que o utilizador está autenticado
    isClientUser,  // Garante que é um cliente (role 'user')
    paymentController.clientGetMyPayments
);

// Cliente "aceita" um pagamento pendente
router.patch('/:paymentId/accept', protect, isClientUser, paymentController.clientAcceptPayment);

router.post('/:paymentId/create-stripe-intent', protect, isClientUser, paymentController.createStripePaymentIntent);

router.post(
  '/stripe-webhook',
  express.raw({type: 'application/json'}), // Middleware para obter o raw body para este endpoint
  paymentController.stripeWebhookHandler
);

module.exports = router;
