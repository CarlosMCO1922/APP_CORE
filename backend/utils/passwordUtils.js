// backend/utils/passwordUtils.js
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Erro ao fazer hash da password:', error);
    throw new Error('Erro ao processar a password.');
  }
};

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
