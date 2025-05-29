// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const sequelize = require('../config/database'); // Ajuste o caminho se o seu config.js estiver noutro local
const db = {};

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

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
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Adicionar `hasMany` aos modelos User e Staff se não o fizerem já para outras coisas
// (Se o User já tiver um hasMany para outro modelo, adicione este à lista dentro do User.associate)
if (db.User && db.Notification && !db.User.associations.notifications) { // Verifica se a associação já não existe
    db.User.hasMany(db.Notification, {
        foreignKey: 'recipientUserId',
        as: 'notifications', // user.getNotifications()
    });
}
if (db.Staff && db.Notification && !db.Staff.associations.notifications) { // Verifica se a associação já não existe
    db.Staff.hasMany(db.Notification, {
        foreignKey: 'recipientStaffId',
        as: 'staffNotifications', // staff.getStaffNotifications()
    });
}
// ================================================================================

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;