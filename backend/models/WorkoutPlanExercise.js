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
    supersetGroup: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Agrupa exercícios. Exercícios com o mesmo supersetGroup são um superset (1, 2, 3...).'
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
      as: 'clientPerformances',
      onDelete: 'CASCADE',
    });
  };

  return WorkoutPlanExercise;
};