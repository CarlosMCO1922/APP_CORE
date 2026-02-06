-- Colunas e enum para reagendamento de inscrição em treino experimental (proposta + confirmação pelo visitante).
-- PostgreSQL
-- Nota: O nome do tipo enum pode ser enum_training_guest_signups_status (Sequelize). Se falhar, verifica com: SELECT typname FROM pg_type WHERE typtype = 'e';

DO $$
BEGIN
  ALTER TYPE enum_training_guest_signups_status ADD VALUE 'RESCHEDULE_PROPOSED';
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$$;

ALTER TABLE training_guest_signups
  ADD COLUMN IF NOT EXISTS proposed_training_id INTEGER REFERENCES trainings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reschedule_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS reschedule_token_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_training_guest_signups_reschedule_token ON training_guest_signups(reschedule_token) WHERE reschedule_token IS NOT NULL;
