// backend/models/ErrorLog.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ErrorLog = sequelize.define('ErrorLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      comment: 'ID do utilizador (pode ser null se erro ocorreu antes de login)',
    },
    errorType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tipo de erro: JS_ERROR, API_ERROR, VALIDATION_ERROR, NETWORK_ERROR, etc.',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Mensagem de erro',
    },
    stackTrace: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Stack trace completo do erro',
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL onde o erro ocorreu',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent do navegador',
    },
    deviceInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Informações do dispositivo (mobile/desktop, OS, browser)',
    },
    severity: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
      allowNull: false,
      defaultValue: 'MEDIUM',
      // Removido comment daqui para evitar problemas na migração do Sequelize
      // O comment pode ser adicionado manualmente via SQL se necessário
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Dados adicionais em formato JSON (contexto, estado da aplicação, etc.)',
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Se o erro foi resolvido/marcado como visto',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data em que o erro foi marcado como resolvido',
    },
    resolvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'staff',
        key: 'id',
      },
      comment: 'ID do staff que resolveu o erro',
    },
  }, {
    tableName: 'error_logs',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['errorType'] },
      { fields: ['severity'] },
      { fields: ['resolved'] },
      { fields: ['createdAt'] },
    ],
  });

  ErrorLog.associate = (models) => {
    ErrorLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'SET NULL',
    });
    ErrorLog.belongsTo(models.Staff, {
      foreignKey: 'resolvedBy',
      as: 'resolver',
      onDelete: 'SET NULL',
    });
  };

  return ErrorLog;
};
