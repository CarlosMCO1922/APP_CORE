// backend/controllers/paymentController.js
const db = require('../models');
const { Op } = require('sequelize');
// const { format } = require('date-fns'); // Removido se não for usado diretamente aqui. Se for, mantenha.
require('dotenv').config(); // Garante que as variáveis de ambiente são carregadas

// Inicializa o Stripe com a tua chave secreta
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { startOfMonth, endOfMonth, format } = require('date-fns');

// --- Funções do Administrador (EXISTENTES - MANTÊM-SE) ---
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
  // startDate e endDate podem ser passados como query params
  // Ex: /api/payments/total-paid?startDate=2025-05-01&endDate=2025-05-31
  const { startDate, endDate } = req.query;

  const whereClause = {
    status: 'pago',
  };

  if (startDate && endDate) {
    // Validar as datas seria uma boa prática aqui
    whereClause.paymentDate = { // Assumindo que 'paymentDate' é a data em que o pagamento foi efetivado
      [Op.gte]: startDate,
      [Op.lte]: endDate,
    };
  } else if (startDate) {
    whereClause.paymentDate = { [Op.gte]: startDate };
  } else if (endDate) {
    whereClause.paymentDate = { [Op.lte]: endDate };
  }
  // Se não houver startDate nem endDate, calcula o total geral

  try {
    const totalPaid = await db.Payment.sum('amount', {
      where: whereClause,
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

// @desc    Cliente lista os seus próprios pagamentos PENDENTES
// @route   GET /api/payments/my-payments/pending
// @access  Privado (Cliente)
const clientGetMyPendingPayments = async (req, res) => {
  const userId = req.user.id;
  try {
    const pendingPayments = await db.Payment.findAll({
      where: {
        userId: userId,
        status: 'pendente', // Apenas pagamentos com status 'pendente'
      },
      include: [
         { model: db.Staff, as: 'registeredBy', attributes: ['firstName', 'lastName'] },
      ],
      order: [['paymentDate', 'ASC'], ['createdAt', 'ASC']], // Mais antigos primeiro
    });
    res.status(200).json(pendingPayments);
  } catch (error) {
    console.error('Erro (cliente) ao listar os seus pagamentos pendentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar os seus pagamentos pendentes.', error: error.message });
  }
};

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
    if (payment.category !== 'sinal_consulta' && payment.category !== 'consulta_fisioterapia' && payment.category !== 'mensalidade_treino') {
        return res.status(400).json({ message: `Esta categoria de pagamento (${payment.category}) não pode ser processada online no momento.` });
    }

    const amountInCents = Math.round(parseFloat(payment.amount) * 100);

    // ***** INÍCIO DA ALTERAÇÃO PARA MULTIBANCO *****
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      payment_method_types: ['card', 'multibanco'], // ALTERADO/ADICIONADO 'multibanco' AQUI
      metadata: {
        internalPaymentId: payment.id,
        userId: userId,
        relatedResourceId: payment.relatedResourceId,
        relatedResourceType: payment.relatedResourceType,
        category: payment.category,
      },
    });
    // ***** FIM DA ALTERAÇÃO PARA MULTIBANCO *****

    console.log(`[CREATE INTENT] PaymentIntent criado para Pag.ID ${payment.id}: PI_ID=${paymentIntent.id}, ClientSecret=${paymentIntent.client_secret.substring(0,20)}... Métodos: ${paymentIntent.payment_method_types.join(', ')}`);

    res.send({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      amount: payment.amount,
    });

  } catch (error) {
    console.error('Erro ao criar Stripe Payment Intent:', error);
    res.status(500).json({ message: 'Erro ao iniciar processo de pagamento.', error: error.message });
  }
};


