"""
Utilitário centralizado para gerenciamento de timezone
Garante que todos os timestamps usem o horário de Brasília (America/Sao_Paulo)
"""
from datetime import datetime, timezone, timedelta

# Offset do Brasil em relação a UTC (UTC-3)
BRAZIL_OFFSET = timedelta(hours=-3)

def get_brazil_now():
    """
    Retorna o datetime atual no horário de Brasília
    Equivalente a datetime.utcnow() mas ajustado para Brasil
    """
    return datetime.utcnow() + BRAZIL_OFFSET

def get_brazil_now_aware():
    """
    Retorna datetime atual timezone-aware no horário de Brasília
    """
    utc_now = datetime.now(timezone.utc)
    brazil_tz = timezone(BRAZIL_OFFSET)
    return utc_now.astimezone(brazil_tz)
