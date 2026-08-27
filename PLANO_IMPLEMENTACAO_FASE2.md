# 📋 PLANO DE IMPLEMENTAÇÃO - FASE 2

## 🎯 OBJETIVO

Implementar melhorias de performance e alterar o sistema de autenticação para **Passwordless Login com OTP (One-Time Password)**.

---

## 📦 FUNCIONALIDADES A IMPLEMENTAR

### **1. PERFORMANCE - Redis Cache (2.1)**
- **Status:** Planejado
- **Esforço:** 12-16 horas
- **Impacto:** Muito Alto
- **Descrição:** Cache distribuído para dashboard, filtros, usuários

### **2. PERFORMANCE - Query Optimization (2.2)**
- **Status:** Planejado
- **Esforço:** 8-12 horas
- **Impacto:** Alto
- **Descrição:** Usar joinedload, selectinload no SQLAlchemy

### **3. PERFORMANCE - Database Indexing (2.3)**
- **Status:** Planejado
- **Esforço:** 2-3 horas
- **Impacto:** Alto
- **Descrição:** Adicionar índices em status, created_by, assigned_to, created_at

### **4. AUTENTICAÇÃO - Passwordless Login com OTP** ⭐ **NOVO**
- **Status:** Planejado
- **Esforço:** 16-20 horas
- **Impacto:** Alto
- **Descrição:** Login por email + código OTP 6 dígitos

---

## 🔐 FUNCIONALIDADE NOVA: PASSWORDLESS LOGIN COM OTP

### **O que é?**

**Passwordless Authentication (Autenticação sem Senha)** é um método de login onde o usuário não precisa de senha. Em vez disso:

1. Usuário insere seu **email**
2. Sistema gera um **código aleatório de 6 dígitos**
3. Código é enviado por **email**
4. Usuário insere o código
5. Sistema valida e faz **login automático**

### **Exemplos de Uso**

- ✅ **Slack** - Login com email + código
- ✅ **Discord** - Opção de login sem senha
- ✅ **GitHub** - Backup codes
- ✅ **Microsoft** - Passwordless sign-in
- ✅ **Google** - Passkeys

### **Vantagens**

| Vantagem | Descrição |
|----------|-----------|
| 🔒 **Mais Seguro** | Sem senhas fracas, sem risco de vazamento |
| 👤 **Melhor UX** | Usuário não precisa lembrar senha |
| ⚡ **Mais Rápido** | Login em 2 passos (email + código) |
| 📱 **Mobile Friendly** | Ideal para aplicativos mobile |
| 🛡️ **Sem Phishing** | Código é único e temporal |
| 📊 **Rastreável** | Cada login é registrado |

### **Fluxo de Login Atual (Será Alterado)**

```
┌─────────────────┐
│  Usuário        │
│  Insere:        │
│  - Username     │
│  - Senha        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Backend valida credenciais         │
│  - Busca usuário por username       │
│  - Compara hash de senha            │
│  - Gera JWT token                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Frontend recebe token              │
│  - Armazena em localStorage         │
│  - Redireciona para /dashboard      │
└─────────────────────────────────────┘
```

### **Fluxo de Login Novo (Passwordless OTP)**

```
┌──────────────────┐
│  Usuário         │
│  Insere email    │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Backend (POST /auth/request-otp)        │
│  1. Valida email                         │
│  2. Gera código 6 dígitos aleatório      │
│  3. Salva em banco (com expiração 10min) │
│  4. Envia email com código               │
│  5. Retorna: "Código enviado"            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Frontend (Tela de Código)               │
│  - Mostra campo para inserir código      │
│  - Timer de 10 minutos                   │
│  - Botão "Reenviar código"               │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Usuário insere código                   │
│  (ex: 123456)                            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Backend (POST /auth/verify-otp)         │
│  1. Valida código                        │
│  2. Verifica expiração (< 10 min)        │
│  3. Valida tentativas (máx 5)            │
│  4. Gera JWT token                       │
│  5. Deleta código do banco               │
│  6. Retorna token                        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Frontend                                │
│  - Recebe token                          │
│  - Armazena em localStorage              │
│  - Redireciona para /dashboard           │
│  - Registra login em auditoria           │
└──────────────────────────────────────────┘
```

---

## 🗄️ ALTERAÇÕES NO BANCO DE DADOS

### **Nova Tabela: `login_otp`**

```sql
CREATE TABLE login_otp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Índices
CREATE INDEX idx_login_otp_email ON login_otp(email);
CREATE INDEX idx_login_otp_code ON login_otp(code);
CREATE INDEX idx_login_otp_expires_at ON login_otp(expires_at);
```

### **Alterações na Tabela `users`**

```sql
-- Adicionar coluna para rastrear último login
ALTER TABLE users ADD COLUMN last_login DATETIME;
ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;

-- Índices
CREATE INDEX idx_users_email ON users(email);
```

