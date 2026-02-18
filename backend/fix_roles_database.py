#!/usr/bin/env python3
"""
Script para corrigir os valores de roles no banco de dados
Converte de maiúsculo para minúsculo para compatibilidade com o enum
"""

import sqlite3
import os
from pathlib import Path

def fix_roles_in_database():
    """Corrige os valores de roles no banco de dados"""
    
    # Caminho para o banco de dados
    db_path = Path("tickets.db")
    
    if not db_path.exists():
        print("❌ Arquivo tickets.db não encontrado!")
        return False
    
    try:
        # Conectar ao banco
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        print("🔄 Corrigindo valores de roles no banco de dados...")
        
        # Verificar valores atuais
        cursor.execute("SELECT DISTINCT role FROM users")
        current_roles = cursor.fetchall()
        print(f"📋 Roles atuais no banco: {[role[0] for role in current_roles]}")
        
        # Corrigir roles de maiúsculo para minúsculo
        cursor.execute("UPDATE users SET role = 'admin' WHERE role = 'ADMIN'")
        admin_updated = cursor.rowcount
        
        cursor.execute("UPDATE users SET role = 'technician' WHERE role = 'TECHNICIAN'")
        tech_updated = cursor.rowcount
        
        cursor.execute("UPDATE users SET role = 'user' WHERE role = 'USER'")
        user_updated = cursor.rowcount
        
        # Verificar valores após correção
        cursor.execute("SELECT DISTINCT role FROM users")
        new_roles = cursor.fetchall()
        print(f"✅ Roles após correção: {[role[0] for role in new_roles]}")
        
        # Mostrar estatísticas
        print(f"📊 Registros atualizados:")
        print(f"  - ADMIN → admin: {admin_updated}")
        print(f"  - TECHNICIAN → technician: {tech_updated}")
        print(f"  - USER → user: {user_updated}")
        
        # Verificar se há usuários
        cursor.execute("SELECT username, role FROM users LIMIT 5")
        users = cursor.fetchall()
        print(f"👥 Primeiros usuários:")
        for username, role in users:
            print(f"  - {username}: {role}")
        
        # Commit das mudanças
        conn.commit()
        print("✅ Correções aplicadas com sucesso!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao corrigir roles: {e}")
        return False
    
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🚀 Iniciando correção de roles no banco de dados...")
    success = fix_roles_in_database()
    
    if success:
        print("\n🎉 Correção concluída! O login deve funcionar agora.")
    else:
        print("\n❌ Falha na correção. Verifique os erros acima.")
