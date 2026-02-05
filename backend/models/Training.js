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
      type: DataTypes.TIME, 
      allowNull: false,
    },
    durationMinutes: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45, 
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
      allowNull: true,
      references: {
        model: 'TrainingSeries', 
        key: 'id',
      },
      onDelete: 'CASCADE', 
    },
    isGeneratedInstance: {
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
      as: 'participants', 
    });
    

    Training.belongsTo(models.Staff, {
      foreignKey: 'instructorId',
      allowNull: false,
      as: 'instructor',
    });

    Training.belongsToMany(models.WorkoutPlan, {
      through: models.TrainingWorkoutPlan,
      foreignKey: 'trainingId',
      otherKey: 'workoutPlanId',
      as: 'workoutPlans'
    });

    Training.hasMany(models.TrainingWaitlist, {
      foreignKey: 'trainingId',
      as: 'waitlistEntries', 
      onDelete: 'CASCADE', 
    });

    Training.hasMany(models.ClientExercisePerformance, {
      foreignKey: 'trainingId',
      as: 'clientPerformances', 
      onDelete: 'CASCADE',
    });

    Training.belongsTo(models.TrainingSeries, {
      foreignKey: 'trainingSeriesId',
      as: 'series',
    });

    Training.hasMany(models.TrainingGuestSignup, {
      foreignKey: 'trainingId',
      as: 'guestSignups',
      onDelete: 'CASCADE',
    });
  };

  return Training;
};
