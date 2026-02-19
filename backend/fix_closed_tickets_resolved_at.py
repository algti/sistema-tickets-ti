"""
Script para corrigir tickets CLOSED sem resolved_at
Executar este script na VPS após fazer pull do código
"""
import sqlite3
import os
from datetime import datetime

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'tickets.db')

def fix_closed_tickets():
    """Atualiza resolved_at para tickets CLOSED que não têm esse campo preenchido"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Buscar tickets CLOSED sem resolved_at
        cursor.execute("""
            SELECT id, closed_at, created_at 
            FROM tickets 
            WHERE status = 'closed' 
            AND resolved_at IS NULL
        """)
        
        tickets_to_fix = cursor.fetchall()
        
        if not tickets_to_fix:
            print("ℹ️  Nenhum ticket CLOSED sem resolved_at encontrado.")
            conn.close()
            return
        
        print(f"📋 Encontrados {len(tickets_to_fix)} tickets CLOSED sem resolved_at")
        
        # Atualizar cada ticket
        for ticket_id, closed_at, created_at in tickets_to_fix:
            # Usar closed_at se disponível, senão usar data atual
            resolved_at = closed_at if closed_at else datetime.utcnow().isoformat()
            
            cursor.execute("""
                UPDATE tickets 
                SET resolved_at = ? 
                WHERE id = ?
            """, (resolved_at, ticket_id))
            
            print(f"  ✓ Ticket #{ticket_id}: resolved_at = {resolved_at}")
        
        conn.commit()
        print(f"\n✅ {len(tickets_to_fix)} tickets atualizados com sucesso!")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro ao corrigir tickets: {e}")
        raise

if __name__ == "__main__":
    fix_closed_tickets()
