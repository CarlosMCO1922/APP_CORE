# Preparação para notificações WhatsApp

Este documento descreve o que aconselhar, o que é preciso e como preparar a app para que a implementação de WhatsApp fique correta. **Não implementar nada até estarem reunidas as condições abaixo.**

---

## 1. Conselho geral

- **Fazer por fases**: primeiro conta/provedor + um único tipo de mensagem (ex.: código de reset); só depois replicar aos restantes tipos.
- **Templates primeiro**: a Meta exige templates aprovados para mensagens “business-initiated”. Sem templates aprovados, não há envio. Preparar textos em PT e submeter antes de codar a lógica.
- **Número E.164**: guardar e enviar sempre em formato internacional (ex. `+351912345678`). Normalizar no backend ao gravar e ao enviar.
- **Opt-in**: para cumprir políticas da Meta e RGPD, só enviar WhatsApp se o utilizador tiver dado consentimento (ex. checkbox “Receber notificações por WhatsApp”). Ter isso na BD e na UI.
- **Fallback**: manter email como canal principal; WhatsApp como complemento. Se não houver número ou opt-in, enviar só por email (comportamento atual).

---

## 2. O que já tens na app (resumo)

| Onde | Email | Telefone |
|------|--------|----------|
| **User** (clientes com conta) | ✅ `email` | ❌ Não existe campo `phone` |
| **Appointment** (visitante) | ✅ `guestEmail` | ✅ `guestPhone` |
| **TrainingGuestSignup** (visitante treino) | ✅ `guestEmail` | ✅ `guestPhone` |

- **Visitantes**: já tens `guestPhone` em Appointment e TrainingGuestSignup; frontend (PublicBookingPage) já recolhe e envia.
- **Utilizadores registados**: só têm email; para reset de password ou notificações por WhatsApp é preciso **adicionar** `phone` (e preferência) ao modelo User e às APIs/UI de perfil ou definições.

---

## 3. O que precisas antes de implementar

### 3.1 Escolha do provedor WhatsApp

- **Opção A – Twilio**: API simples, documentação boa, conta de teste. Variáveis: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (ex. `whatsapp:+14155238886`).
- **Opção B – 360dialog / MessageBird**: focados em WhatsApp Business API na Europa.
- **Opção C – Meta Cloud API direta**: mais controlo, mais trabalho (auth, webhooks, certificados).

**Recomendação**: começar com **Twilio** ou **360dialog** para ter envio a funcionar rápido; migrar para Cloud API direta só se precisares de algo que o provedor não dê.

### 3.2 Conta e número

- Conta no provedor escolhido (e, se for Meta direta, Meta Business Manager).
- Número de telefone dedicado para “envio” (WhatsApp Business). Esse número será o “from” nas mensagens.
- Verificar requisitos do provedor (verificação do número, aprovação da conta, etc.).

### 3.3 Templates de mensagem (Meta / provedor)

Cada tipo de notificação que hoje é um email deve ter um **template WhatsApp** aprovado. Lista alinhada com o teu `emailService.js`:

| # | Tipo (nome interno) | Uso | Variáveis típicas |
|---|---------------------|-----|-------------------|
| 1 | Código recuperação palavra-passe | Reset password | `{{1}}` = código |
| 2 | Pedido de consulta recebido | Marcação pendente (cliente/visitante) | `{{1}}` nome, `{{2}}` profissional, `{{3}}` data/hora |
| 3 | Consulta aceite | Staff aceitou | `{{1}}` nome, `{{2}}` profissional, `{{3}}` data/hora, (opcional: `{{4}}` valor sinal, `{{5}}` link pagamento) |
| 4 | Consulta rejeitada | Staff rejeitou | `{{1}}` nome, `{{2}}` profissional, `{{3}}` data/hora |
| 5 | Data/hora da consulta alterada | Remarcação feita pelo staff | `{{1}}` nome, `{{2}}` nova data/hora |
| 6 | Proposta de reagendamento consulta | Link para confirmar nova data | `{{1}}` nome, `{{2}}` profissional, `{{3}}` data proposta, `{{4}}` URL confirmar |
| 7 | Reagendamento consulta confirmado | Cliente confirmou nova data | `{{1}}` nome, `{{2}}` data/hora final |
| 8 | Pedido de treino recebido | Inscrição treino pendente | `{{1}}` nome, `{{2}}` treino, `{{3}}` data/hora |
| 9 | Treino aceite | Inscrição aprovada | `{{1}}` nome, `{{2}}` treino, `{{3}}` data/hora |
| 10 | Treino rejeitado | Inscrição rejeitada | `{{1}}` nome, `{{2}}` treino |
| 11 | Data/hora do treino alterada | Treino remarcado | `{{1}}` nome, `{{2}}` treino, `{{3}}` nova data/hora |
| 12 | Proposta de reagendamento treino | Link para confirmar | `{{1}}` nome, `{{2}}` treino, `{{3}}` data proposta, `{{4}}` URL |
| 13 | Reagendamento treino confirmado | Cliente confirmou | `{{1}}` nome, `{{2}}` treino, `{{3}}` data/hora |

