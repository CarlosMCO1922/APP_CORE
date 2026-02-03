// Script Node.js para adicionar a coluna materialUsed à tabela client_exercise_performances
// Funciona tanto para PostgreSQL quanto SQLite

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addMaterialUsedColumn() {
  try {
    const dialect = sequelize.getDialect();
    console.log(`Detetado dialect: ${dialect}`);

    if (dialect === 'postgres') {
      // PostgreSQL
      console.log('A verificar se a coluna materialUsed existe (PostgreSQL)...');
      
      const columnExists = await sequelize.query(
        `SELECT 1 
         FROM information_schema.columns 
         WHERE table_name = 'client_exercise_performances' 
         AND column_name = 'materialUsed'`,
        { type: QueryTypes.SELECT }
      );

      if (columnExists.length > 0) {
        console.log('✓ Coluna materialUsed já existe na tabela client_exercise_performances');
        return;
      }

      console.log('A adicionar coluna materialUsed (PostgreSQL)...');
      await sequelize.query(`
        ALTER TABLE client_exercise_performances 
        ADD COLUMN "materialUsed" TEXT NULL;
      `);

      await sequelize.query(`
        COMMENT ON COLUMN client_exercise_performances."materialUsed" IS 
        'Material/equipamento usado pelo cliente (ex.: Haltere 12kg). Mostrado na próxima vez como "Da última vez usaste: ..."';
      `);

      console.log('✓ Coluna materialUsed adicionada com sucesso (PostgreSQL)');

    } else if (dialect === 'sqlite') {
      // SQLite
      console.log('A verificar se a coluna materialUsed existe (SQLite)...');
      
      const tableInfo = await sequelize.query(
        `PRAGMA table_info(client_exercise_performances)`,
        { type: QueryTypes.SELECT }
      );

      const columnExists = tableInfo.some(col => col.name === 'materialUsed');

      if (columnExists) {
        console.log('✓ Coluna materialUsed já existe na tabela client_exercise_performances');
        return;
      }

      console.log('A adicionar coluna materialUsed (SQLite)...');
      await sequelize.query(`
        ALTER TABLE client_exercise_performances 
        ADD COLUMN materialUsed TEXT NULL;
      `);

      console.log('✓ Coluna materialUsed adicionada com sucesso (SQLite)');

    } else {
      throw new Error(`Dialect não suportado: ${dialect}`);
    }

  } catch (error) {
    console.error('✗ Erro ao adicionar coluna materialUsed:', error.message);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addMaterialUsedColumn()
    .then(() => {
      console.log('\n✓ Migração concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Erro na migração:', error);
      process.exit(1);
    });
}

module.exports = addMaterialUsedColumn;
