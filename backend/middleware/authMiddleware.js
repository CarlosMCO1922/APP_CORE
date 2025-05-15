// backend/middleware/authMiddleware.js
const { verifyToken } = require('../utils/tokenUtils');
const db = require('../models'); // Para verificar se o utilizador/staff ainda existe

/**
 * Middleware para proteger rotas, verificando o token JWT.
 * Anexa o payload do token (user ou staff) ao objeto req.
 */
const protect = async (req, res, next) => {
  let token;

  // O token JWT é geralmente enviado no cabeçalho Authorization como "Bearer TOKEN_STRING"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Extrai o token "TOKEN_STRING"
      const decoded = verifyToken(token);

      if (!decoded || !decoded.id || !decoded.role) {
        return res.status(401).json({ message: 'Não autorizado, token inválido (payload incompleto).' });
      }

      // Anexa o utilizador/staff ao objeto req
      // Verifica se é um 'user' (cliente) ou 'staff'
      if (decoded.role === 'user') {
        const user = await db.User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] } // Não incluir a password
        });
        if (!user) {
          return res.status(401).json({ message: 'Não autorizado, utilizador do token não encontrado.' });
        }
        req.user = user; // Para rotas de utilizadores
        req.authContext = { id: user.id, role: 'user', isAdmin: user.isAdmin };
      } else if (['admin', 'trainer', 'physiotherapist', 'employee'].includes(decoded.role)) {
        const staffMember = await db.Staff.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });
        if (!staffMember) {
          return res.status(401).json({ message: 'Não autorizado, funcionário do token não encontrado.' });
        }
        req.staff = staffMember; // Para rotas de staff
        req.authContext = { id: staffMember.id, role: staffMember.role };
      } else {
        return res.status(401).json({ message: 'Não autorizado, role desconhecido no token.' });
      }

      next(); // Prossegue para a próxima função de middleware ou controlador da rota
    } catch (error) {
      console.error('Erro de autenticação:', error);
      // Se verifyToken lançar um erro (ex: expirado, malformado), ele já loga.
      // Aqui podemos garantir uma resposta consistente.
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

/**
 * Middleware para verificar se o utilizador autenticado é um Admin (do modelo User).
 * Deve ser usado DEPOIS do middleware 'protect'.
 */
const isAdminUser = (req, res, next) => {
  if (req.authContext && req.authContext.role === 'user' && req.authContext.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas utilizadores administradores.' });
  }
};

/**
 * Middleware para verificar se o utilizador autenticado é um Staff com role 'admin'.
 * Deve ser usado DEPOIS do middleware 'protect'.
 */
const isAdminStaff = (req, res, next) => {
  if (req.authContext && req.authContext.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores do sistema (staff).' });
  }
};

/**
 * Middleware para verificar se o utilizador autenticado é qualquer tipo de Staff.
 * Deve ser usado DEPOIS do middleware 'protect'.
 */
const isStaff = (req, res, next) => {
  if (req.authContext && ['admin', 'trainer', 'physiotherapist', 'employee'].includes(req.authContext.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas funcionários.' });
  }
};

/**
 * Middleware para verificar se o utilizador autenticado é um Cliente (User não-admin).
 * Deve ser usado DEPOIS do middleware 'protect'.
 */
const isClientUser = (req, res, next) => {
    if (req.authContext && req.authContext.role === 'user') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Apenas clientes.' });
    }
};


module.exports = {
  protect,
  isAdminUser, // Se tiveres utilizadores normais que podem ser admins
  isAdminStaff, // Para o admin principal do sistema (do modelo Staff)
  isStaff,
  isClientUser,
};
