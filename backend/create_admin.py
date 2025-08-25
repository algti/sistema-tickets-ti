import sqlite3
import hashlib
from datetime import datetime

# Connect to SQLite database
conn = sqlite3.connect('tickets.db')
cursor = conn.cursor()

# Hash password (simple version)
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Create admin user
try:
    cursor.execute("""
        INSERT OR REPLACE INTO users 
        (username, email, full_name, department, phone, role, is_active, is_ldap_user, hashed_password, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        'admin',
        'admin@empresa.local',
        'Administrador do Sistema',
        'TI',
        '(11) 99999-9999',
        'admin',
        True,
        False,
        hash_password('admin123'),
        datetime.now().isoformat()
    ))
    
    # Create some categories
    categories = [
        ('Hardware', 'Problemas com equipamentos físicos', '#EF4444'),
        ('Software', 'Problemas com programas e aplicações', '#3B82F6'),
        ('Rede', 'Problemas de conectividade e rede', '#10B981'),
        ('Email', 'Problemas com email e comunicação', '#F59E0B'),
        ('Acesso', 'Problemas de login e permissões', '#8B5CF6'),
        ('Outros', 'Outros problemas não categorizados', '#6B7280')
    ]
    
    for name, desc, color in categories:
        cursor.execute("""
            INSERT OR REPLACE INTO categories 
            (name, description, color, is_active, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (name, desc, color, True, datetime.now().isoformat()))
    
    conn.commit()
    print("✅ Admin user and categories created successfully!")
    print("👤 Login: admin / admin123")
    
except Exception as e:
    print(f"❌ Error: {e}")
    
finally:
    conn.close()
