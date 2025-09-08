from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
import os
import uuid
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_technician, get_user_from_token_param
from app.models.models import (
    Ticket, TicketComment, TicketAttachment, TicketActivity, 
    TicketEvaluation, User, Category, UserRole, TicketStatus, TicketPriority
)
from app.schemas.schemas import (
    Ticket as TicketSchema, TicketCreate, TicketUpdate, 
    CommentCreate, TicketFilters
)
from app.core.config import settings
from app.websocket.notifications import notification_service


router = APIRouter()


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint without authentication"""
    return {"message": "Backend is working", "tickets_count": 3}


@router.get("/simple", response_model=List[dict])
async def get_simple_tickets(db: Session = Depends(get_db)):
    """Get tickets without authentication for testing"""
    tickets = db.query(Ticket).limit(10).all()
    return [
        {
            "id": ticket.id,
            "title": ticket.title,
            "status": ticket.status,
            "priority": ticket.priority,
            "created_at": ticket.created_at.isoformat()
        }
        for ticket in tickets
    ]


def create_activity(db: Session, ticket_id: int, user_id: int, action: str, description: str, old_value: str = None, new_value: str = None):
    """Create ticket activity log"""
    activity = TicketActivity(
        ticket_id=ticket_id,
        user_id=user_id,
        action=action,
        description=description,
        old_value=old_value,
        new_value=new_value
    )
    db.add(activity)
    return activity


@router.get("/", response_model=List[dict])
async def get_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    assigned_to_id: Optional[int] = Query(None),
    created_by_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tickets with filters"""
    
    try:
        query = db.query(Ticket).options(
            joinedload(Ticket.created_by),
            joinedload(Ticket.assigned_to),
            joinedload(Ticket.category)
        )
        
        # Filter based on user role - FIXED: Added proper enum handling
        user_role = current_user.role
        if isinstance(user_role, str):
            user_role_str = user_role.lower()
        else:
            user_role_str = user_role.value.lower()
        
        if user_role_str == "user":
            # Users can only see their own tickets
            query = query.filter(Ticket.created_by_id == current_user.id)
        elif user_role_str == "technician":
            # Technicians can only see tickets assigned to them
            query = query.filter(Ticket.assigned_to_id == current_user.id)
        # Admin can see all tickets (no additional filter)
        
        # Apply filters
        if status and status.strip():
            query = query.filter(Ticket.status == status)
        
        if priority and priority.strip():
            query = query.filter(Ticket.priority == priority)
        
        if category_id:
            query = query.filter(Ticket.category_id == category_id)
        
        if assigned_to_id:
            query = query.filter(Ticket.assigned_to_id == assigned_to_id)
        
        if created_by_id and user_role_str in ["technician", "admin"]:
            query = query.filter(Ticket.created_by_id == created_by_id)
        
        if search and search.strip():
            search_filter = or_(
                Ticket.title.ilike(f"%{search}%"),
                Ticket.description.ilike(f"%{search}%"),
                Ticket.solution.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Ticket.created_at))
        
        tickets = query.offset(skip).limit(limit).all()
        
        # Convert enum values to strings for frontend compatibility - FIXED: Added safe attribute access
        result = []
        for ticket in tickets:
            # Safe enum value extraction
            status_value = "unknown"
            priority_value = "unknown"
            
            try:
                if hasattr(ticket.status, 'value'):
                    status_value = ticket.status.value.lower()
                else:
                    status_value = str(ticket.status).lower()
            except:
                status_value = "unknown"
            
            try:
                if hasattr(ticket.priority, 'value'):
                    priority_value = ticket.priority.value.lower()
                else:
                    priority_value = str(ticket.priority).lower()
            except:
                priority_value = "unknown"
            
            ticket_dict = {
                "id": ticket.id,
                "title": ticket.title or "",
                "description": ticket.description or "",
                "status": status_value,
                "priority": priority_value,
                "category_id": ticket.category_id,
                "created_by_id": ticket.created_by_id,
                "assigned_to_id": ticket.assigned_to_id,
                "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
                "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
                "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
                "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None,
                "solution": ticket.solution or "",
                "created_by": {
                    "id": ticket.created_by.id,
                    "username": ticket.created_by.username,
                    "full_name": ticket.created_by.full_name,
                    "email": ticket.created_by.email
                } if ticket.created_by else None,
                "assigned_to": {
                    "id": ticket.assigned_to.id,
                    "username": ticket.assigned_to.username,
                    "full_name": ticket.assigned_to.full_name,
                    "email": ticket.assigned_to.email
                } if ticket.assigned_to else None,
                "category": {
                    "id": ticket.category.id,
                    "name": ticket.category.name,
                    "color": ticket.category.color
                } if ticket.category else None
            }
            result.append(ticket_dict)
        
        return result
        
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in get_tickets: {str(e)}")
        logger.error(f"User: {current_user.username}, Role: {current_user.role}")
        
        # Return empty list instead of crashing
        return []


