#!/usr/bin/env python3
"""
Script para corrigir TODOS os enum values no banco de dados de forma definitiva
"""
import sqlite3
from datetime import datetime

def fix_all_enums():
    """Corrige todos os enum values no banco de dados"""
    try:
        # Conecta ao banco SQLite
        conn = sqlite3.connect('tickets.db')
        cursor = conn.cursor()
        
        print("🔄 Corrigindo TODOS os enum values no banco de dados...")
        
        # 1. CORRIGIR STATUS DOS TICKETS (minúsculo para maiúsculo)
        print("\n1️⃣ Corrigindo status dos tickets...")
        cursor.execute("UPDATE tickets SET status = 'OPEN' WHERE status = 'open'")
        cursor.execute("UPDATE tickets SET status = 'IN_PROGRESS' WHERE status = 'in_progress'")
        cursor.execute("UPDATE tickets SET status = 'RESOLVED' WHERE status = 'resolved'")
        cursor.execute("UPDATE tickets SET status = 'CLOSED' WHERE status = 'closed'")
        cursor.execute("UPDATE tickets SET status = 'WAITING_USER' WHERE status = 'waiting_user'")
        cursor.execute("UPDATE tickets SET status = 'REOPENED' WHERE status = 'reopened'")
        
        # Verificar status únicos
        cursor.execute("SELECT DISTINCT status FROM tickets")
        statuses = cursor.fetchall()
        print(f"Status únicos após correção: {[s[0] for s in statuses]}")
        
        # 2. CORRIGIR PRIORIDADES DOS TICKETS (minúsculo para maiúsculo)
        print("\n2️⃣ Corrigindo prioridades dos tickets...")
        cursor.execute("UPDATE tickets SET priority = 'LOW' WHERE priority = 'low'")
        cursor.execute("UPDATE tickets SET priority = 'MEDIUM' WHERE priority = 'medium'")
        cursor.execute("UPDATE tickets SET priority = 'HIGH' WHERE priority = 'high'")
        cursor.execute("UPDATE tickets SET priority = 'URGENT' WHERE priority = 'urgent'")
        
        # Verificar prioridades únicas
        cursor.execute("SELECT DISTINCT priority FROM tickets")
        priorities = cursor.fetchall()
        print(f"Prioridades únicas após correção: {[p[0] for p in priorities]}")
        
        # 3. VERIFICAR ROLES DOS USUÁRIOS (já devem estar corretos)
        print("\n3️⃣ Verificando roles dos usuários...")
        cursor.execute("SELECT DISTINCT role FROM users")
        roles = cursor.fetchall()
        print(f"Roles únicos: {[r[0] for r in roles]}")
        
        # 4. VERIFICAR TICKETS E SEUS CRIADORES
        print("\n4️⃣ Verificando tickets e criadores...")
        cursor.execute("""
            SELECT t.id, t.title, t.status, t.priority, t.created_by_id, u.username, u.role 
            FROM tickets t 
            LEFT JOIN users u ON t.created_by_id = u.id
            ORDER BY t.id
        """)
        tickets = cursor.fetchall()
        
        print("Tickets no banco após correção:")
        for ticket in tickets:
            print(f"  ID: {ticket[0]} | {ticket[1]} | Status: {ticket[2]} | Prioridade: {ticket[3]} | Criado por: {ticket[5]} ({ticket[6]})")
        
        # 5. RESUMO POR USUÁRIO
        print("\n5️⃣ Resumo de tickets por usuário:")
        
        # Tickets criados por cada usuário
        cursor.execute("""
            SELECT u.username, u.role, COUNT(t.id) as ticket_count
            FROM users u
            LEFT JOIN tickets t ON u.id = t.created_by_id
            GROUP BY u.id, u.username, u.role
            ORDER BY u.username
        """)
        user_tickets = cursor.fetchall()
        
        for user_ticket in user_tickets:
            print(f"  {user_ticket[0]} ({user_ticket[1]}): {user_ticket[2]} tickets criados")
        
        # Tickets atribuídos a cada técnico
        print("\n6️⃣ Tickets atribuídos a técnicos:")
        cursor.execute("""
            SELECT u.username, COUNT(t.id) as assigned_count
            FROM users u
            LEFT JOIN tickets t ON u.id = t.assigned_to_id
            WHERE u.role = 'TECHNICIAN'
            GROUP BY u.id, u.username
        """)
        assigned_tickets = cursor.fetchall()
        
        for assigned in assigned_tickets:
            print(f"  {assigned[0]}: {assigned[1]} tickets atribuídos")
        
        # Commit das mudanças
        conn.commit()
        conn.close()
        
        print("\n✅ Todos os enum values corrigidos com sucesso!")
        print("\n🎯 Comportamento esperado:")
        print("  👤 Usuario (USER): deve ver apenas seus próprios tickets")
        print("  🔧 Tecnico (TECHNICIAN): deve ver apenas tickets atribuídos a ele")
        print("  👑 Admin (ADMIN): deve ver todos os tickets")
        
    except Exception as e:
        print(f"❌ Erro ao corrigir enums: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Iniciando correção definitiva de todos os enum values...\n")
    fix_all_enums()
