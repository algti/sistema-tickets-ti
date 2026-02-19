"""
Script para adicionar campo tutorial_viewed na tabela users
Executar este script na VPS após fazer pull do código
"""
import sqlite3
import os

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'tickets.db')

def add_tutorial_field():
    """Adiciona campo tutorial_viewed na tabela users"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verificar se a coluna já existe
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'tutorial_viewed' not in columns:
            print("Adicionando campo tutorial_viewed...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN tutorial_viewed BOOLEAN DEFAULT 0
            """)
            conn.commit()
            print("✅ Campo tutorial_viewed adicionado com sucesso!")
        else:
            print("ℹ️  Campo tutorial_viewed já existe no banco de dados.")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro ao adicionar campo: {e}")
        raise

if __name__ == "__main__":
    add_tutorial_field()
