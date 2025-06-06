// backend/utils/tokenUtils.js
const jwt = require('jsonwebtoken');

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("ERRO CRÍTICO: JWT_SECRET não está definido nas variáveis de ambiente.");
}

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
  verifyToken,
};
