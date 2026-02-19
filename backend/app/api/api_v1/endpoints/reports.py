from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case, and_, or_
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import calendar

from app.core.deps import get_db, get_current_user, get_current_technician
from app.models.models import User, Ticket, TicketStatus, TicketPriority, TicketEvaluation, Company
from app.schemas.schemas import User as UserSchema

router = APIRouter()

@router.get("/performance/technicians")
async def get_technician_performance(
    days: int = Query(30, description="Number of days to analyze"),
    technician_id: Optional[int] = Query(None, description="Specific technician ID"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get performance metrics for technicians"""
    
    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Base query
    query = db.query(
        User.id,
        User.full_name,
        User.username,
        User.department,
        func.count(Ticket.id).label('total_tickets'),
        func.count(case([(Ticket.status == TicketStatus.RESOLVED, 1)])).label('resolved_tickets'),
        func.count(case([(Ticket.status == TicketStatus.CLOSED, 1)])).label('closed_tickets'),
        func.avg(
            case([
                (Ticket.resolved_at.isnot(None), 
                 func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600)
            ])
        ).label('avg_resolution_time_hours'),
        func.avg(TicketEvaluation.rating).label('avg_rating')
    ).join(
        Ticket, User.id == Ticket.assigned_to_id
    ).outerjoin(
        TicketEvaluation, Ticket.id == TicketEvaluation.ticket_id
    ).filter(
        User.role.in_(['technician', 'admin']),
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    )
    
    # Filter by specific technician if requested
    if technician_id:
        query = query.filter(User.id == technician_id)
    
    # Group by user
    query = query.group_by(User.id, User.full_name, User.username, User.department)
    
    results = query.all()
    
    performance_data = []
    for result in results:
        resolution_rate = (result.resolved_tickets + result.closed_tickets) / result.total_tickets * 100 if result.total_tickets > 0 else 0
        
        performance_data.append({
            'technician_id': result.id,
            'name': result.full_name,
            'username': result.username,
            'department': result.department,
            'total_tickets': result.total_tickets,
            'resolved_tickets': result.resolved_tickets,
            'closed_tickets': result.closed_tickets,
            'resolution_rate': round(resolution_rate, 2),
            'avg_resolution_time_hours': round(result.avg_resolution_time_hours or 0, 2),
            'avg_rating': round(result.avg_rating or 0, 2)
        })
    
    return {
        'period': f'{days} days',
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'technicians': performance_data
    }

@router.get("/metrics/department")
async def get_department_metrics(
    days: int = Query(30, description="Number of days to analyze"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get metrics grouped by department"""
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get tickets by department (based on creator's department)
    query = db.query(
        User.department,
        func.count(Ticket.id).label('total_tickets'),
        func.count(case([(Ticket.status == TicketStatus.OPEN, 1)])).label('open_tickets'),
        func.count(case([(Ticket.status == TicketStatus.IN_PROGRESS, 1)])).label('in_progress_tickets'),
        func.count(case([(Ticket.status == TicketStatus.RESOLVED, 1)])).label('resolved_tickets'),
        func.count(case([(Ticket.status == TicketStatus.CLOSED, 1)])).label('closed_tickets'),
        func.count(case([(Ticket.priority == TicketPriority.URGENT, 1)])).label('urgent_tickets'),
        func.count(case([(Ticket.priority == TicketPriority.HIGH, 1)])).label('high_tickets'),
        func.avg(
            case([
                (Ticket.resolved_at.isnot(None), 
                 func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600)
            ])
        ).label('avg_resolution_time_hours')
    ).join(
        User, Ticket.created_by_id == User.id
    ).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date,
        User.department.isnot(None)
    ).group_by(User.department)
    
    results = query.all()
    
    department_data = []
    for result in results:
        resolution_rate = (result.resolved_tickets + result.closed_tickets) / result.total_tickets * 100 if result.total_tickets > 0 else 0
        
        department_data.append({
            'department': result.department,
            'total_tickets': result.total_tickets,
            'open_tickets': result.open_tickets,
            'in_progress_tickets': result.in_progress_tickets,
            'resolved_tickets': result.resolved_tickets,
            'closed_tickets': result.closed_tickets,
            'urgent_tickets': result.urgent_tickets,
            'high_tickets': result.high_tickets,
            'resolution_rate': round(resolution_rate, 2),
            'avg_resolution_time_hours': round(result.avg_resolution_time_hours or 0, 2)
        })
    
    return {
        'period': f'{days} days',
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'departments': department_data
    }

@router.get("/metrics/timeline")
async def get_timeline_metrics(
    days: int = Query(30, description="Number of days to analyze"),
    interval: str = Query("daily", description="Interval: daily, weekly, monthly"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get metrics over time"""
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Determine grouping based on interval
    if interval == "daily":
        date_trunc = func.date(Ticket.created_at)
        date_format = '%Y-%m-%d'
    elif interval == "weekly":
        date_trunc = func.date(Ticket.created_at - timedelta(days=func.extract('dow', Ticket.created_at)))
        date_format = '%Y-%m-%d'
    else:  # monthly
        date_trunc = func.date_trunc('month', Ticket.created_at)
        date_format = '%Y-%m'
    
    query = db.query(
        date_trunc.label('period'),
        func.count(Ticket.id).label('created_tickets'),
        func.count(case([(Ticket.resolved_at.isnot(None), 1)])).label('resolved_tickets'),
        func.count(case([(Ticket.status == TicketStatus.CLOSED, 1)])).label('closed_tickets'),
        func.count(case([(Ticket.priority == TicketPriority.URGENT, 1)])).label('urgent_tickets')
    ).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date
    ).group_by(date_trunc).order_by(date_trunc)
    
    results = query.all()
    
    timeline_data = []
    for result in results:
        timeline_data.append({
            'period': result.period.strftime(date_format) if result.period else None,
            'created_tickets': result.created_tickets,
            'resolved_tickets': result.resolved_tickets,
            'closed_tickets': result.closed_tickets,
            'urgent_tickets': result.urgent_tickets
        })
    
    return {
        'interval': interval,
        'period': f'{days} days',
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'timeline': timeline_data
    }

@router.get("/sla/analysis")
async def get_sla_analysis(
    days: int = Query(30, description="Number of days to analyze"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get SLA compliance analysis"""
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Define SLA targets (in hours)
    sla_targets = {
        TicketPriority.URGENT: 4,    # 4 hours
        TicketPriority.HIGH: 24,     # 1 day
        TicketPriority.MEDIUM: 72,   # 3 days
        TicketPriority.LOW: 168      # 1 week
    }
    
    sla_data = []
    
    for priority, target_hours in sla_targets.items():
        # Get tickets for this priority
        query = db.query(
            func.count(Ticket.id).label('total_tickets'),
            func.count(
                case([
                    (and_(
                        Ticket.resolved_at.isnot(None),
                        func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600 <= target_hours
                    ), 1)
                ])
            ).label('within_sla'),
            func.avg(
                case([
                    (Ticket.resolved_at.isnot(None),
                     func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600)
                ])
            ).label('avg_resolution_time')
        ).filter(
            Ticket.priority == priority,
            Ticket.created_at >= start_date,
            Ticket.created_at <= end_date,
            Ticket.resolved_at.isnot(None)
        )
        
        result = query.first()
        
        if result and result.total_tickets > 0:
            sla_compliance = (result.within_sla / result.total_tickets) * 100
            
            sla_data.append({
                'priority': priority.value,
                'target_hours': target_hours,
                'total_tickets': result.total_tickets,
                'within_sla': result.within_sla,
                'sla_compliance_percent': round(sla_compliance, 2),
                'avg_resolution_time_hours': round(result.avg_resolution_time or 0, 2)
            })
    
    # Overall SLA compliance
    overall_query = db.query(
        func.count(Ticket.id).label('total_tickets'),
        func.avg(
            case([
                (Ticket.resolved_at.isnot(None),
                 func.extract('epoch', Ticket.resolved_at - Ticket.created_at) / 3600)
            ])
        ).label('avg_resolution_time')
    ).filter(
        Ticket.created_at >= start_date,
        Ticket.created_at <= end_date,
        Ticket.resolved_at.isnot(None)
    )
    
    overall_result = overall_query.first()
    
    return {
        'period': f'{days} days',
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'sla_targets': sla_targets,
        'priority_analysis': sla_data,
        'overall': {
            'total_resolved_tickets': overall_result.total_tickets or 0,
            'avg_resolution_time_hours': round(overall_result.avg_resolution_time or 0, 2)
        }
    }

@router.get("/export/data")
async def get_export_data(
    report_type: str = Query(..., description="Type of report: performance, department, timeline, sla"),
    days: int = Query(30, description="Number of days to analyze"),
    format: str = Query("json", description="Export format: json, csv"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get data for export in various formats"""
    
    if report_type == "performance":
        data = await get_technician_performance(days=days, current_user=current_user, db=db)
    elif report_type == "department":
        data = await get_department_metrics(days=days, current_user=current_user, db=db)
    elif report_type == "timeline":
        data = await get_timeline_metrics(days=days, current_user=current_user, db=db)
    elif report_type == "sla":
        data = await get_sla_analysis(days=days, current_user=current_user, db=db)
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    return {
        'report_type': report_type,
        'format': format,
        'generated_at': datetime.now().isoformat(),
        'data': data
    }

@router.get("/financial/company/{company_id}")
async def get_company_financial_report(
    company_id: int,
    year: int = Query(..., description="Year for the report"),
    month: int = Query(..., ge=1, le=12, description="Month for the report (1-12)"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get financial report for a specific company"""
    
    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Calculate date range for the month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    # Get tickets for this company in the specified month
    tickets = db.query(Ticket).filter(
        Ticket.company_id == company_id,
        Ticket.created_at >= start_date,
        Ticket.created_at < end_date
    ).all()
    
    # Calculate metrics
    total_tickets = len(tickets)
    closed_tickets = len([t for t in tickets if t.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]])
    
    # Calculate total hours spent
    total_hours = sum([t.time_spent_hours or 0 for t in tickets])
    
    # Calculate financial value
    if company.has_contract:
        # Fixed monthly value from contract
        monthly_value = company.contract_value or 0
        billing_type = "contract"
    else:
        # Calculate based on hours worked
        monthly_value = total_hours * (company.hourly_rate or 0)
        billing_type = "hourly"
    
    # Get tickets by priority
    tickets_by_priority = {
        'low': len([t for t in tickets if t.priority == TicketPriority.LOW]),
        'medium': len([t for t in tickets if t.priority == TicketPriority.MEDIUM]),
        'high': len([t for t in tickets if t.priority == TicketPriority.HIGH]),
        'urgent': len([t for t in tickets if t.priority == TicketPriority.URGENT])
    }
    
    # Get tickets by status
    tickets_by_status = {
        'open': len([t for t in tickets if t.status == TicketStatus.OPEN]),
        'in_progress': len([t for t in tickets if t.status == TicketStatus.IN_PROGRESS]),
        'waiting_user': len([t for t in tickets if t.status == TicketStatus.WAITING_USER]),
        'resolved': len([t for t in tickets if t.status == TicketStatus.RESOLVED]),
        'closed': len([t for t in tickets if t.status == TicketStatus.CLOSED]),
        'reopened': len([t for t in tickets if t.status == TicketStatus.REOPENED])
    }
    
    # Calculate average resolution time for closed tickets
    closed_tickets_with_time = [t for t in tickets if t.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED] and t.resolved_at]
    avg_resolution_hours = None
    if closed_tickets_with_time:
        total_resolution_time = sum([
            (t.resolved_at.replace(tzinfo=None) - t.created_at.replace(tzinfo=None)).total_seconds() / 3600
            for t in closed_tickets_with_time
        ])
        avg_resolution_hours = total_resolution_time / len(closed_tickets_with_time)
    
    return {
        'company': {
            'id': company.id,
            'name': company.name,
            'legal_name': company.legal_name,
            'cnpj': company.cnpj,
            'has_contract': company.has_contract,
            'contract_value': company.contract_value,
            'hourly_rate': company.hourly_rate,
            'contract_status': company.contract_status.value if company.contract_status else None
        },
        'period': {
            'year': year,
            'month': month,
            'month_name': calendar.month_name[month],
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'metrics': {
            'total_tickets': total_tickets,
            'closed_tickets': closed_tickets,
            'total_hours_spent': round(total_hours, 2),
            'avg_resolution_hours': round(avg_resolution_hours, 2) if avg_resolution_hours else None
        },
        'financial': {
            'billing_type': billing_type,
            'monthly_value': round(monthly_value, 2),
            'hourly_rate': company.hourly_rate if not company.has_contract else None,
            'hours_worked': round(total_hours, 2) if not company.has_contract else None
        },
        'tickets_by_priority': tickets_by_priority,
        'tickets_by_status': tickets_by_status,
        'generated_at': datetime.now().isoformat()
    }
