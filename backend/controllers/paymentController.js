// backend/controllers/paymentController.js
const db = require('../models');
const { Op, Sequelize } = require('sequelize');

// --- Funções do Administrador ---

// @desc    Admin cria um novo pagamento para um utilizador
// @route   POST /api/payments
// @access  Privado (Admin Staff)
const adminCreatePayment = async (req, res) => {
  const { userId, amount, paymentDate, referenceMonth, category, description, status } = req.body;
  const staffId = req.staff.id; // Admin que está a registar o pagamento

  if (!userId || !amount || !paymentDate || !referenceMonth || !category) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta: userId, amount, paymentDate, referenceMonth, category.' });
  }

  try {
    const clientUser = await db.User.findByPk(userId);
    if (!clientUser) {
      return res.status(404).json({ message: 'Utilizador (cliente) não encontrado.' });
    }

    const newPayment = await db.Payment.create({
      userId,
      amount,
      paymentDate,
      referenceMonth, // Ex: "2025-07"
      category,
      description,
      status: status || 'pendente', // Se o admin não especificar, fica pendente para o cliente aceitar
      staffId, // Admin que registou
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
// @route   GET /api/payments
// @access  Privado (Admin Staff)
const adminGetAllPayments = async (req, res) => {
  const { userId, status, category, month, year } = req.query;
  const whereClause = {};

  if (userId) whereClause.userId = userId;
  if (status) whereClause.status = status;
  if (category) whereClause.category = category;
  if (month && year) { // Filtro por mês e ano de referência
    whereClause.referenceMonth = `${year}-${month.padStart(2, '0')}`;
  } else if (year) { // Filtro apenas por ano de referência
    whereClause.referenceMonth = { [Op.like]: `${year}-%` };
  }


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
// @route   GET /api/payments/total-paid
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
// @route   PATCH /api/payments/:paymentId/status
// @access  Privado (Admin Staff)
const adminUpdatePaymentStatus = async (req, res) => {
    const { paymentId } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Novo status é obrigatório." });
    }
    // Validar se o status é um dos permitidos pelo ENUM do modelo
    const allowedStatuses = db.Payment.getAttributes().status.values;
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Status inválido. Permitidos: ${allowedStatuses.join(', ')}` });
    }

    try {
        const payment = await db.Payment.findByPk(paymentId);
        if (!payment) {
            return res.status(404).json({ message: "Pagamento não encontrado." });
        }

        payment.status = status;
        // Opcional: adicionar uma nota ou quem alterou o status se necessário
        await payment.save();
        res.status(200).json(payment);
    } catch (error) {
        console.error('Erro (admin) ao atualizar status do pagamento:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar status.', error: error.message });
    }
};


// --- Funções do Cliente ---

// @desc    Cliente lista os seus próprios pagamentos
// @route   GET /api/payments/my-payments
// @access  Privado (Cliente)
const clientGetMyPayments = async (req, res) => {
  const userId = req.user.id; // Obtido do middleware 'protect'

  try {
    const payments = await db.Payment.findAll({
      where: { userId },
      include: [ // Opcional, se quiser mostrar quem registou
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

// @desc    Cliente "aceita" um pagamento pendente, mudando o status para 'pago'
// @route   PATCH /api/payments/:paymentId/accept
// @access  Privado (Cliente)
const clientAcceptPayment = async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id; // Cliente autenticado

  try {
    const payment = await db.Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Pagamento não encontrado.' });
    }

    // Verificar se o pagamento pertence ao utilizador autenticado
    if (payment.userId !== userId) {
      return res.status(403).json({ message: 'Não tem permissão para modificar este pagamento.' });
    }

    // Verificar se o pagamento está realmente pendente
    if (payment.status !== 'pendente') {
      return res.status(400).json({ message: `Este pagamento não está pendente (status atual: ${payment.status}).` });
    }

    payment.status = 'pago';
    // Opcional: registar a data de aceitação se for diferente da paymentDate
    // payment.acceptedAt = new Date(); 
    await payment.save();

    res.status(200).json({ message: 'Pagamento aceite com sucesso!', payment });
  } catch (error) {
    console.error('Erro (cliente) ao aceitar pagamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao aceitar pagamento.', error: error.message });
  }
};


module.exports = {
  adminCreatePayment,
  adminGetAllPayments,
  adminGetTotalPaid,
  adminUpdatePaymentStatus,
  clientGetMyPayments,
  clientAcceptPayment,
};
