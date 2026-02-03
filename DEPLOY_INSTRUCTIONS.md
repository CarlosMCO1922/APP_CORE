# Instruções de Deploy - Correção materialUsed

## ⚠️ IMPORTANTE: Passos Necessários

### 1. Fazer Push do Código
```bash
git add .
git commit -m "Fix: Adicionar suporte para coluna materialUsed e migração"
git push origin main
```

O Render vai fazer deploy automaticamente após o push.

### 2. Executar Migração no Render (OBRIGATÓRIO)

**Opção A: Via Shell do Render (Recomendado)**

1. Acede ao dashboard do Render: https://dashboard.render.com
2. Seleciona o teu serviço backend
3. Vai a **"Shell"** no menu lateral
4. Executa:
```bash
cd backend
node database/addMaterialUsedColumn.js
```

**Opção B: Via SSH (se configurado)**

Se tiveres SSH configurado no Render:
```bash
ssh <user>@<render-host>
cd backend
node database/addMaterialUsedColumn.js
```

**Opção C: Via Console SQL do Render**

1. No dashboard do Render, vai à tua base de dados PostgreSQL
2. Abre o **"Connect"** ou **"SQL Editor"**
3. Executa:
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

### 3. Verificar se Funcionou

Após executar a migração, verifica:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'client_exercise_performances' 
AND column_name = 'materialUsed';
```

Deve retornar uma linha com `materialUsed | text | YES`

### 4. Testar a Aplicação

1. Inicia um treino
2. Completa algumas séries
3. Tenta concluir o treino
4. Deve funcionar sem erros!

## ⚠️ Nota Importante

**A migração NÃO acontece automaticamente!** 
- O código foi atualizado para dar mensagens de erro mais claras
- Mas a coluna precisa ser adicionada manualmente à base de dados
- Sem a migração, os treinos continuarão a falhar

## Troubleshooting

Se a migração falhar:
1. Verifica se estás conectado à base de dados correta
2. Verifica se tens permissões para ALTER TABLE
3. Verifica os logs do Render para ver o erro específico
