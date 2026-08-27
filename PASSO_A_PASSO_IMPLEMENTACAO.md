# 🚀 PASSO A PASSO - IMPLEMENTAÇÃO OTP

## ⚠️ PRÉ-REQUISITOS

### **1. Backup Completo**
```bash
# Backup do banco de dados
cp /var/www/sistema-tickets-ti/backend/tickets.db \
   /var/www/sistema-tickets-ti/backend/tickets.db.backup.$(date +%Y%m%d_%H%M%S)

# Backup do código
cd /var/www/sistema-tickets-ti
git add .
git commit -m "Backup antes de implementar OTP - $(date +%Y%m%d_%H%M%S)"
git push origin ALG_TICKETS
```

### **2. Criar Branch de Desenvolvimento**
```bash
git checkout -b feature/passwordless-otp
```

### **3. Verificar Dependências**
```bash
# Backend
pip list | grep -E "fastapi|sqlalchemy|pydantic|python-jose"

# Frontend
npm list react react-router-dom axios
```

---

## 📋 FASE 1: BACKEND - MODELOS E BANCO DE DADOS

### **PASSO 1.1: Criar Modelos SQLAlchemy**

**Arquivo:** `backend/app/models/models.py`

```python
# Adicionar ao final do arquivo (ANTES de criar tabelas)

class LoginOTP(Base):
    __tablename__ = "login_otp"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(6), nullable=False, index=True)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

class LoginAudit(Base):
    __tablename__ = "login_audit"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    login_method = Column(String(50), default="otp")
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    success = Column(Boolean, default=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="login_audits")

# Adicionar relacionamento em User
class User(Base):
    # ... colunas existentes ...
    
    # ❌ REMOVER:
    # username = Column(String(100), unique=True, nullable=False)
    # hashed_password = Column(String(255), nullable=True)
    # is_ldap_user = Column(Boolean, default=True)
    
    # ✅ ADICIONAR:
    last_login = Column(DateTime, nullable=True)
    last_login_ip = Column(String(45), nullable=True)
    login_attempts = Column(Integer, default=0)
    
    # Relacionamento
    login_audits = relationship("LoginAudit", back_populates="user")
```

**Checklist:**
- [ ] Modelos criados
- [ ] Relacionamentos configurados
- [ ] Índices adicionados

---

### **PASSO 1.2: Criar Schemas Pydantic**

**Arquivo:** `backend/app/schemas/schemas.py`

```python
# Adicionar ao final do arquivo

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
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    class Config:
        from_attributes = True

class LoginAuditSchema(BaseModel):
    id: int
    user_id: Optional[int] = None
    email: str
    login_method: str
    ip_address: Optional[str] = None
    success: bool
    reason: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserResponseSchema(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    department: Optional[str] = None
    
    class Config:
        from_attributes = True

class LoginResponseSchema(BaseModel):
    access_token: str
    token_type: str
    user: UserResponseSchema
```

**Checklist:**
- [ ] Schemas criados
- [ ] Validações configuradas

---

### **PASSO 1.3: Criar Utilitários OTP**

**Arquivo:** `backend/app/utils/otp.py` (NOVO)

```python
import secrets
import string
from datetime import datetime, timedelta

def generate_otp_code(length: int = 6) -> str:
    """
    Gerar código OTP aleatório de 6 dígitos
    
    Args:
        length: Comprimento do código (padrão: 6)
    
    Returns:
        String com código de 6 dígitos
    
    Exemplo:
        >>> code = generate_otp_code()
        >>> len(code)
        6
        >>> code.isdigit()
        True
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))

def get_otp_expiration(minutes: int = 8) -> datetime:
    """
    Calcular data/hora de expiração do OTP
    
    Args:
        minutes: Minutos até expiração (padrão: 8)
    
    Returns:
        datetime com expiração
    
    Exemplo:
        >>> expires = get_otp_expiration(8)
        >>> expires > datetime.utcnow()
        True
    """
    return datetime.utcnow() + timedelta(minutes=minutes)

def is_otp_expired(expires_at: datetime) -> bool:
    """
    Verificar se OTP expirou
    
    Args:
        expires_at: Data/hora de expiração
    
    Returns:
        True se expirou, False caso contrário
    
    Exemplo:
        >>> expires = datetime.utcnow() - timedelta(minutes=1)
        >>> is_otp_expired(expires)
        True
    """
    return datetime.utcnow() > expires_at

def validate_otp_attempts(attempts: int, max_attempts: int = 5) -> bool:
    """
    Verificar se ainda há tentativas disponíveis
    
    Args:
        attempts: Número de tentativas já feitas
        max_attempts: Máximo de tentativas (padrão: 5)
    
    Returns:
        True se há tentativas, False caso contrário
    
    Exemplo:
        >>> validate_otp_attempts(4, 5)
        True
        >>> validate_otp_attempts(5, 5)
        False
    """
    return attempts < max_attempts

def get_client_ip(request) -> str:
    """
    Extrair IP do cliente da requisição
    
    Args:
        request: FastAPI Request object
    
    Returns:
        String com IP do cliente
    """
    if request.headers.get('x-forwarded-for'):
        return request.headers.get('x-forwarded-for').split(',')[0].strip()
    return request.client.host if request.client else "unknown"

def get_user_agent(request) -> str:
    """
    Extrair User-Agent da requisição
    
    Args:
        request: FastAPI Request object
    
    Returns:
        String com User-Agent
    """
    return request.headers.get('user-agent', 'unknown')
```

