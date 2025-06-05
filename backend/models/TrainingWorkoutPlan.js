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
      references: { model: 'trainings', key: 'id' }, // Garante que 'trainings' é o nome correto da tua tabela Training
    },
    workoutPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'workout_plans', key: 'id' }, // Garante que 'workout_plans' é o nome correto
    },
    orderInTraining: { // A COLUNA QUE ESTÁ A FALTAR
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }
  }, {
    tableName: 'TrainingWorkoutPlans', // Define explicitamente o nome da tabela
    timestamps: false, // Geralmente não precisamos de timestamps numa tabela de junção simples
    // Garante que não há conflito de nome se o Sequelize tentar criar com outro nome
  });

  // Não são necessárias associações aqui se os modelos Training e WorkoutPlan já
  // definem a belongsToMany relationship usando este modelo como 'through'.
  // TrainingWorkoutPlan.associate = (models) => {
  //   // TrainingWorkoutPlan.belongsTo(models.Training, { foreignKey: 'trainingId' });
  //   // TrainingWorkoutPlan.belongsTo(models.WorkoutPlan, { foreignKey: 'workoutPlanId' });
  // };

  return TrainingWorkoutPlan;
};