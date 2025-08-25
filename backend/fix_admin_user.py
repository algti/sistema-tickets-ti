#!/usr/bin/env python3
"""
Script para corrigir o usuário admin com hash correto e enum values
"""
from app.core.database import SessionLocal
from app.models.models import User, UserRole, Category
from app.core.security import get_password_hash
from datetime import datetime

def create_admin_user():
    """Cria ou atualiza o usuário admin com configurações corretas"""
    db = SessionLocal()
    
    try:
        # Verifica se admin já existe
        admin = db.query(User).filter(User.username == 'admin').first()
        
        if admin:
            print("🔄 Atualizando usuário admin existente...")
            # Atualiza com valores corretos
            admin.email = 'admin@empresa.local'
            admin.full_name = 'Administrador do Sistema'
            admin.department = 'TI'
            admin.phone = '(11) 99999-9999'
            admin.role = UserRole.ADMIN  # Usar enum correto
            admin.is_active = True
            admin.is_ldap_user = False
            admin.hashed_password = get_password_hash('admin123')  # Hash correto do FastAPI
            admin.updated_at = datetime.now()
        else:
            print("➕ Criando novo usuário admin...")
            # Cria novo admin
            admin = User(
                username='admin',
                email='admin@empresa.local',
                full_name='Administrador do Sistema',
                department='TI',
                phone='(11) 99999-9999',
                role=UserRole.ADMIN,  # Usar enum correto
                is_active=True,
                is_ldap_user=False,
                hashed_password=get_password_hash('admin123'),  # Hash correto do FastAPI
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(admin)
        
        db.commit()
        db.refresh(admin)
        
        print("✅ Usuário admin criado/atualizado com sucesso!")
        print(f"👤 Username: {admin.username}")
        print(f"🔑 Password: admin123")
        print(f"👑 Role: {admin.role}")
        print(f"✅ Active: {admin.is_active}")
        print(f"🔐 Hash: {admin.hashed_password[:20]}...")
        
    except Exception as e:
        print(f"❌ Erro ao criar/atualizar admin: {e}")
        db.rollback()
    finally:
        db.close()

def create_categories():
    """Cria categorias básicas se não existirem"""
    db = SessionLocal()
    
    try:
        categories = [
            ('Hardware', 'Problemas com equipamentos físicos', '#EF4444'),
            ('Software', 'Problemas com programas e aplicações', '#3B82F6'),
            ('Rede', 'Problemas de conectividade e rede', '#10B981'),
            ('Email', 'Problemas com email e comunicação', '#F59E0B'),
            ('Acesso', 'Problemas de login e permissões', '#8B5CF6'),
            ('Outros', 'Outros problemas não categorizados', '#6B7280')
        ]
        
        for name, desc, color in categories:
            existing = db.query(Category).filter(Category.name == name).first()
            if not existing:
                category = Category(
                    name=name,
                    description=desc,
                    color=color,
                    is_active=True,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(category)
        
        db.commit()
        print("✅ Categorias criadas com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao criar categorias: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Corrigindo usuário admin e criando categorias...\n")
    
    create_admin_user()
    print()
    create_categories()
    
    print("\n✅ Processo concluído!")
    print("\n🧪 Teste o login:")
    print("   Username: admin")
    print("   Password: admin123")
