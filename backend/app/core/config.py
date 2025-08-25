from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Sistema de Tickets TI"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql://tickets_user:tickets_password@localhost:5432/tickets_db"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # LDAP Configuration
    LDAP_SERVER: str = "ldap://your-ad-server.local:389"
    LDAP_BASE_DN: str = "DC=empresa,DC=local"
    LDAP_BIND_DN: str = "CN=service-account,OU=Users,DC=empresa,DC=local"
    LDAP_BIND_PASSWORD: str = "service-account-password"
    LDAP_USER_SEARCH_BASE: str = "OU=Users,DC=empresa,DC=local"
    LDAP_GROUP_SEARCH_BASE: str = "OU=Groups,DC=empresa,DC=local"
    
    # Email Configuration
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    
    # File Upload
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "pdf,doc,docx,txt,png,jpg,jpeg,gif"
    
    # Admin Users (fallback when LDAP is not available)
    ADMIN_EMAIL: str = "admin@empresa.local"
    ADMIN_PASSWORD: str = "admin123"  # Change in production
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
