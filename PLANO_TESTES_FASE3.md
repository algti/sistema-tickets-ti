# 🧪 FASE 3: TESTES E VALIDAÇÃO

## 📋 PLANO DE TESTES

### 1️⃣ TESTES MANUAIS - BACKEND

#### 1.1 Teste: Request OTP com Email Válido
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```
**Esperado:** 
- Status: 200 ou 404 (se email não existe)
- Response: `{"message":"Código enviado para seu email","expires_in":480}`

#### 1.2 Teste: Request OTP com Email Inválido
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'
```
**Esperado:** 
- Status: 422 (Validation Error)
- Response: Erro de validação de email

#### 1.3 Teste: Verify OTP com Código Correto
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'
```
**Esperado:** 
- Status: 200
- Response: `{"access_token":"...","token_type":"bearer","user":{...}}`

#### 1.4 Teste: Verify OTP com Código Incorreto
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"000000"}'
```
**Esperado:** 
- Status: 400
- Response: `{"detail":"Código inválido"}`

#### 1.5 Teste: Verify OTP com Código Expirado
```bash
# Aguardar 8 minutos e tentar verificar
curl -X POST http://127.0.0.1:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'
```
**Esperado:** 
- Status: 401
- Response: `{"detail":"Código expirado"}`

#### 1.6 Teste: Resend OTP
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```
**Esperado:** 
- Status: 200
- Response: `{"message":"Novo código enviado para seu email","expires_in":480}`

#### 1.7 Teste: Register Novo Usuário
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","full_name":"Novo Usuário","department":"TI"}'
```
**Esperado:** 
- Status: 200
- Response: `{"message":"Usuário registrado com sucesso","email":"newuser@example.com"}`

#### 1.8 Teste: Register com Email Duplicado
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com","full_name":"Novo Usuário","department":"TI"}'
```
**Esperado:** 
- Status: 409
- Response: `{"detail":"Email já cadastrado no sistema"}`

#### 1.9 Teste: Verify OTP com Máximo de Tentativas
```bash
# Fazer 5 tentativas com código incorreto
for i in {1..5}; do
  curl -X POST http://127.0.0.1:8000/api/v1/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","code":"000000"}'
done
```
**Esperado:** 
- Primeiras 4: Status 400 com mensagem de código incorreto
- 5ª: Status 403 com `{"detail":"Máximo de tentativas atingido"}`

#### 1.10 Teste: Verify OTP com Usuário Inativo
```bash
# Primeiro, desativar usuário no banco
# UPDATE users SET is_active = FALSE WHERE email = 'user@example.com'

curl -X POST http://127.0.0.1:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'
```
**Esperado:** 
- Status: 403
- Response: `{"detail":"Usuário não encontrado ou inativo"}`

---

### 2️⃣ TESTES MANUAIS - FRONTEND

#### 2.1 Teste: Página OTP Login Carrega
- [ ] Acessar `http://localhost:3000/otp-login`
- [ ] Verificar se página carrega sem erros
- [ ] Verificar se componente EmailStep aparece
- [ ] Verificar se logo e textos estão corretos

#### 2.2 Teste: Validação de Email
- [ ] Deixar email vazio e clicar "Enviar Código"
- [ ] Esperado: Mensagem "Email é obrigatório"
- [ ] Inserir email inválido (ex: "teste")
- [ ] Esperado: Mensagem "Email inválido"
- [ ] Inserir email válido
- [ ] Esperado: Sem mensagem de erro

#### 2.3 Teste: Solicitar Código
- [ ] Inserir email válido
- [ ] Clicar "Enviar Código"
- [ ] Esperado: Página muda para CodeStep
- [ ] Esperado: Timer começa em 8:00
- [ ] Esperado: Toast "Código enviado para seu email!"

#### 2.4 Teste: Validação de Código
- [ ] Deixar código vazio
- [ ] Clicar "Verificar Código"
- [ ] Esperado: Mensagem "Código é obrigatório"
- [ ] Inserir menos de 6 dígitos
- [ ] Esperado: Botão "Verificar Código" desabilitado
- [ ] Inserir 6 dígitos
- [ ] Esperado: Botão "Verificar Código" habilitado

