import sqlite3

conn = sqlite3.connect('tickets.db')
cursor = conn.cursor()

# Check current emails
cursor.execute('SELECT username, email FROM users')
print('Before update:')
for user in cursor.fetchall():
    print(f'  {user[0]}: {user[1]}')

# Update all emails to valid ones
cursor.execute('UPDATE users SET email = ? WHERE username = ?', ('admin@example.com', 'admin'))
cursor.execute('UPDATE users SET email = ? WHERE username = ?', ('tecnico@example.com', 'tecnico'))
cursor.execute('UPDATE users SET email = ? WHERE username = ?', ('usuario@example.com', 'usuario'))
conn.commit()

# Check after update
cursor.execute('SELECT username, email FROM users')
print('\nAfter update:')
for user in cursor.fetchall():
    print(f'  {user[0]}: {user[1]}')

conn.close()
print('\nEmails updated successfully!')
