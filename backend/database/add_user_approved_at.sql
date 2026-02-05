-- Adiciona coluna approved_at à tabela users (contas pendentes de aprovação por admin).
-- Utilizadores existentes são considerados aprovados para não perderem acesso.
--
-- PostgreSQL: usar como está. SQLite: remover "IF NOT EXISTS" se a sua versão não suportar,
-- ou executar apenas: ALTER TABLE users ADD COLUMN approved_at DATETIME; UPDATE users SET approved_at = datetime('now') WHERE approved_at IS NULL;

-- PostgreSQL
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL;

-- SQLite (alternativa se não usar Postgres)
-- ALTER TABLE users ADD COLUMN approved_at DATETIME;

-- Aprovar todos os utilizadores existentes (retrocompatibilidade)
UPDATE users SET approved_at = COALESCE(approved_at, CURRENT_TIMESTAMP) WHERE approved_at IS NULL;
