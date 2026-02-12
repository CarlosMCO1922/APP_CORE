# 🚀 Guia de Deploy - Sistema de Sessões de Treino no Render

## 📋 RESUMO DAS ALTERAÇÕES

Este guia contém instruções completas para implementar o sistema de **Sessões de Treino Permanentes** na aplicação APP CORE no Render.

### **O que foi implementado:**
- ✅ Novo modelo `TrainingSession` (sessões concluídas permanentes)
- ✅ Campo `sessionId` em `ClientExercisePerformance` (liga séries à sessão)
- ✅ Controller e rotas completas para gestão de sessões
- ✅ Frontend: Service, WorkoutContext atualizado e página de histórico
- ✅ Criação automática de sessão ao finalizar treino

---

## 🗄️ PASSO 1: EXECUTAR MIGRAÇÃO SQL NA BASE DE DADOS

### **Aceder à Base de Dados PostgreSQL no Render:**

1. **Ir ao Dashboard do Render** → https://dashboard.render.com
2. **Aceder à base de dados** (normalmente chamada algo como `app-core-db` ou similar)
3. **Copiar a Connection String** (formato: `postgresql://user:password@host:port/database`)

### **Conectar via Terminal (opção A - recomendada):**

```bash
# Instalar psql se ainda não tiver (macOS)
brew install postgresql

# Conectar à base de dados do Render
psql "COLAR_AQUI_A_CONNECTION_STRING"
```

### **Conectar via PGAdmin ou TablePlus (opção B):**
- Usar os dados de conexão fornecidos pelo Render
- Host, Port, Database, User, Password

---

### **Executar o Script de Migração:**

Após conectar, executar o conteúdo do ficheiro:
**`backend/database/migrations/001_add_training_sessions.sql`**

```sql
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
```

### **Verificar se funcionou:**

```sql
-- Verificar se a tabela foi criada
\dt training_sessions

-- Verificar se a coluna foi adicionada
\d client_exercise_performances

-- Deve aparecer "session_id" na lista de colunas
```

---

## 🔄 PASSO 2: FAZER DEPLOY DO BACKEND

### **No Render Dashboard:**

1. **Ir ao serviço do backend** (normalmente algo como `app-core-backend`)
2. **Fazer deploy manual** ou **push para o repositório Git**
   - Se usar deploy automático: Fazer commit e push das alterações
   - Se usar deploy manual: Clicar em "Manual Deploy" → "Deploy latest commit"

### **Ficheiros alterados no backend:**
- ✅ `backend/models/TrainingSession.js` (novo)
- ✅ `backend/models/ClientExercisePerfomance.js` (adicionado `sessionId`)
- ✅ `backend/controllers/sessionController.js` (novo)
- ✅ `backend/routes/sessionRoutes.js` (novo)
- ✅ `backend/server.js` (adicionada rota `/sessions`)

### **Aguardar deploy concluir** (normalmente 3-5 minutos)

### **Verificar logs do backend:**
```
Procurar por mensagens como:
✓ Base de dados sincronizada com sucesso
✓ Servidor a correr na porta 3001
```

⚠️ **IMPORTANTE:** Certifica-te que `NODE_ENV=production` está configurado nas variáveis de ambiente do Render para que o Sequelize não tente fazer `alter: true` automaticamente.

---

## 🎨 PASSO 3: FAZER DEPLOY DO FRONTEND

### **No Render Dashboard:**

1. **Ir ao serviço do frontend** (normalmente algo como `app-core-frontend`)
2. **Fazer deploy** (igual ao backend)

### **Ficheiros alterados no frontend:**
- ✅ `frontend/src/services/sessionService.js` (novo)
- ✅ `frontend/src/context/WorkoutContext.js` (cria sessão ao finalizar)
- ✅ `frontend/src/pages/SessionHistoryPage.js` (nova página de histórico)
- ✅ `frontend/src/App.js` (rota `/treino/historico`)

### **Aguardar deploy concluir**

---

## ✅ PASSO 4: TESTAR O SISTEMA

### **1. Testar criar sessão (treino completo):**

1. Fazer login na aplicação
2. Iniciar um treino (qualquer plano de treino)
3. Completar pelo menos 1 série de 1 exercício
4. Clicar em "Concluir Treino"
5. **Verificar na BD:**
   ```sql
   SELECT * FROM training_sessions ORDER BY id DESC LIMIT 5;
   ```
   Deve aparecer a sessão recém-criada!

