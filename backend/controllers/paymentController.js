// backend/controllers/paymentController.js
const db = require('../models');
const { Op, Sequelize } = require('sequelize'); // Sequelize pode não ser necessário aqui diretamente
const { format } = require('date-fns'); // Útil se precisares formatar datas de forma consistente

// --- Funções do Administrador (tuas funções existentes) ---

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

// @desc    Admin lista todos os pagamentos com filtros
// @route   GET /payments (ou /api/payments)
// @access  Privado (Admin Staff)
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

// @desc    Admin obtém o total de pagamentos com status 'pago'
// @route   GET /payments/total-paid (ou /api/payments/total-paid)
// @access  Privado (Admin Staff)
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

// @desc    Admin atualiza o status de um pagamento
// @route   PATCH /payments/:paymentId/status (ou /api/payments/:paymentId/status)
// @access  Privado (Admin Staff)
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

        // Se o pagamento mudou para 'pago' E é um sinal de consulta, atualiza a consulta
        if (status === 'pago' && originalStatus !== 'pago' &&
            payment.relatedResourceType === 'appointment' &&
            payment.category === 'sinal_consulta' &&
            payment.relatedResourceId) {
          const appointment = await db.Appointment.findByPk(payment.relatedResourceId);
          if (appointment) {
            appointment.signalPaid = true;
            if (appointment.status === 'agendada') { // Só muda para confirmada se estava agendada
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

// --- Funções do Cliente ---

// @desc    Cliente lista os seus próprios pagamentos
// @route   GET /payments/my-payments (ou /api/payments/my-payments)
// @access  Privado (Cliente)
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

// @desc    Cliente "aceita" (simula pagamento) um pagamento pendente, mudando o status para 'pago'
// @route   PATCH /payments/:paymentId/accept (ou /api/payments/:paymentId/accept)
// @access  Privado (Cliente)
const clientAcceptPayment = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;

  try {
    const payment = await db.Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Pagamento não encontrado.' });
    }
    if (payment.userId !== userId) {
      return res.status(403).json({ message: 'Não tem permissão para modificar este pagamento.' });
    }
    if (payment.status !== 'pendente') {
      return res.status(400).json({ message: `Este pagamento não está pendente (status atual: ${payment.status}).` });
    }

    payment.status = 'pago';
    // payment.paymentDate = format(new Date(), 'yyyy-MM-dd'); // Opcional: atualizar data do pagamento para o dia da aceitação
    await payment.save();

    // Se for um pagamento de sinal de consulta, atualiza a consulta relacionada
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
        console.log(`Consulta ID ${appointment.id} atualizada via clientAcceptPayment: signalPaid = true, status = ${appointment.status}.`);
      } else {
        console.warn(`ClientAcceptPayment: Consulta ID ${payment.relatedResourceId} associada ao pagamento de sinal ID ${payment.id} não encontrada.`);
      }
    }

    const updatedPaymentWithDetails = await db.Payment.findByPk(payment.id, {
        include: [
            { model: db.User, as: 'client', attributes: ['id', 'firstName', 'lastName'] },
            { model: db.Staff, as: 'registeredBy', attributes: ['id', 'firstName', 'lastName'] },
        ]
    });

    res.status(200).json({ message: 'Pagamento aceite com sucesso!', payment: updatedPaymentWithDetails });
  } catch (error) {
    console.error('Erro (cliente) ao aceitar pagamento:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao aceitar pagamento.', error: error.message });
  }
};

// Opcional: adminDeletePayment (se ainda não existir ou precisar de ajustes)
const adminDeletePayment = async (req, res) => {
    const { paymentId } = req.params;
    try {
        const payment = await db.Payment.findByPk(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Pagamento não encontrado." });
        }

        // Lógica adicional? Por exemplo, se for um sinal, reverter status da consulta?
        // Por agora, apenas apaga o pagamento.
        // if (payment.relatedResourceType === 'appointment' && payment.category === 'sinal_consulta') {
        //     const appointment = await db.Appointment.findByPk(payment.relatedResourceId);
        //     if (appointment && appointment.signalPaid) {
        //         appointment.signalPaid = false;
        //         if (appointment.status === 'confirmada') appointment.status = 'agendada';
        //         await appointment.save();
        //     }
        // }

        await payment.destroy();
        res.status(200).json({ message: "Pagamento eliminado com sucesso." });
    } catch (error) {
        console.error('Erro (admin) ao eliminar pagamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao eliminar pagamento.', error: error.message });
    }
};


module.exports = {
  adminCreatePayment,
  adminGetAllPayments,
  adminGetTotalPaid,
  adminUpdatePaymentStatus,
  adminDeletePayment, // Adicionada esta função aos exports
  clientGetMyPayments,
  clientAcceptPayment,
};