const clientAcceptNonStripePayment = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;
  try {
    const payment = await db.Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Pagamento não encontrado.' });
    if (payment.userId !== userId) return res.status(403).json({ message: 'Não tem permissão.' });
    if (payment.status !== 'pendente') return res.status(400).json({ message: `Pagamento não pendente.` });
    
    // Esta verificação pode ser ajustada ou removida se esta rota for apenas para casos não-Stripe
    // if (payment.category === 'sinal_consulta' /*ou outras categorias pagáveis via Stripe*/) {
    //     // return res.status(400).json({ message: 'Este tipo de pagamento deve ser processado via gateway.'});
    // }

    payment.status = 'pago';
    await payment.save();
    
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


const stripeWebhookHandler = async (req, res) => {
  console.log(`---------- ${new Date().toISOString()} --- [STRIPE WEBHOOK CONTROLLER INICIO] ---`);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('[WEBHOOK CTRL] Secret do Ambiente (primeiros 5):', webhookSecret ? webhookSecret.substring(0, 5) + '...' : 'NÃO DEFINIDO');
  console.log('[WEBHOOK CTRL] Assinatura Recebida (primeiros 10):', sig ? sig.substring(0, 10) + '...' : 'NÃO RECEBIDA');

  if (!webhookSecret) {
    console.error('[WEBHOOK CTRL] ERRO CRÍTICO: STRIPE_WEBHOOK_SECRET não está configurado no ambiente do servidor.');
    return res.status(400).send('Webhook secret não configurado no servidor.');
  }
  if (!sig) {
    console.error('[WEBHOOK CTRL] Erro: Cabeçalho stripe-signature em falta no pedido do Stripe.');
    return res.status(400).send('Cabeçalho stripe-signature em falta.');
  }

  let event;

  try {
    console.log('[WEBHOOK CTRL] A tentar construir evento Stripe a partir do corpo RAW...');
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('[WEBHOOK CTRL] Evento Stripe construído com SUCESSO. Tipo:', event.type, 'ID:', event.id);
  } catch (err) {
    console.error(`[WEBHOOK CTRL] ⚠️ FALHA na verificação da assinatura do webhook: ${err.message}`);
    console.error('[WEBHOOK CTRL] Detalhes do erro de assinatura:', err);
    return res.status(400).send(`Webhook Error (Signature Verification Failed): ${err.message}`);
  }

  console.log(`[WEBHOOK CTRL] A processar evento: ID=<span class="math-inline">\{event\.id\}, Tipo\=</span>{event.type}`);
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log('[WEBHOOK CTRL] ✅ Payment_intent.succeeded DETECTADO para PI_ID:', paymentIntentSucceeded.id);
      console.log('[WEBHOOK CTRL] Metadata do PaymentIntent:', paymentIntentSucceeded.metadata);

      if (paymentIntentSucceeded.metadata && paymentIntentSucceeded.metadata.internalPaymentId) {
        const internalPaymentId = parseInt(paymentIntentSucceeded.metadata.internalPaymentId);
        console.log(`[WEBHOOK CTRL] ID de Pagamento Interno (da metadata): ${internalPaymentId}`);

        try {
          const payment = await db.Payment.findByPk(internalPaymentId);

          if (payment) {
            console.log(`[WEBHOOK CTRL] Pagamento interno ID ${internalPaymentId} encontrado. Status atual: ${payment.status}`);
            if (payment.status === 'pendente' || payment.status !== 'pago') {
              payment.status = 'pago';
              await payment.save();
              console.log(`[WEBHOOK CTRL] Pagamento interno ID ${internalPaymentId} atualizado para 'pago' na BD.`);

              if (payment.relatedResourceType === 'appointment' &&
                  payment.category === 'sinal_consulta' &&
                  payment.relatedResourceId) {
                console.log(`[WEBHOOK CTRL] É um sinal para consulta ID: ${payment.relatedResourceId}. A atualizar consulta...`);
                const appointment = await db.Appointment.findByPk(payment.relatedResourceId);
                if (appointment) {
                  console.log(`[WEBHOOK CTRL] Consulta ID ${appointment.id} encontrada. Status atual: ${appointment.status}`);
                  appointment.signalPaid = true;
                  if (appointment.status === 'agendada') {
                    appointment.status = 'confirmada';
                  }
                  await appointment.save();
                  console.log(`[WEBHOOK CTRL] Consulta ID ${appointment.id} ATUALIZADA na BD: signalPaid = true, status = ${appointment.status}.`);
                } else {
                  console.warn(`[WEBHOOK CTRL] AVISO: Consulta ID ${payment.relatedResourceId} (associada ao pag. de sinal ID ${payment.id}) não encontrada na BD.`);
                }
              }
            } else if (payment.status === 'pago') {
                console.log(`[WEBHOOK CTRL] Pagamento interno ID ${internalPaymentId} já estava 'pago'. Nenhuma ação de atualização de status tomada.`);
            }
          } else {
              console.warn(`[WEBHOOK CTRL] AVISO: Pagamento interno ID ${internalPaymentId} (da metadata) não encontrado na base de dados.`);
          }
        } catch (dbError) {
          console.error(`[WEBHOOK CTRL] ERRO DE BASE DE DADOS ao processar payment_intent.succeeded para internalPaymentId ${internalPaymentId}:`, dbError);
        }
      } else {
        console.warn('[WEBHOOK CTRL] AVISO: Webhook payment_intent.succeeded recebido SEM internalPaymentId nos metadata.');
      }
      break;
    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object;
      console.log('[WEBHOOK CTRL] ❌ Payment_intent.payment_failed DETECTADO para PI_ID:', paymentIntentFailed.id);
      console.log('[WEBHOOK CTRL] Erro do PaymentIntent:', paymentIntentFailed.last_payment_error?.message);
      if (paymentIntentFailed.metadata && paymentIntentFailed.metadata.internalPaymentId) {
        const internalPaymentIdFailed = parseInt(paymentIntentFailed.metadata.internalPaymentId);
        console.log(`[WEBHOOK CTRL] Falha para ID de Pagamento Interno (da metadata): ${internalPaymentIdFailed}`);
        try {
            const paymentToFail = await db.Payment.findByPk(internalPaymentIdFailed);
            if (paymentToFail && paymentToFail.status === 'pendente') {
                paymentToFail.status = 'rejeitado'; 
                paymentToFail.description = (paymentToFail.description || '') + ` Falha Stripe: ${paymentIntentFailed.last_payment_error?.message || 'desconhecido'}`;
                await paymentToFail.save();
                console.log(`[WEBHOOK CTRL] Pagamento interno ID ${internalPaymentIdFailed} atualizado para 'rejeitado' na BD.`);
            } else if (paymentToFail) {
                console.log(`[WEBHOOK CTRL] Pagamento interno ID ${internalPaymentIdFailed} não estava pendente (status: ${paymentToFail.status}). Nenhuma ação de status de falha tomada.`);
            } else {
                console.warn(`[WEBHOOK CTRL] AVISO: Pagamento interno ID ${internalPaymentIdFailed} (para falha) não encontrado na BD.`);
            }
        } catch (dbErrorFailed) {
            console.error(`[WEBHOOK CTRL] ERRO DE BASE DE DADOS ao processar payment_intent.payment_failed para internalPaymentId ${internalPaymentIdFailed}:`, dbErrorFailed);
        }
      } else {
          console.warn('[WEBHOOK CTRL] AVISO: Webhook payment_intent.payment_failed recebido SEM internalPaymentId nos metadata.');
      }
      break;
    default:
      console.log(`[WEBHOOK CTRL] Evento Stripe não tratado explicitamente: ${event.type}`);
  }

  console.log(`--- ${new Date().toISOString()} --- [STRIPE WEBHOOK CONTROLLER FIM] ---`);
  res.status(200).json({ received: true });
};

module.exports = {
  adminCreatePayment,
  adminGetAllPayments,
  adminGetTotalPaid,
  adminUpdatePaymentStatus,
  adminDeletePayment,
  clientGetMyPayments,
  clientGetMyPendingPayments,
  createStripePaymentIntent,
  clientAcceptPayment: clientAcceptNonStripePayment, 
  stripeWebhookHandler,
};