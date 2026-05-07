-- 005_harden_client_exercise_performances_fks.sql
-- Evitar perda de histórico: trocar FKs destrutivas (CASCADE) por SET NULL
-- e permitir NULL em workoutPlan / planExercise nos logs.

DO $$
DECLARE
  plan_col TEXT;
  plan_ex_col TEXT;
  fk_name TEXT;
BEGIN
  -- Detectar nomes de colunas na client_exercise_performances
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_exercise_performances' AND column_name='workout_plan_id') THEN
    plan_col := 'workout_plan_id';
  ELSE
    plan_col := 'workoutPlanId';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_exercise_performances' AND column_name='plan_exercise_id') THEN
    plan_ex_col := 'plan_exercise_id';
  ELSE
    plan_ex_col := 'planExerciseId';
  END IF;

  -- Garantir que as colunas aceitam NULL
  EXECUTE format('ALTER TABLE client_exercise_performances ALTER COLUMN %I DROP NOT NULL', plan_col);
  EXECUTE format('ALTER TABLE client_exercise_performances ALTER COLUMN %I DROP NOT NULL', plan_ex_col);

  -- Remover FK existente para workout_plans (se existir)
  SELECT c.conname INTO fk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'client_exercise_performances'
    AND c.contype = 'f'
    AND pg_get_constraintdef(c.oid) ILIKE '%REFERENCES workout_plans%';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE client_exercise_performances DROP CONSTRAINT %I', fk_name);
  END IF;

  -- Recriar FK para workout_plans com SET NULL
  EXECUTE format(
    'ALTER TABLE client_exercise_performances
       ADD CONSTRAINT client_exercise_performances_%s_fkey
       FOREIGN KEY (%I) REFERENCES workout_plans(id) ON DELETE SET NULL',
    plan_col,
    plan_col
  );

  -- Remover FK existente para workout_plan_exercises (se existir)
  fk_name := NULL;
  SELECT c.conname INTO fk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'client_exercise_performances'
    AND c.contype = 'f'
    AND pg_get_constraintdef(c.oid) ILIKE '%REFERENCES workout_plan_exercises%';

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE client_exercise_performances DROP CONSTRAINT %I', fk_name);
  END IF;

  -- Recriar FK para workout_plan_exercises com SET NULL
  EXECUTE format(
    'ALTER TABLE client_exercise_performances
       ADD CONSTRAINT client_exercise_performances_%s_fkey
       FOREIGN KEY (%I) REFERENCES workout_plan_exercises(id) ON DELETE SET NULL',
    plan_ex_col,
    plan_ex_col
  );
END $$;

