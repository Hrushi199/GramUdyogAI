import sqlite3

def initialize_database():
    conn = sqlite3.connect("database.db")  # Creates a local SQLite database file
    cursor = conn.cursor()

    # Create a table for job postings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_postings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            company_contact TEXT NOT NULL,
            pay TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    initialize_database()