from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_technician
from app.models.models import Ticket, TicketStatus, TicketPriority, Category, User, UserRole, TicketActivity
from app.schemas.schemas import DashboardStats

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    
    # Date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Base query
    base_query = db.query(Ticket)
    
    # Filter by date range
    date_filter = Ticket.created_at >= start_date
    
    # Total tickets
    total_tickets = base_query.filter(date_filter).count()
    
    # Tickets by status
    open_tickets = base_query.filter(
        date_filter,
        Ticket.status == TicketStatus.OPEN
    ).count()
    
    in_progress_tickets = base_query.filter(
        date_filter,
        Ticket.status == TicketStatus.IN_PROGRESS
    ).count()
    
    resolved_tickets = base_query.filter(
        date_filter,
        Ticket.status == TicketStatus.RESOLVED
    ).count()
    
    closed_tickets = base_query.filter(
        date_filter,
        Ticket.status == TicketStatus.CLOSED
    ).count()
    
    # Average resolution time (in hours)
    resolved_tickets_with_time = base_query.filter(
        date_filter,
        Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
        Ticket.resolved_at.isnot(None)
    ).all()
    
    avg_resolution_time = None
    if resolved_tickets_with_time:
        total_time = sum([
            (ticket.resolved_at - ticket.created_at).total_seconds() / 3600
            for ticket in resolved_tickets_with_time
        ])
        avg_resolution_time = total_time / len(resolved_tickets_with_time)
    
    # Tickets by priority
    priority_stats = db.query(
        Ticket.priority,
        func.count(Ticket.id).label('count')
    ).filter(date_filter).group_by(Ticket.priority).all()
    
    tickets_by_priority = {
        priority.value: 0 for priority in TicketPriority
    }
    for priority, count in priority_stats:
        tickets_by_priority[priority.value] = count
    
    # Tickets by category
    category_stats = db.query(
        Category.name,
        func.count(Ticket.id).label('count')
    ).join(
        Ticket, Category.id == Ticket.category_id
    ).filter(date_filter).group_by(Category.name).all()
    
    tickets_by_category = dict(category_stats)
    
    # Recent activities (last 10)
    recent_activities = db.query(TicketActivity).join(
        User, TicketActivity.user_id == User.id
    ).filter(
        TicketActivity.created_at >= start_date
    ).order_by(
        TicketActivity.created_at.desc()
    ).limit(10).all()
    
    return DashboardStats(
        total_tickets=total_tickets,
        open_tickets=open_tickets,
        in_progress_tickets=in_progress_tickets,
        resolved_tickets=resolved_tickets,
        closed_tickets=closed_tickets,
        avg_resolution_time=avg_resolution_time,
        tickets_by_priority=tickets_by_priority,
        tickets_by_category=tickets_by_category,
        recent_activities=recent_activities
    )

@router.get("/tickets-by-month")
async def get_tickets_by_month(
    months: int = Query(12, ge=1, le=24),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get tickets count by month"""
    
    # Get tickets grouped by month
    monthly_stats = db.query(
        extract('year', Ticket.created_at).label('year'),
        extract('month', Ticket.created_at).label('month'),
        func.count(Ticket.id).label('count')
    ).filter(
        Ticket.created_at >= datetime.utcnow() - timedelta(days=months * 30)
    ).group_by(
        extract('year', Ticket.created_at),
        extract('month', Ticket.created_at)
    ).order_by(
        extract('year', Ticket.created_at),
        extract('month', Ticket.created_at)
    ).all()
    
    return [
        {
            'year': int(year),
            'month': int(month),
            'count': count,
            'label': f"{int(month):02d}/{int(year)}"
        }
        for year, month, count in monthly_stats
    ]

@router.get("/technician-performance")
async def get_technician_performance(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get technician performance statistics"""
    
    # Date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get technician statistics
    technician_stats = db.query(
        User.full_name,
        User.id,
        func.count(Ticket.id).label('total_tickets'),
        func.sum(
            func.case(
                (Ticket.status.in_([TicketStatus.RESOLVED, TicketStatus.CLOSED]), 1),
                else_=0
            )
        ).label('resolved_tickets')
    ).join(
        Ticket, User.id == Ticket.assigned_to_id
    ).filter(
        User.role.in_([UserRole.TECHNICIAN, UserRole.ADMIN]),
        Ticket.created_at >= start_date
    ).group_by(
        User.id, User.full_name
    ).all()
    
    return [
        {
            'technician_name': name,
            'technician_id': tech_id,
            'total_tickets': total or 0,
            'resolved_tickets': resolved or 0,
            'resolution_rate': (resolved / total * 100) if total and resolved else 0
        }
        for name, tech_id, total, resolved in technician_stats
    ]

@router.get("/priority-trends")
async def get_priority_trends(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get priority trends over time"""
    
    # Date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get priority trends by week
    priority_trends = db.query(
        extract('week', Ticket.created_at).label('week'),
        extract('year', Ticket.created_at).label('year'),
        Ticket.priority,
        func.count(Ticket.id).label('count')
    ).filter(
        Ticket.created_at >= start_date
    ).group_by(
        extract('week', Ticket.created_at),
        extract('year', Ticket.created_at),
        Ticket.priority
    ).order_by(
        extract('year', Ticket.created_at),
        extract('week', Ticket.created_at)
    ).all()
    
    # Organize data by week
    weeks_data = {}
    for week, year, priority, count in priority_trends:
        week_key = f"{int(year)}-W{int(week):02d}"
        if week_key not in weeks_data:
            weeks_data[week_key] = {
                'week': week_key,
                'low': 0,
                'medium': 0,
                'high': 0,
                'urgent': 0
            }
        weeks_data[week_key][priority.value] = count
    
    return list(weeks_data.values())
