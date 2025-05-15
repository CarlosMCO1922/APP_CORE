// backend/models/Payment.js
const { DataTypes, Sequelize } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2), // Permite valores como 123.45
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01, // Pagamento mínimo
      },
    },
    paymentDate: { // Data em que o pagamento foi efetivamente realizado ou registado pelo admin
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    referenceMonth: { // Mês a que o pagamento se refere, ex: "2025-07"
      type: DataTypes.STRING, // Ou DATEONLY se quiseres guardar o primeiro dia do mês
      allowNull: false,
      comment: 'Mês de referência do pagamento, formato YYYY-MM',
    },
    category: {
      type: DataTypes.ENUM('treino_aula_avulso', 'mensalidade_treino', 'consulta_fisioterapia', 'outro'),
      allowNull: false,
      defaultValue: 'outro',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true, // Descrição opcional, ex: "Mensalidade Julho - PT João"
    },
    status: {
      type: DataTypes.ENUM('pendente', 'pago', 'cancelado', 'rejeitado'),
      allowNull: false,
      defaultValue: 'pendente',
    },
    // Foreign Keys serão adicionadas através das associações
    // userId (quem paga)
    // staffId (quem registou, opcional)
    // relatedResourceId (opcional, para ligar a um treino/consulta específica)
    // relatedResourceType (opcional, 'training' ou 'appointment')
  }, {
    tableName: 'payments',
    timestamps: true, // createdAt e updatedAt
  });

  Payment.associate = (models) => {
    // Um pagamento pertence a um Utilizador (cliente)
    Payment.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false, // Um pagamento deve estar associado a um cliente
      },
      as: 'client',
    });
    models.User.hasMany(Payment, {
      foreignKey: 'userId',
      as: 'payments',
    });

    // Um pagamento pode ter sido registado por um Staff (admin) (opcional)
    Payment.belongsTo(models.Staff, {
      foreignKey: {
        name: 'staffId', // Quem registou o pagamento
        allowNull: true, // Pode ser nulo se o sistema gerar automaticamente, ou se o cliente "auto-pagar"
      },
      as: 'registeredBy',
    });
    models.Staff.hasMany(Payment, { // Um staff pode ter registado vários pagamentos
        foreignKey: 'staffId',
        as: 'registeredPayments',
    });

    // Opcional: Se quiseres ligar um pagamento diretamente a um treino ou consulta específica
    // Payment.belongsTo(models.Training, { foreignKey: 'trainingId', constraints: false, allowNull: true });
    // Payment.belongsTo(models.Appointment, { foreignKey: 'appointmentId', constraints: false, allowNull: true });
  };

  return Payment;
};
