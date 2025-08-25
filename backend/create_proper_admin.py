#!/usr/bin/env python3
"""
Script para criar usuário admin com hash bcrypt correto do FastAPI
"""
import sqlite3
from passlib.context import CryptContext
from datetime import datetime

# Usar o mesmo contexto de hash do FastAPI
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt (same as FastAPI)"""
    return pwd_context.hash(password)

def create_proper_admin():
    """Cria usuário admin com hash bcrypt correto"""
    try:
        # Conecta ao banco SQLite
        conn = sqlite3.connect('tickets.db')
        cursor = conn.cursor()
        
        print("🔄 Criando usuário admin com hash bcrypt correto...")
        
        # Hash correto usando bcrypt
        hashed_password = hash_password('admin123')
        print(f"🔐 Hash bcrypt gerado: {hashed_password[:30]}...")
        
        # Remove admin existente se houver
        cursor.execute("DELETE FROM users WHERE username = 'admin'")
        
        # Cria novo admin com hash bcrypt
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
            hashed_password,
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        
        # Commit das mudanças
        conn.commit()
        
        # Verifica o resultado
        cursor.execute("SELECT username, role, is_active FROM users WHERE username = 'admin'")
        admin_check = cursor.fetchone()
        
        if admin_check:
            print("✅ Usuário admin criado com sucesso!")
            print(f"👤 Username: {admin_check[0]}")
            print(f"👑 Role: {admin_check[1]}")
            print(f"✅ Active: {admin_check[2]}")
        
        conn.close()
        
        print("\n✅ Admin criado com hash bcrypt correto!")
        print("\n🧪 Teste o login:")
        print("   Username: admin")
        print("   Password: admin123")
        
    except Exception as e:
        print(f"❌ Erro ao criar admin: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Criando admin com hash bcrypt correto...\n")
    create_proper_admin()
