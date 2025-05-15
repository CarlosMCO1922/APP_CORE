// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
// Importa a tua instância configurada do Sequelize
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
    // Cada ficheiro de modelo exporta uma função que espera 'sequelize' e 'DataTypes'
    // No nosso caso, os modelos já importam DataTypes, então só precisamos de passar sequelize.
    const modelDefiner = require(path.join(__dirname, file));
    const model = modelDefiner(sequelize, Sequelize.DataTypes); // Passa DataTypes se os modelos não o importarem
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Passa todos os modelos para a função associate
  }
});

db.sequelize = sequelize; // Adiciona a instância do sequelize ao objeto db
db.Sequelize = Sequelize; // Adiciona a classe Sequelize ao objeto db

module.exports = db; // Exporta o objeto db com todos os modelos e sequelize