@router.get("/{ticket_id}", response_model=dict)
async def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific ticket"""
    
    try:
        ticket = db.query(Ticket).options(
            joinedload(Ticket.created_by),
            joinedload(Ticket.assigned_to),
            joinedload(Ticket.category),
            joinedload(Ticket.comments).joinedload(TicketComment.user),
            joinedload(Ticket.attachments),
            joinedload(Ticket.activities).joinedload(TicketActivity.user),
            joinedload(Ticket.evaluation)
        ).filter(Ticket.id == ticket_id).first()
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        # Check permissions - FIXED: Safe role comparison
        user_role = current_user.role
        if isinstance(user_role, str):
            user_role_str = user_role.lower()
        else:
            user_role_str = user_role.value.lower()
        
        if user_role_str == "user" and ticket.created_by_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Convert to dict with enum values as strings and include attachments - FIXED: Safe attribute access
        try:
            status_value = ticket.status.value.lower() if hasattr(ticket.status, 'value') else str(ticket.status).lower()
        except:
            status_value = "unknown"
        
        try:
            priority_value = ticket.priority.value.lower() if hasattr(ticket.priority, 'value') else str(ticket.priority).lower()
        except:
            priority_value = "unknown"
        
        ticket_dict = {
            "id": ticket.id,
            "title": ticket.title or "",
            "description": ticket.description or "",
            "status": status_value,
            "priority": priority_value,
            "category_id": ticket.category_id,
            "created_by_id": ticket.created_by_id,
            "assigned_to_id": ticket.assigned_to_id,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None,
            "solution": ticket.solution or "",
            "created_by": {
                "id": ticket.created_by.id,
                "username": ticket.created_by.username,
                "full_name": ticket.created_by.full_name,
                "email": ticket.created_by.email
            } if ticket.created_by else None,
            "assigned_to": {
                "id": ticket.assigned_to.id,
                "username": ticket.assigned_to.username,
                "full_name": ticket.assigned_to.full_name,
                "email": ticket.assigned_to.email
            } if ticket.assigned_to else None,
            "category": {
                "id": ticket.category.id,
                "name": ticket.category.name,
                "color": ticket.category.color
            } if ticket.category else None,
            "attachments": [
                {
                    "id": att.id,
                    "filename": att.filename,
                    "original_filename": att.original_filename,
                    "file_size": att.file_size,
                    "content_type": att.content_type,
                    "uploaded_by_id": att.uploaded_by_id,
                    "created_at": att.created_at.isoformat() if att.created_at else None
                }
                for att in ticket.attachments
            ] if ticket.attachments else []
        }
        
        return ticket_dict
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in get_ticket: {str(e)}")
        logger.error(f"Ticket ID: {ticket_id}, User: {current_user.username}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/", response_model=TicketSchema)
async def create_ticket(
    ticket: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new ticket"""
    
    # Validate category exists
    if ticket.category_id:
        category = db.query(Category).filter(Category.id == ticket.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found"
            )
    
    db_ticket = Ticket(
        title=ticket.title,
        description=ticket.description,
        priority=ticket.priority,
        category_id=ticket.category_id,
        assigned_to_id=ticket.assigned_to_id,
        created_by_id=current_user.id,
        status=TicketStatus.OPEN
    )
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    # Create activity log
    create_activity(
        db, db_ticket.id, current_user.id, 
        "created", f"Ticket criado: {ticket.title}"
    )
    db.commit()
    
    # Send notification for new ticket
    await notification_service.notify_ticket_created(db_ticket, current_user)
    
    # If ticket is assigned, send assignment notification
    if db_ticket.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == db_ticket.assigned_to_id).first()
        if assigned_user:
            await notification_service.notify_ticket_assigned(db_ticket, assigned_user, current_user)
    
    # Reload with relationships
    ticket_with_relations = db.query(Ticket).options(
        joinedload(Ticket.created_by),
        joinedload(Ticket.assigned_to),
        joinedload(Ticket.category),
        joinedload(Ticket.comments),
        joinedload(Ticket.attachments),
        joinedload(Ticket.activities),
        joinedload(Ticket.evaluation)
    ).filter(Ticket.id == db_ticket.id).first()
    
    return ticket_with_relations


