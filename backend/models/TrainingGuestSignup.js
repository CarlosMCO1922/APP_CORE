// backend/models/TrainingGuestSignup.js
// Inscrição de visitante (sem conta) num treino experimental. Pendente de aprovação do instrutor.
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrainingGuestSignup = sequelize.define('TrainingGuestSignup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    trainingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'trainings', key: 'id' },
      onDelete: 'CASCADE',
    },
    guestName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'guest_name',
    },
    guestEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'guest_email',
    },
    guestPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'guest_phone',
    },
    status: {
      type: DataTypes.ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RESCHEDULE_PROPOSED'),
      allowNull: false,
      defaultValue: 'PENDING_APPROVAL',
    },
    proposedTrainingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'trainings', key: 'id' },
      onDelete: 'SET NULL',
      field: 'proposed_training_id',
    },
    rescheduleToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      field: 'reschedule_token',
    },
    rescheduleTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reschedule_token_expires_at',
    },
    staffApprovedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'staff', key: 'id' },
      onDelete: 'SET NULL',
      field: 'staff_approved_by_id',
    },
  }, {
    tableName: 'training_guest_signups',
    timestamps: true,
    indexes: [
      { fields: ['trainingId', 'status'] },
      { fields: ['guestEmail', 'trainingId'], unique: true },
    ],
  });

  TrainingGuestSignup.associate = (models) => {
    TrainingGuestSignup.belongsTo(models.Training, {
      foreignKey: 'trainingId',
      as: 'training',
    });
    TrainingGuestSignup.belongsTo(models.Training, {
      foreignKey: 'proposedTrainingId',
      as: 'proposedTraining',
    });
    TrainingGuestSignup.belongsTo(models.Staff, {
      foreignKey: 'staffApprovedById',
      as: 'approvedBy',
    });
  };

  return TrainingGuestSignup;
};
