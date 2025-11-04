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
        'consulta_fisioterapia', 
        'sinal_consulta',       
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
    relatedResourceId: { 
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedResourceType: { 
      type: DataTypes.STRING,
      allowNull: true,
    }
    
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['referenceMonth'] },
      { fields: ['paymentDate'] },
      { fields: ['relatedResourceType', 'relatedResourceId'] },
    ],
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'client',
    });

    Payment.belongsTo(models.Staff, {
      foreignKey: {
        name: 'staffId',
        allowNull: true,
      },
      as: 'registeredBy',
    });
  };

  return Payment;
};