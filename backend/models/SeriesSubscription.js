// backend/models/SeriesSubscription.js
module.exports = (sequelize, DataTypes) => {
  const SeriesSubscription = sequelize.define('SeriesSubscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: { // ID do cliente que se inscreve
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // Nome da tabela de Users
        key: 'id',
      },
    },
    trainingSeriesId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'TrainingSeries', // Nome da tabela TrainingSeries
        key: 'id',
      },
    },
    clientSubscriptionStartDate: { // Data de início da subscrição do cliente
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    clientSubscriptionEndDate: { // Data de fim da subscrição do cliente
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    isActive: { // Para desativar uma subscrição sem a apagar
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    // Evitar que um utilizador se inscreva múltiplas vezes na mesma série ativamente
    indexes: [
        {
            unique: true,
            fields: ['userId', 'trainingSeriesId'],
            where: { isActive: true } // Apenas uma subscrição ativa por utilizador por série
        }
    ]
  });

  SeriesSubscription.associate = (models) => {
    SeriesSubscription.belongsTo(models.User, { as: 'client', foreignKey: 'userId' });
    SeriesSubscription.belongsTo(models.TrainingSeries, { as: 'trainingSeries', foreignKey: 'trainingSeriesId' });
  };

  return SeriesSubscription;
};