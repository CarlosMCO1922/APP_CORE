// backend/models/Exercise.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Exercise = sequelize.define('Exercise', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, 
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    videoUrl: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    muscleGroup: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'exercises',
    timestamps: true,
  });

  Exercise.associate = (models) => {
    Exercise.hasMany(models.WorkoutPlanExercise, {
      foreignKey: 'exerciseId',
      as: 'planInstances',
    });
  };

  return Exercise;
};