// backend/models/Training.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Training = sequelize.define('Training', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME, // Formato HH:MM:SS
      allowNull: false,
    },
    durationMinutes: { // Duração do treino em minutos
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45, // Duração padrão de 45 minutos para treinos
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1,
      },
    },
    trainingSeriesId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Permite treinos únicos que não pertencem a uma série
      references: {
        model: 'TrainingSeries', // Nome da tabela TrainingSeries
        key: 'id',
      },
      onDelete: 'CASCADE', // Se a série for apagada, as instâncias também são (ou SET NULL, dependendo da lógica)
    },
    isGeneratedInstance: { // Flag para identificar facilmente instâncias geradas
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
  }, {
    tableName: 'trainings',
    timestamps: true,
  });

  Training.associate = (models) => {
    Training.belongsToMany(models.User, {
      through: 'UserTrainings',
      foreignKey: 'trainingId',
      otherKey: 'userId',
      as: 'participants', // Adicionado alias para clareza
    });
    // A associação User.belongsToMany(models.Training, ...) já deve estar no User.js

    Training.belongsTo(models.Staff, {
      foreignKey: 'instructorId',
      allowNull: false,
      as: 'instructor',
    });

    /*Training.hasMany(models.WorkoutPlan, {
      foreignKey: 'trainingId',
      as: 'workoutPlans', // training.getWorkoutPlans()
      onDelete: 'CASCADE', // Se o treino for apagado, os seus planos também
    });*/

    Training.belongsToMany(models.WorkoutPlan, {
      through: models.TrainingWorkoutPlan,
      foreignKey: 'trainingId',
      otherKey: 'workoutPlanId',
      as: 'workoutPlans'
    });

    Training.hasMany(models.TrainingWaitlist, {
      foreignKey: 'trainingId',
      as: 'waitlistEntries', // training.getWaitlistEntries()
      onDelete: 'CASCADE', // Se o treino for apagado, todas as suas entradas na lista de espera são apagadas
    });

    Training.hasMany(models.ClientExercisePerformance, {
      foreignKey: 'trainingId',
      as: 'clientPerformances', // training.getClientPerformances()
      onDelete: 'CASCADE',
    });

    Training.belongsTo(models.TrainingSeries, {
      foreignKey: 'trainingSeriesId',
      as: 'series',
    });
    // A associação Staff.hasMany(models.Training, ...) já deve estar no Staff.js
  };

  return Training;
};
