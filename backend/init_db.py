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
        updated_at TEXT NOT NULL,
        last_login TEXT DEFAULT NULL
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
    organizer_name TEXT NOT NULL,
    organizer_type TEXT NOT NULL,
    organizer_logo TEXT,
    created_by INTEGER NOT NULL,
    skills_required TEXT NOT NULL,
    tags TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    impact_metrics TEXT DEFAULT '{"participants_target": 0, "skills_developed": 0, "projects_created": 0, "employment_generated": 0}',
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
    team_members TEXT NOT NULL,
    technologies TEXT DEFAULT '[]',
    impact_metrics TEXT DEFAULT '{"users_reached": 0, "revenue_generated": 0}',
    funding_status TEXT DEFAULT 'seeking',
    funding_amount INTEGER DEFAULT 0,
    funding_goal INTEGER DEFAULT 0,
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    created_by INTEGER NOT NULL,
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
        event_id INTEGER,  -- Added event_id
        role TEXT NOT NULL,
        skills TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')

    # Unified Profiles Domain
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS unified_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        organization TEXT,
        location TEXT,
        state TEXT,
        skills TEXT,
        experience TEXT,
        goals TEXT,
        user_type TEXT NOT NULL,
        notifications_settings TEXT,
        impact_metrics TEXT,
        achievements TEXT,
        recent_activities TEXT,
        recommendations TEXT,
        networking_suggestions TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )''')

    # Profile Activities Domain
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS profile_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        description TEXT,
        timestamp TEXT NOT NULL,
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
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS job_postings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        company_contact TEXT NOT NULL,
        pay TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
''')

    # Additional indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_summary_lang ON summary_translations (language)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_audio_lang ON audio_files (language)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_event_organizer ON events (organizer_id, organizer_type)')
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
        ("+916666666666", "hashed_password_here", "individual", "Raj Patel", None),
        ("+915555555555", "hashed_password_here", "individual", "Priya Sharma", None),
        ("+914444444444", "hashed_password_here", "individual", "Ahmed Khan", None),
    ]
    
    cursor.execute("DELETE FROM users")
    for user in sample_users:
        cursor.execute('''
            INSERT INTO users (phone, password_hash, user_type, name, organization, is_active, created_at, updated_at, last_login)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?, NULL)
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
        },
        {
            "title": "AgriTech Innovation Challenge",
            "description": "Competition focused on agricultural technology solutions",
            "event_type": "competition",
            "category": "Agriculture",
            "location": "Pune",
            "state": "Maharashtra",
            "start_date": (datetime.now() + timedelta(days=15)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=17)).isoformat(),
            "max_participants": 50,
            "budget": 30000,
            "prize_pool": 75000,
            "organizer_id": 2,
            "organizer_type": "company",
            "created_by": 2,
            "skills_required": json.dumps(["IoT", "Machine Learning", "Mobile Development"]),
            "tags": json.dumps(["agriculture", "innovation", "iot"]),
            "impact_metrics": json.dumps({
                "participants_target": 50,
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

    # Sample Projects
    sample_projects = [
        {
            "title": "FarmConnect Mobile App",
            "description": "A mobile application connecting farmers directly with consumers, eliminating middlemen and ensuring fair prices for both parties. Features include real-time market prices, weather updates, and secure payment processing.",
            "category": "Agriculture",
            "event_id": 1,
            "event_name": "Rural Innovation Hackathon",
            "event_type": "hackathon",
            "technologies": json.dumps(["React Native", "Node.js", "MongoDB", "Express.js"]),
            "impact_metrics": json.dumps({
                "users_reached": 1250,
                "revenue_generated": 50000,
                "farmers_helped": 300,
                "transactions_processed": 850
            }),
            "funding_status": "funded",
            "funding_amount": 75000,
            "funding_goal": 75000,
            "location": "Bangalore",
            "state": "Karnataka",
            "created_by": 1,
            "status": "completed",
            "completed_at": (datetime.now() - timedelta(days=15)).isoformat(),
            "media": json.dumps({
                "images": ["farmconnect_app.jpg", "dashboard.jpg"],
                "videos": ["demo_video.mp4"]
            }),
            "testimonials": json.dumps([
                {
                    "name": "Ravi Kumar",
                    "role": "Farmer",
                    "message": "This app helped me sell my produce directly to customers at 30% better prices!"
                }
            ]),
            "awards": json.dumps(["Best Innovation Award", "People's Choice Award"]),
            "tags": json.dumps(["agriculture", "mobile-app", "marketplace", "farmers"])
        },
        {
            "title": "Smart Irrigation System",
            "description": "IoT-based automated irrigation system that monitors soil moisture, weather conditions, and crop requirements to optimize water usage and improve crop yield.",
            "category": "Agriculture",
            "event_id": 2,
            "event_name": "AgriTech Innovation Challenge",
            "event_type": "competition",
            "technologies": json.dumps(["Arduino", "Python", "IoT Sensors", "Machine Learning"]),
            "impact_metrics": json.dumps({
                "users_reached": 500,
                "revenue_generated": 25000,
                "water_saved_liters": 100000,
                "crop_yield_increase": 25
            }),
            "funding_status": "seeking",
            "funding_amount": 15000,
            "funding_goal": 100000,
            "location": "Pune",
            "state": "Maharashtra",
            "created_by": 3,
            "status": "active",
            "completed_at": None,
            "media": json.dumps({
                "images": ["irrigation_system.jpg", "sensor_setup.jpg"],
                "videos": ["system_demo.mp4"]
            }),
            "testimonials": json.dumps([
                {
                    "name": "Sunita Patil",
                    "role": "Farmer",
                    "message": "Reduced my water usage by 40% while increasing my crop yield!"
                }
            ]),
            "awards": json.dumps(["Best Technical Innovation"]),
            "tags": json.dumps(["iot", "irrigation", "automation", "water-conservation"])
        },
        {
            "title": "Rural Healthcare Chatbot",
            "description": "AI-powered multilingual chatbot providing basic healthcare guidance and connecting rural communities with healthcare professionals through telemedicine.",
            "category": "Healthcare",
            "event_id": 1,
            "event_name": "Rural Innovation Hackathon",
            "event_type": "hackathon",
            "technologies": json.dumps(["Python", "NLP", "TensorFlow", "React", "WebRTC"]),
            "impact_metrics": json.dumps({
                "users_reached": 2000,
                "revenue_generated": 0,
                "consultations_provided": 1500,
                "villages_covered": 50
            }),
            "funding_status": "seeking",
            "funding_amount": 0,
            "funding_goal": 200000,
            "location": "Bangalore",
            "state": "Karnataka",
            "created_by": 4,
            "status": "active",
            "completed_at": None,
            "media": json.dumps({
                "images": ["chatbot_interface.jpg", "telemedicine_setup.jpg"],
                "videos": ["chatbot_demo.mp4"]
            }),
            "testimonials": json.dumps([
                {
                    "name": "Dr. Anita Verma",
                    "role": "Rural Health Officer",
                    "message": "This chatbot has helped bridge the healthcare gap in remote villages."
                }
            ]),
            "awards": json.dumps(["Social Impact Award"]),
            "tags": json.dumps(["healthcare", "ai", "chatbot", "telemedicine", "rural"])
        },
        {
            "title": "EcoWaste Management System",
            "description": "Comprehensive waste management solution for rural areas including waste tracking, recycling optimization, and community engagement features.",
            "category": "Environment",
            "event_id": 1,
            "event_name": "Rural Innovation Hackathon",
            "event_type": "hackathon",
            "technologies": json.dumps(["React", "Node.js", "PostgreSQL", "GIS Mapping"]),
            "impact_metrics": json.dumps({
                "users_reached": 800,
                "revenue_generated": 12000,
                "waste_recycled_kg": 5000,
                "communities_served": 15
            }),
            "funding_status": "funded",
            "funding_amount": 50000,
            "funding_goal": 50000,
            "location": "Bangalore",
            "state": "Karnataka",
            "created_by": 5,
            "status": "active",
            "completed_at": None,
            "media": json.dumps({
                "images": ["waste_tracking.jpg", "recycling_center.jpg"],
                "videos": ["system_overview.mp4"]
            }),
            "testimonials": json.dumps([
                {
                    "name": "Mohan Reddy",
                    "role": "Village Head",
                    "message": "Our village is now 80% cleaner thanks to this system!"
                }
            ]),
            "awards": json.dumps(["Environmental Impact Award"]),
            "tags": json.dumps(["environment", "waste-management", "recycling", "sustainability"])
        },
        {
            "title": "SkillBridge Learning Platform",
            "description": "Digital platform connecting rural youth with skill development opportunities, online courses, and job placement assistance.",
            "category": "Education",
            "event_id": 2,
            "event_name": "AgriTech Innovation Challenge",
            "event_type": "competition",
            "technologies": json.dumps(["Vue.js", "Django", "MySQL", "Video Streaming"]),
            "impact_metrics": json.dumps({
                "users_reached": 3000,
                "revenue_generated": 35000,
                "courses_completed": 1200,
                "job_placements": 150
            }),
            "funding_status": "seeking",
            "funding_amount": 25000,
            "funding_goal": 150000,
            "location": "Pune",
            "state": "Maharashtra",
            "created_by": 6,
            "status": "active",
            "completed_at": None,
            "media": json.dumps({
                "images": ["learning_platform.jpg", "student_dashboard.jpg"],
                "videos": ["platform_walkthrough.mp4"]
            }),
            "testimonials": json.dumps([
                {
                    "name": "Kavita Singh",
                    "role": "Student",
                    "message": "Got my first job through this platform! The courses were excellent."
                }
            ]),
            "awards": json.dumps([]),
            "tags": json.dumps(["education", "skill-development", "job-placement", "rural-youth"])
        }
    ]

    cursor.execute("DELETE FROM projects")
    for project in sample_projects:
        cursor.execute('''
            INSERT INTO projects (
                title, description, category, event_id, event_name, event_type,
                team_members, technologies, impact_metrics, funding_status, funding_amount,
                funding_goal, location, state, created_by, created_at, completed_at,
                status, media, testimonials, awards, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            project["title"], project["description"], project["category"],
            project["event_id"], project["event_name"], project["event_type"],
            json.dumps([]),  # Initialize with empty team_members
            project["technologies"], project["impact_metrics"], project["funding_status"],
            project["funding_amount"], project["funding_goal"], project["location"],
            project["state"], project["created_by"], now, project["completed_at"],
            project["status"], project["media"], project["testimonials"],
            project["awards"], project["tags"]
        ))

    # Sample Project Team Members
    sample_team_members = [
        # FarmConnect Mobile App team
        {"project_id": 1, "user_id": 1, "event_id": 1, "role": "Lead Developer", "skills": json.dumps(["React Native", "Node.js", "Project Management"])},
        {"project_id": 1, "user_id": 3, "event_id": 1, "role": "UI/UX Designer", "skills": json.dumps(["UI Design", "User Research", "Prototyping"])},
        {"project_id": 1, "user_id": 4, "event_id": 1, "role": "Backend Developer", "skills": json.dumps(["Node.js", "MongoDB", "API Development"])},
        
        # Smart Irrigation System team
        {"project_id": 2, "user_id": 3, "event_id": 2, "role": "Hardware Engineer", "skills": json.dumps(["Arduino", "IoT", "Sensors"])},
        {"project_id": 2, "user_id": 5, "event_id": 2, "role": "Software Developer", "skills": json.dumps(["Python", "Machine Learning", "Data Analysis"])},
        
        # Rural Healthcare Chatbot team
        {"project_id": 3, "user_id": 4, "event_id": 1, "role": "AI Engineer", "skills": json.dumps(["Python", "NLP", "TensorFlow"])},
        {"project_id": 3, "user_id": 6, "event_id": 1, "role": "Frontend Developer", "skills": json.dumps(["React", "JavaScript", "WebRTC"])},
        
        # EcoWaste Management System team
        {"project_id": 4, "user_id": 5, "event_id": 1, "role": "Full Stack Developer", "skills": json.dumps(["React", "Node.js", "PostgreSQL"])},
        {"project_id": 4, "user_id": 1, "event_id": 1, "role": "GIS Specialist", "skills": json.dumps(["GIS Mapping", "Data Visualization", "Geospatial Analysis"])},
        
        # SkillBridge Learning Platform team
        {"project_id": 5, "user_id": 6, "event_id": 2, "role": "Full Stack Developer", "skills": json.dumps(["Vue.js", "Django", "MySQL"])},
        {"project_id": 5, "user_id": 3, "event_id": 2, "role": "Product Manager", "skills": json.dumps(["Product Management", "User Research", "Strategy"])},
    ]

    cursor.execute("DELETE FROM project_team_members")
    for member in sample_team_members:
        cursor.execute('''
            INSERT INTO project_team_members (
                project_id, user_id, event_id, role, skills, joined_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            member["project_id"], member["user_id"], member["event_id"],
            member["role"], member["skills"], now
        ))

    conn.commit()
    conn.close()
    logger.info("Database seeded successfully!")

if __name__ == "__main__":
    init_database()
    seed_db()