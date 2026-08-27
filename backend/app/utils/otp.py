"""
Utilitários para geração e validação de OTP (One-Time Password)
"""

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
