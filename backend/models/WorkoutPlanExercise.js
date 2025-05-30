// backend/models/WorkoutPlanExercise.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkoutPlanExercise = sequelize.define('WorkoutPlanExercise', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sets: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reps: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    restSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: 'workout_plan_exercises',
    timestamps: false, 
  });

  WorkoutPlanExercise.associate = (models) => {
    WorkoutPlanExercise.belongsTo(models.WorkoutPlan, {
      foreignKey: { name: 'workoutPlanId', allowNull: false, },
      as: 'plan',
    });
    WorkoutPlanExercise.belongsTo(models.Exercise, {
      foreignKey: { name: 'exerciseId', allowNull: false, },
      as: 'exerciseDetails',
    });

    WorkoutPlanExercise.hasMany(models.ClientExercisePerformance, {
      foreignKey: 'planExerciseId',
      as: 'clientPerformances', // workoutPlanExercise.getClientPerformances()
      onDelete: 'CASCADE',
    });
  };

  return WorkoutPlanExercise;
};