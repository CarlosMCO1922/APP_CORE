// backend/models/Appointment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME, // Formato HH:MM:SS
      allowNull: false,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        'disponível',
        'agendada', // Cliente marcou ou admin/staff criou para cliente, aguarda sinal
        'confirmada', // Sinal pago, consulta confirmada
        'concluída',
        'cancelada_pelo_cliente',
        'cancelada_pelo_staff',
        'não_compareceu',
        'pendente_aprovacao_staff', // Cliente solicitou, aguarda aprovação do staff
        'rejeitada_pelo_staff'
      ),
      defaultValue: 'disponível',
      allowNull: false,
    },
    totalCost: { // Custo total da consulta
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, // Pode ser null para horários 'disponível' ou se ainda não definido
    },
    signalPaid: { // Sinal de 20% foi pago?
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // paymentForSignalId: { // Opcional: se quiseres uma FK direta para o pagamento do sinal
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: 'payments', // Nome da tabela de pagamentos
    //     key: 'id'
    //   },
    //   onUpdate: 'CASCADE',
    //   onDelete: 'SET NULL' // Ou 'RESTRICT' se não quiser apagar consulta se tiver pagamento
    // }
  }, {
    tableName: 'appointments',
    timestamps: true,
  });

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'client',
    });
    Appointment.belongsTo(models.Staff, {
      foreignKey: 'staffId',
      allowNull: false,
      as: 'professional',
    });

    // Se usares paymentForSignalId:
    // Appointment.belongsTo(models.Payment, {
    //   foreignKey: 'paymentForSignalId',
    //   as: 'signalPaymentInfo' // Nome diferente para evitar conflito com 'payments' em User
    // });
  };

  return Appointment;
};