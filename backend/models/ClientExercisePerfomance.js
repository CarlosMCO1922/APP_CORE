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
    planExerciseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'workout_plan_exercises', 
      },
      onDelete: 'CASCADE',
    },
    performedAt: { 
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    setNumber: { 
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    performedReps: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    performedWeight: {
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: true,
    },
    performedDurationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: { 
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // TEMPORARIAMENTE COMENTADO - Coluna não existe na BD ainda
    // Descomentar após executar migração: node backend/database/addMaterialUsedColumn.js
    // materialUsed: {
    //   type: DataTypes.TEXT,
    //   allowNull: true,
    //   comment: 'Material/equipamento usado pelo cliente (ex.: Haltere 12kg). Mostrado na próxima vez como "Da última vez usaste: ..."',
    // },
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
      as: 'planExerciseDetails', 
    });
  };

  return ClientExercisePerformance;
};