#!/usr/bin/env python3
"""
Script to check and create admin user if needed
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import engine
from app.models.models import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

def check_and_create_admin():
    """Check if admin user exists and create if needed"""
    db = Session(bind=engine)
    
    try:
        # Check if admin user exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if admin_user:
            print(f"✅ Admin user exists:")
            print(f"   Username: {admin_user.username}")
            print(f"   Email: {admin_user.email}")
            print(f"   Role: {admin_user.role}")
            print(f"   Active: {admin_user.is_active}")
            print(f"   LDAP User: {admin_user.is_ldap_user}")
            
            # Update admin user to ensure correct settings
            admin_user.role = "admin"  # Use string value
            admin_user.is_active = True
            admin_user.is_ldap_user = False
            admin_user.hashed_password = get_password_hash("admin123")
            db.commit()
            print("✅ Admin user updated successfully!")
        else:
            # Create admin user
            admin_user = User(
                username="admin",
                email="admin@empresa.local",
                full_name="Administrador do Sistema",
                department="TI",
                phone="(11) 99999-9999",
                role="admin",  # Use string value
                is_active=True,
                is_ldap_user=False,
                hashed_password=get_password_hash("admin123"),
                created_at=datetime.utcnow()
            )
            
            db.add(admin_user)
            db.commit()
            print("✅ Admin user created successfully!")
            print("   Username: admin")
            print("   Password: admin123")
            print("   Role: admin")
        
        # List all users
        print("\n📋 All users in database:")
        users = db.query(User).all()
        for user in users:
            print(f"   - {user.username} ({user.role}) - Active: {user.is_active} - LDAP: {user.is_ldap_user}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    check_and_create_admin()
