-- Script para adicionar a coluna materialUsed à tabela client_exercise_performances (SQLite)
-- Esta coluna armazena o material/equipamento usado pelo cliente (ex.: Haltere 12kg)

-- SQLite não suporta IF NOT EXISTS para ALTER TABLE ADD COLUMN diretamente
-- Verificar se a coluna existe consultando sqlite_master
-- Se não existir, adicionar a coluna

-- NOTA: Em SQLite, para verificar se uma coluna existe, precisamos de usar PRAGMA table_info
-- Este script deve ser executado através de um script Node.js que verifica primeiro

-- Comando para adicionar a coluna (executar apenas se não existir):
-- ALTER TABLE client_exercise_performances ADD COLUMN materialUsed TEXT NULL;
