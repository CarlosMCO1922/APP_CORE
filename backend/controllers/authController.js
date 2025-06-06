// backend/controllers/authController.js
const db = require('../models'); 
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/tokenUtils');

// Registo de um novo Utilizador (Cliente)
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Verificar se o email já existe na tabela Users
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está registado como utilizador.' });
    }

    // Verificar se o email já existe na tabela Staff (para evitar duplicação de emails entre tipos de conta)
    const existingStaff = await db.Staff.findOne({ where: { email } });
    if (existingStaff) {
      return res.status(400).json({ message: 'Este email já está registado como funcionário. Contacte o suporte se isto for um erro.' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await db.User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const userResponse = {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    };

    res.status(201).json({ message: 'Utilizador registado com sucesso!', user: userResponse });
  } catch (error) {
    console.error('Erro no registo do utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registar o utilizador.', error: error.message });
  }
};

// Login de Utilizador (Cliente)
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas (email não encontrado).' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas (password incorreta).' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName, 
      role: 'user', 
      isAdmin: user.isAdmin, 
    };
    const token = generateToken(payload);

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user: { 
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
      }
    });
  } catch (error) {
    console.error('Erro no login do utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao fazer login.', error: error.message });
  }
};

// Registo de um novo Membro da Equipa (Staff)
const registerStaff = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Validação simples do role
  const allowedRoles = ['admin', 'trainer', 'physiotherapist', 'employee'];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({ message: `Role inválido. Roles permitidos: ${allowedRoles.join(', ')}` });
  }

  try {
    // Verificar se o email já existe na tabela Staff
    const existingStaff = await db.Staff.findOne({ where: { email } });
    if (existingStaff) {
      return res.status(400).json({ message: 'Este email já está registado como funcionário.' });
    }

    // Verificar se o email já existe na tabela Users
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está registado como utilizador. Contacte o suporte se isto for um erro.' });
    }

    const hashedPassword = await hashPassword(password);
    const newStaff = await db.Staff.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'employee', 
    });

    const staffResponse = {
      id: newStaff.id,
      firstName: newStaff.firstName,
      lastName: newStaff.lastName,
      email: newStaff.email,
      role: newStaff.role,
    };

    res.status(201).json({ message: 'Funcionário registado com sucesso!', staff: staffResponse });
  } catch (error) {
    console.error('Erro no registo do funcionário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao registar o funcionário.', error: error.message });
  }
};

// Login de Membro da Equipa (Staff/Admin)
const loginStaff = async (req, res) => {
  const { email, password } = req.body;

  try {
    const staffMember = await db.Staff.findOne({ where: { email } });
    if (!staffMember) {
      return res.status(401).json({ message: 'Credenciais inválidas (email não encontrado).' });
    }

    const isMatch = await comparePassword(password, staffMember.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas (password incorreta).' });
    }

    const payload = {
      id: staffMember.id,
      email: staffMember.email,
      firstName: staffMember.firstName, 
      role: staffMember.role, 
    };
    const token = generateToken(payload);

    res.status(200).json({
      message: 'Login de funcionário bem-sucedido!',
      token,
      staff: { 
        id: staffMember.id,
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        email: staffMember.email,
        role: staffMember.role,
      }
    });
  } catch (error) {
    console.error('Erro no login do funcionário:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao fazer login do funcionário.', error: error.message });
  }
};


module.exports = {
  registerUser,
  loginUser,
  registerStaff,
  loginStaff,
};
