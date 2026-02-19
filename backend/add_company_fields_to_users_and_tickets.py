"""
Script para adicionar campos company_id às tabelas users e tickets
E adicionar campo time_spent_hours à tabela tickets
Executar este script na VPS após fazer pull do código
"""
import sqlite3
import os

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'tickets.db')

def add_company_fields():
    """Adiciona campos relacionados a empresas nas tabelas existentes"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verificar e adicionar company_id à tabela users
        cursor.execute("PRAGMA table_info(users)")
        users_columns = [column[1] for column in cursor.fetchall()]
        
        if 'company_id' not in users_columns:
            print("📋 Adicionando campo 'company_id' à tabela 'users'...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN company_id INTEGER REFERENCES companies(id)
            """)
            print("✅ Campo 'company_id' adicionado à tabela 'users'")
        else:
            print("⚠️  Campo 'company_id' já existe na tabela 'users'")
        
        # Verificar e adicionar company_id à tabela tickets
        cursor.execute("PRAGMA table_info(tickets)")
        tickets_columns = [column[1] for column in cursor.fetchall()]
        
        if 'company_id' not in tickets_columns:
            print("📋 Adicionando campo 'company_id' à tabela 'tickets'...")
            cursor.execute("""
                ALTER TABLE tickets 
                ADD COLUMN company_id INTEGER REFERENCES companies(id)
            """)
            print("✅ Campo 'company_id' adicionado à tabela 'tickets'")
        else:
            print("⚠️  Campo 'company_id' já existe na tabela 'tickets'")
        
        # Verificar e adicionar time_spent_hours à tabela tickets
        if 'time_spent_hours' not in tickets_columns:
            print("📋 Adicionando campo 'time_spent_hours' à tabela 'tickets'...")
            cursor.execute("""
                ALTER TABLE tickets 
                ADD COLUMN time_spent_hours REAL DEFAULT 0.0
            """)
            print("✅ Campo 'time_spent_hours' adicionado à tabela 'tickets'")
        else:
            print("⚠️  Campo 'time_spent_hours' já existe na tabela 'tickets'")
        
        # Atualizar company_id dos tickets baseado no usuário criador
        print("📋 Atualizando company_id dos tickets existentes baseado no usuário...")
        cursor.execute("""
            UPDATE tickets 
            SET company_id = (
                SELECT users.company_id 
                FROM users 
                WHERE users.id = tickets.created_by_id
            )
            WHERE company_id IS NULL
        """)
        
        conn.commit()
        print("\n✅ Todas as alterações foram aplicadas com sucesso!")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro ao adicionar campos: {e}")
        raise

if __name__ == "__main__":
    add_company_fields()
