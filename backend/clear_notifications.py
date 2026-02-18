"""
Script para limpar notificações antigas do sistema
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import inspect
from app.core.database import engine, SessionLocal

def check_notifications_table():
    """Verifica se existe tabela de notificações"""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print("=== TABELAS NO BANCO DE DADOS ===")
    for table in tables:
        print(f"- {table}")
    
    if 'notifications' in tables:
        print("\n✓ Tabela 'notifications' encontrada")
        return True
    else:
        print("\n✗ Tabela 'notifications' NÃO encontrada")
        print("\nINFO: As notificações são enviadas via WebSocket em tempo real")
        print("      e não ficam armazenadas permanentemente no banco de dados.")
        print("\nAs notificações antigas que aparecem no frontend são provavelmente:")
        print("1. Notificações em cache do navegador")
        print("2. Notificações de teste/demonstração")
        print("\nSOLUÇÃO: Limpar cache do navegador ou localStorage")
        return False

def clear_notifications():
    """Limpa notificações se a tabela existir"""
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'notifications' in tables:
            # Executar DELETE na tabela de notificações
            result = db.execute("DELETE FROM notifications")
            db.commit()
            print(f"\n✓ {result.rowcount} notificações removidas com sucesso!")
        else:
            print("\n✗ Nenhuma tabela de notificações para limpar")
            print("\nPara limpar notificações do frontend:")
            print("1. Abra o Console do navegador (F12)")
            print("2. Execute: localStorage.clear()")
            print("3. Recarregue a página (F5)")
            
    except Exception as e:
        print(f"\n✗ Erro ao limpar notificações: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== VERIFICAÇÃO DE NOTIFICAÇÕES ===\n")
    
    has_table = check_notifications_table()
    
    if has_table:
        print("\n" + "="*50)
        response = input("\nDeseja limpar todas as notificações? (s/n): ")
        if response.lower() == 's':
            clear_notifications()
        else:
            print("\nOperação cancelada.")
    
    print("\n" + "="*50)
    print("\nCOMO LIMPAR NOTIFICAÇÕES NO FRONTEND:")
    print("1. Abra https://ticket.algti.com.br")
    print("2. Pressione F12 para abrir DevTools")
    print("3. Vá na aba 'Console'")
    print("4. Execute: localStorage.clear()")
    print("5. Feche o DevTools e recarregue a página (F5)")
    print("="*50)
