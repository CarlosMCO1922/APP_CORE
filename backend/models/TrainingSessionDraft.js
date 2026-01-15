// backend/models/TrainingSessionDraft.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrainingSessionDraft = sequelize.define('TrainingSessionDraft', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    trainingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'trainings',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    workoutPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'workout_plans',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    sessionData: {
      type: DataTypes.JSON, // JSON funciona tanto em SQLite (dev) quanto PostgreSQL (prod)
      allowNull: false,
      defaultValue: {},
      comment: 'Dados completos da sessão de treino (setsData, planExercises, etc.)',
    },
    startTime: {
      type: DataTypes.BIGINT, // Timestamp em milissegundos
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Data de expiração do draft (24 horas após última atualização)',
    },
    lastDeviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID do último dispositivo que acedeu/atualizou este draft',
    },
  }, {
    tableName: 'training_session_drafts',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['trainingId'],
      },
      {
        fields: ['expiresAt'],
      },
      {
        unique: true,
        fields: ['userId', 'trainingId', 'workoutPlanId'],
        name: 'unique_user_training_workout_draft',
      },
    ],
  });

  TrainingSessionDraft.associate = (models) => {
    TrainingSessionDraft.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    TrainingSessionDraft.belongsTo(models.Training, {
      foreignKey: 'trainingId',
      as: 'training',
    });
    TrainingSessionDraft.belongsTo(models.WorkoutPlan, {
      foreignKey: 'workoutPlanId',
      as: 'workoutPlan',
    });
  };

  return TrainingSessionDraft;
};
