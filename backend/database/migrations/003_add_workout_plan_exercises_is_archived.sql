-- 003_add_workout_plan_exercises_is_archived.sql
-- Soft-delete para exercícios do plano, para preservar histórico de performances.
-- Evita que updates/remover exercícios apaguem logs via FK ON DELETE CASCADE.

ALTER TABLE workout_plan_exercises
  ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT FALSE;

