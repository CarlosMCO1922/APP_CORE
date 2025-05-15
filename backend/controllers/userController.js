// backend/controllers/userController.js
const db = require('../models');
const { hashPassword } = require('../utils/passwordUtils');
const { Op } = require('sequelize'); // Necessário para Op.ne

// --- Funções para Clientes (já existentes) ---

// @desc    Obter perfil do utilizador autenticado
// @route   GET /api/users/me
// @access  Privado (requer token de cliente)
const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'Utilizador não encontrado ou não autenticado corretamente.' });
  }
  res.status(200).json(req.user);
};

// @desc    Atualizar perfil do utilizador autenticado
// @route   PUT /api/users/me
// @access  Privado (requer token de cliente)
const updateMe = async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'Utilizador não encontrado ou não autenticado corretamente.' });
  }

  const { firstName, lastName, email, password } = req.body;
  const userId = req.user.id;

  try {
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    if (email && email !== user.email) {
      const existingUserWithEmail = await db.User.findOne({
        where: { email, id: { [Op.ne]: userId } }
      });
      if (existingUserWithEmail) {
        return res.status(400).json({ message: 'Este email já está em uso por outra conta de utilizador.' });
      }
      const existingStaffWithEmail = await db.Staff.findOne({ where: { email } });
      if (existingStaffWithEmail) {
        return res.status(400).json({ message: 'Este email já está registado como funcionário. Contacte o suporte.' });
      }
      user.email = email;
    }

    if (password) {
      user.password = await hashPassword(password);
    }

    await user.save();
    const { password: _, ...userResponse } = user.get({ plain: true });
    res.status(200).json({ message: 'Perfil atualizado com sucesso!', user: userResponse });

  } catch (error) {
    console.error('Erro ao atualizar perfil do utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar o perfil.', error: error.message });
  }
};

// @desc    Obter as marcações (treinos e consultas) do utilizador autenticado
// @route   GET /api/users/me/bookings
// @access  Privado (requer token de cliente)
const getMyBookings = async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'Utilizador não encontrado ou não autenticado corretamente.' });
  }
  const userId = req.user.id;

  try {
    const userWithTrainings = await db.User.findByPk(userId, {
      include: [{
        model: db.Training,
        as: 'trainings',
        attributes: ['id', 'name', 'description', 'date', 'time', 'capacity'],
        through: { attributes: [] },
        include: [{
            model: db.Staff,
            as: 'instructor',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }]
      }]
    });

    const userWithAppointments = await db.User.findByPk(userId, {
        include: [{
            model: db.Appointment,
            as: 'appointments',
            attributes: ['id', 'date', 'time', 'notes', 'status'],
            include: [{
                model: db.Staff,
                as: 'professional',
                attributes: ['id', 'firstName', 'lastName', 'email', 'role']
            }]
        }]
    });

    res.status(200).json({
      trainings: userWithTrainings ? userWithTrainings.trainings : [],
      appointments: userWithAppointments ? userWithAppointments.appointments : [],
    });

  } catch (error) {
    console.error('Erro ao obter marcações do utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao obter as marcações.', error: error.message });
  }
};


// --- Funções para ADMINISTRAÇÃO de Utilizadores (Clientes) ---

// @desc    Admin lista todos os utilizadores (clientes)
// @route   GET /api/users
// @access  Privado (Admin Staff)
const getAllUsersAsAdmin = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password'] }, // Excluir passwords
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Erro (admin) ao listar utilizadores:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar utilizadores.', error: error.message });
  }
};

// @desc    Admin obtém detalhes de um utilizador específico
// @route   GET /api/users/:id
// @access  Privado (Admin Staff)
const getUserByIdAsAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [ // Incluir treinos e consultas para uma visão completa do admin
        {
          model: db.Training,
          as: 'trainings',
          attributes: ['id', 'name', 'date', 'time'],
          through: { attributes: [] },
        },
        {
          model: db.Appointment,
          as: 'appointments',
          attributes: ['id', 'date', 'time', 'status'],
          include: [{ model: db.Staff, as: 'professional', attributes: ['firstName', 'lastName']}]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Erro (admin) ao obter utilizador por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao obter utilizador.', error: error.message });
  }
};

// @desc    Admin cria um novo utilizador (cliente)
// @route   POST /api/users
// @access  Privado (Admin Staff)
const createUserAsAdmin = async (req, res) => {
  const { firstName, lastName, email, password, isAdmin } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Por favor, forneça nome, apelido, email e password.' });
  }

  try {
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está registado como utilizador.' });
    }
    const existingStaff = await db.Staff.findOne({ where: { email } });
    if (existingStaff) {
      return res.status(400).json({ message: 'Este email já está registado como funcionário. Não pode ser usado para um cliente.' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await db.User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false, // Admin pode definir se o novo user é admin (do tipo User)
    });

    const { password: _, ...userResponse } = newUser.get({ plain: true });
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Erro (admin) ao criar utilizador:', error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Erro de validação', errors: messages });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar utilizador.', error: error.message });
  }
};

// @desc    Admin atualiza um utilizador (cliente)
// @route   PUT /api/users/:id
// @access  Privado (Admin Staff)
const updateUserAsAdmin = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, password, isAdmin } = req.body;

  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;

    if (email && email !== user.email) {
      const existingUser = await db.User.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está em uso por outro utilizador.' });
      }
      const existingStaff = await db.Staff.findOne({ where: { email } });
      if (existingStaff) {
        return res.status(400).json({ message: 'Este email já está em uso por um funcionário.' });
      }
      user.email = email;
    }

    if (password) {
      user.password = await hashPassword(password);
    }

    await user.save();
    const { password: _, ...userResponse } = user.get({ plain: true });
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Erro (admin) ao atualizar utilizador:', error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Erro de validação', errors: messages });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar utilizador.', error: error.message });
  }
};

// @desc    Admin elimina um utilizador (cliente)
// @route   DELETE /api/users/:id
// @access  Privado (Admin Staff)
const deleteUserAsAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    // O que fazer com as associações (UserTrainings, Appointments)?
    // O Sequelize, por defeito, não faz CASCADE em belongsToMany.
    // As FKs em Appointment para userId podem ser SET NULL se assim definidas no modelo.

    // Remover associações de treinos
    await user.setTrainings([]); // Remove todas as inscrições em treinos

    // Para consultas, se a FK `userId` em `Appointment` for definida com `onDelete: 'SET NULL'`,
    // o Sequelize pode tratar disso. Caso contrário, precisamos de o fazer manualmente.
    // Vamos assumir que queremos desassociar (SET NULL) ou eliminar as consultas do user.
    // Por agora, vamos apenas desassociar (o que significa que as consultas ficam sem cliente).
    await db.Appointment.update({ userId: null, status: 'disponível' }, { where: { userId: id } });
    // Se quiséssemos eliminar as consultas do utilizador:
    // await db.Appointment.destroy({ where: { userId: id } });

    await user.destroy();
    res.status(200).json({ message: 'Utilizador eliminado com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao eliminar utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar utilizador.', error: error.message });
  }
};


module.exports = {
  getMe,
  updateMe,
  getMyBookings,
  // Funções Admin
  getAllUsersAsAdmin,
  getUserByIdAsAdmin,
  createUserAsAdmin,
  updateUserAsAdmin,
  deleteUserAsAdmin,
};
