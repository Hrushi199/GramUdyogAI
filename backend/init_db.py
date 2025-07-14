import sqlite3
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

def get_db():
    return sqlite3.connect('gramudyogai.db')

def init_database():
    """Initialize database with all required tables"""
    conn = get_db()
    cursor = conn.cursor()

    # Auth Domain
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        user_type TEXT NOT NULL,
        name TEXT NOT NULL,
        organization TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )''')

    # Events Domain
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        event_type TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        state TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        max_participants INTEGER NOT NULL,
        current_participants INTEGER DEFAULT 0,
        budget INTEGER DEFAULT 0,
        prize_pool INTEGER DEFAULT 0,
        organizer_id INTEGER NOT NULL,
        organizer_type TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        skills_required TEXT NOT NULL,
        tags TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        impact_metrics TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users (id)
    )''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS event_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'registered',
        joined_at TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS event_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by INTEGER NOT NULL,
        reason TEXT,
        changed_at TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (changed_by) REFERENCES users (id)
    )''')

    # Projects Domain
    # Update team_members structure in projects table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        event_id INTEGER NOT NULL,
        event_name TEXT NOT NULL,
        event_type TEXT NOT NULL,
        technologies TEXT DEFAULT '[]',
        impact_metrics TEXT DEFAULT '{"users_reached": 0, "revenue_generated": 0}',
        funding_status TEXT DEFAULT 'seeking',
        funding_amount INTEGER DEFAULT 0,
        funding_goal INTEGER DEFAULT 0,
        location TEXT NOT NULL,
        state TEXT NOT NULL,
        created_by INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        status TEXT DEFAULT 'active',
        media TEXT DEFAULT '{"images": [], "videos": []}',
        testimonials TEXT DEFAULT '[]',
        awards TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        FOREIGN KEY (event_id) REFERENCES events (id)
    )''')



    cursor.execute('''
    CREATE TABLE IF NOT EXISTS project_team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        skills TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')

    # Social Media Domain
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS social_media_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        scheduled_at TEXT,
        status TEXT DEFAULT 'draft',
        created_at TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events (id)
    )''')

    # Notifications Domain
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        notification_type TEXT NOT NULL,
        related_id INTEGER,
        related_type TEXT,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )''')
    
    # Skills & Learning Domain
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS visual_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        summary_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS summary_translations (
        summary_id INTEGER,
        language TEXT,
        translated_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (summary_id, language),
        FOREIGN KEY (summary_id) REFERENCES visual_summaries(id)
    )''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audio_files (
        text_hash TEXT,
        language TEXT,
        file_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (text_hash, language)
    )''')

    # Additional indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_summary_lang ON summary_translations (language)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_audio_lang ON audio_files (language)')

    # Create performance indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_event_status ON events (status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_event_created_by ON events (created_by)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_event_type ON events (event_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_participant_event ON event_participants (event_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_participant_user ON event_participants (user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_project_event ON projects (event_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_team_project ON project_team_members (project_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_notification_user ON notifications (user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_social_event ON social_media_posts (event_id)')

    conn.commit()
    conn.close()
    logger.info("Database initialized successfully!")

def seed_db():
    """Seed database with sample data"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    # Sample Users
    sample_users = [
        ("+919999999999", "hashed_password_here", "individual", "John Developer", None),
        ("+918888888888", "hashed_password_here", "company", "Tech Corp", "Tech Solutions Ltd"),
        ("+917777777777", "hashed_password_here", "individual", "Sarah Designer", None),
    ]
    
    cursor.execute("DELETE FROM users")
    for user in sample_users:
        cursor.execute('''
            INSERT INTO users (phone, password_hash, user_type, name, organization, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        ''', (*user, now, now))

    # Sample Events
    sample_events = [
        {
            "title": "Rural Innovation Hackathon",
            "description": "48-hour hackathon focused on solving rural challenges using technology",
            "event_type": "hackathon",
            "category": "Technology",
            "location": "Bangalore",
            "state": "Karnataka",
            "start_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=32)).isoformat(),
            "max_participants": 100,
            "budget": 50000,
            "prize_pool": 100000,
            "organizer_id": 1,
            "organizer_type": "individual",
            "created_by": 1,
            "skills_required": json.dumps(["Python", "React", "Node.js"]),
            "tags": json.dumps(["innovation", "rural-tech", "sustainability"]),
            "impact_metrics": json.dumps({
                "participants_target": 100,
                "skills_developed": 0,
                "projects_created": 0,
                "employment_generated": 0
            })
        }
    ]

    cursor.execute("DELETE FROM events")
    for event in sample_events:
        cursor.execute('''
            INSERT INTO events (
                title, description, event_type, category, location, state,
                start_date, end_date, max_participants, budget, prize_pool,
                organizer_id, organizer_type, created_by, skills_required, 
                tags, impact_metrics, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        ''', (
            event["title"], event["description"], event["event_type"],
            event["category"], event["location"], event["state"],
            event["start_date"], event["end_date"], event["max_participants"],
            event["budget"], event["prize_pool"], event["organizer_id"],
            event["organizer_type"], event["created_by"], event["skills_required"],
            event["tags"], event["impact_metrics"], now, now
        ))

    conn.commit()
    conn.close()
    logger.info("Database seeded successfully!")

if __name__ == "__main__":
    init_database()
    seed_db()
