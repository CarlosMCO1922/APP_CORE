# Guia de Testes - Correções Críticas

## ✅ Correções Implementadas

1. **Cache do localStorage - Validação de dados corrompidos**
2. **Erros silenciosos - Tratamento adequado**
3. **Validação de token expirado**
4. **Console.logs condicionais para produção**
5. **Tratamento básico de offline**

---

## 🧪 Como Testar

### 1. Teste de Cache do localStorage (Dados Corrompidos)

**Objetivo:** Verificar que a app não quebra quando há dados corrompidos no localStorage.

**Passos:**
1. Abre as DevTools (F12) → Console
2. Executa este comando para corromper dados:
   ```javascript
   localStorage.setItem('activeWorkoutSession', 'dados-corrompidos-invalidos');
   localStorage.setItem('userData', '{"corrompido": true}');
   ```
3. Recarrega a página (F5)
4. **Resultado esperado:**
   - ✅ A app deve carregar normalmente
   - ✅ Dados corrompidos devem ser removidos automaticamente
   - ✅ Não deve aparecer erros no console (apenas warnings em desenvolvimento)

**Teste adicional - Treino ativo:**
1. Inicia um treino
2. No console, executa: `localStorage.setItem('activeWorkoutSession', 'corrompido')`
3. Recarrega a página
4. **Resultado esperado:** O treino deve ser limpo e a app continua funcional

---

### 2. Teste de Erros Silenciosos

**Objetivo:** Verificar que erros são reportados adequadamente.

**Passos:**
1. Abre as DevTools → Network
2. Desativa a rede (Offline mode no DevTools)
3. Tenta fazer uma ação que requer API (ex: carregar dashboard)
4. **Resultado esperado:**
   - ✅ Deve aparecer mensagem de erro adequada ao utilizador
   - ✅ No console (em desenvolvimento) deve aparecer log do erro
   - ✅ A app não deve travar

**Teste adicional - Dashboard:**
1. Com a app funcionando, abre o Dashboard
2. No console, executa: `localStorage.setItem('userToken', 'token-invalido')`
3. Recarrega a página
4. **Resultado esperado:** Deve redirecionar para login ou mostrar erro adequado

---

### 3. Teste de Validação de Token Expirado

**Objetivo:** Verificar que tokens expirados são detetados e limpos.

**Passos:**
1. Faz login normalmente
2. No console, executa:
   ```javascript
   // Simula token expirado (token JWT com exp no passado)
   localStorage.setItem('userToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6MTYwOTQ0ODAwMH0.invalid');
   ```
3. Recarrega a página
4. **Resultado esperado:**
   - ✅ Deve limpar automaticamente o token e userData
   - ✅ Deve redirecionar para login
   - ✅ Não deve aparecer como autenticado

**Teste adicional - Token válido:**
1. Faz login normalmente
2. Verifica que o token é guardado
3. Recarrega a página
4. **Resultado esperado:** Deve manter a sessão ativa

---

### 4. Teste de Console.logs Condicionais

**Objetivo:** Verificar que logs só aparecem em desenvolvimento.

**Passos:**
1. **Em desenvolvimento (NODE_ENV=development):**
   - Abre o console
   - Navega pela app
   - **Resultado esperado:** ✅ Deves ver logs informativos

2. **Em produção (NODE_ENV=production):**
   - Faz build: `npm run build`
   - Serve a build: `npx serve -s build`
   - Abre o console
   - Navega pela app
   - **Resultado esperado:** ✅ Não deves ver logs de `logger.log()` ou `logger.info()`
   - ✅ Apenas `console.error()` deve aparecer (para erros críticos)

---

### 5. Teste de Tratamento de Offline

**Objetivo:** Verificar que a app deteta e informa sobre falta de conexão.

**Passos:**
1. Abre a app normalmente (com internet)
2. Abre as DevTools → Network
3. Seleciona "Offline" no dropdown de throttling
4. **Resultado esperado:**
   - ✅ Deve aparecer banner vermelho no topo: "Sem conexão à internet..."
   - ✅ Banner deve desaparecer quando voltar online

**Teste adicional - Ações offline:**
1. Com a app offline, tenta:
   - Carregar dashboard
   - Fazer login
   - Iniciar treino
2. **Resultado esperado:**
   - ✅ Deve mostrar mensagens de erro adequadas
   - ✅ Não deve travar a app
   - ✅ Quando voltar online, deve funcionar normalmente

---

## 🔍 Checklist de Funcionalidades Básicas

Após os testes acima, verifica que estas funcionalidades continuam a funcionar:

### Autenticação
- [ ] Login funciona
- [ ] Registo funciona
- [ ] Logout funciona
- [ ] Sessão persiste após reload (se token válido)

### Dashboard
- [ ] Carrega dados corretamente
- [ ] Mostra treinos disponíveis
- [ ] Mostra próximos eventos
- [ ] Botões funcionam

### Treinos
- [ ] Iniciar treino funciona
- [ ] Guardar séries funciona
- [ ] Finalizar treino funciona
- [ ] Cancelar treino funciona
- [ ] Treino persiste após reload (se válido)

### Calendário
- [ ] Carrega eventos
- [ ] Inscrições funcionam
- [ ] Cancelamentos funcionam

### Outras Páginas
- [ ] Navegação funciona
- [ ] Formulários funcionam
- [ ] Modais abrem/fecham corretamente

---

## 🐛 O que fazer se algo não funcionar

1. **Abre o console (F12)** e verifica se há erros
2. **Verifica o Network tab** para ver se há requests falhados
3. **Limpa o localStorage:**
   ```javascript
   localStorage.clear();
   ```
4. **Recarrega a página**
5. Se o problema persistir, anota:
   - O que estavas a fazer
   - Mensagem de erro (se houver)
   - Passos para reproduzir

---

## ✅ Critérios de Sucesso

A app está pronta se:
- ✅ Todos os testes acima passam
- ✅ Não há erros no console (apenas warnings em desenvolvimento)
- ✅ Funcionalidades básicas continuam a funcionar
- ✅ Dados corrompidos são limpos automaticamente
- ✅ Tokens expirados são detetados
- ✅ Offline é detetado e informado ao utilizador

---

## 📝 Notas

- Os logs de desenvolvimento (`logger.log()`) só aparecem quando `NODE_ENV=development`
- Erros críticos (`console.error()`) sempre aparecem para debugging
- O sistema de validação de storage previne quebras mas pode limpar dados inválidos
- O indicador offline aparece automaticamente quando a conexão cai

