// backend/models/TrainingSeries.js
module.exports = (sequelize, DataTypes) => {
  const TrainingSeries = sequelize.define('TrainingSeries', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Ex: Treino de Spinning Semanal',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instructorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'staff', // Nome da tabela staff (confirma se é 'staff' ou 'Users' para instrutores)
        key: 'id',
      },
    },
    // NOVO CAMPO E AJUSTE EM dayOfWeek
    recurrenceType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false,
      defaultValue: 'weekly',
      comment: 'Tipo de recorrência: diária, semanal, mensal',
    },
    dayOfWeek: { // MODIFICADO
      type: DataTypes.INTEGER, // 0 (Dom) a 6 (Sáb)
      allowNull: true, // Nulo se recurrenceType for 'daily', ou para alguns tipos de 'monthly'
      comment: 'Dia da semana (0-Dom, 1-Seg, ...), relevante para semanal/mensal',
    },
    startTime: { // Ex: "18:00:00"
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: { // Ex: "19:00:00"
      type: DataTypes.TIME,
      allowNull: false,
    },
    seriesStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    seriesEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // OPCIONAL: Adicionar um workoutPlanId global para a série
    // workoutPlanId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: 'workout_plans', // Confirma o nome da tua tabela
    //     key: 'id',
    //   },
    // },
  });

  TrainingSeries.associate = (models) => {
    TrainingSeries.hasMany(models.Training, {
      foreignKey: 'trainingSeriesId',
      as: 'instances',
      onDelete: 'CASCADE',
    });
    TrainingSeries.belongsTo(models.Staff, { // Confirma se o modelo de instrutor é 'Staff'
      as: 'instructor',
      foreignKey: 'instructorId'
    });
    // if (models.WorkoutPlan && TrainingSeries.rawAttributes.workoutPlanId) { // Se adicionares workoutPlanId
    //   TrainingSeries.belongsTo(models.WorkoutPlan, { as: 'workoutPlan', foreignKey: 'workoutPlanId' });
    // }
    TrainingSeries.hasMany(models.SeriesSubscription, {
        foreignKey: 'trainingSeriesId',
        as: 'subscriptions'
    });
  };

  return TrainingSeries;
};