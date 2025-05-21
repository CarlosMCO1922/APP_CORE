// backend/controllers/paymentController.js
const db = require('../models');
const { Op } = require('sequelize');
const { format } = require('date-fns');
require('dotenv').config(); // Garante que as variáveis de ambiente são carregadas

// Inicializa o Stripe com a tua chave secreta
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// --- Funções do Administrador (EXISTENTES - MANTÊM-SE) ---
// adminCreatePayment, adminGetAllPayments, adminGetTotalPaid, adminUpdatePaymentStatus, adminDeletePayment
// (O teu código existente para estas funções permanece aqui)
// @desc    Admin cria um novo pagamento para um utilizador
// @route   POST /payments (ou /api/payments)
// @access  Privado (Admin Staff)
const adminCreatePayment = async (req, res) => {
  const { userId, amount, paymentDate, referenceMonth, category, description, status, relatedResourceId, relatedResourceType } = req.body;
  const staffId = req.staff.id;

  if (!userId || !amount || !paymentDate || !referenceMonth || !category) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta: userId, amount, paymentDate, referenceMonth, category.' });
  }
  if (parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'O valor do pagamento deve ser positivo.' });
  }

  try {
    const clientUser = await db.User.findByPk(userId);
    if (!clientUser) {
      return res.status(404).json({ message: 'Utilizador (cliente) não encontrado.' });
    }

    const newPayment = await db.Payment.create({
      userId: parseInt(userId),
      amount: parseFloat(amount),
      paymentDate,
      referenceMonth,
      category,
      description,
      status: status || 'pendente',
      staffId,
      relatedResourceId: relatedResourceId ? parseInt(relatedResourceId) : null,
      relatedResourceType: relatedResourceType || null,
    });

    res.status(201).json(newPayment);
  } catch (error) {
    console.error('Erro (admin) ao criar pagamento:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar pagamento.', error: error.message });
  }
};

