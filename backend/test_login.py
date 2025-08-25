#!/usr/bin/env python3
"""
Script para testar o login diretamente e identificar o erro 500
"""
from app.core.database import SessionLocal
from app.models.models import User
from app.core.security import verify_password
from app.services.ldap_service import LDAPService

def test_login_components():
    """Testa cada componente do login separadamente"""
    print("🚀 Testando componentes do login...\n")
    
    try:
        # 1. Testar conexão com banco
        print("1️⃣ Testando conexão com banco de dados...")
        db = SessionLocal()
        print("✅ Conexão com banco OK")
        
        # 2. Testar busca do usuário admin
        print("\n2️⃣ Testando busca do usuário admin...")
        admin = db.query(User).filter(User.username == 'admin').first()
        if admin:
            print(f"✅ Usuário admin encontrado:")
            print(f"   Username: {admin.username}")
            print(f"   Role: {admin.role}")
            print(f"   Active: {admin.is_active}")
            print(f"   LDAP User: {admin.is_ldap_user}")
            print(f"   Hash: {admin.hashed_password[:20]}...")
        else:
            print("❌ Usuário admin não encontrado")
            return
        
        # 3. Testar LDAP service
        print("\n3️⃣ Testando LDAP service...")
        ldap_service = LDAPService()
        ldap_result = ldap_service.authenticate_user('admin', 'admin123')
        print(f"✅ LDAP service retornou: {ldap_result}")
        
        # 4. Testar verificação de senha
        print("\n4️⃣ Testando verificação de senha...")
        try:
            password_valid = verify_password('admin123', admin.hashed_password)
            print(f"✅ Verificação de senha: {password_valid}")
        except Exception as e:
            print(f"❌ Erro na verificação de senha: {e}")
            return
        
        # 5. Testar condições do login
        print("\n5️⃣ Testando condições do login...")
        print(f"   user exists: {admin is not None}")
        print(f"   not is_ldap_user: {not admin.is_ldap_user}")
        print(f"   password valid: {password_valid}")
        print(f"   is_active: {admin.is_active}")
        
        # 6. Simular lógica completa
        print("\n6️⃣ Simulando lógica completa do login...")
        
        # LDAP check (deve retornar None para admin)
        ldap_user_info = ldap_service.authenticate_user('admin', 'admin123')
        if ldap_user_info:
            print("❌ LDAP deveria retornar None para admin")
            return
        
        # Local authentication
        user = db.query(User).filter(User.username == 'admin').first()
        if not user:
            print("❌ Usuário não encontrado")
            return
            
        if user.is_ldap_user:
            print("❌ Admin não deveria ser usuário LDAP")
            return
            
        if not verify_password('admin123', user.hashed_password):
            print("❌ Senha incorreta")
            return
            
        if not user.is_active:
            print("❌ Usuário inativo")
            return
            
        print("✅ Todas as verificações passaram!")
        print("✅ Login deveria funcionar corretamente")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_login_components()
