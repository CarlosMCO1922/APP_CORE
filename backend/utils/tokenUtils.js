// backend/utils/tokenUtils.js
const jwt = require('jsonwebtoken');

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("ERRO CRÍTICO: JWT_SECRET não está definido nas variáveis de ambiente.");
}

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '8h';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';

/** Token de acesso (API + WebSocket). Curto o suficiente para forçar refresh em sessões longas (ex.: treino ao vivo). */
const generateAccessToken = (payload) => {
  if (!JWT_SECRET) {
    throw new Error('Chave secreta JWT não configurada.');
  }
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
  } catch (error) {
    console.error('Erro ao gerar access token JWT:', error);
    throw new Error('Não foi possível gerar o token de autenticação.');
  }
};

/** Refresh token (apenas para POST /auth/refresh). Não enviar em cada pedido. */
const generateRefreshToken = (payload) => {
  if (!JWT_SECRET) {
    throw new Error('Chave secreta JWT não configurada.');
  }
  const refreshPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    firstName: payload.firstName,
    isAdmin: payload.isAdmin,
    tokenType: 'refresh',
  };
  try {
    return jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });
  } catch (error) {
    console.error('Erro ao gerar refresh token JWT:', error);
    throw new Error('Não foi possível gerar o refresh token.');
  }
};

const verifyRefreshToken = (token) => {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.tokenType !== 'refresh') return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

/** Compatível com código legado: gera access com expiração custom (ex.: reset password). */
const generateToken = (payload, expiresIn = '1d') => {
  if (!JWT_SECRET) {
    throw new Error('Chave secreta JWT não configurada.');
  }
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  } catch (error) {
    console.error('Erro ao gerar token JWT:', error);
    throw new Error('Não foi possível gerar o token de autenticação.');
  }
};

const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error('Chave secreta JWT não configurada.');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error.name, error.message);
    return null;
  }
};


module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyToken,
};
