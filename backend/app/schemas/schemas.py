from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum
from app.models.models import UserRole, TicketStatus, TicketPriority

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    department: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None
    role: UserRole = UserRole.user

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class ProfileUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

class User(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_ldap_user: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#6B7280"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class Category(CategoryBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Ticket Schemas
class TicketBase(BaseModel):
    title: str
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    category_id: Optional[int] = None

class TicketCreate(TicketBase):
    assigned_to_id: Optional[int] = None

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to_id: Optional[int] = None
    category_id: Optional[int] = None
    solution: Optional[str] = None

class TicketComment(BaseModel):
    id: int
    content: str
    is_internal: bool
    user_id: int
    user: User
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class TicketAttachment(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    content_type: Optional[str]
    uploaded_by_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketActivity(BaseModel):
    id: int
    action: str
    description: str
    old_value: Optional[str]
    new_value: Optional[str]
    user: User
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketEvaluation(BaseModel):
    id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str]
    user: User
    created_at: datetime
    
    class Config:
        from_attributes = True

class Ticket(TicketBase):
    id: int
    category_id: Optional[int]
    created_by_id: int
    assigned_to_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    solution: Optional[str]
    status: TicketStatus
    
    # Relationships
    created_by: User
    assigned_to: Optional[User]
    category: Optional[Category]
    # comments: List[TicketComment] = []
    # attachments: List[TicketAttachment] = []
    # activities: List[TicketActivity] = []
    # evaluation: Optional[TicketEvaluation] = None
    
    class Config:
        from_attributes = True

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category_id: Optional[int] = None
    assigned_to_id: Optional[int] = None
    solution: Optional[str] = None

# Comment Schemas
class CommentCreate(BaseModel):
    content: str
    is_internal: bool = False

class CommentUpdate(BaseModel):
    content: str

# Evaluation Schemas
class EvaluationCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
    avg_resolution_time: Optional[float]  # in hours
    tickets_by_priority: dict
    tickets_by_category: dict
    recent_activities: List[TicketActivity]

# Filter Schemas
class TicketFilters(BaseModel):
    status: Optional[List[TicketStatus]] = None
    priority: Optional[List[TicketPriority]] = None
    category_id: Optional[List[int]] = None
    assigned_to_id: Optional[List[int]] = None
    created_by_id: Optional[List[int]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None

# Settings Schemas
class SystemSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None

class SystemSetting(SystemSettingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class SettingsResponse(BaseModel):
    general: dict
    sla: dict
    permissions: dict
    integrations: dict

class SettingsUpdate(BaseModel):
    general: Optional[dict] = None
    sla: Optional[dict] = None
    permissions: Optional[dict] = None
    integrations: Optional[dict] = None

# Chat Schemas
class UserPresenceBase(BaseModel):
    is_online: bool = False
    status_message: Optional[str] = None

class UserPresence(UserPresenceBase):
    id: int
    user_id: int
    last_seen_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Ticket Evaluation Schemas
class TicketEvaluationBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Overall rating from 1 to 5 stars")
    feedback: Optional[str] = Field(None, max_length=1000, description="Optional feedback comment")
    resolution_quality: Optional[int] = Field(None, ge=1, le=5, description="Quality of resolution rating")
    response_time_rating: Optional[int] = Field(None, ge=1, le=5, description="Response time rating")
    technician_rating: Optional[int] = Field(None, ge=1, le=5, description="Technician performance rating")

class TicketEvaluationCreate(TicketEvaluationBase):
    pass

class TicketEvaluationUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=1000)
    resolution_quality: Optional[int] = Field(None, ge=1, le=5)
    response_time_rating: Optional[int] = Field(None, ge=1, le=5)
    technician_rating: Optional[int] = Field(None, ge=1, le=5)

class TicketEvaluation(TicketEvaluationBase):
    id: int
    ticket_id: int
    evaluated_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    evaluated_by: Optional[User] = None
    
    class Config:
        from_attributes = True

# Satisfaction Metrics
class SatisfactionMetrics(BaseModel):
    total_evaluations: int
    average_rating: float
    rating_distribution: Dict[int, int]  # {1: count, 2: count, ...}
    average_resolution_quality: Optional[float] = None
    average_response_time: Optional[float] = None
    average_technician_rating: Optional[float] = None
    satisfaction_percentage: float  # Percentage of ratings >= 4
    
class TechnicianSatisfactionMetrics(BaseModel):
    technician_id: int
    technician_name: str
    total_evaluations: int
    average_rating: float
    satisfaction_percentage: float

# WebSocket Messages (non-chat)
class WebSocketMessage(BaseModel):
    type: str
    data: Optional[dict] = None
