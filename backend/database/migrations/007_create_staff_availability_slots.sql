-- 007_create_staff_availability_slots.sql
-- Disponibilidade por blocos de 30 minutos (08:00-20:00) para marcações de consultas.
-- Guarda blocos disponíveis por staff e por dia; se não existir configuração, aplica defaults.

CREATE TABLE IF NOT EXISTS staff_availability_slots (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time VARCHAR(5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT staff_availability_slots_unique UNIQUE (staff_id, date, time)
);

CREATE INDEX IF NOT EXISTS idx_staff_availability_slots_staff_date
  ON staff_availability_slots (staff_id, date);

