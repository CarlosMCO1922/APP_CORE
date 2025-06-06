// backend/models/SeriesSubscription.js
module.exports = (sequelize, DataTypes) => {
  const SeriesSubscription = sequelize.define('SeriesSubscription', {
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
    },
    trainingSeriesId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TrainingSeries', 
        key: 'id',
      },
    },
    clientSubscriptionStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    clientSubscriptionEndDate: { 
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    isActive: { 
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    indexes: [
        {
            unique: true,
            fields: ['userId', 'trainingSeriesId'],
            where: { isActive: true } 
        }
    ]
  });

  SeriesSubscription.associate = (models) => {
    SeriesSubscription.belongsTo(models.User, { as: 'client', foreignKey: 'userId' });
    SeriesSubscription.belongsTo(models.TrainingSeries, { as: 'trainingSeries', foreignKey: 'trainingSeriesId' });
  };

  return SeriesSubscription;
};