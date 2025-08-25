import sqlite3

# Connect to database
conn = sqlite3.connect('tickets.db')
cursor = conn.cursor()

# Check tickets
cursor.execute("SELECT COUNT(*) FROM tickets")
ticket_count = cursor.fetchone()[0]
print(f"Total tickets: {ticket_count}")

if ticket_count > 0:
    cursor.execute("SELECT id, title, status, priority, created_by_id FROM tickets LIMIT 5")
    tickets = cursor.fetchall()
    print("\nTickets:")
    for ticket in tickets:
        print(f"  ID: {ticket[0]}, Title: {ticket[1]}, Status: {ticket[2]}, Priority: {ticket[3]}, Created by: {ticket[4]}")

# Check users
cursor.execute("SELECT id, username, role, is_active FROM users")
users = cursor.fetchall()
print(f"\nTotal users: {len(users)}")
for user in users:
    print(f"  ID: {user[0]}, Username: {user[1]}, Role: {user[2]}, Active: {user[3]}")

conn.close()