**Checklist:**
- [ ] Arquivo criado
- [ ] Funções implementadas
- [ ] Testes locais passando

---

### **PASSO 1.4: Atualizar Email Service**

**Arquivo:** `backend/app/services/email_service.py`

```python
# Adicionar nova função

async def send_otp_email(email: str, code: str, expires_in_minutes: int = 8):
    """
    Enviar email com código OTP
    
    Args:
        email: Email do destinatário
        code: Código OTP (6 dígitos)
        expires_in_minutes: Minutos até expiração
    
    Raises:
        Exception: Se falhar ao enviar email
    """
    try:
        # Carregar template
        template_path = "app/templates/otp_email.html"
        with open(template_path, 'r', encoding='utf-8') as f:
            template_html = f.read()
        
        # Substituir variáveis
        html_content = template_html.replace(
            "{{ code }}", code
        ).replace(
            "{{ current_year }}", str(datetime.now().year)
        )
        
        # Criar mensagem
        message = MessageSchema(
            subject="🔐 Seu código de acesso - Sistema de Tickets",
            recipients=[email],
            body=html_content,
            subtype="html"
        )
        
        # Enviar
        fm = FastMail(conf)
        await fm.send_message(message)
        
        logger.info(f"OTP email enviado para {email}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao enviar OTP email: {str(e)}")
        raise
```

**Checklist:**
- [ ] Função adicionada
- [ ] Template criado (próximo passo)

---

### **PASSO 1.5: Criar Template de Email**

