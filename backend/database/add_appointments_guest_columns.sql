-- Colunas para visitantes (pedidos de consulta sem conta).
-- Em desenvolvimento com sync(alter: true) o Sequelize pode adicionar automaticamente.

-- PostgreSQL
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255) NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255) NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(255) NULL;

-- SQLite (alternativa): descomentar se não usar Postgres
-- ALTER TABLE appointments ADD COLUMN guest_name TEXT;
-- ALTER TABLE appointments ADD COLUMN guest_email TEXT;
-- ALTER TABLE appointments ADD COLUMN guest_phone TEXT;
