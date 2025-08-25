#!/usr/bin/env python3

from app.core.database import SessionLocal
from app.models.models import Ticket, User

def main():
    db = SessionLocal()
    try:
        # Check tickets
        tickets = db.query(Ticket).all()
        print(f"📋 Total tickets: {len(tickets)}")
        
        if tickets:
            print("\n🎫 Tickets encontrados:")
            for ticket in tickets[:10]:  # Show first 10
                print(f"  ID: {ticket.id}")
                print(f"  Título: {ticket.title}")
                print(f"  Status: {ticket.status}")
                print(f"  Prioridade: {ticket.priority}")
                print(f"  Criado por: {ticket.created_by_id}")
                print(f"  Criado em: {ticket.created_at}")
                print("  ---")
        else:
            print("❌ Nenhum ticket encontrado no banco de dados")
            
        # Check users
        users = db.query(User).all()
        print(f"\n👥 Total usuários: {len(users)}")
        for user in users:
            print(f"  {user.username} ({user.role}) - Ativo: {user.is_active}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
