"""
Script para adicionar índices de performance nas colunas mais usadas em
filtros e relatórios (tickets, comentários, anexos, atividades e ativos).

Sem esses índices, consultas como listagem de tickets (por status, prioridade,
técnico, empresa, categoria) e os relatórios fazem full table scan.

Executar este script na VPS após fazer pull do código:
    cd backend
    python add_performance_indexes.py
"""
import sqlite3
import os

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'tickets.db')

# (nome_do_indice, tabela, coluna)
INDEXES = [
    ("ix_tickets_status", "tickets", "status"),
    ("ix_tickets_priority", "tickets", "priority"),
    ("ix_tickets_created_by_id", "tickets", "created_by_id"),
    ("ix_tickets_assigned_to_id", "tickets", "assigned_to_id"),
    ("ix_tickets_category_id", "tickets", "category_id"),
    ("ix_tickets_company_id", "tickets", "company_id"),
    ("ix_tickets_created_at", "tickets", "created_at"),
    ("ix_ticket_comments_ticket_id", "ticket_comments", "ticket_id"),
    ("ix_ticket_comments_user_id", "ticket_comments", "user_id"),
    ("ix_ticket_attachments_ticket_id", "ticket_attachments", "ticket_id"),
    ("ix_ticket_activities_ticket_id", "ticket_activities", "ticket_id"),
    ("ix_assets_category_id", "assets", "category_id"),
    ("ix_assets_assigned_to_id", "assets", "assigned_to_id"),
    ("ix_assets_company_id", "assets", "company_id"),
]


def add_performance_indexes():
    """Cria os índices que estiverem faltando, pulando os que já existem."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        for index_name, table_name, column_name in INDEXES:
            # Verifica se a tabela existe (algumas instalações podem não ter
            # a tabela 'assets' ainda, por exemplo)
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (table_name,),
            )
            if cursor.fetchone() is None:
                print(f"⚠️  Tabela '{table_name}' não existe, pulando índice '{index_name}'")
                continue

            # Verifica se a coluna existe na tabela
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [row[1] for row in cursor.fetchall()]
            if column_name not in columns:
                print(f"⚠️  Coluna '{table_name}.{column_name}' não existe, pulando índice '{index_name}'")
                continue

            print(f"📋 Criando índice '{index_name}' em '{table_name}({column_name})'...")
            cursor.execute(
                f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({column_name})"
            )
            print(f"✅ Índice '{index_name}' pronto")

        conn.commit()
        print("\n✅ Todos os índices de performance foram aplicados com sucesso!")

    except Exception as e:
        print(f"❌ Erro ao criar índices: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    add_performance_indexes()
