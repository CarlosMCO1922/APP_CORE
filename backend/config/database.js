// backend/config/database.js

const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database', 'core.sqlite')
});

module.exports = sequelize;