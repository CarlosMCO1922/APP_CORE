// backend/models/WorkoutPlan.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WorkoutPlan = sequelize.define('WorkoutPlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { // Nome do plano parcial, ex: "Aquecimento", "Circuito A", "Alongamentos"
      type: DataTypes.STRING,
      allowNull: false, 
    },
    order: { // Para ordenar os múltiplos planos dentro de um Training
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // trainingId será adicionado via associação
  }, {
    tableName: 'workout_plans',
    timestamps: true,
  });

  WorkoutPlan.associate = (models) => {
    // Um WorkoutPlan (parcial) pertence a UM Training
    WorkoutPlan.belongsTo(models.Training, {
      foreignKey: {
        name: 'trainingId',
        allowNull: false,
      },
      as: 'trainingSession', // Um plano pertence a uma sessão de treino
    });

    // Um WorkoutPlan tem muitos WorkoutPlanExercises (detalhes dos exercícios neste plano)
    WorkoutPlan.hasMany(models.WorkoutPlanExercise, {
      foreignKey: 'workoutPlanId',
      as: 'planExercises', // workoutPlan.getPlanExercises()
      onDelete: 'CASCADE', 
    });
  };

  WorkoutPlan.hasMany(models.ClientExercisePerformance, {
      foreignKey: 'workoutPlanId',
      as: 'clientPerformances', // workoutPlan.getClientPerformances()
      onDelete: 'CASCADE',
    });

  return WorkoutPlan;
};