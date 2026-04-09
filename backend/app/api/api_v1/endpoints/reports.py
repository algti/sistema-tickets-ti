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
    days: Optional[int] = Query(None, description="Number of days to analyze (ignored if start_date/end_date provided)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    technician_id: Optional[int] = Query(None, description="Specific technician ID"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Get performance metrics for technicians"""
    
    # Calculate date range - prioriza start_date/end_date se fornecidos
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        if start > end:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
    else:
        # Fallback para days (padrão 30)
        days_to_use = days if days else 30
        end = datetime.now()
        start = end - timedelta(days=days_to_use)
    
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
        Ticket.created_at >= start,
        Ticket.created_at <= end
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


# ========== NOVOS ENDPOINTS COM FILTROS DE DATA CUSTOMIZADOS ==========

@router.get("/general")
async def get_general_report(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Relatório geral de tickets entre datas especificadas"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Query tickets no período
    tickets = db.query(Ticket).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    ).all()
    
    # Estatísticas gerais
    total_tickets = len(tickets)
    tickets_by_status = {}
    tickets_by_priority = {}
    tickets_by_category = {}
    total_hours = 0
    
    for ticket in tickets:
        # Por status
        status_key = ticket.status.value
        tickets_by_status[status_key] = tickets_by_status.get(status_key, 0) + 1
        
        # Por prioridade
        priority_key = ticket.priority.value
        tickets_by_priority[priority_key] = tickets_by_priority.get(priority_key, 0) + 1
        
        # Por categoria
        if ticket.category:
            cat_name = ticket.category.name
            tickets_by_category[cat_name] = tickets_by_category.get(cat_name, 0) + 1
        
        # Horas totais
        if ticket.time_spent_hours:
            total_hours += ticket.time_spent_hours
    
    # Tempo médio de resolução
    resolved_tickets = [t for t in tickets if t.resolved_at]
    avg_resolution_hours = None
    if resolved_tickets:
        total_resolution_time = sum([
            (t.resolved_at - t.created_at).total_seconds() / 3600 
            for t in resolved_tickets
        ])
        avg_resolution_hours = total_resolution_time / len(resolved_tickets)
    
    return {
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'summary': {
            'total_tickets': total_tickets,
            'total_hours_spent': round(total_hours, 2),
            'avg_resolution_hours': round(avg_resolution_hours, 2) if avg_resolution_hours else None,
            'resolved_tickets': len(resolved_tickets)
        },
        'tickets_by_status': tickets_by_status,
        'tickets_by_priority': tickets_by_priority,
        'tickets_by_category': tickets_by_category,
        'generated_at': datetime.now().isoformat()
    }


@router.get("/by-company")
async def get_report_by_company(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    company_id: Optional[int] = Query(None, description="Filter by specific company"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Relatório de tickets por empresa entre datas especificadas"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Query base
    query = db.query(Ticket).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    )
    
    if company_id:
        query = query.filter(Ticket.company_id == company_id)
    
    tickets = query.all()
    
    # Agrupar por empresa
    companies_data = {}
    
    for ticket in tickets:
        if ticket.company:
            comp_id = ticket.company.id
            comp_name = ticket.company.name
            
            if comp_id not in companies_data:
                companies_data[comp_id] = {
                    'company_id': comp_id,
                    'company_name': comp_name,
                    'total_tickets': 0,
                    'total_hours': 0,
                    'tickets_by_status': {},
                    'tickets_by_priority': {}
                }
            
            companies_data[comp_id]['total_tickets'] += 1
            
            if ticket.time_spent_hours:
                companies_data[comp_id]['total_hours'] += ticket.time_spent_hours
            
            # Status
            status_key = ticket.status.value
            companies_data[comp_id]['tickets_by_status'][status_key] = \
                companies_data[comp_id]['tickets_by_status'].get(status_key, 0) + 1
            
            # Prioridade
            priority_key = ticket.priority.value
            companies_data[comp_id]['tickets_by_priority'][priority_key] = \
                companies_data[comp_id]['tickets_by_priority'].get(priority_key, 0) + 1
    
    # Arredondar horas
    for comp_data in companies_data.values():
        comp_data['total_hours'] = round(comp_data['total_hours'], 2)
    
    return {
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'total_tickets': len(tickets),
        'companies': list(companies_data.values()),
        'generated_at': datetime.now().isoformat()
    }


@router.get("/by-user")
async def get_report_by_user(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    user_id: Optional[int] = Query(None, description="Filter by specific user"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Relatório de tickets por usuário (criador) entre datas especificadas"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Query base
    query = db.query(Ticket).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    )
    
    if user_id:
        query = query.filter(Ticket.created_by_id == user_id)
    
    tickets = query.all()
    
    # Agrupar por usuário
    users_data = {}
    
    for ticket in tickets:
        if ticket.created_by:
            usr_id = ticket.created_by.id
            usr_name = ticket.created_by.full_name
            usr_email = ticket.created_by.email
            usr_dept = ticket.created_by.department
            
            if usr_id not in users_data:
                users_data[usr_id] = {
                    'user_id': usr_id,
                    'user_name': usr_name,
                    'user_email': usr_email,
                    'department': usr_dept,
                    'total_tickets': 0,
                    'tickets_by_status': {},
                    'tickets_by_priority': {}
                }
            
            users_data[usr_id]['total_tickets'] += 1
            
            # Status
            status_key = ticket.status.value
            users_data[usr_id]['tickets_by_status'][status_key] = \
                users_data[usr_id]['tickets_by_status'].get(status_key, 0) + 1
            
            # Prioridade
            priority_key = ticket.priority.value
            users_data[usr_id]['tickets_by_priority'][priority_key] = \
                users_data[usr_id]['tickets_by_priority'].get(priority_key, 0) + 1
    
    return {
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'total_tickets': len(tickets),
        'users': list(users_data.values()),
        'generated_at': datetime.now().isoformat()
    }


@router.get("/by-user-company")
async def get_report_by_user_and_company(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    company_id: Optional[int] = Query(None, description="Filter by specific company"),
    user_id: Optional[int] = Query(None, description="Filter by specific user"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Relatório de tickets por usuário x empresa entre datas especificadas"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Query base
    query = db.query(Ticket).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    )
    
    if company_id:
        query = query.filter(Ticket.company_id == company_id)
    
    if user_id:
        query = query.filter(Ticket.created_by_id == user_id)
    
    tickets = query.all()
    
    # Agrupar por empresa e depois por usuário
    companies_data = {}
    
    for ticket in tickets:
        if ticket.company and ticket.created_by:
            comp_id = ticket.company.id
            comp_name = ticket.company.name
            usr_id = ticket.created_by.id
            usr_name = ticket.created_by.full_name
            
            if comp_id not in companies_data:
                companies_data[comp_id] = {
                    'company_id': comp_id,
                    'company_name': comp_name,
                    'total_tickets': 0,
                    'users': {}
                }
            
            if usr_id not in companies_data[comp_id]['users']:
                companies_data[comp_id]['users'][usr_id] = {
                    'user_id': usr_id,
                    'user_name': usr_name,
                    'total_tickets': 0,
                    'tickets_by_status': {},
                    'tickets_by_priority': {}
                }
            
            companies_data[comp_id]['total_tickets'] += 1
            companies_data[comp_id]['users'][usr_id]['total_tickets'] += 1
            
            # Status
            status_key = ticket.status.value
            companies_data[comp_id]['users'][usr_id]['tickets_by_status'][status_key] = \
                companies_data[comp_id]['users'][usr_id]['tickets_by_status'].get(status_key, 0) + 1
            
            # Prioridade
            priority_key = ticket.priority.value
            companies_data[comp_id]['users'][usr_id]['tickets_by_priority'][priority_key] = \
                companies_data[comp_id]['users'][usr_id]['tickets_by_priority'].get(priority_key, 0) + 1
    
    # Converter dicts internos para listas
    for comp_data in companies_data.values():
        comp_data['users'] = list(comp_data['users'].values())
    
    return {
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'total_tickets': len(tickets),
        'companies': list(companies_data.values()),
        'generated_at': datetime.now().isoformat()
    }


@router.get("/by-category")
async def get_report_by_category(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    category_id: Optional[int] = Query(None, description="Filter by specific category"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Relatório de tickets por categoria entre datas especificadas"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Query base
    query = db.query(Ticket).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    )
    
    if category_id:
        query = query.filter(Ticket.category_id == category_id)
    
    tickets = query.all()
    
    # Agrupar por categoria
    categories_data = {}
    
    for ticket in tickets:
        if ticket.category:
            cat_id = ticket.category.id
            cat_name = ticket.category.name
            cat_color = ticket.category.color
            
            if cat_id not in categories_data:
                categories_data[cat_id] = {
                    'category_id': cat_id,
                    'category_name': cat_name,
                    'category_color': cat_color,
                    'total_tickets': 0,
                    'tickets_by_status': {},
                    'tickets_by_priority': {}
                }
            
            categories_data[cat_id]['total_tickets'] += 1
            
            # Status
            status_key = ticket.status.value
            categories_data[cat_id]['tickets_by_status'][status_key] = \
                categories_data[cat_id]['tickets_by_status'].get(status_key, 0) + 1
            
            # Prioridade
            priority_key = ticket.priority.value
            categories_data[cat_id]['tickets_by_priority'][priority_key] = \
                categories_data[cat_id]['tickets_by_priority'].get(priority_key, 0) + 1
    
    return {
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'total_tickets': len(tickets),
        'categories': list(categories_data.values()),
        'generated_at': datetime.now().isoformat()
    }


@router.get("/detailed-company-user")
async def get_detailed_company_user_report(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    company_id: Optional[int] = Query(None, description="Filter by specific company"),
    user_id: Optional[int] = Query(None, description="Filter by specific user"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """
    Relatório detalhado empresa + usuário com timeline completo:
    - Data/hora de abertura
    - Data/hora de fechamento
    - O que foi solicitado (descrição)
    - O que foi feito (solução)
    """
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if start > end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Query base
    query = db.query(Ticket).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    )
    
    if company_id:
        query = query.filter(Ticket.company_id == company_id)
    
    if user_id:
        query = query.filter(Ticket.created_by_id == user_id)
    
    tickets = query.order_by(Ticket.created_at.desc()).all()
    
    # Montar lista detalhada
    detailed_tickets = []
    
    for ticket in tickets:
        # Calcular tempo de atendimento
        resolution_time_hours = None
        if ticket.closed_at:
            resolution_time_hours = (ticket.closed_at - ticket.created_at).total_seconds() / 3600
        
        detailed_tickets.append({
            'ticket_id': ticket.id,
            'title': ticket.title,
            'company': {
                'id': ticket.company.id if ticket.company else None,
                'name': ticket.company.name if ticket.company else None
            },
            'user': {
                'id': ticket.created_by.id if ticket.created_by else None,
                'name': ticket.created_by.full_name if ticket.created_by else None,
                'email': ticket.created_by.email if ticket.created_by else None
            },
            'technician': {
                'id': ticket.assigned_to.id if ticket.assigned_to else None,
                'name': ticket.assigned_to.full_name if ticket.assigned_to else None
            },
            'category': ticket.category.name if ticket.category else None,
            'priority': ticket.priority.value,
            'status': ticket.status.value,
            'timeline': {
                'opened_at': ticket.created_at.isoformat(),
                'resolved_at': ticket.resolved_at.isoformat() if ticket.resolved_at else None,
                'closed_at': ticket.closed_at.isoformat() if ticket.closed_at else None,
                'resolution_time_hours': round(resolution_time_hours, 2) if resolution_time_hours else None
            },
            'details': {
                'description': ticket.description,
                'solution': ticket.solution if ticket.solution else None,
                'time_spent_hours': ticket.time_spent_hours if ticket.time_spent_hours else 0
            }
        })
    
    return {
        'period': {
            'start_date': start_date,
            'end_date': end_date
        },
        'total_tickets': len(detailed_tickets),
        'tickets': detailed_tickets,
        'generated_at': datetime.now().isoformat()
    }


# ========== RELATÓRIOS AVANÇADOS ADICIONAIS ==========

@router.get("/advanced/satisfaction-analysis")
async def get_satisfaction_analysis(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Análise de satisfação do cliente com avaliações detalhadas"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Query avaliações no período
    evaluations = db.query(TicketEvaluation).join(
        Ticket, TicketEvaluation.ticket_id == Ticket.id
    ).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    ).all()
    
    if not evaluations:
        return {
            'period': {'start_date': start_date, 'end_date': end_date},
            'summary': {'total_evaluations': 0},
            'message': 'Nenhuma avaliação encontrada no período'
        }
    
    # Calcular métricas
    total_evals = len(evaluations)
    avg_rating = sum([e.rating for e in evaluations]) / total_evals
    
    ratings_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for eval in evaluations:
        ratings_distribution[eval.rating] += 1
    
    # Avaliações por técnico
    tech_ratings = {}
    for eval in evaluations:
        ticket = eval.ticket
        if ticket.assigned_to:
            tech_id = ticket.assigned_to.id
            tech_name = ticket.assigned_to.full_name
            
            if tech_id not in tech_ratings:
                tech_ratings[tech_id] = {
                    'technician_name': tech_name,
                    'total_evaluations': 0,
                    'avg_rating': 0,
                    'ratings': []
                }
            
            tech_ratings[tech_id]['total_evaluations'] += 1
            tech_ratings[tech_id]['ratings'].append(eval.rating)
    
    # Calcular médias
    for tech_data in tech_ratings.values():
        tech_data['avg_rating'] = round(sum(tech_data['ratings']) / len(tech_data['ratings']), 2)
        del tech_data['ratings']
    
    return {
        'period': {'start_date': start_date, 'end_date': end_date},
        'summary': {
            'total_evaluations': total_evals,
            'avg_rating': round(avg_rating, 2),
            'satisfaction_rate': round((sum([ratings_distribution[4], ratings_distribution[5]]) / total_evals) * 100, 1)
        },
        'ratings_distribution': ratings_distribution,
        'by_technician': list(tech_ratings.values()),
        'generated_at': datetime.now().isoformat()
    }


@router.get("/advanced/reopened-analysis")
async def get_reopened_analysis(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Análise de tickets reabertos (reincidência)"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Tickets reabertos no período
    reopened_tickets = db.query(Ticket).filter(
        Ticket.status == TicketStatus.REOPENED,
        Ticket.created_at >= start,
        Ticket.created_at <= end
    ).all()
    
    total_tickets = db.query(Ticket).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    ).count()
    
    reopened_count = len(reopened_tickets)
    reopened_rate = (reopened_count / total_tickets * 100) if total_tickets > 0 else 0
    
    # Agrupar por categoria
    by_category = {}
    for ticket in reopened_tickets:
        if ticket.category:
            cat_name = ticket.category.name
            by_category[cat_name] = by_category.get(cat_name, 0) + 1
    
    # Agrupar por técnico
    by_technician = {}
    for ticket in reopened_tickets:
        if ticket.assigned_to:
            tech_name = ticket.assigned_to.full_name
            by_technician[tech_name] = by_technician.get(tech_name, 0) + 1
    
    return {
        'period': {'start_date': start_date, 'end_date': end_date},
        'summary': {
            'total_tickets': total_tickets,
            'reopened_tickets': reopened_count,
            'reopened_rate': round(reopened_rate, 2)
        },
        'by_category': by_category,
        'by_technician': by_technician,
        'generated_at': datetime.now().isoformat()
    }


@router.get("/advanced/productivity-analysis")
async def get_productivity_analysis(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Análise de produtividade por hora do dia e dia da semana"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    tickets = db.query(Ticket).filter(
        Ticket.created_at >= start,
        Ticket.created_at <= end
    ).all()
    
    # Análise por hora do dia
    by_hour = {h: 0 for h in range(24)}
    for ticket in tickets:
        hour = ticket.created_at.hour
        by_hour[hour] += 1
    
    # Análise por dia da semana (0=Monday, 6=Sunday)
    weekday_names = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
    by_weekday = {day: 0 for day in weekday_names}
    
    for ticket in tickets:
        weekday_idx = ticket.created_at.weekday()
        weekday_name = weekday_names[weekday_idx]
        by_weekday[weekday_name] += 1
    
    # Horários de pico
    peak_hours = sorted(by_hour.items(), key=lambda x: x[1], reverse=True)[:3]
    peak_hours_formatted = [{'hour': f'{h}:00', 'tickets': count} for h, count in peak_hours]
    
    return {
        'period': {'start_date': start_date, 'end_date': end_date},
        'total_tickets': len(tickets),
        'by_hour': by_hour,
        'by_weekday': by_weekday,
        'peak_hours': peak_hours_formatted,
        'generated_at': datetime.now().isoformat()
    }


@router.get("/advanced/financial-consolidated")
async def get_financial_consolidated(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Análise financeira consolidada de todas as empresas"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Buscar todas as empresas ativas
    companies = db.query(Company).filter(Company.is_active == True).all()
    
    total_revenue = 0
    companies_data = []
    contract_revenue = 0
    hourly_revenue = 0
    
    for company in companies:
        # Tickets da empresa no período
        tickets = db.query(Ticket).filter(
            Ticket.company_id == company.id,
            Ticket.created_at >= start,
            Ticket.created_at <= end
        ).all()
        
        total_hours = sum([t.time_spent_hours for t in tickets if t.time_spent_hours])
        
        # Calcular faturamento
        if company.has_contract and company.contract_value:
            # Calcular proporção do mês
            days_in_period = (end - start).days + 1
            monthly_value = company.contract_value * (days_in_period / 30)
            revenue = monthly_value
            billing_type = 'contract'
            contract_revenue += revenue
        else:
            revenue = total_hours * (company.hourly_rate or 0)
            billing_type = 'hourly'
            hourly_revenue += revenue
        
        total_revenue += revenue
        
        companies_data.append({
            'company_name': company.name,
            'billing_type': billing_type,
            'total_tickets': len(tickets),
            'total_hours': round(total_hours, 2),
            'revenue': round(revenue, 2)
        })
    
    # Ordenar por receita
    companies_data.sort(key=lambda x: x['revenue'], reverse=True)
    
    return {
        'period': {'start_date': start_date, 'end_date': end_date},
        'summary': {
            'total_revenue': round(total_revenue, 2),
            'contract_revenue': round(contract_revenue, 2),
            'hourly_revenue': round(hourly_revenue, 2),
            'total_companies': len(companies_data)
        },
        'companies': companies_data,
        'generated_at': datetime.now().isoformat()
    }


@router.get("/advanced/workload-distribution")
async def get_workload_distribution(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_technician),
    db: Session = Depends(get_db)
):
    """Análise de distribuição de carga de trabalho entre técnicos"""
    
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Buscar todos os técnicos
    technicians = db.query(User).filter(
        User.role.in_(['technician', 'admin']),
        User.is_active == True
    ).all()
    
    workload_data = []
    total_tickets = 0
    
    for tech in technicians:
        # Tickets atribuídos no período
        assigned_tickets = db.query(Ticket).filter(
            Ticket.assigned_to_id == tech.id,
            Ticket.created_at >= start,
            Ticket.created_at <= end
        ).all()
        
        # Tickets ativos (não fechados)
        active_tickets = [t for t in assigned_tickets if t.status not in [TicketStatus.CLOSED, TicketStatus.RESOLVED]]
        
        # Horas trabalhadas
        total_hours = sum([t.time_spent_hours for t in assigned_tickets if t.time_spent_hours])
        
        total_tickets += len(assigned_tickets)
        
        workload_data.append({
            'technician_name': tech.full_name,
            'total_assigned': len(assigned_tickets),
            'active_tickets': len(active_tickets),
            'total_hours': round(total_hours, 2),
            'avg_hours_per_ticket': round(total_hours / len(assigned_tickets), 2) if assigned_tickets else 0
        })
    
    # Calcular média de tickets por técnico
    avg_tickets_per_tech = total_tickets / len(technicians) if technicians else 0
    
    # Identificar técnicos sobrecarregados e ociosos
    overloaded = [t for t in workload_data if t['total_assigned'] > avg_tickets_per_tech * 1.5]
    underutilized = [t for t in workload_data if t['total_assigned'] < avg_tickets_per_tech * 0.5]
    
    return {
        'period': {'start_date': start_date, 'end_date': end_date},
        'summary': {
            'total_technicians': len(technicians),
            'total_tickets': total_tickets,
            'avg_tickets_per_technician': round(avg_tickets_per_tech, 1),
            'overloaded_count': len(overloaded),
            'underutilized_count': len(underutilized)
        },
        'workload': workload_data,
        'overloaded_technicians': overloaded,
        'underutilized_technicians': underutilized,
        'generated_at': datetime.now().isoformat()
    }
