from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import json

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_admin
from app.models.models import User, SystemSettings
from app.schemas.schemas import SettingsResponse, SettingsUpdate

router = APIRouter()

# Default settings
DEFAULT_SETTINGS = {
    "general": {
        "system_name": "Sistema de Tickets TI",
        "company_name": "Empresa LTDA",
        "support_email": "suporte@empresa.com",
        "max_file_size": 10,
        "allowed_file_types": ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif",
        "timezone": "America/Sao_Paulo",
        "language": "pt-BR"
    },
    "sla": {
        "low_priority_hours": 72,
        "medium_priority_hours": 24,
        "high_priority_hours": 8,
        "urgent_priority_hours": 2,
        "auto_escalation": True,
        "escalation_hours": 2,
        "business_hours_only": False,
        "business_start_hour": 8,
        "business_end_hour": 18
    },
    "permissions": {
        "user_can_view_all_tickets": False,
        "user_can_edit_own_tickets": True,
        "user_can_close_own_tickets": False,
        "technician_can_view_reports": True,
        "auto_assign_tickets": True,
        "require_category": True,
        "allow_guest_tickets": False,
        "require_approval_for_closure": False
    },
    "integrations": {
        "ldap_enabled": False,
        "ldap_server": "",
        "ldap_port": 389,
        "ldap_base_dn": "",
        "ldap_user_dn": "",
        "ldap_bind_user": "",
        "ldap_bind_password": "",
        "smtp_enabled": False,
        "smtp_server": "",
        "smtp_port": 587,
        "smtp_username": "",
        "smtp_password": "",
        "smtp_use_tls": True,
        "smtp_from_email": "",
        "email_notifications_enabled": True,
        "webhook_enabled": False,
        "webhook_url": ""
    }
}

def get_setting_value(db: Session, key: str, default_value: Any = None) -> Any:
    """Get a setting value from database or return default"""
    setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
    if setting:
        try:
            return json.loads(setting.value)
        except json.JSONDecodeError:
            return setting.value
    return default_value

def set_setting_value(db: Session, key: str, value: Any, description: str = None):
    """Set a setting value in database"""
    setting = db.query(SystemSettings).filter(SystemSettings.key == key).first()
    
    # Convert value to JSON string if it's not a string
    if isinstance(value, (dict, list, bool, int, float)):
        value_str = json.dumps(value)
    else:
        value_str = str(value)
    
    if setting:
        setting.value = value_str
        if description:
            setting.description = description
    else:
        setting = SystemSettings(
            key=key,
            value=value_str,
            description=description
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    return setting

@router.get("/", response_model=SettingsResponse)
async def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get all system settings"""
    settings = {}
    
    for section, section_settings in DEFAULT_SETTINGS.items():
        settings[section] = {}
        for key, default_value in section_settings.items():
            full_key = f"{section}.{key}"
            settings[section][key] = get_setting_value(db, full_key, default_value)
    
    return SettingsResponse(**settings)

@router.put("/", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update system settings"""
    
    # Update each section that was provided
    for section_name, section_data in settings_update.dict(exclude_unset=True).items():
        if section_data and section_name in DEFAULT_SETTINGS:
            for key, value in section_data.items():
                if key in DEFAULT_SETTINGS[section_name]:
                    full_key = f"{section_name}.{key}"
                    description = f"Setting for {section_name} - {key}"
                    set_setting_value(db, full_key, value, description)
    
    # Return updated settings
    return await get_settings(db, current_user)

@router.get("/reset")
async def reset_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Reset all settings to default values"""
    
    # Delete all existing settings
    db.query(SystemSettings).delete()
    db.commit()
    
    return {"message": "Settings reset to default values"}

@router.get("/test-email")
async def test_email_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Test email configuration"""
    
    # Get SMTP settings
    smtp_enabled = get_setting_value(db, "integrations.smtp_enabled", False)
    
    if not smtp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMTP not enabled in settings"
        )
    
    # In a real implementation, you would send a test email here
    # For now, just return a success message
    return {"message": "Test email would be sent (feature not implemented yet)"}
