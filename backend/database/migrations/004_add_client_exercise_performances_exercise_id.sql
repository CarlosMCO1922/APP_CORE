-- 004_add_client_exercise_performances_exercise_id.sql
-- Guardar exercise_id diretamente nos logs para que o histórico não dependa de workout_plan_exercises.

ALTER TABLE client_exercise_performances
  ADD COLUMN IF NOT EXISTS exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL;

DO $$
DECLARE
  user_col TEXT;
  performed_col TEXT;
  plan_ex_col TEXT;
  wpe_ex_col TEXT;
BEGIN
  -- Detectar nomes de colunas (compatível com tabelas criadas via Sequelize ou via SQL)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_exercise_performances' AND column_name = 'user_id'
  ) THEN
    user_col := 'user_id';
  ELSE
    user_col := 'userId';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_exercise_performances' AND column_name = 'performed_at'
  ) THEN
    performed_col := 'performed_at';
  ELSE
    performed_col := 'performedAt';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_exercise_performances' AND column_name = 'plan_exercise_id'
  ) THEN
    plan_ex_col := 'plan_exercise_id';
  ELSE
    plan_ex_col := 'planExerciseId';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_plan_exercises' AND column_name = 'exercise_id'
  ) THEN
    wpe_ex_col := 'exercise_id';
  ELSE
    wpe_ex_col := 'exerciseId';
  END IF;

  -- Índice (usa os nomes corretos detectados)
  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS idx_performance_user_exercise_date ON client_exercise_performances (%I, exercise_id, %I DESC)',
    user_col,
    performed_col
  );

  -- Backfill (melhor esforço) para preencher exercise_id
  EXECUTE format(
    'UPDATE client_exercise_performances cep
     SET exercise_id = wpe.%I
     FROM workout_plan_exercises wpe
     WHERE cep.exercise_id IS NULL
       AND cep.%I = wpe.id',
    wpe_ex_col,
    plan_ex_col
  );
END $$;

