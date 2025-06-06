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
        model: 'trainings',
        key: 'id',
      },
      onDelete: 'CASCADE', 
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', 
        key: 'id',
      },
      onDelete: 'CASCADE', 
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'NOTIFIED', 'BOOKED', 'EXPIRED', 'CANCELLED_BY_USER'),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    notifiedAt: { 
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'training_waitlists',
    timestamps: true,
    indexes: [
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