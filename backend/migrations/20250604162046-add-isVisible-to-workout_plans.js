'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('workout_plans', 'isVisible', { // Confirma se o nome da tabela é 'workout_plans'
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, // IMPORTANTE: Deve corresponder ao defaultValue no teu modelo
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('workout_plans', 'isVisible');
    // Se estiveres a usar PostgreSQL e o tipo ENUM no futuro, poderias ter que remover o tipo aqui também.
    // Para BOOLEAN, isto é suficiente.
  }
};