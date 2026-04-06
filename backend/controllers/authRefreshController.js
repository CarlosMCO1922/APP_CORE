// POST /auth/refresh — novo access token a partir do refresh token (sessões longas, WebSocket).
const db = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');

const STAFF_ROLES = ['admin', 'trainer', 'physiotherapist', 'employee', 'osteopata'];

const refreshAccess = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ message: 'refreshToken é obrigatório.' });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({ message: 'Refresh token inválido ou expirado.' });
  }

  const { id, role } = decoded;

  try {
    if (role === 'user') {
      const user = await db.User.findByPk(id);
      if (!user) {
        return res.status(401).json({ message: 'Utilizador não encontrado.' });
      }
      if (!user.approvedAt) {
        return res.status(403).json({ message: 'Conta pendente de aprovação.' });
      }
      const payload = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role: 'user',
        isAdmin: user.isAdmin,
      };
      const token = generateAccessToken(payload);
      const newRefresh = generateRefreshToken(payload);
      return res.status(200).json({ token, refreshToken: newRefresh });
    }

    if (STAFF_ROLES.includes(role)) {
      const staff = await db.Staff.findByPk(id);
      if (!staff) {
        return res.status(401).json({ message: 'Utilizador não encontrado.' });
      }
      const payload = {
        id: staff.id,
        email: staff.email,
        firstName: staff.firstName,
        role: staff.role,
        isAdmin: staff.role === 'admin',
      };
      const token = generateAccessToken(payload);
      const newRefresh = generateRefreshToken(payload);
      return res.status(200).json({ token, refreshToken: newRefresh });
    }

    return res.status(401).json({ message: 'Role inválido no refresh token.' });
  } catch (err) {
    console.error('Erro em refreshAccess:', err);
    return res.status(500).json({ message: 'Erro ao renovar sessão.' });
  }
};

module.exports = { refreshAccess };
