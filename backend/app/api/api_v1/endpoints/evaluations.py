"""
Endpoints para sistema de avaliação de tickets
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_admin, get_current_technician
from app.models.models import (
    TicketEvaluation, Ticket, User, UserRole, TicketStatus
)
from app.schemas.schemas import (
    TicketEvaluation as TicketEvaluationSchema,
    TicketEvaluationCreate, TicketEvaluationUpdate,
    SatisfactionMetrics, TechnicianSatisfactionMetrics
)

router = APIRouter()

@router.post("/tickets/{ticket_id}/evaluation", response_model=TicketEvaluationSchema)
async def create_ticket_evaluation(
    ticket_id: int,
    evaluation_data: TicketEvaluationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create evaluation for a ticket (only by ticket creator)"""
    
    # Get ticket
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check if user is the ticket creator
    if ticket.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the ticket creator can evaluate the ticket"
        )
    
    # Check if ticket is closed (changed from resolved or closed to only closed)
    if ticket.status != TicketStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket must be closed to be evaluated"
        )
    
    # Check if evaluation already exists
    existing_evaluation = db.query(TicketEvaluation).filter(
        TicketEvaluation.ticket_id == ticket_id
    ).first()
    
    if existing_evaluation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket has already been evaluated"
        )
    
    # Create evaluation
    db_evaluation = TicketEvaluation(
        ticket_id=ticket_id,
        user_id=current_user.id,
        rating=evaluation_data.rating,
        feedback=evaluation_data.feedback,
        resolution_quality=evaluation_data.resolution_quality,
        response_time_rating=evaluation_data.response_time_rating,
        technician_rating=evaluation_data.technician_rating
    )
    
    db.add(db_evaluation)
    db.commit()
    db.refresh(db_evaluation)
    
    # Load relationships
    db_evaluation = db.query(TicketEvaluation).options(
        joinedload(TicketEvaluation.user)
    ).filter(TicketEvaluation.id == db_evaluation.id).first()
    
    return db_evaluation

@router.get("/tickets/{ticket_id}/evaluation", response_model=TicketEvaluationSchema)
async def get_ticket_evaluation(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get evaluation for a ticket"""
    
    # Get ticket
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Check permissions (creator, assigned technician, or admin/technician role)
    user_role = current_user.role
    if isinstance(user_role, str):
        user_role_str = user_role.lower()
        allowed_roles = ['admin', 'technician']
    else:
        user_role_str = user_role.value.lower()
        allowed_roles = [UserRole.admin.value.lower(), UserRole.technician.value.lower()]
    
    if (ticket.created_by_id != current_user.id and 
        ticket.assigned_to_id != current_user.id and
        user_role_str not in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this evaluation"
        )
    
    # Get evaluation
    evaluation = db.query(TicketEvaluation).options(
        joinedload(TicketEvaluation.user)
    ).filter(TicketEvaluation.ticket_id == ticket_id).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found"
        )
    
    return evaluation

@router.put("/tickets/{ticket_id}/evaluation", response_model=TicketEvaluationSchema)
async def update_ticket_evaluation(
    ticket_id: int,
    evaluation_data: TicketEvaluationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update evaluation for a ticket (only by evaluator)"""
    
    # Get evaluation
    evaluation = db.query(TicketEvaluation).filter(
        TicketEvaluation.ticket_id == ticket_id
    ).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found"
        )
    
    # Check if user is the evaluator
    if evaluation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the evaluator can update the evaluation"
        )
    
    # Update fields
    update_data = evaluation_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(evaluation, field, value)
    
    evaluation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(evaluation)
    
    # Load relationships
    evaluation = db.query(TicketEvaluation).options(
        joinedload(TicketEvaluation.user)
    ).filter(TicketEvaluation.id == evaluation.id).first()
    
    return evaluation

