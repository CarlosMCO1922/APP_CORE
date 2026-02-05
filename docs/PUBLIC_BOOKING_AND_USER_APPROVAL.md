# Marcações públicas (sem conta) e aprovação de utilizadores

## 1. O que foi entendido

### Requisitos funcionais

1. **Visitantes externos (sem conta)**  
   Qualquer pessoa pode:
   - **Pedir uma consulta** (fisioterapia ou PT individual) indicando **nome, telemóvel e email** (obrigatórios). O pedido fica **pendente de aprovação** do profissional escolhido.
   - **Inscrever-se num treino de grupo (experimental)** indicando **nome, telemóvel e email** (obrigatórios). A inscrição fica **pendente de aprovação** do responsável (instrutor).

2. **Sem criação de conta**  
   Para consulta e treino experimental não é necessário registo nem login.

3. **Aprovação por responsável**  
   Tanto o pedido de consulta como a inscrição em treino experimental são sempre aprovados ou rejeitados pelo staff (profissional/instrutor), tal como já acontece com pedidos de clientes com conta.

4. **Novas contas pendentes de aprovação**  
   Quando alguém se regista como **cliente** (Register), a conta fica **pendente de aprovação** por um admin. Só após aprovação o utilizador pode fazer login e usar a área de cliente.

5. **Emails ao visitante (consultas e treinos experimentais sem conta)**  
   - **Imediatamente após submeter** o pedido de consulta ou inscrição em treino experimental → enviar email ao visitante a confirmar que **o pedido foi recebido com sucesso**.
   - **Quando o staff aceita ou rejeita** → enviar email ao visitante a informar que a **consulta / treino experimental foi aceite** ou **não foi aceite**.
   - **Se houver alteração de data/hora** (reagendamento) da consulta ou do treino → enviar email ao visitante a informar da **nova data e hora**.

6. **Admin pode criar consulta ou treino experimental para visitante**  
   Um admin deve poder criar manualmente:
   - **Uma consulta** atribuída a um visitante (sem conta): indicar nome, email e telemóvel do visitante; a consulta pode ficar já agendada/confirmada ou pendente, conforme o fluxo.
   - **Uma inscrição em treino experimental** para um visitante: indicar nome, email e telemóvel; a inscrição pode ficar pendente de aprovação ou já aprovada pelo admin.

---

## 2. Arquitetura proposta

### 2.1 Separação de conceitos

| Conceito | Atual | Proposto |
|----------|--------|----------|
| **Consulta** | Sempre ligada a `User` (userId) ou slot "disponível" (userId null) | Manter. Para pedidos externos: criar slot com **userId null** e guardar dados do visitante em campos **guest** na própria tabela `appointments`. |
| **Treino de grupo** | Inscrição via `UserTrainings` ou `TrainingWaitlist` (ambos exigem userId) | **Nova entidade** `TrainingGuestSignup`: inscrição de visitante (nome, email, telemóvel) num treino, com status pendente/aprovado/rejeitado. Não misturar com User. |
| **Utilizador (cliente)** | Registo → login imediato | Registo → conta com **approvedAt = null** → admin aprova → **approvedAt** preenchido → login permitido. |

### 2.2 Backend

#### Modelos

- **User**  
  - Novo campo: `approvedAt` (DATE, allowNull: true).  
  - Null = conta pendente de aprovação; preenchido = aprovada. No login, rejeitar se `approvedAt` for null.

- **Appointment**  
  - Novos campos (todos opcionais): `guestName`, `guestEmail`, `guestPhone` (STRING).  
  - Quando o pedido é **público** (sem conta): `userId` = null, `guestName`, `guestEmail`, `guestPhone` preenchidos, `status` = `pendente_aprovacao_staff`.  
  - Incluir `guest*` nas respostas da API para o staff ver quem pediu.

