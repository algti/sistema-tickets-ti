#!/usr/bin/env python3
"""
Script para testar especificamente o problema do admin não ver tickets
"""
from app.core.database import SessionLocal
from app.models.models import User, Ticket, UserRole
from sqlalchemy.orm import joinedload
from sqlalchemy import desc, or_

def test_admin_tickets():
    """Testa especificamente o endpoint de tickets para o admin"""
    print("🚀 Testando problema específico do admin não ver tickets...\n")
    
    db = SessionLocal()
    
    try:
        # 1. Buscar usuário admin
        print("1️⃣ Buscando usuário admin...")
        admin = db.query(User).filter(User.username == 'admin').first()
        if not admin:
            print("❌ Admin não encontrado!")
            return
            
        print(f"✅ Admin encontrado:")
        print(f"   ID: {admin.id}")
        print(f"   Username: {admin.username}")
        print(f"   Role: {admin.role}")
        print(f"   Role type: {type(admin.role)}")
        print(f"   Is Active: {admin.is_active}")
        
        # 2. Simular exatamente a query do endpoint
        print(f"\n2️⃣ Simulando query do endpoint para admin...")
        
        # Query base (igual ao endpoint)
        query = db.query(Ticket).options(
            joinedload(Ticket.created_by),
            joinedload(Ticket.assigned_to),
            joinedload(Ticket.category)
        )
        
        print(f"Query inicial - Total tickets: {query.count()}")
        
        # Aplicar filtros baseados no role (igual ao endpoint)
        print(f"\n3️⃣ Aplicando filtros por role...")
        print(f"Admin role: {admin.role}")
        print(f"UserRole.ADMIN: {UserRole.ADMIN}")
        print(f"Role comparison: {admin.role == UserRole.ADMIN}")
        
        if admin.role == UserRole.USER:
            print("❌ ERRO: Admin sendo tratado como USER!")
            query = query.filter(Ticket.created_by_id == admin.id)
        elif admin.role == UserRole.TECHNICIAN:
            print("❌ ERRO: Admin sendo tratado como TECHNICIAN!")
            query = query.filter(Ticket.assigned_to_id == admin.id)
        elif admin.role == UserRole.ADMIN:
            print("✅ Admin sendo tratado como ADMIN (sem filtro)")
        else:
            print(f"❌ ERRO: Role não reconhecido: {admin.role}")
        
        # Aplicar outros filtros (sem parâmetros, como no frontend)
        print(f"\n4️⃣ Aplicando outros filtros...")
        
        # Simular parâmetros vazios do frontend
        status = None
        priority = None
        category_id = None
        assigned_to_id = None
        created_by_id = None
        search = None
        skip = 0
        limit = 100
        
        if status and status.strip():
            print(f"Aplicando filtro status: {status}")
            query = query.filter(Ticket.status == status)
        
        if priority and priority.strip():
            print(f"Aplicando filtro priority: {priority}")
            query = query.filter(Ticket.priority == priority)
        
        if category_id:
            print(f"Aplicando filtro category_id: {category_id}")
            query = query.filter(Ticket.category_id == category_id)
        
        if assigned_to_id:
            print(f"Aplicando filtro assigned_to_id: {assigned_to_id}")
            query = query.filter(Ticket.assigned_to_id == assigned_to_id)
        
        if created_by_id and admin.role in [UserRole.TECHNICIAN, UserRole.ADMIN]:
            print(f"Aplicando filtro created_by_id: {created_by_id}")
            query = query.filter(Ticket.created_by_id == created_by_id)
        
        if search and search.strip():
            print(f"Aplicando filtro search: {search}")
            search_filter = or_(
                Ticket.title.ilike(f"%{search}%"),
                Ticket.description.ilike(f"%{search}%"),
                Ticket.solution.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Ordenar e executar
        print(f"\n5️⃣ Executando query final...")
        query = query.order_by(desc(Ticket.created_at))
        tickets = query.offset(skip).limit(limit).all()
        
        print(f"✅ Tickets encontrados para admin: {len(tickets)}")
        
        if tickets:
            print("\n📋 Lista de tickets para admin:")
            for ticket in tickets:
                created_by = ticket.created_by.username if ticket.created_by else "None"
                assigned_to = ticket.assigned_to.username if ticket.assigned_to else "None"
                print(f"  - ID: {ticket.id} | {ticket.title} | Status: {ticket.status} | Por: {created_by} | Para: {assigned_to}")
        else:
            print("❌ Nenhum ticket encontrado para admin!")
            
        # 6. Verificar se há problema na serialização
        print(f"\n6️⃣ Testando serialização dos tickets...")
        try:
            # Simular conversão para dict (como o Pydantic faria)
            ticket_dicts = []
            for ticket in tickets:
                ticket_dict = {
                    "id": ticket.id,
                    "title": ticket.title,
                    "description": ticket.description,
                    "status": ticket.status,
                    "priority": ticket.priority,
                    "created_at": ticket.created_at,
                    "updated_at": ticket.updated_at
                }
                ticket_dicts.append(ticket_dict)
            
            print(f"✅ Serialização OK - {len(ticket_dicts)} tickets serializados")
            
        except Exception as e:
            print(f"❌ Erro na serialização: {e}")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_admin_tickets()
