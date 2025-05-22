// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, isAdminStaff, isClientUser } = require('../middleware/authMiddleware');

// ... (outras rotas GET, POST para /payments, /my-payments, etc. mantêm-se como estavam) ...
// --- Rotas do Administrador (Staff com role 'admin') ---
router.post('/', protect, isAdminStaff, paymentController.adminCreatePayment);
router.get('/', protect, isAdminStaff, paymentController.adminGetAllPayments);
router.get('/total-paid', protect, isAdminStaff, paymentController.adminGetTotalPaid);
router.patch('/:paymentId/status', protect, isAdminStaff, paymentController.adminUpdatePaymentStatus);
router.delete('/:paymentId', protect, isAdminStaff, paymentController.adminDeletePayment);

// --- Rotas do Cliente (User autenticado) ---
router.get('/my-payments', protect, isClientUser, paymentController.clientGetMyPayments);
router.patch('/:paymentId/accept', protect, isClientUser, paymentController.clientAcceptPayment);
router.post('/:paymentId/create-stripe-intent', protect, isClientUser, paymentController.createStripePaymentIntent);


// ***** INÍCIO DA ALTERAÇÃO DE DIAGNÓSTICO *****
// Webhook do Stripe - VERSÃO DE TESTE SIMPLIFICADA
router.post(
  '/stripe-webhook',
  (req, res, next) => {
    console.log(`---------- ${new Date().toISOString()} ----------`);
    console.log('!!! ROTA /stripe-webhook ACIONADA (VERSÃO SIMPLIFICADA) !!!');
    console.log('Headers Recebidos:', JSON.stringify(req.headers, null, 2));
    // Tenta ler o corpo se disponível, mas não faças nada que possa dar erro ainda
    let rawBodyForLog = '';
    req.on('data', chunk => {
      rawBodyForLog += chunk.toString();
    });
    req.on('end', () => {
      console.log('Corpo Recebido (Raw - primeira tentativa):', rawBodyForLog);
    });
    
    res.status(200).send('Webhook recebido pela rota simplificada.'); // Envia resposta imediata
    // NÃO CHAMA paymentController.stripeWebhookHandler nem express.raw por agora
  }
);
// ***** FIM DA ALTERAÇÃO DE DIAGNÓSTICO *****

module.exports = router;