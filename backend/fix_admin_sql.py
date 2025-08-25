#!/usr/bin/env python3
"""
Script to fix admin user using direct SQL
"""
import sqlite3
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security import get_password_hash

def fix_admin_user():
    """Fix admin user using direct SQL"""
    conn = sqlite3.connect('tickets.db')
    cursor = conn.cursor()
    
    try:
        # Check current admin user
        cursor.execute("SELECT * FROM users WHERE username = 'admin'")
        admin_user = cursor.fetchone()
        
        if admin_user:
            print("✅ Current admin user found:")
            print(f"   ID: {admin_user[0]}")
            print(f"   Username: {admin_user[1]}")
            print(f"   Email: {admin_user[2]}")
            print(f"   Role: {admin_user[6]}")
            print(f"   Active: {admin_user[7]}")
            print(f"   LDAP: {admin_user[8]}")
            
            # Update admin user
            cursor.execute("""
                UPDATE users 
                SET role = 'admin', 
                    is_active = 1, 
                    is_ldap_user = 0,
                    hashed_password = ?
                WHERE username = 'admin'
            """, (get_password_hash('admin123'),))
            
            print("✅ Admin user updated successfully!")
        else:
            # Create admin user
            cursor.execute("""
                INSERT INTO users 
                (username, email, full_name, department, phone, role, is_active, is_ldap_user, hashed_password, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                'admin',
                'admin@empresa.local',
                'Administrador do Sistema',
                'TI',
                '(11) 99999-9999',
                'admin',
                1,
                0,
                get_password_hash('admin123'),
                datetime.now().isoformat()
            ))
            
            print("✅ Admin user created successfully!")
        
        conn.commit()
        
        # Verify the fix
        cursor.execute("SELECT username, role, is_active, is_ldap_user FROM users WHERE username = 'admin'")
        result = cursor.fetchone()
        if result:
            print(f"\n✅ Verification - Admin user: {result[0]}, Role: {result[1]}, Active: {result[2]}, LDAP: {result[3]}")
        
        # List all users
        print("\n📋 All users:")
        cursor.execute("SELECT username, role, is_active, is_ldap_user FROM users")
        users = cursor.fetchall()
        for user in users:
            print(f"   - {user[0]} ({user[1]}) - Active: {user[2]} - LDAP: {user[3]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_admin_user()