#### 2.5 Teste: Verificar Código Incorreto
- [ ] Inserir código incorreto (ex: 000000)
- [ ] Clicar "Verificar Código"
- [ ] Esperado: Mensagem de erro
- [ ] Esperado: Contador de tentativas diminui (5→4)
- [ ] Esperado: Toast com mensagem de erro

#### 2.6 Teste: Reenviar Código
- [ ] Clicar "Reenviar Código"
- [ ] Esperado: Timer volta para 8:00
- [ ] Esperado: Contador de tentativas volta para 0
- [ ] Esperado: Toast "Novo código enviado!"

#### 2.7 Teste: Voltar para Email
- [ ] Clicar "Voltar"
- [ ] Esperado: Volta para EmailStep
- [ ] Esperado: Campo de email limpo
- [ ] Esperado: Sem erros

#### 2.8 Teste: Timer Expiração
- [ ] Aguardar 8 minutos (ou simular no console)
- [ ] Esperado: Timer chega a 0:00
- [ ] Esperado: Mensagem "Código expirado"
- [ ] Esperado: Volta para EmailStep automaticamente

#### 2.9 Teste: Máximo de Tentativas
- [ ] Inserir código incorreto 5 vezes
- [ ] Esperado: Após 5ª tentativa, mensagem "Máximo de tentativas atingido"
- [ ] Esperado: Volta para EmailStep
- [ ] Esperado: Deve solicitar novo código

#### 2.10 Teste: Login Bem-Sucedido
- [ ] Solicitar código
- [ ] Inserir código correto
- [ ] Clicar "Verificar Código"
- [ ] Esperado: Redirecionamento para /dashboard
- [ ] Esperado: Usuário logado
- [ ] Esperado: Token salvo em localStorage

#### 2.11 Teste: Página Register Carrega
- [ ] Acessar `http://localhost:3000/register`
- [ ] Verificar se página carrega sem erros
- [ ] Verificar se formulário aparece
- [ ] Verificar se campos estão corretos

#### 2.12 Teste: Validação de Registro
- [ ] Deixar email vazio e clicar "Criar Conta"
- [ ] Esperado: Mensagem "Email é obrigatório"
- [ ] Deixar nome vazio
- [ ] Esperado: Mensagem "Nome completo é obrigatório"
- [ ] Inserir nome com 1 caractere
- [ ] Esperado: Mensagem "Nome deve ter pelo menos 3 caracteres"

#### 2.13 Teste: Registrar Novo Usuário
- [ ] Preencher formulário com dados válidos
- [ ] Clicar "Criar Conta"
- [ ] Esperado: Toast "Registro realizado com sucesso!"
- [ ] Esperado: Redirecionamento para /otp-login
- [ ] Esperado: Novo usuário pode fazer login

#### 2.14 Teste: Registrar com Email Duplicado
- [ ] Tentar registrar com email já existente
- [ ] Clicar "Criar Conta"
- [ ] Esperado: Toast "Email já cadastrado no sistema"
- [ ] Esperado: Permanece na página de registro

#### 2.15 Teste: Link "Não tem conta?"
- [ ] Na página OTPLogin, clicar "Registre-se aqui"
- [ ] Esperado: Navega para /register

#### 2.16 Teste: Link "Voltar para Login"
- [ ] Na página Register, clicar "Voltar para Login"
- [ ] Esperado: Navega para /otp-login

#### 2.17 Teste: Redirecionar /login para /otp-login
- [ ] Acessar `http://localhost:3000/login`
- [ ] Esperado: Redireciona para /otp-login

#### 2.18 Teste: Usuário Logado não Acessa Login
- [ ] Fazer login
- [ ] Tentar acessar /otp-login
- [ ] Esperado: Redireciona para /dashboard
- [ ] Tentar acessar /register
- [ ] Esperado: Redireciona para /dashboard

---

### 3️⃣ TESTES DE INTEGRAÇÃO

#### 3.1 Fluxo Completo: Novo Usuário
1. [ ] Acessar /register
2. [ ] Preencher formulário
3. [ ] Clicar "Criar Conta"
4. [ ] Verificar se usuário foi criado no banco
5. [ ] Acessar /otp-login
6. [ ] Inserir email do novo usuário
7. [ ] Clicar "Enviar Código"
8. [ ] Verificar se código foi enviado por email
9. [ ] Inserir código
10. [ ] Clicar "Verificar Código"
11. [ ] Verificar se fez login com sucesso
12. [ ] Verificar se token está em localStorage
13. [ ] Verificar se usuário aparece em /dashboard

