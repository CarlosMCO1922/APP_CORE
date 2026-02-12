-- Migração: Adicionar tabela training_sessions e campo sessionId em client_exercise_performances
-- Data: 2026-02-02
-- Descrição: Implementa sistema de sessões de treino permanentes

-- 1. Criar tabela training_sessions
CREATE TABLE IF NOT EXISTS training_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_id INTEGER REFERENCES trainings(id) ON DELETE SET NULL,
  workout_plan_id INTEGER NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  total_duration_seconds INTEGER,
  total_volume DECIMAL(10,2),
  total_sets INTEGER,
  completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  notes TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON training_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_sessions_workout_plan ON training_sessions(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_workout_plan ON training_sessions(user_id, workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON training_sessions(user_id, completed_at);

-- 3. Adicionar sessionId a client_exercise_performances
ALTER TABLE client_exercise_performances 
ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES training_sessions(id) ON DELETE SET NULL;

-- 4. Criar índice para sessionId
CREATE INDEX IF NOT EXISTS idx_performance_session_id ON client_exercise_performances(session_id);

-- 5. Comentários para documentação
COMMENT ON TABLE training_sessions IS 'Sessões de treino concluídas permanentemente';
COMMENT ON COLUMN training_sessions.start_time IS 'Timestamp em milissegundos do início';
COMMENT ON COLUMN training_sessions.end_time IS 'Timestamp em milissegundos do fim';
COMMENT ON COLUMN training_sessions.total_volume IS 'Soma de (peso × reps) de todas as séries';
COMMENT ON COLUMN training_sessions.metadata IS 'PRs batidos, sensações, dados extra em JSON';
COMMENT ON COLUMN client_exercise_performances.session_id IS 'Referência à sessão de treino completa';
