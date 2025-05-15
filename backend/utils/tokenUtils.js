// backend/utils/tokenUtils.js
const jwt = require('jsonwebtoken');

// Carrega as variáveis de ambiente (se estiveres a usar .env)
// Certifica-te de que tens o ficheiro .env na raiz do backend com JWT_SECRET
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("ERRO CRÍTICO: JWT_SECRET não está definido nas variáveis de ambiente.");
  // Em produção, deverias parar a aplicação aqui ou ter um fallback muito seguro.
  // Para desenvolvimento, podemos usar um valor padrão, mas NÃO FAÇAS ISTO EM PRODUÇÃO.
  // JWT_SECRET = 'DEV_FALLBACK_SECRET_CHANGE_ME';
  // console.warn("A usar JWT_SECRET de fallback para desenvolvimento. MUDA ISTO PARA PRODUÇÃO!");
}


/**
 * Gera um token JWT para um utilizador.
 * @param {object} payload - Os dados a incluir no token (ex: id do utilizador, role).
 * @param {string} expiresIn - Duração da validade do token (ex: '1h', '7d').
 * @returns {string} O token JWT gerado.
 */
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

/**
 * Verifica um token JWT.
 * @param {string} token - O token JWT a verificar.
 * @returns {Promise<object|null>} O payload descodificado se o token for válido, null caso contrário.
 */
const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error('Chave secreta JWT não configurada.');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    // Erros comuns: TokenExpiredError, JsonWebTokenError (malformado, assinatura inválida)
    console.error('Erro ao verificar token JWT:', error.name, error.message);
    return null;
  }
};


module.exports = {
  generateToken,
  verifyToken,
};
