// backend/middleware/authMiddleware.js
const { verifyToken } = require('../utils/tokenUtils');
const db = require('../models'); 

const protect = async (req, res, next) => {
  let token;

 
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; 
      const decoded = verifyToken(token);

      if (!decoded || !decoded.id || !decoded.role) {
        return res.status(401).json({ message: 'Não autorizado, token inválido (payload incompleto).' });
      }

      if (decoded.role === 'user') {
        const user = await db.User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] } 
        });
        if (!user) {
          return res.status(401).json({ message: 'Não autorizado, utilizador do token não encontrado.' });
        }
        req.user = user; 
        req.authContext = { id: user.id, role: 'user', isAdmin: user.isAdmin };
      } else if (['admin', 'trainer', 'physiotherapist', 'employee'].includes(decoded.role)) {
        const staffMember = await db.Staff.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });
        if (!staffMember) {
          return res.status(401).json({ message: 'Não autorizado, funcionário do token não encontrado.' });
        }
        req.staff = staffMember; 
        req.authContext = { id: staffMember.id, role: staffMember.role };
      } else {
        return res.status(401).json({ message: 'Não autorizado, role desconhecido no token.' });
      }

      next(); 
    } catch (error) {
      console.error('Erro de autenticação:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Não autorizado, token expirado.' });
      }
      return res.status(401).json({ message: 'Não autorizado, token falhou na verificação.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
  }
};


const isAdminUser = (req, res, next) => {
  if (req.authContext && req.authContext.role === 'user' && req.authContext.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas utilizadores administradores.' });
  }
};


const isAdminStaff = (req, res, next) => {
  if (req.authContext && req.authContext.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores do sistema (staff).' });
  }
};


const isStaff = (req, res, next) => {
  if (req.authContext && ['admin', 'trainer', 'physiotherapist', 'employee'].includes(req.authContext.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas funcionários.' });
  }
};


const isClientUser = (req, res, next) => {
    if (req.authContext && req.authContext.role === 'user') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas clientes.' });
    }
};


module.exports = {
  protect,
  isAdminUser, 
  isAdminStaff, 
  isStaff,
  isClientUser,
};