### **Nova Tabela: `login_audit`**

```sql
CREATE TABLE login_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL FOREIGN KEY,
    login_method VARCHAR(50),  -- 'otp', 'ldap', 'local'
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN,
    reason VARCHAR(255),  -- Se falhou, por quê
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_audit_user_id ON login_audit(user_id);
CREATE INDEX idx_login_audit_created_at ON login_audit(created_at);
```

---

## 🔧 ALTERAÇÕES NO BACKEND

### **1. Nova Rota: Request OTP**

```python
# POST /api/v1/auth/request-otp
# Body: { "email": "user@example.com" }
# Response: { "message": "Código enviado para seu email", "expires_in": 600 }

@router.post("/request-otp")
async def request_otp(
    request: Request,
    email_request: EmailRequest,
    db: Session = Depends(get_db)
):
    """
    Solicitar código OTP para login
    
    1. Valida email
    2. Gera código 6 dígitos
    3. Salva no banco com expiração
    4. Envia email
    5. Retorna sucesso
    """
    pass
```

### **2. Nova Rota: Verify OTP**

```python
# POST /api/v1/auth/verify-otp
# Body: { "email": "user@example.com", "code": "123456" }
# Response: { "access_token": "...", "token_type": "bearer" }

@router.post("/verify-otp")
async def verify_otp(
    request: Request,
    otp_request: OTPVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verificar código OTP e fazer login
    
    1. Valida código
    2. Verifica expiração
    3. Verifica tentativas
    4. Gera JWT token
    5. Registra login em auditoria
    6. Retorna token
    """
    pass
```

### **3. Nova Rota: Resend OTP**

```python
# POST /api/v1/auth/resend-otp
# Body: { "email": "user@example.com" }
# Response: { "message": "Novo código enviado" }

@router.post("/resend-otp")
async def resend_otp(
    request: Request,
    email_request: EmailRequest,
    db: Session = Depends(get_db)
):
    """
    Reenviar código OTP
    
    1. Valida email
    2. Deleta código anterior
    3. Gera novo código
    4. Envia email
    5. Retorna sucesso
    """
    pass
```

### **4. Schemas Pydantic Novos**

```python
class EmailRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)

class LoginOTP(Base):
    id: int
    email: str
    code: str
    attempts: int
    max_attempts: int
    created_at: datetime
    expires_at: datetime
    used: bool
    ip_address: str
    user_agent: str
```

### **5. Serviço de Email**

```python
# Melhorar email_service.py para enviar código OTP

async def send_otp_email(email: str, code: str, expires_in_minutes: int = 10):
    """
    Enviar email com código OTP
    
    Template HTML:
    - Código em destaque
    - Tempo de expiração
    - Aviso de segurança
    - Link para suporte
    """
    pass
```

### **6. Utilitários**

```python
# Novo arquivo: app/utils/otp.py

import secrets
import string

def generate_otp_code(length: int = 6) -> str:
    """Gerar código OTP aleatório de 6 dígitos"""
    return ''.join(secrets.choice(string.digits) for _ in range(length))

def is_otp_expired(created_at: datetime, expires_at: datetime) -> bool:
    """Verificar se OTP expirou"""
    return datetime.utcnow() > expires_at

def validate_otp_attempts(attempts: int, max_attempts: int = 5) -> bool:
    """Verificar se ainda há tentativas disponíveis"""
    return attempts < max_attempts
```

---

## 🎨 ALTERAÇÕES NO FRONTEND

### **1. Nova Página: OTP Login**

```javascript
// frontend/src/pages/OTPLogin.js

export default function OTPLogin() {
  const [step, setStep] = useState('email'); // 'email' ou 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos
  const [attempts, setAttempts] = useState(0);

  // Passo 1: Solicitar OTP
  const handleRequestOTP = async () => {
    // POST /auth/request-otp
    // Muda para step 'code'
  };

  // Passo 2: Verificar OTP
  const handleVerifyOTP = async () => {
    // POST /auth/verify-otp
    // Se sucesso, faz login
  };

  // Reenviar código
  const handleResendOTP = async () => {
    // POST /auth/resend-otp
  };

  // Timer de expiração
  useEffect(() => {
    if (step === 'code' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, step]);

  return (
    <div className="login-container">
      {step === 'email' ? (
        <EmailStep onSubmit={handleRequestOTP} />
      ) : (
        <CodeStep 
          onSubmit={handleVerifyOTP}
          onResend={handleResendOTP}
          timeLeft={timeLeft}
          attempts={attempts}
        />
      )}
    </div>
  );
}
```

### **2. Componente: Email Step**

```javascript
// frontend/src/components/EmailStep.js

export default function EmailStep({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="auth-form">
      <h2>Fazer Login</h2>
      <p>Insira seu email para receber um código de acesso</p>
      
      <input
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      
      <button onClick={() => onSubmit(email)} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar Código'}
      </button>
    </div>
  );
}
```

