from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_technician
from app.models.models import Asset, AssetCategory, User
from app.schemas.schemas import (
    Asset as AssetSchema,
    AssetCreate,
    AssetUpdate,
    AssetCategory as AssetCategorySchema,
    AssetCategoryCreate,
    AssetCategoryUpdate
)

router = APIRouter()

# Asset Categories Endpoints
@router.get("/categories/", response_model=List[AssetCategorySchema])
async def get_asset_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get asset categories"""
    query = db.query(AssetCategory)
    
    if is_active is not None:
        query = query.filter(AssetCategory.is_active == is_active)
    
    categories = query.offset(skip).limit(limit).all()
    return categories

@router.post("/categories/", response_model=AssetCategorySchema)
async def create_asset_category(
    category: AssetCategoryCreate,
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Create new asset category"""
    db_category = AssetCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/categories/{category_id}", response_model=AssetCategorySchema)
async def update_asset_category(
    category_id: int,
    category: AssetCategoryUpdate,
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Update asset category"""
    db_category = db.query(AssetCategory).filter(AssetCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category.dict(exclude_unset=True).items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/categories/{category_id}")
async def delete_asset_category(
    category_id: int,
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Delete asset category"""
    db_category = db.query(AssetCategory).filter(AssetCategory.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}

# Assets Endpoints
@router.get("/", response_model=List[AssetSchema])
async def get_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    company_id: Optional[int] = Query(None),
    in_maintenance: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get assets with filters"""
    query = db.query(Asset).options(
        joinedload(Asset.category),
        joinedload(Asset.assigned_to),
        joinedload(Asset.company)
    )
    
    # Apply filters
    if status:
        query = query.filter(Asset.status == status)
    
    if category_id:
        query = query.filter(Asset.category_id == category_id)
    
    if company_id:
        query = query.filter(Asset.company_id == company_id)
    
    if in_maintenance is not None:
        query = query.filter(Asset.in_maintenance == in_maintenance)
    
    if search:
        search_filter = (
            Asset.name.ilike(f"%{search}%") |
            Asset.asset_tag.ilike(f"%{search}%") |
            Asset.serial_number.ilike(f"%{search}%") |
            Asset.location.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    assets = query.offset(skip).limit(limit).all()
    return assets

@router.get("/{asset_id}", response_model=AssetSchema)
async def get_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get asset by ID"""
    asset = db.query(Asset).options(
        joinedload(Asset.category),
        joinedload(Asset.assigned_to),
        joinedload(Asset.company)
    ).filter(Asset.id == asset_id).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return asset

@router.post("/", response_model=AssetSchema)
async def create_asset(
    asset: AssetCreate,
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Create new asset"""
    # Check if asset_tag already exists
    existing = db.query(Asset).filter(Asset.asset_tag == asset.asset_tag).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset tag already exists")
    
    db_asset = Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    # Load relationships
    db_asset = db.query(Asset).options(
        joinedload(Asset.category),
        joinedload(Asset.assigned_to),
        joinedload(Asset.company)
    ).filter(Asset.id == db_asset.id).first()
    
    return db_asset

@router.put("/{asset_id}", response_model=AssetSchema)
async def update_asset(
    asset_id: int,
    asset: AssetUpdate,
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Update asset"""
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check if asset_tag is being changed and if it already exists
    if asset.asset_tag and asset.asset_tag != db_asset.asset_tag:
        existing = db.query(Asset).filter(Asset.asset_tag == asset.asset_tag).first()
        if existing:
            raise HTTPException(status_code=400, detail="Asset tag already exists")
    
    for key, value in asset.dict(exclude_unset=True).items():
        setattr(db_asset, key, value)
    
    db.commit()
    db.refresh(db_asset)
    
    # Load relationships
    db_asset = db.query(Asset).options(
        joinedload(Asset.category),
        joinedload(Asset.assigned_to),
        joinedload(Asset.company)
    ).filter(Asset.id == db_asset.id).first()
    
    return db_asset

@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Delete asset"""
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted successfully"}
