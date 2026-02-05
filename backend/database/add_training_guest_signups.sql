-- Tabela de inscrições de visitantes (sem conta) em treinos experimentais.
-- Em desenvolvimento com sync(alter: true) o Sequelize pode criar automaticamente.

-- PostgreSQL
CREATE TABLE IF NOT EXISTS training_guest_signups (
  id SERIAL PRIMARY KEY,
  training_id INTEGER NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_email VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
  staff_approved_by_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_guest_signups_training_status ON training_guest_signups(training_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_guest_signups_training_email ON training_guest_signups(training_id, guest_email);
