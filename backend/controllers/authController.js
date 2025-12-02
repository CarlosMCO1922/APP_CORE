// backend/controllers/authController.js
const db = require('../models'); 
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/tokenUtils');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Registo de um novo Utilizador (Cliente)
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, gdprConsent } = req.body;

  try {
    // Verificar consentimento GDPR
    if (!gdprConsent) {
      return res.status(400).json({ message: 'É necessário aceitar o consentimento de partilha de dados (RGPD) para criar uma conta.' });
    }

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
      gdprConsent: true,
      gdprConsentDate: new Date(),
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


const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'O email é obrigatório.' });

  try {
    const user = await db.User.findOne({ where: { email } });
    if (user) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.passwordResetToken = crypto.createHash('sha256').update(resetCode).digest('hex');
      user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Expira em 10 minutos
      await user.save();

      try {
        await sendPasswordResetEmail(user.email, resetCode);
      } catch (e) {
        console.error('Falha ao enviar email de reset:', e);
      }
    }
    res.status(200).json({ message: 'Se existir uma conta com este email, receberá um código de recuperação.' });
  } catch (error) {
    console.error('Erro ao pedir reset de password:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email e código são obrigatórios.' });
    
    try {
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        const user = await db.User.findOne({
            where: { email, passwordResetToken: hashedCode, passwordResetExpires: { [db.Sequelize.Op.gt]: Date.now() } }
        });
        if (!user) return res.status(400).json({ message: 'Código inválido ou expirado.' });
        res.status(200).json({ message: 'Código verificado com sucesso.' });
    } catch (error) {
        console.error('Erro ao verificar código de reset:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

const resetPassword = async (req, res) => {
    const { email, code, password } = req.body;
    if (!email || !code || !password) return res.status(400).json({ message: 'Email, código e nova password são obrigatórios.' });

    try {
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        const user = await db.User.findOne({
            where: { email, passwordResetToken: hashedCode, passwordResetExpires: { [db.Sequelize.Op.gt]: Date.now() } }
        });
        if (!user) return res.status(400).json({ message: 'Pedido de reset inválido ou expirado.' });

        user.password = await hashPassword(password);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();
        res.status(200).json({ message: 'Palavra-passe atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao redefinir password:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};


module.exports = {
  registerUser,
  loginUser,
  registerStaff,
  loginStaff,
  // Adicionar as novas funções ao export
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
};
