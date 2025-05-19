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
      unique: true, // Para evitar exercícios duplicados com o mesmo nome
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING, // URL para uma imagem
      allowNull: true,
    },
    videoUrl: {
      type: DataTypes.STRING, // URL para um vídeo (ex: YouTube, Vimeo)
      allowNull: true,
    },
    muscleGroup: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Podes adicionar mais campos como 'equipmentNeeded', 'difficultyLevel', etc.
  }, {
    tableName: 'exercises',
    timestamps: true,
  });

  Exercise.associate = (models) => {
    // Um exercício pode estar em muitos WorkoutPlanExercises
    Exercise.hasMany(models.WorkoutPlanExercise, {
      foreignKey: 'exerciseId',
      as: 'planInstances',
    });
  };

  return Exercise;
};