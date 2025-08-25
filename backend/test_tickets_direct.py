#!/usr/bin/env python3
"""
Script para testar diretamente o endpoint /tickets/ simulando a requisição do admin
"""
from app.core.database import SessionLocal
from app.models.models import User, Ticket, UserRole
from app.api.api_v1.endpoints.tickets import get_tickets
from sqlalchemy.orm import joinedload
from sqlalchemy import desc, or_

def test_tickets_endpoint_direct():
    """Testa diretamente o endpoint get_tickets para admin"""
    print("🚀 Testando endpoint /tickets/ diretamente para admin...\n")
    
    db = SessionLocal()
    
    try:
        # 1. Buscar usuário admin
        print("1️⃣ Buscando usuário admin...")
        admin = db.query(User).filter(User.username == 'admin').first()
        if not admin:
            print("❌ Admin não encontrado!")
            return
            
        print(f"✅ Admin encontrado: {admin.username} (Role: {admin.role})")
        
        # 2. Simular exatamente os parâmetros que o frontend envia
        print(f"\n2️⃣ Simulando parâmetros do frontend...")
        
        # Parâmetros vazios (como o frontend envia inicialmente)
        status = ""
        priority = ""
        category_id = None
        assigned_to_id = None
        created_by_id = None
        search = ""
        skip = 0
        limit = 100
        
        print(f"Parâmetros:")
        print(f"  status: '{status}'")
        print(f"  priority: '{priority}'")
        print(f"  category_id: {category_id}")
        print(f"  assigned_to_id: {assigned_to_id}")
        print(f"  created_by_id: {created_by_id}")
        print(f"  search: '{search}'")
        print(f"  skip: {skip}")
        print(f"  limit: {limit}")
        
        # 3. Executar a mesma lógica do endpoint
        print(f"\n3️⃣ Executando lógica do endpoint...")
        
        # Query base (igual ao endpoint)
        query = db.query(Ticket).options(
            joinedload(Ticket.created_by),
            joinedload(Ticket.assigned_to),
            joinedload(Ticket.category)
        )
        
        print(f"Query inicial - Total tickets: {query.count()}")
        
        # Aplicar filtros baseados no role
        print(f"\n4️⃣ Aplicando filtros por role...")
        print(f"Admin role: {admin.role}")
        print(f"Role type: {type(admin.role)}")
        
        if admin.role == UserRole.USER:
            print("❌ ERRO: Admin sendo tratado como USER!")
            query = query.filter(Ticket.created_by_id == admin.id)
        elif admin.role == UserRole.TECHNICIAN:
            print("❌ ERRO: Admin sendo tratado como TECHNICIAN!")
            query = query.filter(Ticket.assigned_to_id == admin.id)
        elif admin.role == UserRole.ADMIN:
            print("✅ Admin sendo tratado como ADMIN (sem filtro de role)")
        else:
            print(f"❌ ERRO: Role não reconhecido: {admin.role}")
        
        print(f"Após filtro de role - Total tickets: {query.count()}")
        
        # Aplicar outros filtros (simulando parâmetros vazios)
        print(f"\n5️⃣ Aplicando outros filtros...")
        
        if status and status.strip():
            print(f"Aplicando filtro status: {status}")
            # Converter string para enum se necessário
            from app.models.models import TicketStatus
            try:
                status_enum = TicketStatus(status.lower())
                query = query.filter(Ticket.status == status_enum)
            except ValueError:
                print(f"❌ Status inválido: {status}")
        else:
            print("Status vazio - sem filtro")
        
        if priority and priority.strip():
            print(f"Aplicando filtro priority: {priority}")
            # Converter string para enum se necessário
            from app.models.models import TicketPriority
            try:
                priority_enum = TicketPriority(priority.lower())
                query = query.filter(Ticket.priority == priority_enum)
            except ValueError:
                print(f"❌ Priority inválida: {priority}")
        else:
            print("Priority vazia - sem filtro")
        
        if category_id:
            print(f"Aplicando filtro category_id: {category_id}")
            query = query.filter(Ticket.category_id == category_id)
        else:
            print("Category_id vazio - sem filtro")
        
        if assigned_to_id:
            print(f"Aplicando filtro assigned_to_id: {assigned_to_id}")
            query = query.filter(Ticket.assigned_to_id == assigned_to_id)
        else:
            print("Assigned_to_id vazio - sem filtro")
        
        if created_by_id and admin.role in [UserRole.TECHNICIAN, UserRole.ADMIN]:
            print(f"Aplicando filtro created_by_id: {created_by_id}")
            query = query.filter(Ticket.created_by_id == created_by_id)
        else:
            print("Created_by_id vazio - sem filtro")
        
        if search and search.strip():
            print(f"Aplicando filtro search: {search}")
            search_filter = or_(
                Ticket.title.ilike(f"%{search}%"),
                Ticket.description.ilike(f"%{search}%"),
                Ticket.solution.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        else:
            print("Search vazio - sem filtro")
        
        print(f"Após todos os filtros - Total tickets: {query.count()}")
        
        # Ordenar e executar
        print(f"\n6️⃣ Executando query final...")
        query = query.order_by(desc(Ticket.created_at))
        tickets = query.offset(skip).limit(limit).all()
        
        print(f"✅ Tickets encontrados: {len(tickets)}")
        
        if tickets:
            print("\n📋 Lista de tickets:")
            for ticket in tickets:
                created_by = ticket.created_by.username if ticket.created_by else "None"
                assigned_to = ticket.assigned_to.username if ticket.assigned_to else "None"
                print(f"  - ID: {ticket.id} | {ticket.title} | Status: {ticket.status} | Por: {created_by} | Para: {assigned_to}")
        else:
            print("❌ Nenhum ticket encontrado!")
            
        # 7. Verificar se há problema na conversão para schema
        print(f"\n7️⃣ Testando conversão para schema...")
        try:
            from app.schemas.schemas import TicketSchema
            ticket_schemas = []
            for ticket in tickets:
                # Simular conversão Pydantic
                ticket_dict = {
                    "id": ticket.id,
                    "title": ticket.title,
                    "description": ticket.description,
                    "status": ticket.status.value if hasattr(ticket.status, 'value') else ticket.status,
                    "priority": ticket.priority.value if hasattr(ticket.priority, 'value') else ticket.priority,
                    "created_at": ticket.created_at,
                    "updated_at": ticket.updated_at,
                    "created_by_id": ticket.created_by_id,
                    "assigned_to_id": ticket.assigned_to_id,
                    "category_id": ticket.category_id,
                    "created_by": {
                        "id": ticket.created_by.id,
                        "username": ticket.created_by.username,
                        "email": ticket.created_by.email,
                        "full_name": ticket.created_by.full_name
                    } if ticket.created_by else None,
                    "assigned_to": {
                        "id": ticket.assigned_to.id,
                        "username": ticket.assigned_to.username,
                        "email": ticket.assigned_to.email,
                        "full_name": ticket.assigned_to.full_name
                    } if ticket.assigned_to else None,
                    "category": {
                        "id": ticket.category.id,
                        "name": ticket.category.name,
                        "description": ticket.category.description
                    } if ticket.category else None
                }
                ticket_schemas.append(ticket_dict)
            
            print(f"✅ Conversão para schema OK - {len(ticket_schemas)} tickets")
            
        except Exception as e:
            print(f"❌ Erro na conversão para schema: {e}")
            import traceback
            traceback.print_exc()
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_tickets_endpoint_direct()
