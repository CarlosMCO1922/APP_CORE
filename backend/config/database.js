// backend/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config(); // Para carregar .env localmente, se usares

let sequelize;

// Verifica se estamos em produção e se DATABASE_URL está definida (será definida pelo Render)
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Esta opção pode ser necessária dependendo do provedor de DB do Render
      }
    },
    logging: false, // Desativa logging SQL verboso em produção
  });
} else {
  // Configuração de desenvolvimento com SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database', 'core.sqlite'),
    logging: console.log, // Ativa logging SQL para desenvolvimento
  });
}

module.exports = sequelize;