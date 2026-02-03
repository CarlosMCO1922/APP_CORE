-- Script para adicionar a coluna materialUsed à tabela client_exercise_performances
-- Esta coluna armazena o material/equipamento usado pelo cliente (ex.: Haltere 12kg)

-- Verificar se a coluna já existe antes de adicionar (PostgreSQL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'client_exercise_performances' 
        AND column_name = 'materialUsed'
    ) THEN
        ALTER TABLE client_exercise_performances 
        ADD COLUMN "materialUsed" TEXT NULL;
        
        COMMENT ON COLUMN client_exercise_performances."materialUsed" IS 
        'Material/equipamento usado pelo cliente (ex.: Haltere 12kg). Mostrado na próxima vez como "Da última vez usaste: ..."';
        
        RAISE NOTICE 'Coluna materialUsed adicionada com sucesso à tabela client_exercise_performances';
    ELSE
        RAISE NOTICE 'Coluna materialUsed já existe na tabela client_exercise_performances';
    END IF;
END $$;