const adminGetAllPayments = async (req, res) => {
  const { userId, status, category, month, year, relatedResourceId, relatedResourceType } = req.query;
  const whereClause = {};

  if (userId) whereClause.userId = userId;
  if (status) whereClause.status = status;
  if (category) whereClause.category = category;
  if (month && year) {
    whereClause.referenceMonth = `${year}-${month.padStart(2, '0')}`;
  } else if (year) {
    whereClause.referenceMonth = { [Op.like]: `${year}-%` };
  }
  if (relatedResourceId) whereClause.relatedResourceId = relatedResourceId;
  if (relatedResourceType) whereClause.relatedResourceType = relatedResourceType;


  try {
    const payments = await db.Payment.findAll({
      where: whereClause,
      include: [
        { model: db.User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: db.Staff, as: 'registeredBy', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']],
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error('Erro (admin) ao listar pagamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar pagamentos.', error: error.message });
  }
};

const adminGetTotalPaid = async (req, res) => {
  try {
    const totalPaid = await db.Payment.sum('amount', {
      where: {
        status: 'pago',
      },
    });
    res.status(200).json({ totalPaid: totalPaid || 0 });
  } catch (error) {
    console.error('Erro (admin) ao calcular total pago:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao calcular total pago.', error: error.message });
  }
};

const adminUpdatePaymentStatus = async (req, res) => {
    const { paymentId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Novo status é obrigatório." });
    }
    const allowedStatuses = db.Payment.getAttributes().status.values;
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Status inválido. Permitidos: ${allowedStatuses.join(', ')}` });
    }

    try {
        const payment = await db.Payment.findByPk(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Pagamento não encontrado." });
        }

        const originalStatus = payment.status;
        payment.status = status;
        await payment.save();

        if (status === 'pago' && originalStatus !== 'pago' &&
            payment.relatedResourceType === 'appointment' &&
            payment.category === 'sinal_consulta' &&
            payment.relatedResourceId) {
          const appointment = await db.Appointment.findByPk(payment.relatedResourceId);
          if (appointment) {
            appointment.signalPaid = true;
            if (appointment.status === 'agendada') {
                appointment.status = 'confirmada';
            }
            await appointment.save();
            console.log(`Consulta ID ${appointment.id} atualizada pelo adminUpdatePaymentStatus: sinalPago = true, status = ${appointment.status}.`);
          } else {
            console.warn(`AdminUpdatePaymentStatus: Consulta ID ${payment.relatedResourceId} associada ao pagamento de sinal ID ${payment.id} não encontrada.`);
          }
        }
        res.status(200).json(payment);
    } catch (error) {
        console.error('Erro (admin) ao atualizar status do pagamento:', error);
        if (error.name === 'SequelizeValidationError') {
          return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar status.', error: error.message });
    }
};

const adminDeletePayment = async (req, res) => {
    const { paymentId } = req.params;
    try {
        const payment = await db.Payment.findByPk(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Pagamento não encontrado." });
        }
        await payment.destroy();
        res.status(200).json({ message: "Pagamento eliminado com sucesso." });
    } catch (error) {
        console.error('Erro (admin) ao eliminar pagamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao eliminar pagamento.', error: error.message });
    }
};


// --- Funções do Cliente (EXISTENTES - `clientGetMyPayments` MANTÉM-SE) ---
const clientGetMyPayments = async (req, res) => {
  // ... (o teu código existente para esta função) ...
  const userId = req.user.id;
  try {
    const payments = await db.Payment.findAll({
      where: { userId },
      include: [
         { model: db.Staff, as: 'registeredBy', attributes: ['firstName', 'lastName'] },
      ],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']],
    });
    res.status(200).json(payments);
  } catch (error) {
    console.error('Erro (cliente) ao listar os seus pagamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar os seus pagamentos.', error: error.message });
  }
};

// @desc    Lida com webhooks do Stripe
// @route   POST /payments/stripe-webhook
// @access  Público (mas verificado com assinatura do Stripe)
const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Precisarás de configurar isto

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não está configurado.');
    return res.status(400).send('Webhook secret não configurado no servidor.');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️ Erro na verificação da assinatura do webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Lida com o evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log('✅ PaymentIntent bem-sucedido:', paymentIntentSucceeded.id);
      // Lógica para atualizar o teu sistema:
      // paymentIntentSucceeded.metadata.internalPaymentId contém o ID do teu pagamento interno
      if (paymentIntentSucceeded.metadata.internalPaymentId) {
        const internalPaymentId = parseInt(paymentIntentSucceeded.metadata.internalPaymentId);
        const payment = await db.Payment.findByPk(internalPaymentId);

        if (payment && payment.status === 'pendente') {
          payment.status = 'pago';
          // Opcional: podes querer guardar o ID do PaymentIntent do Stripe no teu registo de Payment
          // payment.stripePaymentIntentId = paymentIntentSucceeded.id;
          await payment.save();
          console.log(`Pagamento interno ID ${internalPaymentId} atualizado para 'pago'.`);

          // Atualizar a consulta associada, se for um sinal
          if (payment.relatedResourceType === 'appointment' &&
              payment.category === 'sinal_consulta' &&
              payment.relatedResourceId) {
            const appointment = await db.Appointment.findByPk(payment.relatedResourceId);
            if (appointment) {
              appointment.signalPaid = true;
              if (appointment.status === 'agendada') {
                appointment.status = 'confirmada';
              }
              await appointment.save();
              console.log(`Consulta ID ${appointment.id} atualizada: signalPaid = true, status = ${appointment.status}.`);
            }
          }
        } else if (payment && payment.status === 'pago') {
            console.log(`Pagamento interno ID ${internalPaymentId} já estava 'pago'. Nenhuma ação tomada.`);
        } else {
            console.warn(`Pagamento interno ID ${internalPaymentId} não encontrado ou não estava pendente.`);
        }
      } else {
        console.warn('Webhook payment_intent.succeeded recebido sem internalPaymentId nos metadata.');
      }
      break;
    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object;
      console.log('❌ PaymentIntent falhou:', paymentIntentFailed.id, paymentIntentFailed.last_payment_error?.message);
      // Opcional: Atualizar o teu Payment interno para 'rejeitado' ou 'falhou'
      // e notificar o utilizador.
      if (paymentIntentFailed.metadata.internalPaymentId) {
        const internalPaymentId = parseInt(paymentIntentFailed.metadata.internalPaymentId);
        const payment = await db.Payment.findByPk(internalPaymentId);
        if (payment && payment.status === 'pendente') {
            payment.status = 'rejeitado'; // ou um novo status 'falhou'
            payment.description = (payment.description || '') + ` Falha Stripe: ${paymentIntentFailed.last_payment_error?.message || 'desconhecido'}`;
            await payment.save();
            console.log(`Pagamento interno ID ${internalPaymentId} atualizado para 'rejeitado' devido a falha no Stripe.`);
        }
      }
      break;
    // ... lida com outros tipos de eventos que te interessem
    default:
      console.log(`Evento Stripe não tratado: ${event.type}`);
  }

  // Retorna uma resposta 200 para o Stripe para confirmar o recebimento do evento
  res.status(200).json({ received: true });
};

// `clientAcceptPayment` será substituído pela lógica de pagamento com Stripe.
// Vamos criar um novo endpoint para iniciar o pagamento com Stripe.

// @desc    Cliente cria uma intenção de pagamento Stripe para um pagamento pendente
// @route   POST /payments/:paymentId/create-stripe-intent
// @access  Privado (Cliente)
const createStripePaymentIntent = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  try {
    const payment = await db.Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Pagamento não encontrado.' });
    }
    if (payment.userId !== userId) {
      return res.status(403).json({ message: 'Não tem permissão para este pagamento.' });
    }
    if (payment.status !== 'pendente') {
      return res.status(400).json({ message: `Este pagamento não está pendente (status atual: ${payment.status}).` });
    }
    if (payment.category !== 'sinal_consulta' && payment.category !== 'consulta_fisioterapia' /* Adicionar outras categorias pagáveis online */) {
        return res.status(400).json({ message: `Esta categoria de pagamento (${payment.category}) não pode ser processada online no momento.` });
    }

    const amountInCents = Math.round(parseFloat(payment.amount) * 100); // Stripe espera o valor em cêntimos

    // Crio uma PaymentIntent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur', // Define a tua moeda
      metadata: {
        internalPaymentId: payment.id, // Guarda o ID do teu pagamento interno
        userId: userId,
        relatedResourceId: payment.relatedResourceId,
        relatedResourceType: payment.relatedResourceType,
        category: payment.category,
      },
      // Podes adicionar outros parâmetros conforme a documentação do Stripe
      // por exemplo, `payment_method_types: ['card', 'multibanco']` se configurado
    });

    res.send({
      clientSecret: paymentIntent.client_secret, // O frontend usará isto
      paymentId: payment.id, // Envia o ID do pagamento de volta para referência
      amount: payment.amount,
    });

  } catch (error) {
    console.error('Erro ao criar Stripe Payment Intent:', error);
    res.status(500).json({ message: 'Erro ao iniciar processo de pagamento.', error: error.message });
  }
};

// A função clientAcceptPayment original (que apenas mudava o status) já não será chamada diretamente pelo cliente para pagamentos Stripe.
// O status do pagamento será atualizado pelo webhook do Stripe.
// No entanto, podemos manter uma versão dela para o admin poder marcar como pago manualmente, se necessário,
// ou para outros tipos de pagamento que não usem Stripe.
// A versão que forneci anteriormente para adminUpdatePaymentStatus já cobre um pouco disso.

// Se ainda precisares da antiga clientAcceptPayment para algo específico não-Stripe:
const clientAcceptNonStripePayment = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;
  try {
    const payment = await db.Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado.' });
    if (payment.userId !== userId) return res.status(403).json({ message: 'Não tem permissão.' });
    if (payment.status !== 'pendente') return res.status(400).json({ message: `Pagamento não pendente.` });
    // Adicionar verificação para garantir que esta rota só é usada para pagamentos não-Stripe
    if (payment.category === 'sinal_consulta' /*ou outras categorias pagáveis via Stripe*/) {
        // return res.status(400).json({ message: 'Este tipo de pagamento deve ser processado via gateway.'});
    }

    payment.status = 'pago';
    await payment.save();
    // Lógica de atualizar consulta se for sinal (como tínhamos antes)
    if (payment.relatedResourceType === 'appointment' && payment.category === 'sinal_consulta' && payment.relatedResourceId) {
      const appointment = await db.Appointment.findByPk(payment.relatedResourceId);
      if (appointment) {
        appointment.signalPaid = true;
        if (appointment.status === 'agendada') appointment.status = 'confirmada';
        await appointment.save();
      }
    }
    res.status(200).json({ message: 'Pagamento aceite com sucesso!', payment });
  } catch (error) {
    console.error('Erro (cliente) ao aceitar pagamento não-Stripe:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


module.exports = {
  adminCreatePayment,
  adminGetAllPayments,
  adminGetTotalPaid,
  adminUpdatePaymentStatus,
  adminDeletePayment,
  clientGetMyPayments,
  createStripePaymentIntent, // NOVA FUNÇÃO
  clientAcceptPayment: clientAcceptNonStripePayment, // Renomeada para clareza, se mantiveres a funcionalidade
  stripeWebhookHandler,
};