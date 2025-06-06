// backend/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config(); 

let sequelize;


if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false 
      }
    },
    logging: false,
  });
} else {
  // Configuração de desenvolvimento com SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database', 'core.sqlite'),
    logging: console.log, 
  });
}

module.exports = sequelize;