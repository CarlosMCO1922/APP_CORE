-- Script para corrigir a coluna severity na tabela error_logs
-- Execute este script manualmente na base de dados se necessário

-- Passo 1: Criar o tipo ENUM se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_error_logs_severity') THEN
        CREATE TYPE "public"."enum_error_logs_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;
END$$;

-- Passo 2: Se a coluna já existe como VARCHAR/TEXT, converter para ENUM
-- (Ajuste o tipo atual se necessário - verificar primeiro com: \d error_logs)
DO $$
BEGIN
    -- Verificar se a coluna severity existe e qual o tipo atual
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'error_logs' AND column_name = 'severity'
        AND data_type != 'USER-DEFINED'
    ) THEN
        -- Converter valores existentes para ENUM válido (se houver valores inválidos, usar 'MEDIUM' como padrão)
        ALTER TABLE "error_logs" 
        ALTER COLUMN "severity" TYPE "public"."enum_error_logs_severity" 
        USING CASE 
            WHEN severity::text IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') THEN severity::text::"public"."enum_error_logs_severity"
            ELSE 'MEDIUM'::"public"."enum_error_logs_severity"
        END;
    END IF;
END$$;

-- Passo 3: Definir constraints e defaults
ALTER TABLE "error_logs" 
ALTER COLUMN "severity" SET NOT NULL;

ALTER TABLE "error_logs" 
ALTER COLUMN "severity" SET DEFAULT 'MEDIUM';

-- Passo 4: Adicionar comentário (separado para evitar conflitos)
COMMENT ON COLUMN "error_logs"."severity" IS 'Severidade do erro';

