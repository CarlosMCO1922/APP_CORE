// backend/models/ClientExercisePerformance.js
module.exports = (sequelize, DataTypes) => {
  const ClientExercisePerformance = sequelize.define('ClientExercisePerformance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Nome da tabela 'users'
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    trainingId: { // O treino específico onde o plano foi realizado
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trainings', // Nome da tabela 'trainings'
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    workoutPlanId: { // O plano de treino dentro do treino
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'workout_plans', // Nome da tabela 'workout_plans' (verifique o nome real da sua tabela)
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    planExerciseId: { // O exercício específico do WorkoutPlanExercise
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'workout_plan_exercises', // Nome da tabela 'workout_plan_exercises' (verifique o nome real)
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    performedAt: { // Data em que o exercício foi realizado/logado
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    setNumber: { // Número da série, se estiver a registar por série (opcional)
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    performedReps: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    performedWeight: {
      type: DataTypes.DECIMAL(10, 2), // Ex: 100.50
      allowNull: true,
    },
    performedDurationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: { // Notas do cliente sobre esta performance específica
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'client_exercise_performances',
    timestamps: true,
  });

  ClientExercisePerformance.associate = (models) => {
    ClientExercisePerformance.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    ClientExercisePerformance.belongsTo(models.Training, {
      foreignKey: 'trainingId',
      as: 'training',
    });
    ClientExercisePerformance.belongsTo(models.WorkoutPlan, {
      foreignKey: 'workoutPlanId',
      as: 'workoutPlan',
    });
    ClientExercisePerformance.belongsTo(models.WorkoutPlanExercise, {
      foreignKey: 'planExerciseId',
      as: 'planExerciseDetails', // Para aceder aos detalhes do exercício no plano
    });
  };

  return ClientExercisePerformance;
};