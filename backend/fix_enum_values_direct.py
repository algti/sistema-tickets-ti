#!/usr/bin/env python3
"""
Script para corrigir valores de enum diretamente no banco SQLite
"""
import sqlite3
import hashlib
from datetime import datetime

def hash_password_simple(password):
    """Hash simples para compatibilidade"""
    return hashlib.sha256(password.encode()).hexdigest()

def fix_database():
    """Corrige valores de enum e cria admin com hash correto"""
    try:
        # Conecta ao banco SQLite
        conn = sqlite3.connect('tickets.db')
        cursor = conn.cursor()
        
        print("🔄 Corrigindo valores de enum no banco de dados...")
        
        # Atualiza valores de role para maiúsculo
        cursor.execute("UPDATE users SET role = 'ADMIN' WHERE role = 'admin'")
        cursor.execute("UPDATE users SET role = 'TECHNICIAN' WHERE role = 'technician'")
        cursor.execute("UPDATE users SET role = 'USER' WHERE role = 'user'")
        
        # Atualiza valores de status para minúsculo (conforme enum do backend)
        cursor.execute("UPDATE tickets SET status = 'open' WHERE status = 'OPEN'")
        cursor.execute("UPDATE tickets SET status = 'in_progress' WHERE status = 'IN_PROGRESS'")
        cursor.execute("UPDATE tickets SET status = 'resolved' WHERE status = 'RESOLVED'")
        cursor.execute("UPDATE tickets SET status = 'closed' WHERE status = 'CLOSED'")
        cursor.execute("UPDATE tickets SET status = 'waiting_user' WHERE status = 'WAITING_USER'")
        
        # Atualiza valores de priority para minúsculo (conforme enum do backend)
        cursor.execute("UPDATE tickets SET priority = 'low' WHERE priority = 'LOW'")
        cursor.execute("UPDATE tickets SET priority = 'medium' WHERE priority = 'MEDIUM'")
        cursor.execute("UPDATE tickets SET priority = 'high' WHERE priority = 'HIGH'")
        cursor.execute("UPDATE tickets SET priority = 'urgent' WHERE priority = 'URGENT'")
        
        print("✅ Valores de enum corrigidos!")
        
        # Verifica se admin existe
        cursor.execute("SELECT * FROM users WHERE username = 'admin'")
        admin = cursor.fetchone()
        
        if admin:
            print("🔄 Atualizando usuário admin existente...")
            # Atualiza admin existente com hash correto
            cursor.execute("""
                UPDATE users SET 
                    email = ?,
                    full_name = ?,
                    department = ?,
                    phone = ?,
                    role = 'ADMIN',
                    is_active = 1,
                    is_ldap_user = 0,
                    hashed_password = ?,
                    updated_at = ?
                WHERE username = 'admin'
            """, (
                'admin@empresa.local',
                'Administrador do Sistema',
                'TI',
                '(11) 99999-9999',
                hash_password_simple('admin123'),
                datetime.now().isoformat()
            ))
        else:
            print("➕ Criando novo usuário admin...")
            # Cria novo admin
            cursor.execute("""
                INSERT INTO users 
                (username, email, full_name, department, phone, role, is_active, is_ldap_user, hashed_password, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'ADMIN', 1, 0, ?, ?, ?)
            """, (
                'admin',
                'admin@empresa.local',
                'Administrador do Sistema',
                'TI',
                '(11) 99999-9999',
                hash_password_simple('admin123'),
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
        
        # Commit das mudanças
        conn.commit()
        
        # Verifica o resultado
        cursor.execute("SELECT username, role, is_active FROM users WHERE username = 'admin'")
        admin_check = cursor.fetchone()
        
        if admin_check:
            print("✅ Usuário admin corrigido com sucesso!")
            print(f"👤 Username: {admin_check[0]}")
            print(f"👑 Role: {admin_check[1]}")
            print(f"✅ Active: {admin_check[2]}")
        
        # Verifica quantos tickets existem
        cursor.execute("SELECT COUNT(*) FROM tickets")
        ticket_count = cursor.fetchone()[0]
        print(f"🎫 Total de tickets no banco: {ticket_count}")
        
        conn.close()
        
        print("\n✅ Correção do banco de dados concluída!")
        print("\n🧪 Teste o login:")
        print("   Username: admin")
        print("   Password: admin123")
        
    except Exception as e:
        print(f"❌ Erro ao corrigir banco de dados: {e}")

if __name__ == "__main__":
    print("🚀 Iniciando correção direta do banco de dados...\n")
    fix_database()
