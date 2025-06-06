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
    User.belongsToMany(models.Training, {
      through: 'UserTrainings', 
      foreignKey: 'userId',    
      otherKey: 'trainingId',  
      as: 'trainings',
    });
    
    User.hasMany(models.Appointment, {
      foreignKey: 'userId', 
      as: 'appointments',
    });
    User.hasMany(models.TrainingWaitlist, {
      foreignKey: 'userId',
      as: 'waitlistEntries', 
      onDelete: 'CASCADE', 
    });
    User.hasMany(models.ClientExercisePerformance, {
      foreignKey: 'userId',
      as: 'exercisePerformances', 
      onDelete: 'CASCADE',
});
  };

  return User;
};
