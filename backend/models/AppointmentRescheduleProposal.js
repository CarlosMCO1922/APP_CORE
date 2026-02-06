// backend/models/AppointmentRescheduleProposal.js
// Proposta de reagendamento enviada ao cliente/visitante; confirmação via link no email.
const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const AppointmentRescheduleProposal = sequelize.define('AppointmentRescheduleProposal', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'appointments', key: 'id' },
      onDelete: 'CASCADE',
      field: 'appointment_id',
    },
    proposedDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'proposed_date',
    },
    proposedTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'proposed_time',
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'used_at',
    },
  }, {
    tableName: 'appointment_reschedule_proposals',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['token'] }, { fields: ['appointmentId'] }],
  });

  AppointmentRescheduleProposal.associate = (models) => {
    AppointmentRescheduleProposal.belongsTo(models.Appointment, {
      foreignKey: 'appointmentId',
      as: 'appointment',
    });
  };

  AppointmentRescheduleProposal.generateToken = () =>
    crypto.randomBytes(32).toString('hex');

  return AppointmentRescheduleProposal;
};
