// backend/models/Appointment.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME, // Formato HH:MM:SS
      allowNull: false,
    },
    durationMinutes: { // Duração da consulta em minutos
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60, // Duração padrão de 60 minutos para consultas
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        'disponível',
        'agendada',
        'concluída',
        'cancelada_pelo_cliente',
        'cancelada_pelo_staff',
        'não_compareceu',
        'pendente_aprovacao_staff',
        'rejeitada_pelo_staff',
      ),
      defaultValue: 'disponível',
      allowNull: false,
    }
  }, {
    tableName: 'appointments',
    timestamps: true,
  });

  Appointment.associate = (models) => {
    // Uma Consulta pertence a um Utilizador (cliente)
    Appointment.belongsTo(models.User, {
      foreignKey: 'userId', 
      as: 'client', // Alias para o cliente da consulta
      // allowNull: true, // Removido daqui, pois a FK pode ser nula por defeito se não especificado no define()
                       // e a lógica de ser nula ou não é gerida na criação da consulta.
    });
    // A contraparte User.hasMany(models.Appointment, { as: 'appointments' }) está em User.js

    // Uma Consulta pertence a um Staff (profissional)
    Appointment.belongsTo(models.Staff, {
      foreignKey: 'staffId', 
      allowNull: false,    // Uma consulta deve ter um profissional
      as: 'professional',  // Alias para o profissional da consulta
    });
    // A linha models.Staff.hasMany(models.Appointment, ...) foi REMOVIDA daqui,
    // pois essa associação é definida em Staff.js
  };

  return Appointment;
};
