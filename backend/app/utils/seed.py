from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Category, UserRole
from app.core.config import settings

def create_admin_user(db: Session):
    """Create default admin user"""
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@sistema-tickets.com",
            full_name="Administrador do Sistema",
            department="TI",
            role=UserRole.admin,
            hashed_password=get_password_hash("!@Adm1n@sw!"),
            is_ldap_user=False,
            is_active=True
        )
        db.add(admin)
        print("✅ Admin user created with username: admin")
    else:
        print("ℹ️  Admin user already exists")

def create_default_categories(db: Session):
    """Create default ticket categories - DISABLED FOR CLEAN START"""
    pass

def seed_database():
    """Seed database with initial data"""
    print("🌱 Creating admin user...")
    
    db = SessionLocal()
    try:
        create_admin_user(db)
        db.commit()
        print("✅ Admin user created successfully!")
        print("📋 Login credentials:")
        print("   Username: admin")
        print("   Password: !@Adm1n@sw!")
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
