from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_admin, get_current_technician
from app.core.security import get_password_hash
from app.models.models import User as UserModel, UserRole
from app.schemas.schemas import UserCreate, UserUpdate, User as UserSchema, ProfileUpdate

router = APIRouter()

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

@router.post("/profile-update")
async def update_profile_new(request: Request):
    """Update current user profile"""
    
    print("=== PROFILE UPDATE ENDPOINT CALLED ===")
    
    try:
        # Get authorization header manually
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = auth_header.split(" ")[1]
        print(f"Token received: {token[:20]}...")
        
        # Get current user manually
        from app.core.security import verify_token
        from app.core.database import SessionLocal
        
        try:
            payload = verify_token(token)
            username = payload.get("sub")
            if not username:
                raise HTTPException(status_code=401, detail="Invalid token")
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Create database session manually
        db = SessionLocal()
        
        current_user = db.query(UserModel).filter(UserModel.username == username).first()
        if not current_user:
            db.close()
            raise HTTPException(status_code=401, detail="User not found")
        
        print(f"Current user: {current_user.username} (ID: {current_user.id})")
        
        # Get request body and parse JSON manually to avoid Pydantic validation issues
        body = await request.body()
        print(f"Raw body: {body}")
        
        import json
        data = json.loads(body)
        print(f"Parsed data: {data}")
        
        # Update allowed fields for profile (exclude role and is_active for self-update)
        allowed_fields = ['email', 'full_name', 'department', 'phone']
        updated_fields = []
        
        print(f"Current user attributes before update:")
        for field in allowed_fields:
            if hasattr(current_user, field):
                current_value = getattr(current_user, field)
                print(f"  {field}: '{current_value}'")
        
        for field, value in data.items():
            print(f"Processing field: {field} = {value}")
            if field in allowed_fields:
                if hasattr(current_user, field):
                    old_value = getattr(current_user, field)
                    setattr(current_user, field, value)
                    updated_fields.append(field)
                    print(f"✓ Updated {field}: '{old_value}' -> '{value}'")
                else:
                    print(f"✗ User doesn't have attribute: {field}")
            else:
                print(f"✗ Field not allowed for profile update: {field}")
        
        if updated_fields:
            print(f"Committing changes for fields: {updated_fields}")
            try:
                db.commit()
                print("✓ Database commit successful")
                db.refresh(current_user)
                print("✓ User refreshed from database")
            except Exception as commit_error:
                print(f"✗ Database commit failed: {str(commit_error)}")
                db.rollback()
                raise commit_error
        else:
            print("No valid fields to update")
        
        # Verify the update worked
        print(f"Current user attributes after update:")
        for field in allowed_fields:
            if hasattr(current_user, field):
                current_value = getattr(current_user, field)
                print(f"  {field}: '{current_value}'")
        
        response_data = {
            "message": "Profile updated successfully" if updated_fields else "No changes detected",
            "updated_fields": updated_fields,
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "department": current_user.department,
                "phone": current_user.phone,
                "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
                "is_active": current_user.is_active,
                "is_ldap_user": current_user.is_ldap_user,
                "created_at": current_user.created_at.isoformat() if current_user.created_at else None
            }
        }
        
        print(f"Returning response: {response_data}")
        return response_data
        
    except json.JSONDecodeError as e:
        print(f"✗ JSON decode error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON in request body")
    except Exception as e:
        print(f"✗ Unexpected error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        db.close()

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