@router.put("/{ticket_id}", response_model=TicketSchema)
async def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update ticket"""
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    can_update = (
        current_user.role in [UserRole.technician, UserRole.admin] or
        (current_user.role == UserRole.user and ticket.created_by_id == current_user.id)
    )
    
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Users can only update title, description, and priority of their own open tickets
    if current_user.role == UserRole.user:
        if ticket.status not in [TicketStatus.OPEN, TicketStatus.WAITING_USER]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update ticket in current status"
            )
        # Limit what users can update
        allowed_fields = ['title', 'description', 'priority']
        update_data = {k: v for k, v in ticket_update.dict(exclude_unset=True).items() if k in allowed_fields}
    else:
        update_data = ticket_update.dict(exclude_unset=True)
    
    # Track changes for activity log and notifications
    changes = []
    old_status = ticket.status
    old_assigned_to_id = ticket.assigned_to_id
    
    for field, new_value in update_data.items():
        if hasattr(ticket, field):
            old_value = getattr(ticket, field)
            if old_value != new_value:
                changes.append({
                    'field': field,
                    'old_value': str(old_value) if old_value else None,
                    'new_value': str(new_value) if new_value else None
                })
                setattr(ticket, field, new_value)
    
    # Handle status changes
    if 'status' in update_data:
        if update_data['status'] == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
        elif update_data['status'] == TicketStatus.CLOSED:
            ticket.closed_at = datetime.utcnow()
    
    ticket.updated_at = datetime.utcnow()
    
    # Create activity logs for changes
    for change in changes:
        field_names = {
            'status': 'Status',
            'priority': 'Prioridade',
            'assigned_to_id': 'Responsável',
            'title': 'Título',
            'description': 'Descrição',
            'solution': 'Solução'
        }
        field_name = field_names.get(change['field'], change['field'])
        
        create_activity(
            db, ticket.id, current_user.id,
            "updated", f"{field_name} alterado",
            change['old_value'], change['new_value']
        )
    
    db.commit()
    db.refresh(ticket)
    
    # Send notifications for changes
    if old_status != ticket.status:
        await notification_service.notify_ticket_status_changed(ticket, old_status, current_user)
        
        # Special notification for resolution
        if ticket.status == TicketStatus.RESOLVED:
            await notification_service.notify_ticket_resolved(ticket, current_user)
    
    # Send notification for assignment changes
    if old_assigned_to_id != ticket.assigned_to_id and ticket.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == ticket.assigned_to_id).first()
        if assigned_user:
            await notification_service.notify_ticket_assigned(ticket, assigned_user, current_user)
    
    # Reload with relationships
    ticket_with_relations = db.query(Ticket).options(
        joinedload(Ticket.created_by),
        joinedload(Ticket.assigned_to),
        joinedload(Ticket.category),
        joinedload(Ticket.comments),
        joinedload(Ticket.attachments),
        joinedload(Ticket.activities),
        joinedload(Ticket.evaluation)
    ).filter(Ticket.id == ticket.id).first()
    
    return ticket_with_relations


@router.post("/{ticket_id}/comments")
async def add_comment(
    ticket_id: int,
    comment: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add comment to ticket"""
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    can_comment = (
        current_user.role in [UserRole.technician, UserRole.admin] or
        ticket.created_by_id == current_user.id
    )
    
    if not can_comment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Users cannot create internal comments
    if current_user.role == UserRole.user and comment.is_internal:
        comment.is_internal = False
    
    db_comment = TicketComment(
        content=comment.content,
        is_internal=comment.is_internal,
        ticket_id=ticket_id,
        user_id=current_user.id
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Create activity log
    comment_type = "comentário interno" if comment.is_internal else "comentário"
    create_activity(
        db, ticket_id, current_user.id,
        "commented", f"Adicionou {comment_type}"
    )
    db.commit()
    
    # Send notification for new comment (only for non-internal comments or to technicians)
    if not comment.is_internal:
        await notification_service.notify_new_comment(ticket, comment.content, current_user)
    
    return {"message": "Comment added successfully", "comment_id": db_comment.id}


@router.get("/{ticket_id}/comments")
async def get_ticket_comments(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comments for a specific ticket"""
    
    try:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        # Check permissions - FIXED: Safe role comparison
        user_role = current_user.role
        if isinstance(user_role, str):
            user_role_str = user_role.lower()
        else:
            user_role_str = user_role.value.lower()
        
        can_view = (
            user_role_str in ["technician", "admin"] or
            ticket.created_by_id == current_user.id
        )
        
        if not can_view:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Get comments with user information
        comments_query = db.query(TicketComment).options(
            joinedload(TicketComment.user)
        ).filter(TicketComment.ticket_id == ticket_id)
        
        # Filter internal comments for regular users
        if user_role_str == "user":
            comments_query = comments_query.filter(TicketComment.is_internal == False)
        
        comments = comments_query.order_by(TicketComment.created_at).all()
        
        # Convert to dict format - FIXED: Safe attribute access
        result = []
        for comment in comments:
            try:
                user_role_value = comment.user.role.value.lower() if hasattr(comment.user.role, 'value') else str(comment.user.role).lower()
            except:
                user_role_value = "unknown"
            
            comment_dict = {
                "id": comment.id,
                "content": comment.content or "",
                "is_internal": comment.is_internal,
                "created_at": comment.created_at.isoformat() if comment.created_at else None,
                "user": {
                    "id": comment.user.id,
                    "username": comment.user.username,
                    "full_name": comment.user.full_name,
                    "role": user_role_value
                } if comment.user else None
            }
            result.append(comment_dict)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in get_ticket_comments: {str(e)}")
        logger.error(f"Ticket ID: {ticket_id}, User: {current_user.username}")
        
        # Return empty list instead of crashing
        return []


@router.post("/{ticket_id}/attachments")
async def upload_attachment(
    ticket_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload file attachment to ticket"""
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions
    can_upload = (
        current_user.role in [UserRole.technician, UserRole.admin] or
        ticket.created_by_id == current_user.id
    )
    
    if not can_upload:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Validate file - FIXED: Added proper validation
    if not file.filename or not file.filename.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    if file.size is None or file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE} bytes"
        )
    
    if '.' not in file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have an extension"
        )
    
    file_extension = file.filename.split('.')[-1].lower()
    allowed_extensions = settings.ALLOWED_EXTENSIONS.split(',')
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join("uploads", unique_filename)
    
    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create attachment record
    attachment = TicketAttachment(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file.size,
        content_type=file.content_type,
        ticket_id=ticket_id,
        uploaded_by_id=current_user.id
    )
    
    db.add(attachment)
    
    # Create activity log
    create_activity(
        db, ticket_id, current_user.id,
        "attachment", f"Anexou arquivo: {file.filename}"
    )
    
    db.commit()
    db.refresh(attachment)
    
    return {
        "message": "File uploaded successfully",
        "attachment_id": attachment.id,
        "filename": attachment.original_filename
    }