- **TrainingGuestSignup** (novo modelo)  
  - `id`, `trainingId`, `guestName`, `guestEmail`, `guestPhone`, `status` (ENUM: PENDING_APPROVAL, APPROVED, REJECTED), `staffApprovedById` (FK Staff, null), `createdAt`, `updatedAt`.  
  - Associações: `TrainingGuestSignup.belongsTo(Training)`, `TrainingGuestSignup.belongsTo(Staff, { as: 'approvedBy' })`.  
  - Permite listar inscrições experimentais por treino e por status e aprovar/rejeitar.

#### Rotas públicas (sem autenticação)

- `GET /api/public/trainings`  
  Listar treinos futuros (e opcionalmente com vagas) para a página “Treino experimental”. Resposta mínima (nome, data, hora, capacidade, instrutor, etc.) sem dados sensíveis.

- `POST /api/public/appointment-request`  
  Body: `staffId`, `date`, `time`, `durationMinutes?`, `notes?`, `guestName`, `guestEmail`, `guestPhone`.  
  Validação: nome, email e telemóvel obrigatórios; profissional existe e tem role adequado; conflito de horário.  
  Cria `Appointment` com `userId` null, `guest*` preenchidos, `status = 'pendente_aprovacao_staff'`. Notifica o profissional.

- `POST /api/public/trainings/:trainingId/guest-signup`  
  Body: `guestName`, `guestEmail`, `guestPhone`.  
  Validação: nome, email e telemóvel obrigatórios; treino existe e é futuro; não duplicar mesma pessoa no mesmo treino (por email).  
  Cria `TrainingGuestSignup` com `status = PENDING_APPROVAL`. Notifica o instrutor do treino.

Todas estas rotas **não** usam o middleware `protect`; podem ter rate limiting e validação forte de input para segurança.

#### Autenticação e utilizadores

- **Registo (POST /api/auth/register)**  
  Criar `User` com `approvedAt = null`. Resposta: “Conta criada. Aguarde aprovação por um administrador.”

- **Login (POST /api/auth/login)**  
  Se `user.approvedAt === null` → HTTP 403 com mensagem “Conta pendente de aprovação. Contacte o suporte.”

- **Admin**  
  - Endpoint para listar utilizadores com filtro “pendentes” (e.g. `GET /api/users?approved=false`).  
  - Endpoint para aprovar: `PATCH /api/users/:id/approve` (apenas admin), que define `approvedAt = new Date()`.

#### Staff / Admin – pedidos existentes e novos

- **Pedidos de consulta**  
  O fluxo atual `staffRespondToAppointmentRequest` já usa `pendente_aprovacao_staff`. Alargar para:
  - Incluir na listagem de pedidos as consultas com `userId` null e `guest*` preenchidos.
  - Nas respostas da API, devolver `guestName`, `guestEmail`, `guestPhone` quando existirem.
  - Aceitar/rejeitar continua igual; ao aceitar, pode definir `totalCost`; não é necessário criar User para o visitante.

- **Inscrições em treino experimental**  
  - Nova página ou secção em “Gestão de treinos”: listar `TrainingGuestSignup` com status `PENDING_APPROVAL`.
  - Ações: Aprovar / Rejeitar. Ao aprovar: atualizar status e **enviar email ao visitante** (aceite ou rejeitado). Não é obrigatório criar User; o participante fica como “visitante” no treino (lista de participantes pode mostrar “Nome (visitante)”).

#### Emails ao visitante (consultas e treinos experimentais)

