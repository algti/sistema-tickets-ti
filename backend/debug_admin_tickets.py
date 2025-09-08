#!/usr/bin/env python3
"""
Debug simples para identificar o problema do admin não ver tickets
"""
from app.core.database import SessionLocal
from app.models.models import User, Ticket, UserRole
from sqlalchemy.orm import joinedload

def debug_admin_tickets():
    """Debug simples do problema admin tickets"""
    print("🔍 Debug: Admin não vê tickets na página...\n")
    
    db = SessionLocal()
    
    try:
        # 1. Verificar admin
        admin = db.query(User).filter(User.username == 'admin').first()
        print(f"Admin: {admin.username} | Role: {admin.role} | ID: {admin.id}")
        
        # 2. Query básica (sem filtros)
        query = db.query(Ticket).options(
            joinedload(Ticket.created_by),
            joinedload(Ticket.assigned_to),
            joinedload(Ticket.category)
        )
        
        total_tickets = query.count()
        print(f"Total tickets no banco: {total_tickets}")
        
        # 3. Aplicar apenas filtro de role (como no endpoint)
        if admin.role == UserRole.user:
            print("❌ Admin sendo tratado como USER!")
            query = query.filter(Ticket.created_by_id == admin.id)
        elif admin.role == UserRole.technician:
            print("❌ Admin sendo tratado como TECHNICIAN!")
            query = query.filter(Ticket.assigned_to_id == admin.id)
        elif admin.role == UserRole.admin:
            print("✅ Admin = sem filtro adicional")
        
        tickets_after_role_filter = query.count()
        print(f"Tickets após filtro de role: {tickets_after_role_filter}")
        
        # 4. Verificar se há problema com strings vazias nos filtros
        print(f"\n🔍 Testando filtros com strings vazias...")
        
        # Simular exatamente o que o frontend envia
        status = ""
        priority = ""
        
        # PROBLEMA POTENCIAL: Verificar se strings vazias estão causando filtro
        if status:  # String vazia = False
            print(f"Aplicaria filtro status: '{status}'")
        else:
            print(f"Status vazio - OK")
            
        if priority:  # String vazia = False
            print(f"Aplicaria filtro priority: '{priority}'")
        else:
            print(f"Priority vazio - OK")
        
        # 5. Executar query final
        tickets = query.limit(50).all()
        print(f"\nTickets finais para admin: {len(tickets)}")
        
        if tickets:
            for ticket in tickets:
                print(f"  - {ticket.id}: {ticket.title}")
        else:
            print("❌ ZERO tickets retornados!")
            
        # 6. Verificar se há problema na conversão enum
        print(f"\n🔍 Verificando enums dos tickets...")
        for ticket in tickets[:3]:  # Apenas os primeiros 3
            print(f"Ticket {ticket.id}:")
            print(f"  Status: {ticket.status} (type: {type(ticket.status)})")
            print(f"  Priority: {ticket.priority} (type: {type(ticket.priority)})")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_admin_tickets()
