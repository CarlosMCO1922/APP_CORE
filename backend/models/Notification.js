// backend/models/Notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    recipientUserId: { 
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', 
        key: 'id',
      },
      onDelete: 'CASCADE', 
    },
    recipientStaffId: { 
      type: DataTypes.INTEGER,
      allowNull: true, 
      references: {
        model: 'staff', 
        key: 'id',
      },
      onDelete: 'CASCADE', 
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: { 
      type: DataTypes.STRING,
      allowNull: true, 
    },
    relatedResourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedResourceType: { 
      type: DataTypes.STRING,
      allowNull: true,
    },
    link: { 
      type: DataTypes.STRING,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['recipientUserId'] },
      { fields: ['recipientStaffId'] },
      { fields: ['isRead'] },
      { fields: ['createdAt'] },
    ],
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'recipientUserId',
      as: 'recipientUser', 
    });
    Notification.belongsTo(models.Staff, {
      foreignKey: 'recipientStaffId',
      as: 'recipientStaff', 
    });
  };

  return Notification;
};