#### 3.2 Fluxo Completo: Usuário Existente
1. [ ] Acessar /otp-login
2. [ ] Inserir email de usuário existente
3. [ ] Clicar "Enviar Código"
4. [ ] Verificar se código foi enviado
5. [ ] Inserir código correto
6. [ ] Clicar "Verificar Código"
7. [ ] Verificar se fez login com sucesso
8. [ ] Verificar se dados do usuário estão corretos
9. [ ] Verificar se pode acessar /dashboard
10. [ ] Verificar se pode acessar /profile

#### 3.3 Fluxo: Reenviar Código
1. [ ] Solicitar código
2. [ ] Clicar "Reenviar Código"
3. [ ] Verificar se novo código foi enviado
4. [ ] Verificar se código anterior não funciona mais
5. [ ] Verificar se novo código funciona

#### 3.4 Fluxo: Máximo de Tentativas
1. [ ] Solicitar código
2. [ ] Tentar 5 vezes com código incorreto
3. [ ] Verificar se após 5ª tentativa, volta para email
4. [ ] Verificar se deve solicitar novo código
5. [ ] Verificar se novo código funciona

---

### 4️⃣ TESTES DE BANCO DE DADOS

#### 4.1 Verificar Tabelas Criadas
```sql
-- Verificar se tabelas existem
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('login_otp', 'login_audit');
```
**Esperado:** Ambas as tabelas devem existir

#### 4.2 Verificar Colunas em Users
```sql
-- Verificar se colunas foram adicionadas
PRAGMA table_info(users);
```
**Esperado:** Deve ter `last_login`, `last_login_ip`, `login_attempts`
**Não deve ter:** `username`, `hashed_password`, `is_ldap_user`

#### 4.3 Verificar Dados em LoginOTP
```sql
-- Após solicitar código
SELECT * FROM login_otp ORDER BY created_at DESC LIMIT 1;
```
**Esperado:** 
- email: correto
- code: 6 dígitos
- expires_at: 8 minutos no futuro
- used: 0 (false)

#### 4.4 Verificar Dados em LoginAudit
```sql
-- Após fazer login
SELECT * FROM login_audit ORDER BY created_at DESC LIMIT 5;
```
**Esperado:** 
- Registros de request-otp
- Registros de verify-otp
- success: 1 para logins bem-sucedidos

#### 4.5 Verificar Atualização em Users
```sql
-- Após fazer login
SELECT id, email, last_login, last_login_ip FROM users WHERE email = 'user@example.com';
```
**Esperado:** 
- last_login: data/hora atual
- last_login_ip: IP do cliente

---

### 5️⃣ TESTES DE SEGURANÇA

#### 5.1 Teste: Código Não Pode Ser Reutilizado
- [ ] Fazer login com código correto
- [ ] Tentar usar mesmo código novamente
- [ ] Esperado: Erro "Código já foi utilizado"

#### 5.2 Teste: Código Expira Após 8 Minutos
- [ ] Solicitar código
- [ ] Aguardar 8+ minutos
- [ ] Tentar usar código
- [ ] Esperado: Erro "Código expirado"

#### 5.3 Teste: Máximo 5 Tentativas
- [ ] Solicitar código
- [ ] Tentar 6 vezes com código incorreto
- [ ] Esperado: Após 5ª tentativa, bloqueado

#### 5.4 Teste: Email Não Cadastrado
- [ ] Tentar fazer login com email não cadastrado
- [ ] Esperado: Erro "Email não cadastrado no sistema"

#### 5.5 Teste: Usuário Inativo Não Pode Fazer Login
- [ ] Desativar usuário no banco
- [ ] Tentar fazer login
- [ ] Esperado: Erro "Usuário inativo"

#### 5.6 Teste: Token JWT Válido
- [ ] Fazer login
- [ ] Verificar token em localStorage
- [ ] Decodificar token (jwt.io)
- [ ] Esperado: Token contém email do usuário
- [ ] Esperado: Token tem expiração