@router.get("/{ticket_id}/attachments/{attachment_id}/download")
async def download_attachment(
    ticket_id: int,
    attachment_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """Download ticket attachment"""
    
    # Validate token and get user - FIXED: Added fallback for ALGORITHM
    try:
        from jose import jwt
        from app.core.config import settings
        
        # Use HS256 as default algorithm if not specified
        algorithm = getattr(settings, 'ALGORITHM', 'HS256')
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        current_user = db.query(User).filter(User.username == username).first()
        if not current_user or not current_user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
            
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get ticket first to check permissions
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permissions
    if current_user.role == UserRole.user and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this ticket")
    elif current_user.role == UserRole.technician and ticket.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this ticket")
    
    # Get attachment
    attachment = db.query(TicketAttachment).filter(
        TicketAttachment.id == attachment_id,
        TicketAttachment.ticket_id == ticket_id
    ).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Check if file exists
    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # Return file with proper download headers for Windows compatibility
    import urllib.parse
    
    # Clean filename for Windows
    clean_filename = attachment.original_filename.replace('"', '').replace('\\', '').replace('/', '')
    encoded_filename = urllib.parse.quote(clean_filename)
    
    return FileResponse(
        path=attachment.file_path,
        filename=clean_filename,
        media_type="application/force-download",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}"; filename*=UTF-8\'\'{encoded_filename}',
            "Content-Type": "application/force-download",
            "Content-Transfer-Encoding": "binary",
            "Cache-Control": "must-revalidate, post-check=0, pre-check=0",
            "Pragma": "public",
            "Expires": "0"
        }
    )


@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a ticket (Admin only)"""
    # Check if user is admin
    user_role = current_user.role
    if isinstance(user_role, str):
        is_admin = user_role.lower() == 'admin'
    else:
        is_admin = user_role.value.lower() == 'admin'
    
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete tickets"
        )
    
    # Get ticket
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Delete associated files
    attachments = db.query(TicketAttachment).filter(TicketAttachment.ticket_id == ticket_id).all()
    for attachment in attachments:
        if os.path.exists(attachment.file_path):
            try:
                os.remove(attachment.file_path)
            except OSError:
                pass  # File might already be deleted
    
    # Delete ticket (cascade will handle related records)
    db.delete(ticket)
    db.commit()
    
    # Send notification
    await notification_service.send_system_notification(
        f"Ticket #{ticket_id} foi excluído pelo administrador",
        exclude_user_id=current_user.id
    )
    
    return {"message": "Ticket deleted successfully"}
