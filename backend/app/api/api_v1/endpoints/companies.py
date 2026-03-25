from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.timezone import get_brazil_now
from app.core.deps import get_current_user, get_current_admin, get_current_technician
from app.models.models import Company as CompanyModel, User as UserModel, ContractStatus
from app.schemas.schemas import Company, CompanyCreate, CompanyUpdate, User as UserSchema

router = APIRouter()

@router.get("/", response_model=List[Company])
async def get_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    has_contract: Optional[bool] = Query(None),
    current_user: UserSchema = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get companies list (technicians and admins only)"""
    
    query = db.query(CompanyModel)
    
    # Apply filters
    if is_active is not None:
        query = query.filter(CompanyModel.is_active == is_active)
    
    if has_contract is not None:
        query = query.filter(CompanyModel.has_contract == has_contract)
    
    if search:
        search_filter = (
            CompanyModel.name.ilike(f"%{search}%") |
            CompanyModel.legal_name.ilike(f"%{search}%") |
            CompanyModel.cnpj.ilike(f"%{search}%") |
            CompanyModel.email.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    companies = query.offset(skip).limit(limit).all()
    return companies

@router.get("/{company_id}", response_model=Company)
async def get_company(
    company_id: int,
    current_user: UserSchema = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get specific company"""
    
    company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return company

@router.post("/", response_model=Company)
async def create_company(
    company: CompanyCreate,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create new company (admin only)"""
    
    # Check if CNPJ already exists
    existing_company = db.query(CompanyModel).filter(CompanyModel.cnpj == company.cnpj).first()
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CNPJ already registered"
        )
    
    # Validate contract fields
    if company.has_contract:
        if not company.contract_value or not company.contract_start_date or not company.contract_end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Contract value, start date and end date are required for companies with contract"
            )
        # Set contract status based on dates
        if company.contract_end_date < datetime.now():
            company.contract_status = ContractStatus.EXPIRED
        elif (company.contract_end_date - datetime.now()).days <= 30:
            company.contract_status = ContractStatus.PENDING_RENEWAL
        else:
            company.contract_status = ContractStatus.ACTIVE
    else:
        if not company.hourly_rate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hourly rate is required for companies without contract"
            )
    
    # Create company
    db_company = CompanyModel(**company.dict())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    return db_company

@router.put("/{company_id}", response_model=Company)
async def update_company(
    company_id: int,
    company_update: CompanyUpdate,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update company (admin only)"""
    
    company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update company fields
    update_data = company_update.dict(exclude_unset=True)
    
    # Validate contract fields if has_contract is being updated
    if 'has_contract' in update_data:
        if update_data['has_contract']:
            contract_value = update_data.get('contract_value', company.contract_value)
            contract_start = update_data.get('contract_start_date', company.contract_start_date)
            contract_end = update_data.get('contract_end_date', company.contract_end_date)
            
            if not contract_value or not contract_start or not contract_end:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Contract value, start date and end date are required for companies with contract"
                )
            
            # Update contract status
            if contract_end < datetime.now():
                update_data['contract_status'] = ContractStatus.EXPIRED
            elif (contract_end - datetime.now()).days <= 30:
                update_data['contract_status'] = ContractStatus.PENDING_RENEWAL
            else:
                update_data['contract_status'] = ContractStatus.ACTIVE
        else:
            hourly_rate = update_data.get('hourly_rate', company.hourly_rate)
            if not hourly_rate:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Hourly rate is required for companies without contract"
                )
    
    for field, value in update_data.items():
        setattr(company, field, value)
    
    company.updated_at = get_brazil_now()
    db.commit()
    db.refresh(company)
    
    return company

@router.delete("/{company_id}")
async def deactivate_company(
    company_id: int,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Deactivate company (admin only)"""
    
    company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    company.is_active = False
    company.updated_at = get_brazil_now()
    db.commit()
    
    return {"message": "Company deactivated successfully"}

@router.put("/{company_id}/activate")
async def activate_company(
    company_id: int,
    current_user: UserSchema = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Activate company (admin only)"""
    
    company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    company.is_active = True
    company.updated_at = get_brazil_now()
    db.commit()
    
    return {"message": "Company activated successfully"}

@router.get("/{company_id}/users", response_model=List[UserSchema])
async def get_company_users(
    company_id: int,
    current_user: UserSchema = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get all users from a specific company"""
    
    company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    users = db.query(UserModel).filter(UserModel.company_id == company_id).all()
    return users
