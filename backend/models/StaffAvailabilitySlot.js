// backend/models/StaffAvailabilitySlot.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StaffAvailabilitySlot = sequelize.define(
    'StaffAvailabilitySlot',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'staff_id',
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      time: {
        type: DataTypes.STRING(5),
        allowNull: false,
      },
    },
    {
      tableName: 'staff_availability_slots',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['staff_id', 'date', 'time'] }],
    }
  );

  StaffAvailabilitySlot.associate = (models) => {
    StaffAvailabilitySlot.belongsTo(models.Staff, {
      foreignKey: 'staffId',
      as: 'staff',
      onDelete: 'CASCADE',
    });
  };

  return StaffAvailabilitySlot;
};

