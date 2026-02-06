-- Tabela de propostas de reagendamento de consulta (link de confirmação no email).
-- PostgreSQL
CREATE TABLE IF NOT EXISTS appointment_reschedule_proposals (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_reschedule_proposals_token ON appointment_reschedule_proposals(token);
CREATE INDEX IF NOT EXISTS idx_appointment_reschedule_proposals_appointment_id ON appointment_reschedule_proposals(appointment_id);