@router.get("/evaluations", response_model=List[TicketEvaluationSchema])
async def get_evaluations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    rating: Optional[int] = Query(None, ge=1, le=5),
    technician_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get evaluations list (technicians and admins only)"""
    
    query = db.query(TicketEvaluation).options(
        joinedload(TicketEvaluation.user),
        joinedload(TicketEvaluation.ticket).joinedload(Ticket.assigned_to)
    )
    
    # Apply filters
    if rating:
        query = query.filter(TicketEvaluation.rating == rating)
    
    if technician_id:
        query = query.join(Ticket).filter(Ticket.assigned_to_id == technician_id)
    
    if date_from:
        try:
            date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(TicketEvaluation.created_at >= date_from_dt)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(TicketEvaluation.created_at <= date_to_dt)
        except ValueError:
            pass
    
    # Order by creation date (newest first)
    query = query.order_by(desc(TicketEvaluation.created_at))
    
    evaluations = query.offset(skip).limit(limit).all()
    return evaluations

@router.get("/metrics/satisfaction", response_model=SatisfactionMetrics)
async def get_satisfaction_metrics(
    days: int = Query(30, ge=1, le=365),
    technician_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get satisfaction metrics"""
    
    # Calculate date range
    date_from = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(TicketEvaluation).filter(
        TicketEvaluation.created_at >= date_from
    )
    
    # Filter by technician if specified
    if technician_id:
        query = query.join(Ticket).filter(Ticket.assigned_to_id == technician_id)
    
    evaluations = query.all()
    
    if not evaluations:
        return SatisfactionMetrics(
            total_evaluations=0,
            average_rating=0.0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            satisfaction_percentage=0.0
        )
    
    # Calculate metrics
    total_evaluations = len(evaluations)
    ratings = [e.rating for e in evaluations]
    average_rating = sum(ratings) / total_evaluations
    
    # Rating distribution
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating in ratings:
        rating_distribution[rating] += 1
    
    # Satisfaction percentage (ratings >= 4)
    satisfied_count = sum(1 for rating in ratings if rating >= 4)
    satisfaction_percentage = (satisfied_count / total_evaluations) * 100
    
    # Additional metrics
    resolution_quality_ratings = [e.resolution_quality for e in evaluations if e.resolution_quality]
    response_time_ratings = [e.response_time_rating for e in evaluations if e.response_time_rating]
    technician_ratings = [e.technician_rating for e in evaluations if e.technician_rating]
    
    average_resolution_quality = (
        sum(resolution_quality_ratings) / len(resolution_quality_ratings)
        if resolution_quality_ratings else None
    )
    
    average_response_time = (
        sum(response_time_ratings) / len(response_time_ratings)
        if response_time_ratings else None
    )
    
    average_technician_rating = (
        sum(technician_ratings) / len(technician_ratings)
        if technician_ratings else None
    )
    
    return SatisfactionMetrics(
        total_evaluations=total_evaluations,
        average_rating=round(average_rating, 2),
        rating_distribution=rating_distribution,
        average_resolution_quality=round(average_resolution_quality, 2) if average_resolution_quality else None,
        average_response_time=round(average_response_time, 2) if average_response_time else None,
        average_technician_rating=round(average_technician_rating, 2) if average_technician_rating else None,
        satisfaction_percentage=round(satisfaction_percentage, 2)
    )

@router.get("/metrics/technicians", response_model=List[TechnicianSatisfactionMetrics])
async def get_technician_satisfaction_metrics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get satisfaction metrics by technician"""
    
    # Calculate date range
    date_from = datetime.utcnow() - timedelta(days=days)
    
    # Get evaluations with technician info
    evaluations = db.query(TicketEvaluation).join(Ticket).join(
        User, Ticket.assigned_to_id == User.id
    ).filter(
        TicketEvaluation.created_at >= date_from,
        Ticket.assigned_to_id.isnot(None)
    ).all()
    
    # Group by technician
    technician_metrics = {}
    
    for evaluation in evaluations:
        technician = evaluation.ticket.assigned_to
        if not technician:
            continue
            
        if technician.id not in technician_metrics:
            technician_metrics[technician.id] = {
                'technician_id': technician.id,
                'technician_name': technician.full_name or technician.username,
                'ratings': []
            }
        
        technician_metrics[technician.id]['ratings'].append(evaluation.rating)
    
    # Calculate metrics for each technician
    result = []
    for tech_id, data in technician_metrics.items():
        ratings = data['ratings']
        total_evaluations = len(ratings)
        average_rating = sum(ratings) / total_evaluations
        satisfied_count = sum(1 for rating in ratings if rating >= 4)
        satisfaction_percentage = (satisfied_count / total_evaluations) * 100
        
        result.append(TechnicianSatisfactionMetrics(
            technician_id=tech_id,
            technician_name=data['technician_name'],
            total_evaluations=total_evaluations,
            average_rating=round(average_rating, 2),
            satisfaction_percentage=round(satisfaction_percentage, 2)
        ))
    
    # Sort by average rating (descending)
    result.sort(key=lambda x: x.average_rating, reverse=True)
    
    return result

@router.delete("/tickets/{ticket_id}/evaluation")
async def delete_ticket_evaluation(
    ticket_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete evaluation for a ticket (admin only)"""
    
    evaluation = db.query(TicketEvaluation).filter(
        TicketEvaluation.ticket_id == ticket_id
    ).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found"
        )
    
    db.delete(evaluation)
    db.commit()
    
    return {"message": "Evaluation deleted successfully"}
