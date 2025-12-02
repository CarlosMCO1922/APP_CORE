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
    // --- NOVOS CAMPOS ADICIONADOS ---
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gdprConsent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    gdprConsentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // ---------------------------------
  }, {
    tableName: 'users',
    timestamps: true,
  });

  User.associate = (models) => {
    // ... as suas associações existentes mantêm-se aqui ...
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