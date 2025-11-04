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
      type: DataTypes.TIME, 
      allowNull: false,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'FISIOTERAPIA',
      comment: 'Distingue entre uma consulta de fisioterapia e uma sessão de PT individual',
      validate: {
        isIn: {
          args: [['FISIOTERAPIA', 'PT_INDIVIDUAL']],
          msg: "A categoria deve ser 'FISIOTERAPIA' ou 'PT_INDIVIDUAL'"
        }
      }
    },
    status: {
      type: DataTypes.ENUM(
        'disponível',
        'agendada', 
        'confirmada', 
        'concluída',
        'cancelada_pelo_cliente',
        'cancelada_pelo_staff',
        'não_compareceu',
        'pendente_aprovacao_staff', 
        'rejeitada_pelo_staff'
      ),
      defaultValue: 'disponível',
      allowNull: false,
    },
    totalCost: { 
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true, 
    },
    signalPaid: { 
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    tableName: 'appointments',
    timestamps: true,
    indexes: [
      { fields: ['staffId', 'date'] },
      { fields: ['userId', 'date'] },
      { fields: ['status'] },
    ],
  });

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'client',
    });
    Appointment.belongsTo(models.Staff, {
      foreignKey: 'staffId',
      allowNull: false,
      as: 'professional',
    });
  };

  return Appointment;
};