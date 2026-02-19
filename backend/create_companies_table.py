"""
Script para criar tabela companies no banco de dados
Executar este script na VPS após fazer pull do código
"""
import sqlite3
import os
from datetime import datetime

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'tickets.db')

def create_companies_table():
    """Cria a tabela companies com todos os campos necessários"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='companies'
        """)
        
        if cursor.fetchone():
            print("⚠️  Tabela 'companies' já existe. Pulando criação.")
            conn.close()
            return
        
        print("📋 Criando tabela 'companies'...")
        
        # Criar tabela companies
        cursor.execute("""
            CREATE TABLE companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                legal_name VARCHAR(255) NOT NULL,
                cnpj VARCHAR(18) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                street VARCHAR(255) NOT NULL,
                number VARCHAR(20) NOT NULL,
                neighborhood VARCHAR(100) NOT NULL,
                complement VARCHAR(255),
                zip_code VARCHAR(10) NOT NULL,
                has_contract BOOLEAN DEFAULT 0,
                contract_start_date TIMESTAMP,
                contract_end_date TIMESTAMP,
                contract_value REAL,
                hourly_rate REAL,
                contract_status VARCHAR(20),
                commercial_responsible VARCHAR(255),
                service_type VARCHAR(100),
                notes TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        
        # Criar índices para melhor performance
        cursor.execute("CREATE INDEX idx_companies_name ON companies(name)")
        cursor.execute("CREATE INDEX idx_companies_cnpj ON companies(cnpj)")
        
        conn.commit()
        print("✅ Tabela 'companies' criada com sucesso!")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro ao criar tabela companies: {e}")
        raise

if __name__ == "__main__":
    create_companies_table()
