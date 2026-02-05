// backend/controllers/userController.js
const db = require('../models');
const { hashPassword } = require('../utils/passwordUtils');
const { Op } = require('sequelize'); 

// --- Funções para Clientes ---
const getMe = async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'Utilizador não encontrado ou não autenticado corretamente.' });
  }
  res.status(200).json(req.user);
};


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


// --- Funções para ADMINISTRAÇÃO de Utilizadores ---
const getAllUsersAsAdmin = async (req, res) => {
  try {
    const { approved } = req.query;
    const whereClause = {};
    if (approved === 'false' || approved === '0') {
      whereClause.approvedAt = null;
    } else if (approved === 'true' || approved === '1') {
      whereClause.approvedAt = { [Op.ne]: null };
    }
    const users = await db.User.findAll({
      where: Object.keys(whereClause).length ? whereClause : undefined,
      attributes: { exclude: ['password'] },
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Erro (admin) ao listar utilizadores:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar utilizadores.', error: error.message });
  }
};


const getUserByIdAsAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [ 
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
      isAdmin: isAdmin || false,
      approvedAt: new Date(), // Utilizadores criados por admin ficam já aprovados
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


const approveUserAsAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    if (user.approvedAt) {
      return res.status(400).json({ message: 'Este utilizador já está aprovado.' });
    }
    user.approvedAt = new Date();
    await user.save();
    const { password: _, ...userResponse } = user.get({ plain: true });
    res.status(200).json({ message: 'Utilizador aprovado com sucesso. Pode agora iniciar sessão.', user: userResponse });
  } catch (error) {
    console.error('Erro (admin) ao aprovar utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao aprovar utilizador.', error: error.message });
  }
};


const deleteUserAsAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }
    await user.setTrainings([]); 
    await db.Appointment.update({ userId: null, status: 'disponível' }, { where: { userId: id } });
    await user.destroy();
    res.status(200).json({ message: 'Utilizador eliminado com sucesso.' });
  } catch (error) {
    console.error('Erro (admin) ao eliminar utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar utilizador.', error: error.message });
  }
};


const adminGetUserTrainings = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    const trainings = await db.Training.findAll({
      include: [
        {
          model: db.User,
          as: 'participants',
          where: { id: userId }, 
          attributes: [], 
          through: { attributes: [] }
        },
        {
          model: db.Staff,
          as: 'instructor',
          attributes: ['id', 'firstName', 'lastName'],
        }
      ],
      order: [['date', 'DESC'], ['time', 'DESC']],
    });

   
    const trainingsWithDetails = await Promise.all(trainings.map(async (training) => {
        const trainingJSON = training.toJSON();
        const totalParticipants = await training.countParticipants();
        return {
            ...trainingJSON,
            participantsCount: totalParticipants, 
        };
    }));


    res.status(200).json(trainingsWithDetails);
  } catch (error) {
    console.error(`Erro ao buscar treinos para o utilizador ID ${userId}:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


const adminGetUserAppointments = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    const appointments = await db.Appointment.findAll({
      where: { userId: userId },
      include: [
        {
          model: db.Staff,
          as: 'professional', 
          attributes: ['id', 'firstName', 'lastName', 'role'],
        },
      ],
      order: [['date', 'DESC'], ['time', 'DESC']],
    });
    res.status(200).json(appointments);
  } catch (error) {
    console.error(`Erro ao buscar consultas para o utilizador ID ${userId}:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
};


module.exports = {
  getMe,
  updateMe,
  getMyBookings,
  getAllUsersAsAdmin,
  getUserByIdAsAdmin,
  createUserAsAdmin,
  updateUserAsAdmin,
  approveUserAsAdmin,
  deleteUserAsAdmin,
  adminGetUserTrainings,
  adminGetUserAppointments,
};
