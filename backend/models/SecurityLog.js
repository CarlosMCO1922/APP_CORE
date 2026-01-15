// backend/models/SecurityLog.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SecurityLog = sequelize.define('SecurityLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do utilizador (pode ser null se não autenticado)',
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tipo de evento: UNAUTHORIZED_ACCESS_ATTEMPT, ROLE_MISMATCH, TOKEN_TAMPERING, etc.',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Descrição detalhada do evento de segurança',
    },
    attemptedRole: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Role que o utilizador tentou usar (se aplicável)',
    },
    actualRole: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Role real do utilizador (se autenticado)',
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Endereço IP do cliente',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent do navegador',
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL que foi acedida',
    },
    severity: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
      allowNull: false,
      defaultValue: 'MEDIUM',
      comment: 'Severidade do evento de segurança',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Dados adicionais em formato JSON',
    },
  }, {
    tableName: 'security_logs',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['eventType'] },
      { fields: ['severity'] },
      { fields: ['createdAt'] },
    ],
  });

  SecurityLog.associate = (models) => {
    SecurityLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'SET NULL',
    });
  };

  return SecurityLog;
};