### **3. Componente: Code Step**

```javascript
// frontend/src/components/CodeStep.js

export default function CodeStep({ onSubmit, onResend, timeLeft, attempts }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth-form">
      <h2>Verificar Código</h2>
      <p>Insira o código de 6 dígitos enviado para seu email</p>
      
      <input
        type="text"
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.slice(0, 6))}
        maxLength="6"
        disabled={loading}
        autoFocus
      />
      
      <div className="timer">
        ⏱️ Expira em: {formatTime(timeLeft)}
      </div>
      
      <div className="attempts">
        Tentativas: {attempts}/5
      </div>
      
      <button onClick={() => onSubmit(code)} disabled={loading}>
        {loading ? 'Verificando...' : 'Verificar Código'}
      </button>
      
      <button onClick={onResend} variant="secondary">
        Reenviar Código
      </button>
    </div>
  );
}
```

### **4. Atualizar Login.js**

```javascript
// frontend/src/pages/Login.js

// Remover campos de username/password
// Redirecionar para OTPLogin

export default function Login() {
  return <Navigate to="/otp-login" replace />;
}
```

### **5. Atualizar AuthContext.js**

```javascript
// frontend/src/contexts/AuthContext.js

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Novo método: requestOTP
  const requestOTP = async (email) => {
    try {
      const response = await authAPI.post('/auth/request-otp', { email });
      return { success: true, expiresIn: response.data.expires_in };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  };

  // Novo método: verifyOTP
  const verifyOTP = async (email, code) => {
    try {
      const response = await authAPI.post('/auth/verify-otp', { email, code });
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      authAPI.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await getCurrentUser();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  };

  // Novo método: resendOTP
  const resendOTP = async (email) => {
    try {
      await authAPI.post('/auth/resend-otp', { email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  };

  const value = {
    user,
    token,
    loading,
    requestOTP,
    verifyOTP,
    resendOTP,
    logout,
    // ... outros métodos
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 📊 RESUMO DE ALTERAÇÕES

### **Backend**
| Item | Ação |
|------|------|
| Rotas | +3 novas (request-otp, verify-otp, resend-otp) |
| Modelos | +2 novos (LoginOTP, LoginAudit) |
| Schemas | +2 novos (EmailRequest, OTPVerifyRequest) |
| Serviços | Melhorar email_service.py |
| Utilitários | +1 novo (otp.py) |
| Banco | +2 tabelas, +4 colunas em users |

### **Frontend**
| Item | Ação |
|------|------|
| Páginas | +1 nova (OTPLogin.js) |
| Componentes | +2 novos (EmailStep, CodeStep) |
| Contextos | Atualizar AuthContext.js |
| Páginas | Atualizar Login.js |

### **Email**
| Item | Ação |
|------|------|
| Template | +1 novo (OTP email) |
| Serviço | Melhorar email_service.py |

---

## ⏱️ CRONOGRAMA ESTIMADO

| Fase | Duração | Tarefas |
|------|---------|---------|
| **1. Planejamento** | 2h | Definir specs, criar documentação |
| **2. Backend - OTP** | 6h | Rotas, modelos, lógica |
| **3. Backend - Email** | 3h | Template, envio |
| **4. Frontend - UI** | 5h | Páginas, componentes |
| **5. Frontend - Lógica** | 4h | AuthContext, integração |
| **6. Testes** | 4h | Testes unitários, E2E |
| **7. Deploy** | 2h | Deploy em produção |
| **TOTAL** | **26h** | |

---

## 🔄 ORDEM DE IMPLEMENTAÇÃO

### **Fase 1: Performance (Paralelo com OTP)**

1. **Database Indexing** (2-3h) - PRIMEIRO (rápido, impacto alto)
2. **Query Optimization** (8-12h) - SEGUNDO
3. **Redis Cache** (12-16h) - TERCEIRO

### **Fase 2: Passwordless OTP (Sequencial)**

1. **Backend - Modelos e Rotas** (6h)
2. **Backend - Email Service** (3h)
3. **Frontend - UI Components** (5h)
4. **Frontend - AuthContext** (4h)
5. **Testes e Deploy** (6h)

---

## ✅ CHECKLIST PRÉ-IMPLEMENTAÇÃO

- [ ] Confirmar requisitos do OTP
- [ ] Definir tempo de expiração (10 min?)
- [ ] Definir máximo de tentativas (5?)
- [ ] Definir comprimento do código (6 dígitos?)
- [ ] Confirmar template de email
- [ ] Confirmar SMTP configurado
- [ ] Confirmar Redis disponível
- [ ] Confirmar SQLAlchemy versão
- [ ] Backup do banco antes de começar
- [ ] Criar branch git para desenvolvimento

---

**Plano de Implementação - Fase 2**
**Data:** Agosto 2026
**Status:** Pronto para Implementação
**Próximo Passo:** Confirmação de requisitos
