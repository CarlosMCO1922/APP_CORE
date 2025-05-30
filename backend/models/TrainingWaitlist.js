// backend/models/TrainingWaitlist.js
//const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const TrainingWaitlist = sequelize.define('TrainingWaitlist', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    trainingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trainings', // Nome da tabela 'trainings'
        key: 'id',
      },
      onDelete: 'CASCADE', // Se o treino for apagado, as entradas na lista de espera também
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Nome da tabela 'users'
        key: 'id',
      },
      onDelete: 'CASCADE', // Se o utilizador for apagado, remove-o da lista de espera
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'NOTIFIED', 'BOOKED', 'EXPIRED', 'CANCELLED_BY_USER'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    notifiedAt: { // Data em que o utilizador foi notificado de uma vaga
      type: DataTypes.DATE,
      allowNull: true,
    },
    // createdAt (addedAt) e updatedAt são adicionados automaticamente pelo Sequelize
  }, {
    tableName: 'training_waitlists',
    timestamps: true,
    indexes: [
      // Índice para garantir que um utilizador só pode estar uma vez na lista de espera de um treino
      {
        unique: true,
        fields: ['trainingId', 'userId']
      }
    ]
  });

  TrainingWaitlist.associate = (models) => {
    TrainingWaitlist.belongsTo(models.Training, {
      foreignKey: 'trainingId',
      as: 'training',
    });
    TrainingWaitlist.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return TrainingWaitlist;
};