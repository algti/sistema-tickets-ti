"""
Script para ajustar timestamps existentes no banco de dados
Converte horários de UTC para horário de Brasília (UTC-3)
ATENÇÃO: Execute este script apenas UMA VEZ após o deploy
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'tickets.db')

def fix_timestamps():
    """
    Ajusta todos os timestamps no banco de dados
    Subtrai 3 horas de todos os timestamps para corrigir de UTC para Brasil
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("=" * 60)
        print("CORREÇÃO DE TIMEZONE - HORÁRIO DE BRASÍLIA (UTC-3)")
        print("=" * 60)
        
        # 1. Corrigir tickets
        print("\n📋 Corrigindo timestamps da tabela 'tickets'...")
        cursor.execute("""
            UPDATE tickets 
            SET created_at = datetime(created_at, '-3 hours'),
                updated_at = CASE WHEN updated_at IS NOT NULL 
                    THEN datetime(updated_at, '-3 hours') ELSE NULL END,
                resolved_at = CASE WHEN resolved_at IS NOT NULL 
                    THEN datetime(resolved_at, '-3 hours') ELSE NULL END,
                closed_at = CASE WHEN closed_at IS NOT NULL 
                    THEN datetime(closed_at, '-3 hours') ELSE NULL END
        """)
        tickets_count = cursor.rowcount
        print(f"✅ {tickets_count} tickets atualizados")
        
        # 2. Corrigir comentários
        print("\n💬 Corrigindo timestamps da tabela 'ticket_comments'...")
        cursor.execute("""
            UPDATE ticket_comments 
            SET created_at = datetime(created_at, '-3 hours'),
                updated_at = CASE WHEN updated_at IS NOT NULL 
                    THEN datetime(updated_at, '-3 hours') ELSE NULL END
        """)
        comments_count = cursor.rowcount
        print(f"✅ {comments_count} comentários atualizados")
        
        # 3. Corrigir atividades
        print("\n📝 Corrigindo timestamps da tabela 'ticket_activities'...")
        cursor.execute("""
            UPDATE ticket_activities 
            SET created_at = datetime(created_at, '-3 hours')
        """)
        activities_count = cursor.rowcount
        print(f"✅ {activities_count} atividades atualizadas")
        
        # 4. Corrigir avaliações
        print("\n⭐ Corrigindo timestamps da tabela 'ticket_evaluations'...")
        cursor.execute("""
            UPDATE ticket_evaluations 
            SET created_at = datetime(created_at, '-3 hours')
        """)
        evaluations_count = cursor.rowcount
        print(f"✅ {evaluations_count} avaliações atualizadas")
        
        # 5. Corrigir usuários
        print("\n👥 Corrigindo timestamps da tabela 'users'...")
        cursor.execute("""
            UPDATE users 
            SET created_at = datetime(created_at, '-3 hours'),
                updated_at = CASE WHEN updated_at IS NOT NULL 
                    THEN datetime(updated_at, '-3 hours') ELSE NULL END
        """)
        users_count = cursor.rowcount
        print(f"✅ {users_count} usuários atualizados")
        
        # 6. Corrigir empresas
        print("\n🏢 Corrigindo timestamps da tabela 'companies'...")
        cursor.execute("""
            UPDATE companies 
            SET created_at = datetime(created_at, '-3 hours'),
                updated_at = CASE WHEN updated_at IS NOT NULL 
                    THEN datetime(updated_at, '-3 hours') ELSE NULL END,
                contract_start_date = CASE WHEN contract_start_date IS NOT NULL 
                    THEN datetime(contract_start_date, '-3 hours') ELSE NULL END,
                contract_end_date = CASE WHEN contract_end_date IS NOT NULL 
                    THEN datetime(contract_end_date, '-3 hours') ELSE NULL END
        """)
        companies_count = cursor.rowcount
        print(f"✅ {companies_count} empresas atualizadas")
        
        # Commit das mudanças
        conn.commit()
        
        print("\n" + "=" * 60)
        print("✅ CORREÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)
        print(f"\nResumo:")
        print(f"  - Tickets: {tickets_count}")
        print(f"  - Comentários: {comments_count}")
        print(f"  - Atividades: {activities_count}")
        print(f"  - Avaliações: {evaluations_count}")
        print(f"  - Usuários: {users_count}")
        print(f"  - Empresas: {companies_count}")
        print(f"\nTotal: {tickets_count + comments_count + activities_count + evaluations_count + users_count + companies_count} registros atualizados")
        print(f"\nTodos os horários foram ajustados para o horário de Brasília (UTC-3)")
        
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Erro ao corrigir timestamps: {e}")
        raise

if __name__ == "__main__":
    print("\n⚠️  ATENÇÃO: Este script irá ajustar TODOS os timestamps no banco de dados")
    print("⚠️  Execute apenas UMA VEZ após o deploy da correção de timezone")
    print("⚠️  Certifique-se de ter feito backup do banco antes de continuar")
    response = input("\nDeseja continuar? (digite 'SIM' para confirmar): ")
    
    if response.upper() == 'SIM':
        fix_timestamps()
    else:
        print("\n❌ Operação cancelada pelo usuário")
