// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize'); // Classe Sequelize
const basename = path.basename(__filename);
// Importa a instância do Sequelize já configurada do seu ficheiro database.js
const sequelize = require('../config/database'); // ESTA É A ÚNICA DECLARAÇÃO DE 'sequelize' QUE PRECISA
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // Passa a instância 'sequelize' e 'Sequelize.DataTypes' para cada modelo
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Adiciona as associações 'hasMany' para User e Staff com Notification,
// verificando se já não existem para evitar duplicados.
if (db.User && db.Notification && !db.User.associations.notifications) {
    db.User.hasMany(db.Notification, {
        foreignKey: 'recipientUserId',
        as: 'notifications',
    });
}
if (db.Staff && db.Notification && !db.Staff.associations.staffNotifications) {
    db.Staff.hasMany(db.Notification, {
        foreignKey: 'recipientStaffId',
        as: 'staffNotifications', // 'staffNotifications' como no modelo Notification.js
    });
}

db.sequelize = sequelize; // Exporta a instância do Sequelize
db.Sequelize = Sequelize; // Exporta a classe Sequelize

module.exports = db;