import sqlite3
conn = sqlite3.connect('backend/gramudyogai.db')
cursor = conn.cursor()
uesrs = cursor.execute("SELECT * FROM users;")
for user in uesrs:
    print(user)
conn.commit()
conn.close()
