// backend/models/Staff.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Staff = sequelize.define('Staff', {
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
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'employee', // Pode ser 'admin', 'trainer', 'physiotherapist'
    },
  }, {
    tableName: 'staff',
    timestamps: true,
  });

  Staff.associate = (models) => {
    // Associação: Um Staff (instrutor) pode ministrar vários Trainings
    Staff.hasMany(models.Training, {
      foreignKey: 'instructorId',
      as: 'trainingsAsInstructor', 
    });
    // A contraparte (Training.belongsTo(Staff)) está definida em Training.js

    // Associação: Um Staff (profissional) pode ter várias Appointments (consultas)
    // Esta é a única definição desta associação com este alias.
    Staff.hasMany(models.Appointment, {
      foreignKey: 'staffId', 
      as: 'appointmentsAsProfessional', 
    });
    // A contraparte (Appointment.belongsTo(Staff)) está definida em Appointment.js
  };

  return Staff;
};
