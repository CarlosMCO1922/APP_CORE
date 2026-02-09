// backend/controllers/staffController.js
const db = require('../models');
const { hashPassword } = require('../utils/passwordUtils');
const { Op } = require('sequelize');

const createStaffMember = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ message: 'Por favor, forneça nome, apelido, email, password e role.' });
  }

  const allowedRoles = ['admin', 'trainer', 'physiotherapist', 'employee', 'osteopata'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: `Role inválido. Roles permitidos: ${allowedRoles.join(', ')}` });
  }

  try {
    // Verificar se o email já existe na tabela Staff ou Users
    const existingStaff = await db.Staff.findOne({ where: { email } });
    if (existingStaff) {
      return res.status(400).json({ message: 'Este email já está registado como funcionário.' });
    }
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está registado como utilizador. Contacte o suporte.' });
    }

    const hashedPassword = await hashPassword(password);
    const newStaffMember = await db.Staff.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    const { password: _, ...staffResponse } = newStaffMember.get({ plain: true });
    res.status(201).json(staffResponse);

  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Erro de validação', errors: messages });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar funcionário.', error: error.message });
  }
};


const getAllStaffMembers = async (req, res) => {
  try {
    const staffMembers = await db.Staff.findAll({
      attributes: { exclude: ['password'] }, 
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });
    res.status(200).json(staffMembers);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar funcionários.', error: error.message });
  }
};


const getStaffMemberById = async (req, res) => {
  const { id } = req.params;
  try {
    const staffMember = await db.Staff.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!staffMember) {
      return res.status(404).json({ message: 'Funcionário não encontrado.' });
    }
    res.status(200).json(staffMember);
  } catch (error) {
    console.error('Erro ao obter funcionário por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao obter funcionário.', error: error.message });
  }
};


const updateStaffMember = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, role, password } = req.body; 

  try {
    const staffMember = await db.Staff.findByPk(id);
    if (!staffMember) {
      return res.status(404).json({ message: 'Funcionário não encontrado.' });
    }

    if (firstName) staffMember.firstName = firstName;
    if (lastName) staffMember.lastName = lastName;
    if (role) {
      const allowedRoles = ['admin', 'trainer', 'physiotherapist', 'employee', 'osteopata'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Role inválido. Roles permitidos: ${allowedRoles.join(', ')}` });
      }
      staffMember.role = role;
    }

    if (email && email !== staffMember.email) {
      const existingStaff = await db.Staff.findOne({ where: { email, id: { [Op.ne]: id } } });
      if (existingStaff) {
        return res.status(400).json({ message: 'Este email já está em uso por outro funcionário.' });
      }
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Este email já está em uso por um utilizador.' });
      }
      staffMember.email = email;
    }

    if (password) { 
      staffMember.password = await hashPassword(password);
    }

    await staffMember.save();
    const { password: _, ...staffResponse } = staffMember.get({ plain: true });
    res.status(200).json(staffResponse);

  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
     if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message);
        return res.status(400).json({ message: 'Erro de validação', errors: messages });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar funcionário.', error: error.message });
  }
};


const deleteStaffMember = async (req, res) => {
  const { id } = req.params;

  
  if (req.staff && parseInt(req.staff.id) === parseInt(id)) {
      return res.status(400).json({ message: 'Não pode eliminar a sua própria conta de administrador através desta rota.' });
  }

  try {
    const staffMember = await db.Staff.findByPk(id);
    if (!staffMember) {
      return res.status(404).json({ message: 'Funcionário não encontrado.' });
    }

    const trainingsCount = await db.Training.count({ where: { instructorId: id } });
    if (trainingsCount > 0) {
      return res.status(400).json({ message: `Não é possível eliminar. Este funcionário está associado a ${trainingsCount} treino(s). Reatribua ou elimine os treinos primeiro.` });
    }
    const appointmentsCount = await db.Appointment.count({ where: { staffId: id } });
    if (appointmentsCount > 0) {
      return res.status(400).json({ message: `Não é possível eliminar. Este funcionário está associado a ${appointmentsCount} consulta(s). Reatribua ou elimine as consultas primeiro.` });
    }

    await staffMember.destroy();
    res.status(200).json({ message: 'Funcionário eliminado com sucesso.' });

  } catch (error) {
    console.error('Erro ao eliminar funcionário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao eliminar funcionário.', error: error.message });
  }
};

const getProfessionals = async (req, res) => {
  try {
    const professionals = await db.Staff.findAll({
      where: {
        role: {
          [Op.in]: ['trainer', 'physiotherapist', 'admin', 'osteopata']
        }
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'], 
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });
    res.status(200).json(professionals);
  } catch (error) {
    console.error('Erro ao listar profissionais:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar profissionais.', error: error.message });
  }
};

module.exports = {
  createStaffMember,
  getAllStaffMembers,
  getStaffMemberById,
  updateStaffMember,
  deleteStaffMember,
  getProfessionals,
};
