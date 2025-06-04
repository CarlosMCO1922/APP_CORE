// backend/config/config.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Garante que o .env é carregado para o CLI

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: require('path').join(__dirname, '..', 'database', 'core.sqlite'), // Caminho para o teu SQLite
    logging: console.log, // Ou false se não quiseres logs do SQL no desenvolvimento
  },
  production: {
    use_env_variable: 'DATABASE_URL', // Diz ao CLI para usar a DATABASE_URL do ambiente
    dialect: 'postgres',
    protocol: 'postgres', // Necessário para Heroku/Render com DATABASE_URL
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Importante para Render/Heroku
      }
    },
    logging: false, // Desativa logs SQL em produção
  }
  // Podes adicionar um ambiente 'test' aqui se necessário
};