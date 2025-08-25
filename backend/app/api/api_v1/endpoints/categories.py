from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_admin
from app.models.models import Category, User
from app.schemas.schemas import Category as CategorySchema, CategoryCreate, CategoryUpdate

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
async def get_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get categories list"""
    
    query = db.query(Category)
    
    # Apply filters
    if is_active and is_active.strip():
        # Convert string to boolean
        if is_active.lower() in ['true', '1', 'yes']:
            query = query.filter(Category.is_active == True)
        elif is_active.lower() in ['false', '0', 'no']:
            query = query.filter(Category.is_active == False)
    else:
        # By default, show only active categories for non-admin users
        if current_user.role.upper() != "ADMIN":
            query = query.filter(Category.is_active == True)
    
    if search:
        search_filter = (
            Category.name.ilike(f"%{search}%") |
            Category.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    categories = query.offset(skip).limit(limit).all()
    return categories

@router.get("/{category_id}", response_model=CategorySchema)
async def get_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific category"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category

@router.post("/", response_model=CategorySchema)
async def create_category(
    category: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create new category (admin only)"""
    
    # Check if name already exists
    existing_category = db.query(Category).filter(Category.name == category.name).first()
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name already exists"
        )
    
    db_category = Category(
        name=category.name,
        description=category.description,
        color=category.color,
        is_active=True
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update category (admin only)"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if new name already exists (if name is being changed)
    if category_update.name and category_update.name != category.name:
        existing_category = db.query(Category).filter(Category.name == category_update.name).first()
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists"
            )
    
    # Update category fields
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return category

@router.delete("/{category_id}")
async def deactivate_category(
    category_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Deactivate category (admin only)"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    category.is_active = False
    db.commit()
    
    return {"message": "Category deactivated successfully"}

@router.put("/{category_id}/activate")
async def activate_category(
    category_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Activate category (admin only)"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    category.is_active = True
    db.commit()
    
    return {"message": "Category activated successfully"}
