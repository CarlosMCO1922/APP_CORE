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
        model: 'staff', 
        key: 'id',
      },
    },
    recurrenceType: {
      type: DataTypes.STRING, 
      allowNull: false,
      defaultValue: 'weekly',
      comment: 'Tipo de recorrência: diária, semanal, mensal (controlado pela aplicação)',
      validate: { 
        isIn: {
          args: [['daily', 'weekly', 'monthly']],
          msg: "Valor inválido para recurrenceType. Deve ser 'daily', 'weekly', ou 'monthly'."
        }
      }
    },
    dayOfWeek: {
      type: DataTypes.INTEGER, 
      allowNull: true, 
      comment: 'Dia da semana (0-Dom, 1-Seg, ...), relevante para semanal/mensal',
    },
    startTime: { 
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: { 
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
  });

  TrainingSeries.associate = (models) => {
    TrainingSeries.hasMany(models.Training, {
      foreignKey: 'trainingSeriesId',
      as: 'instances',
      onDelete: 'CASCADE',
    });
    TrainingSeries.belongsTo(models.Staff, { 
      as: 'instructor',
      foreignKey: 'instructorId'
    });
    TrainingSeries.hasMany(models.SeriesSubscription, {
        foreignKey: 'trainingSeriesId',
        as: 'subscriptions'
    });
  };

  return TrainingSeries;
};