from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.core.deps import get_current_user
from app.models.models import User as UserModel, UserRole
from app.schemas.schemas import Token, LoginRequest, User as UserSchema
from app.services.ldap_service import ldap_service

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login with LDAP or local credentials"""
    
    # First try LDAP authentication
    ldap_user_info = ldap_service.authenticate_user(login_data.username, login_data.password)
    
    if ldap_user_info:
        # LDAP authentication successful
        user = db.query(UserModel).filter(UserModel.username == login_data.username).first()
        
        if not user:
            # Create new user from LDAP info
            user = UserModel(
                username=ldap_user_info['username'],
                email=ldap_user_info['email'],
                full_name=ldap_user_info['full_name'],
                department=ldap_user_info.get('department'),
                phone=ldap_user_info.get('phone'),
                role=UserRole.user,
                is_ldap_user=True,
                is_active=True
            )
            
            # Check if user should be technician or admin based on AD groups
            groups = ldap_user_info.get('groups', [])
            if any('ti-admin' in group.lower() or 'helpdesk-admin' in group.lower() for group in groups):
                user.role = UserRole.admin
            elif any('ti-tech' in group.lower() or 'helpdesk-tech' in group.lower() for group in groups):
                user.role = UserRole.technician
            
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update existing user info from LDAP
            user.email = ldap_user_info['email']
            user.full_name = ldap_user_info['full_name']
            user.department = ldap_user_info.get('department')
            user.phone = ldap_user_info.get('phone')
            
            # Update role based on AD groups if user is still LDAP user
            if user.is_ldap_user:
                groups = ldap_user_info.get('groups', [])
                if any('ti-admin' in group.lower() or 'helpdesk-admin' in group.lower() for group in groups):
                    user.role = UserRole.admin
                elif any('ti-tech' in group.lower() or 'helpdesk-tech' in group.lower() for group in groups):
                    user.role = UserRole.technician
                else:
                    # Safe role comparison for demotion
                    current_role = user.role
                    if isinstance(current_role, str):
                        current_role_str = current_role.lower()
                    else:
                        current_role_str = current_role.value.lower()
                    
                    if current_role_str in ["admin", "technician"]:
                        # Demote if no longer in groups
                        user.role = UserRole.user
            
            db.commit()
            db.refresh(user)
    
    else:
        # Try local authentication (for non-LDAP users like admins)
        user = db.query(UserModel).filter(UserModel.username == login_data.username).first()
        
        if not user or user.is_ldap_user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login/form", response_model=Token)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint compatible with OAuth2PasswordRequestForm"""
    login_data = LoginRequest(username=form_data.username, password=form_data.password)
    return await login(login_data, db)

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: UserModel = Depends(get_current_user)):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=current_user.username, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