#### 5.7 Teste: Código Deve Ter 6 Dígitos
- [ ] Tentar verificar com código de 5 dígitos
- [ ] Esperado: Erro de validação
- [ ] Tentar verificar com código de 7 dígitos
- [ ] Esperado: Erro de validação

---

### 6️⃣ TESTES DE PERFORMANCE

#### 6.1 Teste: Tempo de Resposta Request OTP
- [ ] Medir tempo de resposta
- [ ] Esperado: < 500ms

#### 6.2 Teste: Tempo de Resposta Verify OTP
- [ ] Medir tempo de resposta
- [ ] Esperado: < 500ms

#### 6.3 Teste: Tempo de Resposta Register
- [ ] Medir tempo de resposta
- [ ] Esperado: < 500ms

#### 6.4 Teste: Múltiplas Requisições Simultâneas
- [ ] Fazer 10 requisições simultâneas
- [ ] Esperado: Todas respondidas corretamente
- [ ] Esperado: Sem erros de concorrência

---

### 7️⃣ TESTES DE COMPATIBILIDADE

#### 7.1 Teste: Navegadores
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

#### 7.2 Teste: Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

#### 7.3 Teste: Conexões
- [ ] Conexão rápida (5G)
- [ ] Conexão lenta (3G)
- [ ] Conexão muito lenta (2G)

---

## 📊 CHECKLIST DE TESTES

### Backend
- [ ] 1.1 Request OTP com email válido
- [ ] 1.2 Request OTP com email inválido
- [ ] 1.3 Verify OTP com código correto
- [ ] 1.4 Verify OTP com código incorreto
- [ ] 1.5 Verify OTP com código expirado
- [ ] 1.6 Resend OTP
- [ ] 1.7 Register novo usuário
- [ ] 1.8 Register com email duplicado
- [ ] 1.9 Verify OTP com máximo de tentativas
- [ ] 1.10 Verify OTP com usuário inativo

### Frontend
- [ ] 2.1 Página OTP Login carrega
- [ ] 2.2 Validação de email
- [ ] 2.3 Solicitar código
- [ ] 2.4 Validação de código
- [ ] 2.5 Verificar código incorreto
- [ ] 2.6 Reenviar código
- [ ] 2.7 Voltar para email
- [ ] 2.8 Timer expiração
- [ ] 2.9 Máximo de tentativas
- [ ] 2.10 Login bem-sucedido
- [ ] 2.11 Página Register carrega
- [ ] 2.12 Validação de registro
- [ ] 2.13 Registrar novo usuário
- [ ] 2.14 Registrar com email duplicado
- [ ] 2.15 Link "Não tem conta?"
- [ ] 2.16 Link "Voltar para Login"
- [ ] 2.17 Redirecionar /login
- [ ] 2.18 Usuário logado não acessa login

### Integração
- [ ] 3.1 Fluxo completo: novo usuário
- [ ] 3.2 Fluxo completo: usuário existente
- [ ] 3.3 Fluxo: reenviar código
- [ ] 3.4 Fluxo: máximo de tentativas

### Banco de Dados
- [ ] 4.1 Tabelas criadas
- [ ] 4.2 Colunas em users
- [ ] 4.3 Dados em login_otp
- [ ] 4.4 Dados em login_audit
- [ ] 4.5 Atualização em users

### Segurança
- [ ] 5.1 Código não pode ser reutilizado
- [ ] 5.2 Código expira após 8 minutos
- [ ] 5.3 Máximo 5 tentativas
- [ ] 5.4 Email não cadastrado
- [ ] 5.5 Usuário inativo não pode fazer login
- [ ] 5.6 Token JWT válido
- [ ] 5.7 Código deve ter 6 dígitos

### Performance
- [ ] 6.1 Tempo de resposta request OTP
- [ ] 6.2 Tempo de resposta verify OTP
- [ ] 6.3 Tempo de resposta register
- [ ] 6.4 Múltiplas requisições simultâneas

### Compatibilidade
- [ ] 7.1 Navegadores (Chrome, Firefox, Safari, Edge)
- [ ] 7.2 Dispositivos (Desktop, Tablet, Mobile)
- [ ] 7.3 Conexões (5G, 3G, 2G)

---

**Total de Testes:** 60+
**Status:** Pronto para Execução
**Data:** 27 de Agosto de 2026
