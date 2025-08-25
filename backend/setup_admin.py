#!/usr/bin/env python3
"""
Script to create admin user for the ticket system
"""
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.models import User, UserRole, Base

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")

def create_admin_user():
    """Create admin user"""
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("ℹ️  Admin user already exists")
            return
        
        # Create admin user
        admin = User(
            username="admin",
            email="admin@sistema-tickets.com",
            full_name="Administrador do Sistema",
            department="TI",
            role=UserRole.ADMIN,
            hashed_password=get_password_hash("!@Adm1n@sw!"),
            is_ldap_user=False,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print("📋 Login credentials:")
        print("   Username: admin")
        print("   Password: !@Adm1n@sw!")
        print("   Role: Administrator")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Setting up admin user...")
    create_tables()
    create_admin_user()
    print("✅ Setup completed!")
