// backend/models/TrainingWorkoutPlan.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrainingWorkoutPlan = sequelize.define('TrainingWorkoutPlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    trainingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'trainings', key: 'id' }, 
    },
    workoutPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'workout_plans', key: 'id' },
    },
    orderInTraining: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }
  }, {
    tableName: 'TrainingWorkoutPlans', 
    timestamps: false,
  });
  return TrainingWorkoutPlan;
};