Os nomes e variáveis têm de coincidir com o que o provedor/Meta exigir (limites de caracteres, placeholders `{{1}}`, etc.). Guardar no documento o **nome exato de cada template** (ex. `password_reset_code`, `appointment_request_received`) para usar no código.

### 3.4 Dados na aplicação

- **User (clientes com conta)**  
  - Campo `phone` (STRING, nullable), ex. `+351912345678`.  
  - Opcional: campo `notifyByWhatsApp` (BOOLEAN, default false) para opt-in.  
  - Migração DB + atualizar registo/edição de utilizador (admin e/ou perfil do cliente).

- **Visitantes**  
  - Já tens `guestPhone` em Appointment e TrainingGuestSignup.  
  - Garantir que o valor é guardado em E.164 (normalizar no backend ao criar/atualizar).  
  - Decisão de negócio: enviar WhatsApp a visitantes só se `guestPhone` estiver preenchido (e, se a política exigir, um opt-in no formulário público).

- **Normalização de número**  
  - Função utilitária: string de input → E.164 (ex. `912 345 678` ou `912345678` → `+351912345678`). Usar ao gravar em User, Appointment e TrainingGuestSignup, e antes de chamar a API do provedor.

### 3.5 Variáveis de ambiente

Exemplo (Twilio):

```env
# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Exemplo (genérico / 360dialog):

```env
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=twilio|360dialog|meta
WHATSAPP_API_KEY=xxxx
WHATSAPP_PHONE_NUMBER_ID=xxxx
```

Não commitar valores reais; usar `.env` e documentar no README ou num ficheiro de exemplo (`.env.example`).

### 3.6 Frontend (onde preparar)

- **Perfil / Definições (utilizador logado)**  
  - Campo “Telemóvel” (opcional).  
  - Checkbox “Receber notificações por WhatsApp” (só visível se telemóvel preenchido).  
  - Chamar API que atualize `User.phone` e `User.notifyByWhatsApp`.

- **Admin – edição de utilizador**  
  - Se existir formulário de edição de User, adicionar `phone` (e opcionalmente `notifyByWhatsApp`).

- **Formulários de visitante (PublicBookingPage)**  
  - Já recolhem `guestPhone`. Apenas garantir que o backend normaliza para E.164; não é obrigatório mudar a UI para “opt-in WhatsApp” se decidires que o envio a visitantes é legítimo pelo contexto do pedido (avaliar com RGPD).

---

## 4. Checklist “tudo pronto para implementar”

Usar isto antes de escrever código de envio WhatsApp. Só quando tudo estiver ✅ faz sentido implementar.

### Conta e provedor
- [ ] Provedor escolhido (Twilio / 360dialog / Meta).
- [ ] Conta criada e ativa.
- [ ] Número de envio (WhatsApp Business) configurado e verificado.
- [ ] Variáveis de ambiente definidas (e documentadas em `.env.example`).

### Templates
- [ ] Lista de templates definida (nomes e variáveis) para todos os tipos acima.
- [ ] Templates submetidos e **aprovados** na Meta / painel do provedor.
- [ ] Nomes exatos dos templates anotados para uso no código (ex. tabela num doc ou comentário no repo).

### Base de dados e modelos
- [ ] User: campo `phone` (e opcionalmente `notifyByWhatsApp`) adicionado e migração aplicada.
- [ ] Appointment e TrainingGuestSignup: confirmar que `guestPhone` existe e é usado; decidir se precisas de opt-in extra.
- [ ] Utilitário de normalização de número (input → E.164) definido e usado onde se grava telefone.

### APIs e UI
- [ ] API de atualização de perfil (e/ou admin) atualizada para aceitar `phone` e `notifyByWhatsApp`.
- [ ] Frontend: ecrã de perfil/definições com campo telemóvel e checkbox “Receber por WhatsApp” (se aplicável).
- [ ] Decisão clara: em que fluxos se envia WhatsApp (só utilizadores com opt-in? visitantes com guestPhone? ambos?).

### Documentação interna
- [ ] Documento ou tabela com: tipo de notificação → nome do template WhatsApp → variáveis na ordem correta.
- [ ] Regras de negócio: quando enviar só email, quando email + WhatsApp, quando só WhatsApp (se for o caso).

---

## 5. Como ficará a implementação (resumo, sem código)

- **Novo módulo** `backend/utils/whatsappService.js` (ou `services/whatsappService.js`) com uma função por tipo de notificação (espelho das do `emailService.js`), cada uma a montar o payload do template e a chamar a API do provedor.
- **Controllers** (auth, appointment, public, training): nos mesmos sítios onde hoje chamas o email, adicionar chamada ao WhatsApp **se** `WHATSAPP_ENABLED` e se existir número + (para User) opt-in; em caso de erro de envio WhatsApp, logar e não falhar o fluxo (email continua a ser o canal principal).
- **Config**: ler env (provedor, API key, número from); se não estiver configurado, as funções WhatsApp não fazem nada (ou devolvem no-op), tal como o email quando SMTP não está configurado.

Quando o checklist estiver completo, podes pedir a implementação passo a passo (por exemplo: primeiro `whatsappService.js` + reset password + User.phone e opt-in; depois o resto dos templates e controllers).
