import sqlite3

# Connect to the SQLite database
db = sqlite3.connect('gramudyogai.db')

# Create a cursor object
cursor = db.cursor()

# Add missing columns to notifications table if they don't exist
cursor.execute("ALTER TABLE project_team_members ADD COLUMN status TEXT DEFAULT 'active';")
db.commit()
db.close()
