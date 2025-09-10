from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User as UserModel, UserRole
from app.schemas.schemas import TokenData

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserModel:
    """Get current authenticated user"""
    print(f"=== GET_CURRENT_USER CALLED ===")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        print(f"Token received: {credentials.credentials[:20]}...")
        print(f"SECRET_KEY (first 10 chars): {settings.SECRET_KEY[:10]}...")
        print(f"ALGORITHM: {settings.ALGORITHM}")
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        print(f"Token payload: {payload}")
        username: str = payload.get("sub")
        print(f"Username from token: {username}")
        if username is None:
            print("✗ Username is None in token payload")
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        print(f"✗ JWT Error: {str(e)}")
        print(f"Token that failed: {credentials.credentials}")
        raise credentials_exception
    
    user = db.query(UserModel).filter(UserModel.username == token_data.username).first()
    if user is None:
        print(f"✗ User not found in database: {token_data.username}")
        raise credentials_exception
    
    print(f"User found: {user.username}, active: {user.is_active}, role: {user.role}")
    
    if not user.is_active:
        print(f"✗ User is inactive: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    print(f"✓ User authenticated successfully: {user.username}")
    return user

def get_current_active_user(
    current_user: UserModel = Depends(get_current_user)
) -> UserModel:
    """Get current active user"""
    return current_user

def get_current_technician(
    current_user: UserModel = Depends(get_current_user)
) -> UserModel:
    """Get current user if they are technician or admin"""
    # Handle both string and enum values
    if isinstance(current_user.role, str):
        user_role = current_user.role.lower()
        allowed_roles = ['technician', 'admin']
    else:
        user_role = current_user.role
        allowed_roles = [UserRole.technician, UserRole.admin]
    
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Technician role required."
        )
    return current_user

def get_current_admin(
    current_user: UserModel = Depends(get_current_user)
) -> UserModel:
    """Get current user if they are admin"""
    # Handle both string and enum values
    if isinstance(current_user.role, str):
        user_role = current_user.role.lower()
        allowed_roles = ['admin']
    else:
        user_role = current_user.role
        allowed_roles = [UserRole.admin]
    
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin role required."
        )
    return current_user

def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[UserModel]:
    """Get current user if token is provided, otherwise return None"""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            return None
        
        user = db.query(UserModel).filter(UserModel.username == username).first()
        if user and user.is_active:
            return user
        
    except JWTError:
        pass
    
    return None

def get_user_from_token_param(
    request: Request,
    db: Session = Depends(get_db)
) -> UserModel:
    """Get current user from token query parameter"""
    token = request.query_params.get("token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token parameter required"
        )
    
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = db.query(UserModel).filter(UserModel.username == username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
