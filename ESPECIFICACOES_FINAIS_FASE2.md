# 📋 ESPECIFICAÇÕES FINAIS - FASE 2

## ✅ CONFIRMAÇÕES DO USUÁRIO

| Item | Especificação |
|------|---------------|
| **1. Tempo de Expiração** | 8 minutos |
| **2. Máximo de Tentativas** | 5 tentativas |
| **3. Comprimento do Código** | 6 dígitos |
| **4. Login LDAP** | ❌ REMOVER |
| **5. Ordem de Prioridade** | OTP primeiro, depois Performance |
| **6. Login Username/Senha** | ❌ REMOVER completamente |

---

## 🎯 OBJETIVO FINAL

Implementar **Passwordless Authentication com OTP** removendo completamente:
- ❌ Login com username/senha
- ❌ Autenticação LDAP
- ✅ Novo: Login com email + código OTP (8 minutos, 6 dígitos)
- ✅ Novo: Validação de email cadastrado
- ✅ Novo: Usuários não cadastrados podem se registrar

---

## 🔍 ANÁLISE DE IMPACTO - O QUE NÃO SERÁ AFETADO

### **✅ SEGURO - Não será alterado**

| Componente | Motivo |
|-----------|--------|
| Sistema de Tickets | Não depende de login |
| Dashboard | Usa JWT token (mantém igual) |
| Comentários | Usa user_id (mantém igual) |
| Avaliações | Usa user_id (mantém igual) |
| WebSocket | Usa JWT token (mantém igual) |
| Upload de Arquivos | Usa user_id (mantém igual) |
| Relatórios | Usa user_id (mantém igual) |
| RBAC (Roles) | Mantém igual (user, technician, admin) |
| Banco de Dados (geral) | Apenas adiciona tabelas, não altera existentes |

### **⚠️ SERÁ ALTERADO - Com cuidado**

| Componente | Alteração | Cuidado |
|-----------|-----------|---------|
| Tabela `users` | Remover coluna `hashed_password` | Backup antes |
| Tabela `users` | Remover coluna `is_ldap_user` | Backup antes |
| Rota `/auth/login` | Remover completamente | Criar novas rotas |
| Rota `/auth/refresh` | Manter igual | Sem alteração |
| Rota `/auth/me` | Manter igual | Sem alteração |
| Frontend Login.js | Reescrever completamente | Criar OTPLogin.js novo |
| AuthContext.js | Atualizar métodos | Manter estrutura |
| Nginx config | Sem alteração | Sem alteração |

---

## 📊 ESTRUTURA DE DADOS FINAL

### **Tabela: `users` (ALTERADA)**

```sql
-- ANTES
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,  -- ❌ REMOVER
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('user', 'technician', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    is_ldap_user BOOLEAN DEFAULT TRUE,  -- ❌ REMOVER
    hashed_password VARCHAR(255),  -- ❌ REMOVER
    tutorial_viewed BOOLEAN DEFAULT FALSE,
    company_id INTEGER FOREIGN KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DEPOIS
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,  -- ✅ MANTÉM (agora é identificador)
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('user', 'technician', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    tutorial_viewed BOOLEAN DEFAULT FALSE,
    company_id INTEGER FOREIGN KEY,
    last_login DATETIME,  -- ✅ NOVO
    last_login_ip VARCHAR(45),  -- ✅ NOVO
    login_attempts INTEGER DEFAULT 0,  -- ✅ NOVO
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### **Tabela: `login_otp` (NOVA)**

```sql
CREATE TABLE login_otp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,  -- 8 minutos após criação
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- ÍNDICES
CREATE INDEX idx_login_otp_email ON login_otp(email);
CREATE INDEX idx_login_otp_code ON login_otp(code);
CREATE INDEX idx_login_otp_expires_at ON login_otp(expires_at);
```

### **Tabela: `login_audit` (NOVA)**

```sql
CREATE TABLE login_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER FOREIGN KEY,  -- NULL se falhou
    email VARCHAR(255),  -- Email que tentou fazer login
    login_method VARCHAR(50),  -- 'otp'
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN,
    reason VARCHAR(255),  -- Se falhou, por quê
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES
CREATE INDEX idx_login_audit_user_id ON login_audit(user_id);
CREATE INDEX idx_login_audit_email ON login_audit(email);
CREATE INDEX idx_login_audit_created_at ON login_audit(created_at);
```

---

## 🔧 ROTAS A REMOVER

### **❌ Remover Completamente**

```python
# app/api/api_v1/endpoints/auth.py

