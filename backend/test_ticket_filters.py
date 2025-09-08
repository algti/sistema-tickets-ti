#!/usr/bin/env python3
"""
Script para testar os filtros de tickets por role
"""
from app.core.database import SessionLocal
from app.models.models import User, Ticket, UserRole
from sqlalchemy.orm import joinedload

def test_ticket_filters():
    """Testa os filtros de tickets para cada perfil de usuário"""
    print("🚀 Testando filtros de tickets por role...\n")
    
    db = SessionLocal()
    
    try:
        # Buscar todos os usuários
        users = db.query(User).all()
        print("=== USUÁRIOS NO BANCO ===")
        for user in users:
            print(f"ID: {user.id} | Username: {user.username} | Role: {user.role}")
        
        print("\n=== TICKETS NO BANCO ===")
        all_tickets = db.query(Ticket).options(
            joinedload(Ticket.created_by),
            joinedload(Ticket.assigned_to)
        ).all()
        
        for ticket in all_tickets:
            created_by = ticket.created_by.username if ticket.created_by else "None"
            assigned_to = ticket.assigned_to.username if ticket.assigned_to else "None"
            print(f"ID: {ticket.id} | Título: {ticket.title} | Criado por: {created_by} | Atribuído a: {assigned_to}")
        
        print(f"\nTotal de tickets no banco: {len(all_tickets)}")
        
        # Testar filtros para cada usuário
        for user in users:
            print(f"\n=== TESTANDO FILTROS PARA {user.username.upper()} ({user.role}) ===")
            
            # Simular a lógica do endpoint
            query = db.query(Ticket).options(
                joinedload(Ticket.created_by),
                joinedload(Ticket.assigned_to),
                joinedload(Ticket.category)
            )
            
            # Aplicar filtros baseados no role
            if user.role == UserRole.user:
                print(f"Aplicando filtro USER: created_by_id == {user.id}")
                query = query.filter(Ticket.created_by_id == user.id)
            elif user.role == UserRole.technician:
                print(f"Aplicando filtro TECHNICIAN: assigned_to_id == {user.id}")
                query = query.filter(Ticket.assigned_to_id == user.id)
            elif user.role == UserRole.admin:
                print("Aplicando filtro ADMIN: sem filtro (todos os tickets)")
            
            # Executar query
            filtered_tickets = query.all()
            print(f"Tickets encontrados: {len(filtered_tickets)}")
            
            for ticket in filtered_tickets:
                created_by = ticket.created_by.username if ticket.created_by else "None"
                assigned_to = ticket.assigned_to.username if ticket.assigned_to else "None"
                print(f"  - ID: {ticket.id} | {ticket.title} | Por: {created_by} | Para: {assigned_to}")
        
        print("\n=== RESUMO ESPERADO ===")
        print("👤 Usuario (USER): deve ver 4 tickets (IDs: 2, 3, 4, 5, 6)")
        print("🔧 Tecnico (TECHNICIAN): deve ver 0 tickets (nenhum atribuído)")
        print("👑 Admin (ADMIN): deve ver 6 tickets (todos)")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_ticket_filters()
