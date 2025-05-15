// backend/utils/passwordUtils.js
const bcrypt = require('bcryptjs');

/**
 * Gera o hash de uma password.
 * @param {string} password - A password em texto plano.
 * @returns {Promise<string>} A password "hasheada".
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10); // O "salt" adiciona aleatoriedade ao hash
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Erro ao fazer hash da password:', error);
    throw new Error('Erro ao processar a password.');
  }
};

/**
 * Compara uma password em texto plano com uma password "hasheada".
 * @param {string} candidatePassword - A password fornecida pelo utilizador.
 * @param {string} hashedPassword - A password "hasheada" guardada na base de dados.
 * @returns {Promise<boolean>} True se as passwords corresponderem, false caso contrário.
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Erro ao comparar passwords:', error);
    throw new Error('Erro ao verificar a password.');
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
