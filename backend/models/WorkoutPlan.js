// backend/models/WorkoutPlan.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkoutPlan = sequelize.define('WorkoutPlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, 
      comment: 'Indica se o plano de treino é visível para os clientes na biblioteca de planos.'
    },
  }, {
    tableName: 'workout_plans',
    timestamps: true,
  });

  WorkoutPlan.associate = (models) => {

    WorkoutPlan.belongsToMany(models.Training, {
      through: models.TrainingWorkoutPlan,
      foreignKey: 'workoutPlanId',
      otherKey: 'trainingId',
      as: 'trainingSessions'
    });

    WorkoutPlan.hasMany(models.WorkoutPlanExercise, {
      foreignKey: 'workoutPlanId',
      as: 'planExercises', 
      onDelete: 'CASCADE', 
    });

    WorkoutPlan.hasMany(models.ClientExercisePerformance, {
      foreignKey: 'workoutPlanId',
      as: 'clientPerformances', 
      onDelete: 'CASCADE',
    });
  };

  return WorkoutPlan;
};