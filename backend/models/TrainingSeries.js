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
    instructorId: { // Instrutor responsável pela série (e instâncias, salvo override)
      type: DataTypes.INTEGER,
      allowNull: false, // Ou true se puder ser definido por instância
      references: {
        model: 'Users', // Nome da tabela de Users (confirme se é 'Users' ou 'Staffs')
        key: 'id',
      },
    },
    dayOfWeek: { // 0 para Domingo, 1 para Segunda, ..., 6 para Sábado
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Dia da semana (0-Domingo, 1-Segunda, ...)',
    },
    startTime: { // Ex: "18:00:00"
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: { // Ex: "19:00:00"
      type: DataTypes.TIME,
      allowNull: false,
    },
    seriesStartDate: { // Data de início da primeira ocorrência da série
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    seriesEndDate: { // Data de fim da última ocorrência da série
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    capacity: { // Capacidade de cada instância da série
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10, // Exemplo de default
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Adicione workoutPlanId se uma série tiver um plano fixo
    // workoutPlanId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: 'WorkoutPlans',
    //     key: 'id',
    //   },
    // },
  });

  TrainingSeries.associate = (models) => {
    TrainingSeries.hasMany(models.Training, { // Uma série tem muitas instâncias de treino
      foreignKey: 'trainingSeriesId',
      as: 'instances', // db.TrainingSeries.findAll({ include: 'instances' })
      onDelete: 'CASCADE', // Se apagar a série, apaga as instâncias
    });
    TrainingSeries.belongsTo(models.User, { // Assumindo que User é o modelo para instrutores
      as: 'instructor', 
      foreignKey: 'instructorId' 
    });
    // TrainingSeries.belongsTo(models.WorkoutPlan, { as: 'workoutPlan', foreignKey: 'workoutPlanId' });
    TrainingSeries.hasMany(models.SeriesSubscription, {
        foreignKey: 'trainingSeriesId',
        as: 'subscriptions'
    });
  };

  return TrainingSeries;
};