# REMOVER:
@router.post("/login")  # ❌ REMOVER
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # Lógica de login com username/senha
    pass

# REMOVER:
@router.post("/refresh")  # ⚠️ MANTER (apenas JWT refresh)
async def refresh_token(current_user: User = Depends(get_current_user)):
    pass

# REMOVER:
# Qualquer referência a LDAP
# Qualquer referência a username
# Qualquer referência a hashed_password
```

---

## 🔧 ROTAS A CRIAR

### **✅ Criar Novas Rotas**

```python
# app/api/api_v1/endpoints/auth.py

@router.post("/request-otp")
async def request_otp(
    request: Request,
    email_request: EmailRequest,
    db: Session = Depends(get_db)
):
    """
    Solicitar código OTP para login
    
    Validações:
    1. Email válido (formato)
    2. Email cadastrado no sistema
    3. Usuário ativo (is_active = True)
    4. Limpar OTPs anteriores expirados
    5. Gerar novo código 6 dígitos
    6. Salvar no banco com expiração 8 min
    7. Enviar email com código
    8. Registrar tentativa em auditoria
    
    Response:
    {
        "message": "Código enviado para seu email",
        "expires_in": 480  # 8 minutos em segundos
    }
    
    Erros:
    - 400: Email inválido
    - 404: Email não cadastrado
    - 403: Usuário inativo
    - 429: Muitas tentativas (rate limit)
    """
    pass

@router.post("/verify-otp")
async def verify_otp(
    request: Request,
    otp_request: OTPVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verificar código OTP e fazer login
    
    Validações:
    1. Email válido
    2. Código válido (6 dígitos)
    3. OTP existe no banco
    4. OTP não expirou (< 8 min)
    5. Tentativas < 5
    6. OTP não foi usado
    7. Usuário existe e está ativo
    8. Gerar JWT token
    9. Marcar OTP como usado
    10. Atualizar last_login em users
    11. Registrar sucesso em auditoria
    
    Response:
    {
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "token_type": "bearer",
        "user": {
            "id": 1,
            "email": "user@example.com",
            "full_name": "João Silva",
            "role": "user"
        }
    }
    
    Erros:
    - 400: Código inválido
    - 401: Código expirado
    - 401: Código incorreto (tentativa X/5)
    - 403: Muitas tentativas
    - 404: Email não encontrado
    - 403: Usuário inativo
    """
    pass

@router.post("/resend-otp")
async def resend_otp(
    request: Request,
    email_request: EmailRequest,
    db: Session = Depends(get_db)
):
    """
    Reenviar código OTP
    
    Validações:
    1. Email válido
    2. Email cadastrado
    3. Usuário ativo
    4. Deletar OTP anterior
    5. Gerar novo código
    6. Enviar email
    7. Registrar em auditoria
    
    Response:
    {
        "message": "Novo código enviado",
        "expires_in": 480
    }
    
    Erros:
    - 400: Email inválido
    - 404: Email não cadastrado
    - 403: Usuário inativo
    - 429: Muitas tentativas de resend
    """
    pass

@router.post("/register")  # ✅ NOVO - Para usuários não cadastrados
async def register(
    request: Request,
    register_request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registrar novo usuário
    
    Validações:
    1. Email válido
    2. Email não existe
    3. Nome válido
    4. Criar usuário com role 'user' padrão
    5. Enviar email de confirmação
    6. Registrar em auditoria
    
    Response:
    {
        "message": "Usuário registrado com sucesso",
        "email": "user@example.com"
    }
    
    Erros:
    - 400: Email inválido
    - 409: Email já cadastrado
    - 400: Dados incompletos
    """
    pass

# MANTER:
@router.get("/me")  # ✅ MANTER (sem alteração)
async def get_current_user(current_user: User = Depends(get_current_user)):
    pass

@router.post("/refresh")  # ✅ MANTER (sem alteração)
async def refresh_token(current_user: User = Depends(get_current_user)):
    pass

@router.post("/logout")  # ✅ MANTER (sem alteração)
async def logout(current_user: User = Depends(get_current_user)):
    pass
```

---

## 📝 SCHEMAS PYDANTIC A CRIAR

```python
# app/schemas/schemas.py

class EmailRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, regex="^[0-9]{6}$")

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=3, max_length=255)
    department: Optional[str] = None