O `emailService` já existe e usa variáveis de ambiente (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`). **As credenciais nunca devem estar no código**; configurar em `.env` (e não commitar `.env`).

Novas funções no `emailService` (ou módulo dedicado a emails de marcações):

| Momento | Destinatário | Assunto / Conteúdo |
|--------|---------------|---------------------|
| **Pedido de consulta recebido** | `guestEmail` | “Pedido de consulta recebido” – confirmar que o pedido foi registado e está pendente de confirmação pelo profissional (indicar data/hora pedida e profissional). |
| **Pedido de treino experimental recebido** | `guestEmail` | “Inscrição em treino experimental recebida” – confirmar que a inscrição foi registada e está pendente de confirmação (indicar nome do treino, data/hora). |
| **Consulta aceite pelo staff** | `guestEmail` | “Consulta confirmada” – informar que a consulta foi aceite, com data, hora, profissional e instruções (ex.: pagamento do sinal se aplicável). |
| **Consulta rejeitada pelo staff** | `guestEmail` | “Pedido de consulta não aceite” – informar de forma educada que o pedido não foi aceite. |
| **Treino experimental aceite** | `guestEmail` | “Inscrição no treino confirmada” – data, hora e nome do treino. |
| **Treino experimental rejeitado** | `guestEmail` | “Inscrição no treino não aceite” – informar que a inscrição não foi aceite. |
| **Alteração de data/hora (consulta ou treino)** | `guestEmail` | “Alteração de horário” – indicar a nova data e hora (e, no caso de consulta, o profissional). |

Chamadas a enviar em **background** (não bloquear a resposta da API), com tratamento de erro em log para falhas de envio.

**Configuração de email (Gmail):**  
Conta de envio: **core.read@gmail.com**. Configurar no `.env` do backend:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=core.read@gmail.com`
- `SMTP_PASS=<palavra-passe da aplicação ou app password>`
- `FROM_EMAIL=core.read@gmail.com`

Para Gmail, pode ser necessário usar uma “Palavra-passe de app” (contas Google com 2FA). **Nunca commitar o ficheiro `.env` nem a palavra-passe no repositório.**

#### Admin: criar consulta ou treino experimental para visitante

- **Criar consulta para visitante (sem conta)**  
  - Endpoint existente de criação de consulta por admin (`POST /api/appointments` ou equivalente) deve ser alargado para aceitar **em alternativa a `userId`** os campos `guestName`, `guestEmail`, `guestPhone`.  
  - Se forem enviados os campos guest (e não `userId`), criar `Appointment` com `userId` null, `guest*` preenchidos e status conforme (ex.: `agendada` ou `pendente_aprovacao_staff`).  
  - Opcional: enviar email ao visitante a confirmar a marcação (e, se houver alteração posterior de hora, enviar email de alteração).

- **Criar inscrição em treino experimental para visitante**  
  - Novo endpoint (admin): `POST /api/trainings/:trainingId/guest-signup-admin` ou integrado na gestão de treinos: body `guestName`, `guestEmail`, `guestPhone` e opcionalmente `status` (ex.: já `APPROVED`).  
  - Cria registo em `TrainingGuestSignup`; se for criado já aprovado, não é necessário o instrutor aprovar.  
  - Opcional: enviar email ao visitante a confirmar a inscrição no treino.

- **Alteração de data/hora (reagendamento)**  
  - Quando um admin/staff altera a **data ou hora** de uma consulta que tem `guestEmail` (visitante), ou quando o horário de um treino é alterado e existem `TrainingGuestSignup` para esse treino, deve ser disparado o **email de alteração de horário** para cada visitante afetado.

### 2.3 Frontend

#### Página pública (sem login)

- **Rota nova**, por exemplo: `/marcar` ou `/experimentar`, **fora** de `ProtectedRoute`.  
- Conteúdo:
  1. **Pedir consulta**  
     - Seleção de profissional (e opcionalmente categoria).  
     - Escolha de data e slot (reutilizar lógica de slots ou endpoint público de slots para um profissional).  
     - Formulário: Nome, Email, Telemóvel (obrigatórios) + notas opcionais.  
     - Submit → POST `/api/public/appointment-request` → mensagem “Pedido enviado. Aguarde confirmação por parte do profissional.”
  2. **Treino experimental**  
     - Listagem de treinos (GET `/api/public/trainings`).  
     - Ao escolher um treino: formulário Nome, Email, Telemóvel (obrigatórios).  
     - Submit → POST `/api/public/trainings/:id/guest-signup` → “Inscrição enviada. Aguarde confirmação.”

- Opcional: navbar mínima com “Entrar” / “Registar” para não misturar com a área autenticada.

#### Registo e login

- **Registo**: após sucesso, mostrar mensagem a dizer que a conta está pendente de aprovação e que não pode iniciar sessão até um admin aprovar.
- **Login**: se a API devolver 403 por conta não aprovada, mostrar mensagem clara: “A sua conta ainda não foi aprovada. Contacte o suporte.”

#### Admin

- **Gestão de utilizadores**  
  - Filtro ou secção “Contas pendentes de aprovação”.  
  - Botão “Aprovar” que chama `PATCH /api/users/:id/approve`.

#### Staff

- **Pedidos de consulta**  
  - Na página de pedidos (ex.: `StaffManageRequestsPage`), listar também pedidos de visitantes (mostrar `guestName`, `guestEmail`, `guestPhone`) e manter aprovar/rejeitar.
- **Treinos experimentais**  
  - Nova página ou secção para inscrições `TrainingGuestSignup` pendentes, com aprovar/rejeitar.

---

## 3. Boas práticas aplicadas

- **Separação**: visitantes não viram Users; dados de visitante em campos dedicados (`guest*` ou `TrainingGuestSignup`).
- **Reuso**: status `pendente_aprovacao_staff` já existe em consultas; só se estende para `userId` null + guest.
- **Segurança**: rotas públicas sem token mas com validação forte e possibilidade de rate limit; aprovação de contas explícita.
- **Escalabilidade**: no futuro, um visitante aprovado num treino pode ser convertido em User (conversão opcional, não obrigatória para esta fase).

---

## 4. Plano de implementação sugerido (fases)

1. **Fase 1 – Aprovação de utilizadores**  
   - Backend: campo `User.approvedAt`, lógica no registo e no login, endpoints de listagem e aprovação (admin).  
   - Frontend: mensagens no registo/login e secção de aprovação na gestão de utilizadores.

2. **Fase 2 – Pedido de consulta público e emails**  
   - Backend: campos `guest*` em `Appointment`, rota POST `/api/public/appointment-request`, estender listagem/resposta de pedidos para staff.  
   - Backend: funções de email no `emailService`: “pedido de consulta recebido”, “consulta aceite”, “consulta rejeitada”, “alteração de horário (consulta)”. Chamar após criar pedido, após staff aceitar/rejeitar e após alteração de data/hora.  
   - Backend: admin pode criar consulta para visitante (body com `guestName`, `guestEmail`, `guestPhone` em alternativa a `userId`); ao alterar data/hora de consulta com guest, enviar email de alteração.  
   - Frontend: página pública com formulário “Pedir consulta” e integração com a nova API.

3. **Fase 3 – Inscrição em treino experimental e emails**  
   - Backend: modelo `TrainingGuestSignup`, POST `/api/public/trainings/:id/guest-signup`, GET `/api/public/trainings`, endpoints para staff listar e aprovar/rejeitar.  
   - Backend: funções de email: “inscrição treino recebida”, “treino aceite”, “treino rejeitado”, “alteração de horário (treino)”. Admin pode criar inscrição para visitante (endpoint ou fluxo na gestão de treinos); ao alterar data/hora do treino, notificar visitantes inscritos.  
   - Frontend: secção “Treino experimental” na página pública; área staff para aprovar inscrições; admin pode criar inscrição para visitante.

4. **Fase 4 (opcional)**  
   - Rate limiting nas rotas públicas.  
   - Ficheiro `.env.example` com variáveis `SMTP_*` e `FROM_EMAIL` (sem valores sensíveis) para referência.

---

## 5. Resumo da configuração de email

- **Conta de envio:** core.read@gmail.com (configurar em `.env`, nunca no código).
- **Variáveis:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`.
- **Segurança:** Não commitar `.env`; usar “Palavra-passe de app” no Gmail se tiver 2FA ativado.

Se estiver de acordo com esta visão, o próximo passo é implementar pela ordem das fases (começando pela Fase 1). Posso detalhar os passos técnicos (migrations, ficheiros a criar/alterar) para cada fase quando quiseres.
