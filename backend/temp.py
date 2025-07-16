import sqlite3

db = sqlite3.connect('gramudyogai.db')

cursor = db.cursor()
db.commit()
db.close()