**Arquivo:** `backend/app/templates/otp_email.html` (NOVO)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white; 
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content { 
            padding: 30px 20px; 
        }
        .content p {
            color: #333;
            line-height: 1.6;
            margin: 15px 0;
        }
        .code-box { 
            background: #f1f5f9;
            border: 2px solid #06b6d4;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        .code { 
            font-size: 36px; 
            font-weight: bold; 
            letter-spacing: 8px;
            color: #06b6d4;
            font-family: 'Courier New', monospace;
        }
        .timer {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        .warning { 
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning strong {
            color: #d97706;
        }
        .warning p {
            margin: 5px 0;
            font-size: 13px;
            color: #92400e;
        }
        .footer { 
            background: #f9fafb;
            padding: 20px; 
            text-align: center; 
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
        }
        .support-link {
            color: #06b6d4;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Código de Acesso</h1>
            <p>Sistema de Tickets ALG</p>
        </div>
        
        <div class="content">
            <p>Olá,</p>
            
            <p>Você solicitou um código para fazer login no <strong>Sistema de Tickets ALG</strong>.</p>
            
            <p>Seu código de acesso é:</p>
            
            <div class="code-box">
                <div class="code">{{ code }}</div>
                <div class="timer">⏱️ Expira em 8 minutos</div>
            </div>
            
            <p><strong>Como usar:</strong></p>
            <ol>
                <li>Copie o código acima</li>
                <li>Volte para a página de login</li>
                <li>Cole o código no campo indicado</li>
                <li>Clique em "Verificar Código"</li>
            </ol>
            
            <div class="warning">
                <strong>⚠️ Aviso de Segurança:</strong>
                <p>• Nunca compartilhe este código com ninguém</p>
                <p>• O suporte nunca pedirá seu código</p>
                <p>• Se você não solicitou este código, ignore este email</p>
            </div>
            
            <p>Se tiver dúvidas, <a href="https://ticket.algti.com/support" class="support-link">clique aqui</a> para contatar o suporte.</p>
        </div>
        
        <div class="footer">
            <p><strong>Sistema de Tickets ALG Soluções em Tecnologia</strong></p>
            <p>{{ current_year }} - Todos os direitos reservados</p>
            <p><a href="https://algti.com" class="support-link">www.algti.com</a></p>
        </div>
    </div>
</body>
</html>
```

**Checklist:**
- [ ] Template criado
- [ ] Variáveis corretas ({{ code }}, {{ current_year }})

---

### **PASSO 1.6: Criar Rotas de Autenticação**

**Arquivo:** `backend/app/api/api_v1/endpoints/auth.py`

```python
# REMOVER COMPLETAMENTE:
# - @router.post("/login") com username/senha
# - Qualquer referência a LDAP
# - Qualquer referência a hashed_password

# ADICIONAR:

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.models import User, LoginOTP, LoginAudit
from app.schemas.schemas import (
    EmailRequest, OTPVerifyRequest, RegisterRequest,
    LoginResponseSchema, UserResponseSchema
)
from app.services.email_service import send_otp_email
from app.utils.otp import (
    generate_otp_code, get_otp_expiration, is_otp_expired,
    validate_otp_attempts, get_client_ip, get_user_agent
)
from app.utils.logger import logger

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/request-otp")
async def request_otp(
    request: Request,
    email_request: EmailRequest,
    db: Session = Depends(get_db)
):
    """
    Solicitar código OTP para login
    
    Validações:
    1. Email válido
    2. Email cadastrado
    3. Usuário ativo
    4. Limpar OTPs anteriores expirados
    5. Gerar novo código
    6. Enviar email
    7. Registrar em auditoria
    """
    try:
        email = email_request.email.lower()
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        # 1. Validar email cadastrado
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Registrar tentativa falhada
            audit = LoginAudit(
                email=email,
                login_method="otp",
                ip_address=client_ip,
                user_agent=user_agent,
                success=False,
                reason="Email não cadastrado"
            )
            db.add(audit)
            db.commit()
            
            raise HTTPException(
                status_code=404,
                detail="Email não cadastrado no sistema"
            )
        
        # 2. Validar usuário ativo
        if not user.is_active:
            audit = LoginAudit(
                user_id=user.id,
                email=email,
                login_method="otp",
                ip_address=client_ip,
                user_agent=user_agent,
                success=False,
                reason="Usuário inativo"
            )
            db.add(audit)
            db.commit()
            
            raise HTTPException(
                status_code=403,
                detail="Usuário inativo. Contate o administrador."
            )
        
        # 3. Limpar OTPs anteriores expirados
        db.query(LoginOTP).filter(
            LoginOTP.email == email,
            LoginOTP.expires_at < datetime.utcnow()
        ).delete()
        db.commit()
        
        # 4. Gerar novo código
        code = generate_otp_code(6)
        expires_at = get_otp_expiration(8)  # 8 minutos
        
        # 5. Salvar no banco
        otp = LoginOTP(
            email=email,
            code=code,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=user_agent
        )
        db.add(otp)
        db.commit()
        
        # 6. Enviar email
        await send_otp_email(email, code, expires_in_minutes=8)
        
        # 7. Registrar em auditoria
        audit = LoginAudit(
            user_id=user.id,
            email=email,
            login_method="otp",
            ip_address=client_ip,
            user_agent=user_agent,
            success=True,
            reason="OTP enviado"
        )
        db.add(audit)
        db.commit()
        
        logger.info(f"OTP enviado para {email}")
        
        return {
            "message": "Código enviado para seu email",
            "expires_in": 480  # 8 minutos em segundos
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao solicitar OTP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar requisição"
        )

@router.post("/verify-otp")
async def verify_otp(
    request: Request,
    otp_request: OTPVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verificar código OTP e fazer login
    """
    try:
        email = otp_request.email.lower()
        code = otp_request.code
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        # 1. Buscar OTP
        otp = db.query(LoginOTP).filter(
            LoginOTP.email == email,
            LoginOTP.code == code
        ).first()
        
        if not otp:
            raise HTTPException(
                status_code=400,
                detail="Código inválido"
            )
        
        # 2. Verificar expiração
        if is_otp_expired(otp.expires_at):
            raise HTTPException(
                status_code=401,
                detail="Código expirado"
            )
        
        # 3. Verificar tentativas
        if not validate_otp_attempts(otp.attempts, 5):
            raise HTTPException(
                status_code=403,
                detail="Máximo de tentativas atingido"
            )
        
        # 4. Verificar se já foi usado
        if otp.used:
            raise HTTPException(
                status_code=400,
                detail="Código já foi utilizado"
            )
        
        # 5. Buscar usuário
        user = db.query(User).filter(User.email == email).first()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="Usuário não encontrado ou inativo"
            )
        
        # 6. Marcar OTP como usado
        otp.used = True
        otp.used_at = datetime.utcnow()
        
        # 7. Atualizar último login do usuário
        user.last_login = datetime.utcnow()
        user.last_login_ip = client_ip
        user.login_attempts = 0
        
        # 8. Gerar JWT token
        access_token = create_access_token(subject=user.email)
        
        # 9. Registrar sucesso em auditoria
        audit = LoginAudit(
            user_id=user.id,
            email=email,
            login_method="otp",
            ip_address=client_ip,
            user_agent=user_agent,
            success=True,
            reason="Login bem-sucedido"
        )
        
        db.add(audit)
        db.commit()
        
        logger.info(f"Login bem-sucedido para {email}")
        
        return LoginResponseSchema(
            access_token=access_token,
            token_type="bearer",
            user=UserResponseSchema.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar OTP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar requisição"
        )

@router.post("/resend-otp")
async def resend_otp(
    request: Request,
    email_request: EmailRequest,
    db: Session = Depends(get_db)
):
    """
    Reenviar código OTP
    """
    try:
        email = email_request.email.lower()
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        # 1. Validar email cadastrado
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Email não cadastrado"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="Usuário inativo"
            )
        
        # 2. Deletar OTP anterior
        db.query(LoginOTP).filter(
            LoginOTP.email == email,
            LoginOTP.used == False
        ).delete()
        db.commit()
        
        # 3. Gerar novo código
        code = generate_otp_code(6)
        expires_at = get_otp_expiration(8)
        
        # 4. Salvar
        otp = LoginOTP(
            email=email,
            code=code,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=user_agent
        )
        db.add(otp)
        db.commit()
        
        # 5. Enviar email
        await send_otp_email(email, code, expires_in_minutes=8)
        
        logger.info(f"OTP reenviado para {email}")
        
        return {
            "message": "Novo código enviado para seu email",
            "expires_in": 480
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao reenviar OTP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar requisição"
        )

@router.post("/register")
async def register(
    request: Request,
    register_request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registrar novo usuário
    """
    try:
        email = register_request.email.lower()
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        # 1. Validar email não existe
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email já cadastrado no sistema"
            )
        
        # 2. Criar novo usuário
        new_user = User(
            email=email,
            full_name=register_request.full_name,
            department=register_request.department,
            role="user",  # Role padrão
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # 3. Registrar em auditoria
        audit = LoginAudit(
            user_id=new_user.id,
            email=email,
            login_method="otp",
            ip_address=client_ip,
            user_agent=user_agent,
            success=True,
            reason="Novo usuário registrado"
        )
        db.add(audit)
        db.commit()
        
        logger.info(f"Novo usuário registrado: {email}")
        
        return {
            "message": "Usuário registrado com sucesso",
            "email": email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao registrar usuário: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar requisição"
        )

# MANTER (sem alteração):
@router.get("/me")
async def get_current_user(current_user: User = Depends(get_current_user)):
    """Obter dados do usuário atual"""
    return UserResponseSchema.from_orm(current_user)

@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """Renovar token JWT"""
    access_token = create_access_token(subject=current_user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout (apenas para auditoria)"""
    return {"message": "Logout realizado com sucesso"}
```

**Checklist:**
- [ ] Rotas criadas
- [ ] Validações implementadas
- [ ] Email service integrado
- [ ] Auditoria registrada

---

## 📊 PRÓXIMOS PASSOS

Após completar a Fase 1 (Backend), continuaremos com:

**FASE 2: Frontend**
- Criar OTPLogin.js
- Criar componentes (EmailStep, CodeStep)
- Atualizar AuthContext.js
- Atualizar App.js

**FASE 3: Testes e Deploy**
- Testes unitários
- Testes E2E
- Deploy em produção

---

**Passo a Passo - Implementação OTP**
**Data:** Agosto 2026
**Status:** Pronto para Começar
**Próximo Passo:** Executar PASSO 1.1
