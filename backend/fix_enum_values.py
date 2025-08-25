#!/usr/bin/env python3
"""
Script to fix enum values in database to match SQLAlchemy enum definitions
"""
import sqlite3

def fix_enum_values():
    """Fix enum values in database"""
    conn = sqlite3.connect('tickets.db')
    cursor = conn.cursor()
    
    try:
        print("🔧 Fixing enum values in database...")
        
        # Fix user roles - convert lowercase to uppercase
        cursor.execute("UPDATE users SET role = 'ADMIN' WHERE role = 'admin'")
        cursor.execute("UPDATE users SET role = 'TECHNICIAN' WHERE role = 'technician'")
        cursor.execute("UPDATE users SET role = 'USER' WHERE role = 'user'")
        
        # Fix ticket statuses if needed
        cursor.execute("UPDATE tickets SET status = 'OPEN' WHERE status = 'open'")
        cursor.execute("UPDATE tickets SET status = 'IN_PROGRESS' WHERE status = 'in_progress'")
        cursor.execute("UPDATE tickets SET status = 'WAITING_USER' WHERE status = 'waiting_user'")
        cursor.execute("UPDATE tickets SET status = 'RESOLVED' WHERE status = 'resolved'")
        cursor.execute("UPDATE tickets SET status = 'CLOSED' WHERE status = 'closed'")
        cursor.execute("UPDATE tickets SET status = 'REOPENED' WHERE status = 'reopened'")
        
        # Fix ticket priorities if needed
        cursor.execute("UPDATE tickets SET priority = 'LOW' WHERE priority = 'low'")
        cursor.execute("UPDATE tickets SET priority = 'MEDIUM' WHERE priority = 'medium'")
        cursor.execute("UPDATE tickets SET priority = 'HIGH' WHERE priority = 'high'")
        cursor.execute("UPDATE tickets SET priority = 'URGENT' WHERE priority = 'urgent'")
        
        conn.commit()
        
        # Verify the fixes
        print("\n✅ Verification - User roles:")
        cursor.execute("SELECT username, role FROM users")
        users = cursor.fetchall()
        for user in users:
            print(f"   - {user[0]}: {user[1]}")
        
        print("\n✅ Verification - Ticket statuses:")
        cursor.execute("SELECT DISTINCT status FROM tickets")
        statuses = cursor.fetchall()
        for status in statuses:
            print(f"   - {status[0]}")
        
        print("\n✅ Verification - Ticket priorities:")
        cursor.execute("SELECT DISTINCT priority FROM tickets")
        priorities = cursor.fetchall()
        for priority in priorities:
            print(f"   - {priority[0]}")
        
        print("\n✅ All enum values fixed successfully!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_enum_values()
