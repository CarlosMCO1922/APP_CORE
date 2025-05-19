// backend/models/Payment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01,
      },
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    referenceMonth: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Mês de referência do pagamento, formato YYYY-MM',
    },
    category: {
      type: DataTypes.ENUM(
        'treino_aula_avulso',
        'mensalidade_treino',
        'consulta_fisioterapia', // Pagamento total de uma consulta já realizada
        'sinal_consulta',       // NOVO: Pagamento do sinal de 20%
        'outro'
      ),
      allowNull: false,
      defaultValue: 'outro',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pendente', 'pago', 'cancelado', 'rejeitado'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    relatedResourceId: { // ID da consulta, treino, etc.
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedResourceType: { // 'appointment', 'training_booking', etc.
      type: DataTypes.STRING,
      allowNull: true,
    }
    // userId e staffId são adicionados via associações
  }, {
    tableName: 'payments',
    timestamps: true,
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'client',
    });
    // models.User.hasMany(Payment, ...) no User.js

    Payment.belongsTo(models.Staff, {
      foreignKey: {
        name: 'staffId',
        allowNull: true,
      },
      as: 'registeredBy',
    });
    // models.Staff.hasMany(Payment, ...) no Staff.js
  };

  return Payment;
};