// backend/models/TrainingSession.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrainingSession = sequelize.define('TrainingSession', {
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
      onDelete: 'SET NULL',
      comment: 'Referência ao treino agendado (pode ser null para treinos livres)',
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
    startTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Timestamp em milissegundos do início da sessão',
    },
    endTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Timestamp em milissegundos do fim da sessão',
    },
    totalDurationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duração total da sessão em segundos',
    },
    totalVolume: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Volume total (soma de peso × reps de todas as séries)',
    },
    totalSets: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Número total de séries completadas',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data/hora de conclusão da sessão',
    },
    status: {
      type: DataTypes.ENUM('completed', 'cancelled'),
      defaultValue: 'completed',
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas/observações da sessão',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: 'Metadados adicionais (PRs batidos, sensações, etc.)',
    },
  }, {
    tableName: 'training_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
        name: 'idx_sessions_user_id',
      },
      {
        fields: ['completedAt'],
        name: 'idx_sessions_completed_at',
      },
      {
        fields: ['workoutPlanId'],
        name: 'idx_sessions_workout_plan',
      },
      {
        fields: ['userId', 'workoutPlanId'],
        name: 'idx_sessions_user_workout_plan',
      },
      {
        fields: ['userId', 'completedAt'],
        name: 'idx_sessions_user_date',
      },
    ],
  });

  TrainingSession.associate = (models) => {
    TrainingSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    TrainingSession.belongsTo(models.Training, {
      foreignKey: 'trainingId',
      as: 'training',
    });
    TrainingSession.belongsTo(models.WorkoutPlan, {
      foreignKey: 'workoutPlanId',
      as: 'workoutPlan',
    });
    TrainingSession.hasMany(models.ClientExercisePerformance, {
      foreignKey: 'sessionId',
      as: 'performances',
    });
  };

  return TrainingSession;
};
