#!/usr/bin/env python3
"""
Script para corrigir o schema do banco de dados SQLite
Remove coluna username que não existe mais no modelo
"""
import sqlite3
import os

def fix_database():
    db_path = './tickets.db'
    
    if not os.path.exists(db_path):
        print(f"Banco de dados não encontrado em {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar se a coluna username existe
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print(f"Colunas atuais na tabela users: {column_names}")
        
        if 'username' in column_names:
            print("\n⚠️  Coluna 'username' encontrada. Iniciando correção...")
            
            # SQLite não suporta DROP COLUMN diretamente, então precisamos recriar a tabela
            # Primeiro, criar tabela temporária com as colunas corretas
            cursor.execute("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    department VARCHAR(100),
                    phone VARCHAR(20),
                    role VARCHAR(50) DEFAULT 'user',
                    is_active BOOLEAN DEFAULT 1,
                    tutorial_viewed BOOLEAN DEFAULT 0,
                    company_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME,
                    FOREIGN KEY (company_id) REFERENCES companies(id)
                )
            """)
            
            # Copiar dados da tabela antiga para a nova
            cursor.execute("""
                INSERT INTO users_new (id, email, full_name, department, phone, role, is_active, tutorial_viewed, company_id, created_at, updated_at)
                SELECT id, email, full_name, department, phone, role, is_active, tutorial_viewed, company_id, created_at, updated_at
                FROM users
            """)
            
            # Remover tabela antiga
            cursor.execute("DROP TABLE users")
            
            # Renomear tabela nova
            cursor.execute("ALTER TABLE users_new RENAME TO users")
            
            conn.commit()
            print("✅ Coluna 'username' removida com sucesso!")
            print("✅ Tabela users recriada com schema correto!")
            
        else:
            print("✅ Coluna 'username' não encontrada. Schema já está correto!")
        
        # Verificar schema final
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        print("\n📋 Schema final da tabela users:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao corrigir banco de dados: {e}")
        return False

if __name__ == '__main__':
    print("🔧 Corrigindo schema do banco de dados SQLite...\n")
    if fix_database():
        print("\n✅ Banco de dados corrigido com sucesso!")
    else:
        print("\n❌ Falha ao corrigir banco de dados!")
