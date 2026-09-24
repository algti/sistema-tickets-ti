from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.core.deps import get_current_user
from app.models.models import User as UserModel, UserRole, LoginOTP, LoginAudit
from app.schemas.schemas import (
    Token, User as UserSchema, EmailRequest, OTPVerifyRequest, 
    RegisterRequest, LoginResponseSchema, UserResponseSchema
)
from app.services.email_service import email_service
from app.utils.otp import (
    generate_otp_code, get_otp_expiration, is_otp_expired,
    validate_otp_attempts, get_client_ip, get_user_agent
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Rate limiting para solicitação de OTP (evita spam de email e DoS)
OTP_REQUEST_RATE_LIMIT_WINDOW_MINUTES = 10
OTP_REQUEST_RATE_LIMIT_MAX_PER_EMAIL = 3
OTP_REQUEST_RATE_LIMIT_MAX_PER_IP = 10


def check_otp_request_rate_limit(db: Session, email: str, client_ip: str) -> None:
    """
    Bloqueia novas solicitações de OTP se o email ou o IP excederem o limite
    de requisições dentro da janela de tempo configurada.
    """
    window_start = datetime.utcnow() - timedelta(minutes=OTP_REQUEST_RATE_LIMIT_WINDOW_MINUTES)

    email_requests = db.query(LoginOTP).filter(
        LoginOTP.email == email,
        LoginOTP.created_at >= window_start
    ).count()
    if email_requests >= OTP_REQUEST_RATE_LIMIT_MAX_PER_EMAIL:
        raise HTTPException(
            status_code=429,
            detail="Muitas solicitações de código para este email. Aguarde alguns minutos e tente novamente."
        )

    if client_ip and client_ip != "unknown":
        ip_requests = db.query(LoginOTP).filter(
            LoginOTP.ip_address == client_ip,
            LoginOTP.created_at >= window_start
        ).count()
        if ip_requests >= OTP_REQUEST_RATE_LIMIT_MAX_PER_IP:
            raise HTTPException(
                status_code=429,
                detail="Muitas solicitações de código a partir deste IP. Aguarde alguns minutos e tente novamente."
            )


@router.post("/request-otp")
async def request_otp(
    request: Request,
    email_request: EmailRequest,
    db: Session = Depends(get_db)
):
    """
    Solicitar código OTP para login
    """
    try:
        email = email_request.email.lower()
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        # 1. Validar email cadastrado
        user = db.query(UserModel).filter(UserModel.email == email).first()
        
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
        
        # 3. Verificar rate limit antes de gerar novo código
        check_otp_request_rate_limit(db, email, client_ip)
        
        # 4. Limpar OTPs anteriores expirados
        db.query(LoginOTP).filter(
            LoginOTP.email == email,
            LoginOTP.expires_at < datetime.utcnow()
        ).delete()
        db.commit()
        
        # 5. Gerar novo código
        code = generate_otp_code(6)
        expires_at = get_otp_expiration(8)  # 8 minutos
        
        # 6. Salvar no banco
        otp = LoginOTP(
            email=email,
            code=code,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=user_agent
        )
        db.add(otp)
        db.commit()
        
        # 7. Enviar email
        try:
            email_service.send_otp_email(email, code, expires_in_minutes=8)
        except Exception as e:
            logger.error(f"Erro ao enviar email para {email}: {str(e)}", exc_info=True)
            # Continuar mesmo se email falhar
        
        # 8. Registrar em auditoria
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
        
        return {
            "message": "Código enviado para seu email",
            "expires_in": 480  # 8 minutos em segundos
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar request-otp: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar requisição"
        )

@router.post("/verify-otp", response_model=LoginResponseSchema)
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
        
        # 1. Buscar o OTP mais recente não utilizado para este email (não filtra
        # pelo código digitado, para conseguirmos contabilizar tentativas erradas
        # mesmo quando o código informado está incorreto)
        otp = db.query(LoginOTP).filter(
            LoginOTP.email == email,
            LoginOTP.used == False
        ).order_by(LoginOTP.created_at.desc()).first()
        
        if not otp:
            raise HTTPException(
                status_code=400,
                detail="Código inválido ou não solicitado"
            )
        
        # 2. Verificar expiração
        if is_otp_expired(otp.expires_at):
            raise HTTPException(
                status_code=401,
                detail="Código expirado"
            )
        
        # 3. Verificar tentativas ANTES de validar o código, para bloquear brute-force
        if not validate_otp_attempts(otp.attempts, otp.max_attempts):
            raise HTTPException(
                status_code=403,
                detail="Máximo de tentativas atingido. Solicite um novo código."
            )
        
        # 4. Comparar o código informado - se estiver errado, incrementa as
        # tentativas e registra a falha em auditoria
        if otp.code != code:
            otp.attempts += 1
            db.commit()
            
            audit = LoginAudit(
                email=email,
                login_method="otp",
                ip_address=client_ip,
                user_agent=user_agent,
                success=False,
                reason="Código incorreto"
            )
            db.add(audit)
            db.commit()
            
            remaining = max(otp.max_attempts - otp.attempts, 0)
            raise HTTPException(
                status_code=400,
                detail=f"Código inválido. Tentativas restantes: {remaining}"
            )
        
        # 5. Buscar usuário
        user = db.query(UserModel).filter(UserModel.email == email).first()
        
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
        
        return LoginResponseSchema(
            access_token=access_token,
            token_type="bearer",
            user=UserResponseSchema.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
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
        user = db.query(UserModel).filter(UserModel.email == email).first()
        
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
        
        # 2. Verificar rate limit antes de gerar novo código
        check_otp_request_rate_limit(db, email, client_ip)
        
        # 3. Deletar OTP anterior
        db.query(LoginOTP).filter(
            LoginOTP.email == email,
            LoginOTP.used == False
        ).delete()
        db.commit()
        
        # 4. Gerar novo código
        code = generate_otp_code(6)
        expires_at = get_otp_expiration(8)
        
        # 5. Salvar
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
        try:
            email_service.send_otp_email(email, code, expires_in_minutes=8)
        except Exception as e:
            logger.error(f"Erro ao enviar email para {email}: {str(e)}", exc_info=True)
            # Continuar mesmo se email falhar
        
        return {
            "message": "Novo código enviado para seu email",
            "expires_in": 480
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar resend-otp: {str(e)}", exc_info=True)
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
        existing_user = db.query(UserModel).filter(UserModel.email == email).first()
        
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="Email já cadastrado no sistema"
            )
        
        # 2. Criar novo usuário
        new_user = UserModel(
            email=email,
            full_name=register_request.full_name,
            department=register_request.department,
            role=UserRole.user,  # Role padrão
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
        
        return {
            "message": "Usuário registrado com sucesso",
            "email": email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar requisição"
        )

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: UserModel = Depends(get_current_user)):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=current_user.email, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(current_user: UserModel = Depends(get_current_user)):
    """Logout endpoint"""
    return {"message": "Logout realizado com sucesso"}

