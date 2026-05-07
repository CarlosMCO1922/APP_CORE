-- 006_add_users_is_external_client.sql
-- Marcar clientes criados a partir de pagamentos (não são utilizadores/login).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "isExternalClient" BOOLEAN NOT NULL DEFAULT FALSE;