### **2. Testar histórico:**

1. Na aplicação, ir para `/treino/historico`
2. Deve aparecer a lista de sessões concluídas
3. Clicar numa sessão → Modal abre com detalhes completos
4. Verificar:
   - Nome do plano
   - Data/hora
   - Duração
   - Volume total
   - Séries por exercício

### **3. Verificar API (via Postman/cURL):**

**Obter histórico:**
```bash
curl -X GET "https://SEU_BACKEND.onrender.com/sessions/history?limit=10" \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Obter detalhes de uma sessão:**
```bash
curl -X GET "https://SEU_BACKEND.onrender.com/sessions/1" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 🔧 TROUBLESHOOTING

### **Erro: "Column session_id does not exist"**
➡️ **Solução:** A migração SQL não foi executada. Repetir PASSO 1.

### **Erro: "Table training_sessions does not exist"**
➡️ **Solução:** A tabela não foi criada. Verificar se a migração SQL foi executada com sucesso.

### **Sessão não aparece no histórico:**
➡️ **Soluções:**
1. Verificar logs do backend: `console.log('Sessão criada:', session.id)`
2. Verificar se o treino foi concluído (não cancelado)
3. Verificar na BD se a sessão existe:
   ```sql
   SELECT * FROM training_sessions WHERE user_id = X;
   ```

### **Erro 500 ao criar sessão:**
➡️ **Soluções:**
1. Verificar logs do backend no Render
2. Verificar se `performanceIds` são válidos
3. Verificar se o utilizador é dono das performances

### **Frontend não mostra histórico:**
➡️ **Soluções:**
1. Verificar console do browser (F12)
2. Verificar se o token JWT está válido
3. Verificar se a rota `/sessions/history` está acessível

---

## 📊 VERIFICAÇÃO FINAL

### **Checklist de sucesso:**

- [ ] Tabela `training_sessions` existe na BD
- [ ] Coluna `session_id` existe em `client_exercise_performances`
- [ ] Backend faz deploy sem erros
- [ ] Frontend faz deploy sem erros
- [ ] Ao concluir treino, sessão é criada automaticamente
- [ ] Histórico (`/treino/historico`) mostra sessões
- [ ] Clicar numa sessão mostra detalhes completos
- [ ] Séries têm `sessionId` preenchido

---

## 🎯 COMO FUNCIONA O SISTEMA

### **Fluxo completo:**

```
1. INICIAR TREINO
   └─> Criar TrainingSessionDraft (temporário, 24h)

2. CONFIRMAR CADA SÉRIE
   ├─> Guardar em ClientExercisePerformance (sessionId = null)
   └─> Atualizar TrainingSessionDraft

3. FINALIZAR TREINO (NOVO!)
   ├─> Criar TrainingSession (permanente)
   ├─> Atualizar todas as séries com sessionId
   ├─> Calcular totais (volume, duração, etc)
   ├─> Eliminar TrainingSessionDraft
   └─> Navegação para resumo

4. VER HISTÓRICO
   └─> Listar TrainingSessions do utilizador
       └─> Clicar: mostrar todas as séries dessa sessão

5. REPETIR TREINO (DIA SEGUINTE)
   ├─> Ao iniciar: buscar última sessão do mesmo plano
   ├─> Preencher placeholders com dados da última sessão
   └─> Ao finalizar: NOVA TrainingSession (dia diferente!)
```

---

## 📞 SUPORTE

Se encontrares problemas:

1. **Verificar logs do Render** (tanto backend como frontend)
2. **Verificar console do browser** (F12)
3. **Testar endpoints da API diretamente** (Postman/cURL)
4. **Verificar estado da BD** (psql/PGAdmin)

---

## ✅ CONCLUSÃO

Após seguir este guia:
- ✅ Sistema de sessões de treino permanente funcional
- ✅ Histórico completo por utilizador
- ✅ Possibilidade de ver treinos passados
- ✅ Cada dia é uma sessão separada
- ✅ Evolução visível entre sessões
- ✅ Multi-user safe (concorrência garantida)
- ✅ Offline-first mantido (drafts temporários + sessões permanentes)

**O sistema está pronto para produção!** 🚀
