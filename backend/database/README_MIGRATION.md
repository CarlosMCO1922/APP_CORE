# Migração: Adicionar coluna materialUsed

## Problema
A coluna `materialUsed` está definida no modelo Sequelize mas não existe na base de dados, causando erros ao tentar gravar treinos.

## Solução

### Opção 1: Executar script Node.js (Recomendado)
```bash
cd backend
node database/addMaterialUsedColumn.js
```

Este script:
- Detecta automaticamente se está a usar PostgreSQL ou SQLite
- Verifica se a coluna já existe
- Adiciona a coluna apenas se necessário
- Funciona tanto em desenvolvimento quanto em produção

### Opção 2: Executar SQL manualmente

#### Para PostgreSQL (Produção):
```sql
-- Verificar se já existe
SELECT 1 
FROM information_schema.columns 
WHERE table_name = 'client_exercise_performances' 
AND column_name = 'materialUsed';

-- Se não existir, executar:
ALTER TABLE client_exercise_performances 
ADD COLUMN "materialUsed" TEXT NULL;

COMMENT ON COLUMN client_exercise_performances."materialUsed" IS 
'Material/equipamento usado pelo cliente (ex.: Haltere 12kg). Mostrado na próxima vez como "Da última vez usaste: ..."';
```

#### Para SQLite (Desenvolvimento):
```sql
-- Verificar se já existe
PRAGMA table_info(client_exercise_performances);

-- Se não existir, executar:
ALTER TABLE client_exercise_performances 
ADD COLUMN materialUsed TEXT NULL;
```

## Verificação
Após executar a migração, verifique se a coluna foi adicionada:

**PostgreSQL:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'client_exercise_performances' 
AND column_name = 'materialUsed';
```

**SQLite:**
```sql
PRAGMA table_info(client_exercise_performances);
```

## Nota
O código foi atualizado para ser resiliente: se a coluna não existir, o sistema vai tentar gravar sem o campo `materialUsed` e mostrar um aviso. No entanto, é recomendado executar a migração para ter a funcionalidade completa.
