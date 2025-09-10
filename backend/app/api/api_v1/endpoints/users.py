from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_admin, get_current_technician
from app.core.security import get_password_hash
from app.models.models import User as UserModel, UserRole
from app.schemas.schemas import UserCreate, UserUpdate, User as UserSchema, ProfileUpdate

router = APIRouter()

# Check if router has global dependencies
print(f"=== ROUTER DEPENDENCIES DEBUG ===")
print(f"Router dependencies: {getattr(router, 'dependencies', 'None')}")
print(f"Router prefix: {getattr(router, 'prefix', 'None')}")
print(f"Router tags: {getattr(router, 'tags', 'None')}")

@router.get("/", response_model=List[UserSchema])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[str] = Query(None),
    is_active: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: UserSchema = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get users list (technicians and admins only)"""
    
    query = db.query(UserModel)
    
    # Apply filters
    if role and role.strip():
        # Convert string to UserRole enum
        try:
            role_enum = UserRole(role.upper())
            query = query.filter(UserModel.role == role_enum)
        except ValueError:
            # Invalid role, skip filter
            pass
    
    if is_active and is_active.strip():
        # Convert string to boolean
        if is_active.lower() in ['true', '1', 'yes']:
            query = query.filter(UserModel.is_active == True)
        elif is_active.lower() in ['false', '0', 'no']:
            query = query.filter(UserModel.is_active == False)
    
    if search:
        search_filter = (
            UserModel.full_name.ilike(f"%{search}%") |
            UserModel.username.ilike(f"%{search}%") |
            UserModel.email.ilike(f"%{search}%") |
            UserModel.department.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/technicians", response_model=List[UserSchema])
async def get_technicians(
    current_user: UserSchema = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of technicians for assignment"""
    
    try:
        # Handle role comparison safely
        technicians = db.query(UserModel).filter(
            UserModel.is_active == True
        ).all()
        
        # Filter by role in Python to handle enum/string comparison safely
        filtered_technicians = []
        for tech in technicians:
            user_role = tech.role
            if isinstance(user_role, str):
                user_role_str = user_role.lower()
            else:
                user_role_str = user_role.value.lower()
            
            if user_role_str in ["technician", "admin"]:
                filtered_technicians.append(tech)
        
        return filtered_technicians
        
    except Exception as e:
        print(f"Error in get_technicians: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching technicians: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    current_user: UserSchema = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get specific user"""
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/", response_model=UserSchema)
async def create_user(
    user: UserCreate,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create new user (admin only)"""
    
    # Check if username already exists
    existing_user = db.query(UserModel).filter(UserModel.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = None
    if user.password:
        hashed_password = get_password_hash(user.password)
    
    db_user = UserModel(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        department=user.department,
        phone=user.phone,
        role=user.role,
        hashed_password=hashed_password,
        is_ldap_user=False if user.password else True,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update user (admin only)"""
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user fields
    update_data = user_update.dict(exclude_unset=True)
    
    # Handle password hashing if provided
    if 'password' in update_data and update_data['password']:
        update_data['hashed_password'] = get_password_hash(update_data['password'])
        del update_data['password']  # Remove plain password
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    
    print(f"=== USERS.PY PROFILE UPDATE ENDPOINT CALLED ===")
    print(f"Current user: {current_user.username} (ID: {current_user.id})")
    print(f"User active: {current_user.is_active}")
    print(f"User role: {current_user.role}")
    print(f"Profile data: {profile_data.dict(exclude_unset=True)}")
    print(f"This should be the CORRECT endpoint being called")
    
    try:
        # Get the actual user from database
        user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
        if not user:
            print(f"✗ User not found in database: ID {current_user.id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"Database user found: {user.username}, active: {user.is_active}")
        
        # Convert ProfileUpdate to dict, excluding None values
        update_data = profile_data.dict(exclude_unset=True)
        
        # Update allowed fields for profile (exclude role and is_active for self-update)
        allowed_fields = ['email', 'full_name', 'department', 'phone']
        updated_fields = []
        
        for field, value in update_data.items():
            if field in allowed_fields and hasattr(user, field):
                old_value = getattr(user, field)
                setattr(user, field, value)
                updated_fields.append(field)
                print(f"✓ Updated {field}: '{old_value}' -> '{value}'")
        
        if updated_fields:
            print(f"Committing changes for fields: {updated_fields}")
            db.commit()
            db.refresh(user)
            print("✓ Database commit successful")
        else:
            print("No fields to update")
        
        response_data = {
            "message": "Profile updated successfully" if updated_fields else "No changes detected",
            "updated_fields": updated_fields,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "department": user.department,
                "phone": user.phone,
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                "is_active": user.is_active,
                "is_ldap_user": user.is_ldap_user,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
        }
        
        print(f"✓ Returning response: {response_data}")
        return response_data
        
    except Exception as e:
        print(f"✗ Exception occurred: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{user_id}")
async def deactivate_user(
    user_id: int,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Deactivate user (admin only)"""
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    
    return {"message": "User deactivated successfully"}

@router.put("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Activate user (admin only)"""
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    return {"message": "User activated successfully"}

@router.delete("/{user_id}/delete")
async def delete_user(
    user_id: int,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete user permanently (admin only)"""
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting the current admin user
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
