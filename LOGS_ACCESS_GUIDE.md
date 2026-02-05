# Guia de Acesso aos Logs do Sistema

## 📋 Como Aceder aos Logs

### 1. **Através da Interface Web (Dashboard Admin)**

1. **Login como Admin/Staff**
   - Faz login na aplicação com credenciais de administrador ou staff

2. **Navegar para a Página de Logs**
   - URL: `/admin/logs`
   - Ou através do menu de administração (se existir link)

3. **Visualizar Logs**
   - **Tab "Erros"**: Visualiza todos os erros JavaScript, API, React, etc.
   - **Tab "Segurança"**: Visualiza eventos de segurança (tentativas de acesso não autorizado, discrepâncias de role, etc.)

### 2. **Funcionalidades do Dashboard**

#### Filtros Disponíveis:
- **Severidade**: CRITICAL, HIGH, MEDIUM, LOW
- **Tipo de Erro**: JS_ERROR, API_ERROR, VALIDATION_ERROR, NETWORK_ERROR, REACT_ERROR_BOUNDARY, UNHANDLED_PROMISE_REJECTION
- **Estado**: Resolvido / Não Resolvido (apenas para erros)
- **Tipo de Evento**: UNAUTHORIZED_ACCESS_ATTEMPT, ROLE_MISMATCH, TOKEN_TAMPERING (apenas para segurança)
- **User ID**: Filtrar por utilizador específico
- **Data**: Filtrar por intervalo de datas

#### Estatísticas:
- Total de logs
- Logs não resolvidos (apenas erros)
- Logs críticos
- Logs de alta severidade

#### Ações:
- **Marcar como Resolvido**: Para erros, podes marcar como resolvido quando corrigires o problema
- **Pagination**: Navegar entre páginas de resultados

### 3. **Através da API (Programaticamente)**

#### Obter Logs de Erro:
```bash
GET /api/logs/errors?limit=50&offset=0&severity=HIGH&resolved=false
Headers: Authorization: Bearer <token>
```

#### Obter Logs de Segurança:
```bash
GET /api/logs/security?limit=50&offset=0&eventType=UNAUTHORIZED_ACCESS_ATTEMPT
Headers: Authorization: Bearer <token>
```

#### Marcar Erro como Resolvido:
```bash
PATCH /api/logs/errors/:logId/resolve
Headers: Authorization: Bearer <token>
```

### 4. **Estrutura dos Logs**

#### ErrorLog:
- `id`: ID único do log
- `userId`: ID do utilizador (null se não autenticado)
- `errorType`: Tipo de erro
- `message`: Mensagem do erro
- `stackTrace`: Stack trace completo
- `url`: URL onde ocorreu o erro
- `userAgent`: User agent do navegador
- `deviceInfo`: Informações do dispositivo (JSON)
- `severity`: Severidade (LOW, MEDIUM, HIGH, CRITICAL)
- `metadata`: Dados adicionais (JSON)
- `resolved`: Se foi resolvido
- `resolvedAt`: Data de resolução
- `resolvedBy`: ID do staff que resolveu
- `createdAt`: Data de criação

#### SecurityLog:
- `id`: ID único do log
- `userId`: ID do utilizador
- `eventType`: Tipo de evento de segurança
- `description`: Descrição detalhada
- `attemptedRole`: Role que foi tentado usar
- `actualRole`: Role real do utilizador
- `ipAddress`: Endereço IP
- `userAgent`: User agent
- `url`: URL acedida
- `severity`: Severidade
- `metadata`: Dados adicionais
- `createdAt`: Data de criação

### 5. **Tipos de Eventos de Segurança**

- **UNAUTHORIZED_ACCESS_ATTEMPT**: Tentativa de acesso a rota não autorizada
- **ROLE_MISMATCH**: Discrepância entre role no JWT e role no backend
- **TOKEN_TAMPERING**: Tentativa de manipulação de token (detetado automaticamente)

### 6. **Dicas para Despistar Erros**

1. **Filtrar por Severidade CRITICAL/HIGH primeiro**
   - Estes são os erros mais importantes

2. **Verificar Logs Não Resolvidos**
   - Foca-te nos erros que ainda não foram resolvidos

3. **Agrupar por Tipo de Erro**
   - Se muitos erros do mesmo tipo, pode ser um problema sistemático

4. **Verificar por Utilizador**
   - Se um utilizador específico tem muitos erros, pode ser problema do dispositivo/browser dele

5. **Verificar Stack Trace**
   - O stack trace mostra exatamente onde o erro ocorreu no código

6. **Verificar Metadata**
   - O campo metadata contém contexto adicional (componente React, estado da aplicação, etc.)

7. **Verificar Logs de Segurança**
   - Se houver muitos eventos de segurança, pode indicar tentativas de ataque

### 7. **Exportação de Logs**

Para exportar logs para análise externa:
- Usa a API para obter todos os logs
- Ou consulta diretamente a base de dados nas tabelas `error_logs` e `security_logs`

### 8. **Limpeza Automática**

**Nota**: Atualmente não há limpeza automática de logs. Recomenda-se:
- Limpar logs antigos periodicamente (ex: mais de 90 dias)
- Manter apenas logs críticos/importantes
- Fazer backup antes de limpar

---

## 🔒 Segurança Implementada

### Proteções Adicionadas:

1. **Validação com Backend**
   - O frontend valida role/permissões com o backend antes de permitir acesso
   - Endpoint: `GET /api/auth/validate`

2. **JWT como Fonte de Verdade**
   - Role e permissões vêm do JWT (não podem ser alterados no localStorage)
   - O JWT é decodificado no frontend para obter role real

3. **Logs de Segurança Automáticos**
   - Tentativas de acesso não autorizado são registadas automaticamente
   - Discrepâncias entre JWT e backend são registadas

4. **ProtectedRoute Melhorado**
   - Valida com backend antes de renderizar rotas protegidas
   - Mostra loading durante validação
   - Redireciona se não autorizado

---

## 📊 Exemplo de Uso

### Cenário: Despistar Erro Frequente

1. Acede a `/admin/logs`
2. Filtra por `errorType: JS_ERROR` e `severity: HIGH`
3. Vê que há muitos erros com a mesma mensagem
4. Clica num erro para ver detalhes (stack trace, metadata)
5. Identifica o ficheiro/linha onde ocorre
6. Corrige o código
7. Marca os erros como resolvidos

### Cenário: Investigar Tentativa de Hack

1. Acede a `/admin/logs`
2. Vai para tab "Segurança"
3. Filtra por `eventType: ROLE_MISMATCH` ou `UNAUTHORIZED_ACCESS_ATTEMPT`
4. Vê os logs com IP, user agent, e descrição
5. Identifica padrões ou utilizadores suspeitos
6. Toma medidas de segurança se necessário

---

## 🚀 Próximos Passos (Opcional)

- Integração com Sentry para erros críticos (notificações em tempo real)
- Exportação CSV/JSON dos logs
- Gráficos e análises de tendências
- Alertas automáticos por email para erros críticos
- Limpeza automática de logs antigos
