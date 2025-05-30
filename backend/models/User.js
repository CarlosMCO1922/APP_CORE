// backend/models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  User.associate = (models) => {
    // Um User pode estar inscrito em vários Trainings
    User.belongsToMany(models.Training, {
      through: 'UserTrainings', // Nome da tabela de junção
      foreignKey: 'userId',    // Chave estrangeira em UserTrainings que referencia User
      otherKey: 'trainingId',  // Chave estrangeira em UserTrainings que referencia Training
      as: 'trainings',
    });
    // Um User pode ter várias Appointments (consultas)
    User.hasMany(models.Appointment, {
      foreignKey: 'userId', // Chave estrangeira em Appointment que referencia User
      as: 'appointments',
    });
  };

  User.hasMany(models.TrainingWaitlist, {
      foreignKey: 'userId',
      as: 'waitlistEntries', // user.getWaitlistEntries()
      onDelete: 'CASCADE', // Se o user for apagado, as suas entradas na lista de espera são apagadas
    });

  return User;
};
