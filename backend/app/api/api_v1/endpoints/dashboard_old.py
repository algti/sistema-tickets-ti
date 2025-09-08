from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.models import Ticket, TicketStatus, TicketPriority, Category, User, UserRole, TicketActivity
from app.schemas.schemas import DashboardStats

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user),
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
    
    # Apply role-based filtering
    user_role = current_user.role
    if isinstance(user_role, str):
        user_role_str = user_role.lower()
    else:
        user_role_str = user_role.value.lower()
    
    # Role-based filtering
    if user_role_str == "admin":
        # Admin sees all tickets - no additional filtering
        pass
    elif user_role_str == "technician":
        # Technician sees only tickets assigned to them
        base_query = base_query.filter(Ticket.assigned_to_id == current_user.id)
    elif user_role_str == "user":
        # Regular user sees only their own tickets
        base_query = base_query.filter(Ticket.created_by_id == current_user.id)
    else:
        # Unknown role - restrict to own tickets
        base_query = base_query.filter(Ticket.created_by_id == current_user.id)
    
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
    
    # Tickets by priority (apply same role-based filtering)
    priority_stats = base_query.filter(date_filter).with_entities(
        Ticket.priority,
        func.count(Ticket.id).label('count')
    ).group_by(Ticket.priority).all()
    
    tickets_by_priority = {
        priority.value: 0 for priority in TicketPriority
    }
    for priority, count in priority_stats:
        tickets_by_priority[priority.value] = count
    
    # Tickets by category (apply same role-based filtering)
    category_query = db.query(
        Category.name,
        func.count(Ticket.id).label('count')
    ).join(
        Ticket, Category.id == Ticket.category_id
    ).filter(date_filter)
    
    # Apply role-based filtering to category stats
    if user_role_str == "technician":
        category_query = category_query.filter(Ticket.assigned_to_id == current_user.id)
    elif user_role_str == "user":
        category_query = category_query.filter(Ticket.created_by_id == current_user.id)
    
    category_stats = category_query.group_by(Category.name).all()
    
    tickets_by_category = dict(category_stats)
    
    # Recent activities (last 10) - apply role-based filtering
    activities_query = db.query(TicketActivity).join(
        User, TicketActivity.user_id == User.id
    ).join(
        Ticket, TicketActivity.ticket_id == Ticket.id
    ).filter(
        TicketActivity.created_at >= start_date
    )
    
    # Apply role-based filtering to activities
    if user_role_str == "technician":
        activities_query = activities_query.filter(Ticket.assigned_to_id == current_user.id)
    elif user_role_str == "user":
        activities_query = activities_query.filter(Ticket.created_by_id == current_user.id)
    
    recent_activities = activities_query.order_by(
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get tickets count by month"""
    
    # Apply role-based filtering
    user_role = current_user.role
    if isinstance(user_role, str):
        user_role_str = user_role.lower()
    else:
        user_role_str = user_role.value.lower()
    
    # Base query with date filter
    base_query = db.query(
        extract('year', Ticket.created_at).label('year'),
        extract('month', Ticket.created_at).label('month'),
        func.count(Ticket.id).label('count')
    ).filter(
        Ticket.created_at >= datetime.utcnow() - timedelta(days=months * 30)
    )
    
    # Apply role-based filtering
    if user_role_str == "admin":
        # Admin sees all tickets - no additional filtering
        pass
    elif user_role_str == "technician":
        # Technician sees only tickets assigned to them
        base_query = base_query.filter(Ticket.assigned_to_id == current_user.id)
    elif user_role_str == "user":
        # Regular user sees only their own tickets
        base_query = base_query.filter(Ticket.created_by_id == current_user.id)
    else:
        # Unknown role - restrict to own tickets
        base_query = base_query.filter(Ticket.created_by_id == current_user.id)
    
    # Get tickets grouped by month
    monthly_stats = base_query.group_by(
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get technician performance statistics"""
    
    # Apply role-based filtering
    user_role = current_user.role
    if isinstance(user_role, str):
        user_role_str = user_role.lower()
    else:
        user_role_str = user_role.value.lower()
    
    # Only admins and technicians can see performance stats
    if user_role_str not in ["admin", "technician"]:
        return []
    
    # Date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Base query for technician statistics
    base_query = db.query(
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
        User.role.in_([UserRole.technician, UserRole.admin]),
        Ticket.created_at >= start_date
    )
    
    # Apply role-based filtering
    if user_role_str == "technician":
        # Technician sees only their own performance
        base_query = base_query.filter(User.id == current_user.id)
    # Admin sees all technicians' performance - no additional filtering needed
    
    technician_stats = base_query.group_by(
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get priority trends over time"""
    
    # Apply role-based filtering
    user_role = current_user.role
    if isinstance(user_role, str):
        user_role_str = user_role.lower()
    else:
        user_role_str = user_role.value.lower()
    
    # Date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Base query for priority trends by week
    base_query = db.query(
        extract('week', Ticket.created_at).label('week'),
        extract('year', Ticket.created_at).label('year'),
        Ticket.priority,
        func.count(Ticket.id).label('count')
    ).filter(
        Ticket.created_at >= start_date
    )
    
    # Apply role-based filtering
    if user_role_str == "admin":
        # Admin sees all tickets - no additional filtering
        pass
    elif user_role_str == "technician":
        # Technician sees only tickets assigned to them
        base_query = base_query.filter(Ticket.assigned_to_id == current_user.id)
    elif user_role_str == "user":
        # Regular user sees only their own tickets
        base_query = base_query.filter(Ticket.created_by_id == current_user.id)
    else:
        # Unknown role - restrict to own tickets
        base_query = base_query.filter(Ticket.created_by_id == current_user.id)
    
    # Get priority trends by week
    priority_trends = base_query.group_by(
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