class LoginOTPSchema(BaseModel):
    id: int
    email: str
    code: str
    attempts: int
    max_attempts: int
    created_at: datetime
    expires_at: datetime
    used: bool
    ip_address: Optional[str]
    user_agent: Optional[str]

class LoginAuditSchema(BaseModel):
    id: int
    user_id: Optional[int]
    email: str
    login_method: str
    ip_address: Optional[str]
    success: bool
    reason: Optional[str]
    created_at: datetime

class UserResponseSchema(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    department: Optional[str]
    
    class Config:
        from_attributes = True

class LoginResponseSchema(BaseModel):
    access_token: str
    token_type: str
    user: UserResponseSchema
```

---

## 📧 TEMPLATE DE EMAIL

```html
<!-- app/templates/otp_email.html -->

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #06b6d4; color: white; padding: 20px; }
        .content { padding: 20px; }
        .code { 
            font-size: 32px; 
            font-weight: bold; 
            letter-spacing: 5px;
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
        }
        .warning { color: #ef4444; font-size: 12px; margin-top: 20px; }
        .footer { background: #f1f5f9; padding: 10px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Código de Acesso</h1>
        </div>
        
        <div class="content">
            <p>Olá,</p>
            
            <p>Você solicitou um código para fazer login no Sistema de Tickets ALG.</p>
            
            <p>Seu código de acesso é:</p>
            
            <div class="code">{{ code }}</div>
            
            <p>Este código expira em <strong>8 minutos</strong>.</p>
            
            <p>Se você não solicitou este código, ignore este email.</p>
            
            <div class="warning">
                ⚠️ <strong>Aviso de Segurança:</strong> Nunca compartilhe este código com ninguém. 
                O suporte nunca pedirá seu código.
            </div>
        </div>
        
        <div class="footer">
            <p>Sistema de Tickets ALG Soluções em Tecnologia</p>
            <p>{{ current_year }} - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>
```

---

## 🎨 FRONTEND - ESTRUTURA DE ARQUIVOS

### **Remover:**
```
❌ frontend/src/pages/Login.js (remover completamente)
❌ Qualquer referência a username
❌ Qualquer referência a LDAP
```

### **Criar:**
```
✅ frontend/src/pages/OTPLogin.js (nova página)
✅ frontend/src/components/EmailStep.js (novo componente)
✅ frontend/src/components/CodeStep.js (novo componente)
✅ frontend/src/pages/Register.js (novo - registro de usuários)
✅ frontend/src/components/RegisterForm.js (novo componente)
```

### **Atualizar:**
```
✅ frontend/src/contexts/AuthContext.js (atualizar métodos)
✅ frontend/src/services/api.js (atualizar endpoints)
✅ frontend/src/App.js (atualizar rotas)
✅ frontend/src/index.css (sem alteração)
```

---

## 🔐 VALIDAÇÕES CRÍTICAS

### **1. Validação de Email Cadastrado**

```python
def validate_email_exists(email: str, db: Session) -> User:
    """
    Validar se email existe e usuário está ativo
    
    Retorna: User object
    Lança: HTTPException 404 se não existe
    Lança: HTTPException 403 se inativo
    """
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email não cadastrado no sistema"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Usuário inativo. Contate o administrador."
        )
    
    return user
```

### **2. Validação de Código OTP**

```python
def validate_otp_code(email: str, code: str, db: Session) -> LoginOTP:
    """
    Validar código OTP
    
    Verificações:
    1. OTP existe
    2. OTP não expirou
    3. Tentativas < 5
    4. OTP não foi usado
    """
    otp = db.query(LoginOTP).filter(
        LoginOTP.email == email,
        LoginOTP.code == code
    ).first()
    
    if not otp:
        raise HTTPException(status_code=400, detail="Código inválido")
    
    if datetime.utcnow() > otp.expires_at:
        raise HTTPException(status_code=401, detail="Código expirado")
    
    if otp.attempts >= otp.max_attempts:
        raise HTTPException(status_code=403, detail="Muitas tentativas")
    
    if otp.used:
        raise HTTPException(status_code=400, detail="Código já foi usado")
    
    return otp
```

### **3. Validação de Novo Usuário**

```python
def validate_new_user(email: str, db: Session) -> bool:
    """
    Validar se email pode ser registrado
    
    Retorna: True se pode registrar
    Lança: HTTPException 409 se email já existe
    """
    existing_user = db.query(User).filter(User.email == email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email já cadastrado no sistema"
        )
    
    return True
```

---

## 🛡️ PROTEÇÕES CONTRA ABUSO

### **Rate Limiting**

```python
# Limitar requisições de OTP por email
# Máximo 3 requisições por 15 minutos por email

# Limitar tentativas de verificação
# Máximo 5 tentativas por OTP

# Limitar requisições de resend
# Máximo 3 resends por 30 minutos por email
```

### **Limpeza de OTPs Expirados**

```python
# Executar a cada 5 minutos
@app.task
def cleanup_expired_otps():
    """Deletar OTPs expirados"""
    db.query(LoginOTP).filter(
        LoginOTP.expires_at < datetime.utcnow()
    ).delete()
    db.commit()
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Backend**
- [ ] Criar tabelas (login_otp, login_audit)
- [ ] Adicionar colunas em users
- [ ] Criar índices
- [ ] Criar schemas Pydantic
- [ ] Criar modelos SQLAlchemy
- [ ] Criar utilitários OTP
- [ ] Criar rotas (request-otp, verify-otp, resend-otp, register)
- [ ] Criar validações
- [ ] Criar template de email
- [ ] Atualizar email_service.py
- [ ] Remover rotas antigas (/login com username/senha)
- [ ] Remover referências a LDAP
- [ ] Remover referências a hashed_password
- [ ] Testes unitários

### **Fase 2: Frontend**
- [ ] Criar OTPLogin.js
- [ ] Criar EmailStep.js
- [ ] Criar CodeStep.js
- [ ] Criar Register.js
- [ ] Criar RegisterForm.js
- [ ] Atualizar AuthContext.js
- [ ] Atualizar api.js
- [ ] Atualizar App.js (rotas)
- [ ] Remover Login.js antigo
- [ ] Testes E2E

### **Fase 3: Deploy**
- [ ] Backup do banco
- [ ] Executar migrations
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Testes em produção
- [ ] Monitorar logs

---

## ⚠️ CUIDADOS ESPECIAIS

### **1. Não Afete Outras Funcionalidades**

```
✅ SEGURO - Não alterar:
- Sistema de tickets (usa user_id)
- Dashboard (usa JWT)
- Comentários (usa user_id)
- Avaliações (usa user_id)
- WebSocket (usa JWT)
- Upload (usa user_id)
- RBAC (usa role)
- Relatórios (usa user_id)
```

### **2. Backup Antes de Começar**

```bash
# Backup do banco
cp /var/www/sistema-tickets-ti/backend/tickets.db \
   /var/www/sistema-tickets-ti/backend/tickets.db.backup.$(date +%Y%m%d_%H%M%S)

# Backup do código
git commit -m "Backup antes de implementar OTP"
```

### **3. Testes Antes de Deploy**

```
✅ Testes a fazer:
- Requisitar OTP com email válido
- Requisitar OTP com email inválido
- Requisitar OTP com email não cadastrado
- Verificar OTP correto
- Verificar OTP incorreto (5 tentativas)
- Verificar OTP expirado
- Reenviar OTP
- Registrar novo usuário
- Login com novo usuário
- Verificar auditoria de login
- Verificar que tickets funcionam normalmente
- Verificar que dashboard funciona normalmente
```

---

## 📊 RESUMO FINAL

| Item | Valor |
|------|-------|
| **Tempo de Expiração OTP** | 8 minutos |
| **Máximo de Tentativas** | 5 |
| **Comprimento do Código** | 6 dígitos |
| **Login LDAP** | ❌ Removido |
| **Login Username/Senha** | ❌ Removido |
| **Novo: OTP** | ✅ Implementado |
| **Novo: Registro de Usuários** | ✅ Implementado |
| **Novo: Validação de Email** | ✅ Implementado |
| **Tabelas Novas** | 2 (login_otp, login_audit) |
| **Colunas Removidas** | 2 (hashed_password, is_ldap_user) |
| **Colunas Adicionadas** | 3 (last_login, last_login_ip, login_attempts) |
| **Rotas Removidas** | 1 (/auth/login) |
| **Rotas Adicionadas** | 4 (request-otp, verify-otp, resend-otp, register) |
| **Tempo Estimado** | 26-30 horas |

---

**Especificações Finais - Fase 2**
**Data:** Agosto 2026
**Status:** Pronto para Implementação
**Próximo Passo:** Iniciar implementação do Backend
