// backend/models/Notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Quem recebe a notificação (pode ser um User normal ou um Staff)
    recipientUserId: { // Se a notificação for para um cliente
      type: DataTypes.INTEGER,
      allowNull: true, // Pode ser nulo se for para um Staff
      references: {
        model: 'users', // Nome da tabela users
        key: 'id',
      },
      onDelete: 'CASCADE', // Se o User for apagado, apaga as suas notificações
    },
    recipientStaffId: { // Se a notificação for para um membro do staff
      type: DataTypes.INTEGER,
      allowNull: true, // Pode ser nulo se for para um User
      references: {
        model: 'staff', // Nome da tabela staff
        key: 'id',
      },
      onDelete: 'CASCADE', // Se o Staff for apagado, apaga as suas notificações
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: { // Ex: 'NEW_BOOKING', 'PAYMENT_REMINDER', 'TRAINING_CANCELLED', 'NEW_SIGNUP_ADMIN'
      type: DataTypes.STRING,
      allowNull: true, // Opcional, mas útil para categorizar
    },
    relatedResourceId: { // ID do recurso relacionado (ex: trainingId, appointmentId)
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedResourceType: { // Tipo do recurso (ex: 'training', 'appointment', 'payment')
      type: DataTypes.STRING,
      allowNull: true,
    },
    link: { // Link para onde o utilizador deve ser redirecionado ao clicar na notificação no frontend
      type: DataTypes.STRING,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // createdAt e updatedAt são adicionados automaticamente pelo Sequelize
  }, {
    tableName: 'notifications',
    timestamps: true,
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'recipientUserId',
      as: 'recipientUser', // notification.getRecipientUser()
    });
    Notification.belongsTo(models.Staff, {
      foreignKey: 'recipientStaffId',
      as: 'recipientStaff', // notification.getRecipientStaff()
    });
  };

  return Notification;
};