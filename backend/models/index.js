// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const sequelize = require('../config/database');
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
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// As associações hasMany para TrainingWaitlist nos modelos User e Training
// já foram definidas dentro dos seus respetivos ficheiros de modelo (User.js, Training.js)
// e serão chamadas pelo loop Object.keys(db) acima.

// Mantém as associações explícitas para Notification se ainda as tiver aqui.
if (db.User && db.Notification && !db.User.associations.notifications) {
    db.User.hasMany(db.Notification, {
        foreignKey: 'recipientUserId',
        as: 'notifications',
    });
}
if (db.Staff && db.Notification && !db.Staff.associations.staffNotifications) {
    db.Staff.hasMany(db.Notification, {
        foreignKey: 'recipientStaffId',
        as: 'staffNotifications',
    });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;