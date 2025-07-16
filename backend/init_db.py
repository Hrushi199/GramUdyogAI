import sqlite3
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

def get_db():
    conn = sqlite3.connect('gramudyogai.db')
    conn.row_factory = sqlite3.Row
    return conn

def migrate_database_schema():
    """Migrate existing database to new schema if needed"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if job_postings table exists and has the new columns
        cursor.execute("PRAGMA table_info(job_postings)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Add missing columns to job_postings if they don't exist
        if 'source' not in columns:
            cursor.execute('ALTER TABLE job_postings ADD COLUMN source TEXT DEFAULT "Skill India"')
        if 'tags' not in columns:
            cursor.execute('ALTER TABLE job_postings ADD COLUMN tags TEXT')
        if 'apply_url' not in columns:
            cursor.execute('ALTER TABLE job_postings ADD COLUMN apply_url TEXT')
        
        # Check if courses table exists and has the new columns
        cursor.execute("PRAGMA table_info(courses)")
        course_columns = [col[1] for col in cursor.fetchall()]
        
        if 'source' not in course_columns:
            cursor.execute('ALTER TABLE courses ADD COLUMN source TEXT DEFAULT "Skill India"')
        if 'is_active' not in course_columns:
            cursor.execute('ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT 1')

        # Check if users table has last_login
        cursor.execute("PRAGMA table_info(users)")
        user_columns = [col[1] for col in cursor.fetchall()]
        if 'last_login' not in user_columns:
            cursor.execute('ALTER TABLE users ADD COLUMN last_login TEXT DEFAULT NULL')
        
        # Check if events table has marketing_highlights and other new columns
        cursor.execute("PRAGMA table_info(events)")
        event_columns = [col[1] for col in cursor.fetchall()]
        if 'marketing_highlights' not in event_columns:
            cursor.execute('ALTER TABLE events ADD COLUMN marketing_highlights TEXT DEFAULT "[]"')
        if 'success_metrics' not in event_columns:
            cursor.execute('ALTER TABLE events ADD COLUMN success_metrics TEXT DEFAULT "[]"')
        if 'sections' not in event_columns:
            cursor.execute('ALTER TABLE events ADD COLUMN sections TEXT DEFAULT "[]"')
        
        # Check if project_investments table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='project_investments'")
        if not cursor.fetchone():
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS project_investments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                investor_id INTEGER NOT NULL,
                investor_name TEXT NOT NULL,
                investor_email TEXT,
                investor_phone TEXT NOT NULL,
                investment_amount INTEGER NOT NULL,
                investment_type TEXT NOT NULL, -- equity, loan, grant, partnership
                equity_percentage REAL DEFAULT 0, -- for equity investments
                expected_returns TEXT, -- what investor expects in return
                terms_conditions TEXT, -- investment terms and conditions
                message TEXT, -- investor's message to project team
                status TEXT DEFAULT 'pending', -- pending, accepted, rejected, negotiating
                invested_at TEXT NOT NULL DEFAULT (datetime('now')),
                response_message TEXT, -- project team's response
                response_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (investor_id) REFERENCES users (id),
                UNIQUE(project_id, investor_id) -- one investment per investor per project
            )
            ''')
            
            # Create indexes for the new table
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_project ON project_investments (project_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_investor ON project_investments (investor_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_status ON project_investments (status)')
        else:
            # Table exists, check if it has all required columns
            cursor.execute("PRAGMA table_info(project_investments)")
            investment_columns = [col[1] for col in cursor.fetchall()]
            
            # Check if the table has the problematic structure and recreate if necessary
            if 'investor_contac' in investment_columns or len(investment_columns) < 10:
                # Backup existing data if any
                cursor.execute("SELECT * FROM project_investments")
                existing_data = cursor.fetchall()
                
                # Drop and recreate the table
                cursor.execute('DROP TABLE IF EXISTS project_investments')
                cursor.execute('''
                CREATE TABLE project_investments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL,
                    investor_id INTEGER NOT NULL,
                    investor_name TEXT NOT NULL,
                    investor_email TEXT,
                    investor_phone TEXT NOT NULL,
                    investment_amount INTEGER NOT NULL,
                    investment_type TEXT NOT NULL, -- equity, loan, grant, partnership
                    equity_percentage REAL DEFAULT 0, -- for equity investments
                    expected_returns TEXT, -- what investor expects in return
                    terms_conditions TEXT, -- investment terms and conditions
                    message TEXT, -- investor's message to project team
                    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, negotiating
                    invested_at TEXT NOT NULL DEFAULT (datetime('now')),
                    response_message TEXT, -- project team's response
                    response_at TEXT,
                    FOREIGN KEY (project_id) REFERENCES projects (id),
                    FOREIGN KEY (investor_id) REFERENCES users (id),
                    UNIQUE(project_id, investor_id) -- one investment per investor per project
                )
                ''')
                
                # Create indexes for the new table
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_project ON project_investments (project_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_investor ON project_investments (investor_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_status ON project_investments (status)')
                
                logger.info("Recreated project_investments table with correct schema")
            else:
                # Add missing columns if they don't exist
                if 'investor_name' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN investor_name TEXT NOT NULL DEFAULT ""')
                if 'investor_email' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN investor_email TEXT')
                if 'investor_phone' not in investment_columns:
                    # Check if there's an old column with different name
                    if 'investor_contac' in investment_columns:
                        # Rename the old column to the correct name
                        cursor.execute('ALTER TABLE project_investments RENAME COLUMN investor_contac TO investor_phone')
                    else:
                        cursor.execute('ALTER TABLE project_investments ADD COLUMN investor_phone TEXT NOT NULL DEFAULT ""')
                if 'investment_amount' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN investment_amount INTEGER NOT NULL DEFAULT 0')
                if 'investment_type' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN investment_type TEXT NOT NULL DEFAULT "equity"')
                if 'equity_percentage' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN equity_percentage REAL DEFAULT 0')
                if 'expected_returns' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN expected_returns TEXT')
                if 'terms_conditions' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN terms_conditions TEXT')
                if 'message' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN message TEXT')
                if 'status' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN status TEXT DEFAULT "pending"')
                if 'invested_at' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN invested_at TEXT DEFAULT ""')
                if 'response_message' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN response_message TEXT')
                if 'response_at' not in investment_columns:
                    cursor.execute('ALTER TABLE project_investments ADD COLUMN response_at TEXT')
        
        conn.commit()
        logger.info("Database schema migration completed successfully")
        
    except Exception as e:
        logger.error(f"Database migration error: {e}")
        conn.rollback()
    finally:
        conn.close()

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
        is_verified BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login TEXT DEFAULT NULL,
        skills TEXT DEFAULT ''
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
    impact_metrics TEXT DEFAULT '{"participants_target": 0, "skills_developed": 0, "projects_created": 0, "employment_generated": 0}',
    marketing_highlights TEXT DEFAULT '[]',
    success_metrics TEXT DEFAULT '[]',
    sections TEXT DEFAULT '[]',
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
        status TEXT DEFAULT 'active',
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
    event_id INTEGER,
    project_id INTEGER,
    metadata TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)
''')
    
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
        job_title TEXT NOT NULL,
        company_name TEXT NOT NULL,
        location TEXT NOT NULL,
        salary_range TEXT,
        description TEXT NOT NULL,
        posted_date TEXT,
        apply_url TEXT,
        industry TEXT,
        sector TEXT,
        job_status TEXT DEFAULT 'Active',
        experience_required TEXT, -- Changed to TEXT for compatibility with all data
        employment_type TEXT,
        job_type TEXT,
        in_hand_salary TEXT, -- Changed to TEXT for compatibility
        application_deadline TEXT,
        source TEXT DEFAULT 'Skill India', -- To identify data source
        tags TEXT, -- JSON array of relevant tags/keywords
        skills_required TEXT, -- JSON array
        title TEXT, -- Legacy field for backward compatibility
        company_contact TEXT, -- Legacy field for backward compatibility
        pay TEXT, -- Legacy field for backward compatibility
        company TEXT, -- Legacy field for backward compatibility
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_active BOOLEAN DEFAULT 0
    )
''')

    # Courses table for Skill India courses
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        link TEXT NOT NULL,
        category TEXT,
        skill_level TEXT DEFAULT 'beginner',
        duration TEXT DEFAULT 'Self-paced',
        provider TEXT DEFAULT 'Skill India Digital',
        description TEXT,
        tags TEXT, -- JSON array of relevant tags/keywords
        source TEXT DEFAULT 'Skill India', -- To identify data source
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
''')

    # Course enrollments table for user course tracking
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS course_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT DEFAULT 'enrolled', -- enrolled, in_progress, completed, dropped
        progress INTEGER DEFAULT 0, -- 0-100 percentage
        completion_date TEXT,
        certificate_url TEXT,
        FOREIGN KEY (course_id) REFERENCES courses (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(course_id, user_id)
    )
''')

    # Job applications table for user job tracking
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS job_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT DEFAULT 'applied', -- applied, shortlisted, rejected, hired
        notes TEXT,
        follow_up_date TEXT,
        FOREIGN KEY (job_id) REFERENCES job_postings (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(job_id, user_id)
    )
''')

    # User skills tracking
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        skill_name TEXT NOT NULL,
        proficiency_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
        acquired_through TEXT, -- course, project, job, self-taught
        verified BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, skill_name)
    )
''')

    # User achievements/certifications
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT, -- certificate, award, milestone, badge
        issuer TEXT,
        date TEXT NOT NULL,
        verification_url TEXT,
        image_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
''')

    # User profiles table (enhanced)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        location TEXT,
        state TEXT,
        skills TEXT, -- JSON array of skills
        experience TEXT,
        goals TEXT,
        education TEXT,
        work_history TEXT, -- JSON array of work experiences
        portfolio_url TEXT,
        linkedin_url TEXT,
        github_url TEXT,
        bio TEXT,
        avatar_url TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
''')

    # Project investments table for investor tracking
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS project_investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        investor_id INTEGER NOT NULL,
        investor_name TEXT NOT NULL,
        investor_email TEXT,
        investor_phone TEXT NOT NULL,
        investment_amount INTEGER NOT NULL,
        investment_type TEXT NOT NULL, -- equity, loan, grant, partnership
        equity_percentage REAL DEFAULT 0, -- for equity investments
        expected_returns TEXT, -- what investor expects in return
        terms_conditions TEXT, -- investment terms and conditions
        message TEXT, -- investor's message to project team
        status TEXT DEFAULT 'pending', -- pending, accepted, rejected, negotiating
        invested_at TEXT NOT NULL DEFAULT (datetime('now')),
        response_message TEXT, -- project team's response
        response_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (investor_id) REFERENCES users (id),
        UNIQUE(project_id, investor_id) -- one investment per investor per project
    )''')

    # Additional indexes for performance
    # Check if columns exist before creating indexes
    cursor.execute("PRAGMA table_info(job_postings)")
    job_columns = [col[1] for col in cursor.fetchall()]
    
    if 'job_title' in job_columns:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_title ON job_postings (job_title)')
    if 'title' in job_columns:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_title_legacy ON job_postings (title)')
    if 'company' in job_columns:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_company ON job_postings (company)')
    if 'location' in job_columns:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_location ON job_postings (location)')
    if 'industry' in job_columns:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_industry ON job_postings (industry)')
    if 'job_status' in job_columns:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_status ON job_postings (job_status)')
    
    # Check if courses table exists and create indexes
    cursor.execute("PRAGMA table_info(courses)")
    course_columns = [col[1] for col in cursor.fetchall()]
    
    if 'name' in course_columns:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_course_name ON courses (name)')
    if 'category' in course_columns:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_course_category ON courses (category)')
    
    # Other indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_course_enrollment_user ON course_enrollments (user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_job_application_user ON job_applications (user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_skill ON user_skills (user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_skill_name ON user_skills (skill_name)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_achievement_user ON achievements (user_id)')
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
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_project ON project_investments (project_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_investor ON project_investments (investor_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_investment_status ON project_investments (status)')

    conn.commit()
    conn.close()
    logger.info("Database initialized successfully!")

def load_skill_india_jobs():
    """Load jobs from skill_india_all_jobs.json into the database"""
    import json
    import os
    
    try:
        json_file_path = os.path.join(os.path.dirname(__file__), 'skill_india_all_jobs.json')
        if not os.path.exists(json_file_path):
            logger.warning(f"Jobs JSON file not found at {json_file_path}")
            return
            
        with open(json_file_path, 'r', encoding='utf-8') as f:
            jobs_data = json.load(f)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Clear existing Skill India job data
        cursor.execute("DELETE FROM job_postings WHERE source = 'Skill India' OR source IS NULL")
        
        # Insert jobs from JSON
        jobs_inserted = 0
        for job in jobs_data:
            try:
                # Skip incomplete entries
                if not job.get('job_title') or not job.get('company'):
                    continue
                
                # Extract tags from job data
                tags = extract_job_tags(job)
                
                cursor.execute('''
                    INSERT INTO job_postings (
                        job_title, company_name, location, salary_range, description,
                        posted_date, apply_url, industry, sector, 
                        experience_required, application_deadline, source, tags, 
                        title, company_contact, pay, created_at, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    job.get('job_title', ''),
                    job.get('company', ''),
                    job.get('location', ''),
                    job.get('salary_range', ''),
                    job.get('description', ''),
                    job.get('posted_on', ''),  # Maps to posted_date
                    job.get('apply_url', ''),  # Include the apply_url from JSON
                    job.get('industry', ''),
                    job.get('sector', ''),
                    str(job.get('experience_required', 0)),
                    job.get('valid_upto', ''),  # Maps to application_deadline
                    'Skill India',
                    json.dumps(tags),
                    job.get('job_title', ''),  # Legacy title field
                    'Contact via apply_url',  # Legacy company_contact
                    job.get('salary_range', ''),  # Legacy pay field
                    datetime.now().isoformat(),  # created_at
                    1  # is_active
                ))
                jobs_inserted += 1
            except Exception as e:
                logger.error(f"Error inserting job {job.get('job_title', 'Unknown')}: {e}")
                continue
        
        conn.commit()
        conn.close()
        logger.info(f"Successfully loaded {jobs_inserted} jobs from Skill India data")
        
    except Exception as e:
        logger.error(f"Error loading Skill India jobs: {e}")

def extract_job_tags(job):
    """Extract relevant tags from job data"""
    tags = []
    
    # Add industry and sector as tags
    if job.get('industry'):
        tags.append(job['industry'].lower().replace(' ', '-'))
    if job.get('sector'):
        tags.append(job['sector'].lower().replace(' ', '-'))
    
    # Extract keywords from job title and description
    job_title = job.get('job_title', '').lower()
    description = job.get('description', '').lower()
    
    # Common job-related keywords
    keywords = [
        'sales', 'marketing', 'customer service', 'telecaller', 'delivery',
        'executive', 'manager', 'developer', 'engineer', 'assistant',
        'representative', 'consultant', 'specialist', 'coordinator',
        'analyst', 'operator', 'technician', 'supervisor', 'clerk',
        'cashier', 'receptionist', 'accountant', 'nurse', 'teacher'
    ]
    
    for keyword in keywords:
        if keyword in job_title or keyword in description:
            tags.append(keyword)
    
    # Add experience level tag
    exp_required = job.get('experience_required', 0)
    if exp_required == 0:
        tags.append('fresher')
    elif exp_required <= 2:
        tags.append('entry-level')
    elif exp_required <= 5:
        tags.append('mid-level')
    else:
        tags.append('senior-level')
    
    # Add location-based tags
    location = job.get('location', '').lower()
    if location:
        tags.append(f"location-{location.replace(' ', '-')}")
    
    return list(set(tags))  # Remove duplicates

def load_skill_india_courses():
    """Load courses from skill_india_all_courses.json into the database"""
    import json
    import os
    
    try:
        json_file_path = os.path.join(os.path.dirname(__file__), 'skill_india_all_courses.json')
        if not os.path.exists(json_file_path):
            logger.warning(f"Courses JSON file not found at {json_file_path}")
            return
            
        with open(json_file_path, 'r', encoding='utf-8') as f:
            courses_data = json.load(f)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Clear existing Skill India course data
        cursor.execute("DELETE FROM courses WHERE source = 'Skill India' OR source IS NULL")
        
        # Insert courses from JSON
        courses_inserted = 0
        for course in courses_data:
            try:
                # Skip incomplete entries
                if not course.get('name') or not course.get('link'):
                    continue
                
                course_name = course.get('name', '')
                category = extract_course_category(course_name)
                skill_level = extract_skill_level(course_name)
                tags = extract_course_tags(course_name)
                description = generate_course_description(course_name, category)
                
                cursor.execute('''
                    INSERT INTO courses (
                        name, link, category, skill_level, provider,
                        description, tags, source, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    course_name,
                    course.get('link', ''),
                    category,
                    skill_level,
                    'Skill India Digital',
                    description,
                    json.dumps(tags),
                    'Skill India',
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                ))
                courses_inserted += 1
            except Exception as e:
                logger.error(f"Error inserting course {course.get('name', 'Unknown')}: {e}")
                continue
        
        conn.commit()
        conn.close()
        logger.info(f"Successfully loaded {courses_inserted} courses from Skill India data")
        
    except Exception as e:
        logger.error(f"Error loading Skill India courses: {e}")

def generate_course_description(course_name, category):
    """Generate a descriptive text for the course"""
    return f"Learn {course_name} through Skill India Digital platform. This {category.lower()} course will help you develop essential skills and knowledge in the field."

def extract_course_category(course_name):
    """Extract category from course name using keywords"""
    course_name_lower = course_name.lower()
    
    # Technology categories
    if any(keyword in course_name_lower for keyword in ['ai', 'artificial intelligence', 'machine learning', 'data science', 'python', 'java', 'programming', 'software', 'web development', 'app development', 'cyber', 'nlp', 'computer']):
        return 'Technology'
    
    # Finance categories
    if any(keyword in course_name_lower for keyword in ['finance', 'banking', 'accounting', 'investment', 'financial']):
        return 'Finance'
    
    # Business categories
    if any(keyword in course_name_lower for keyword in ['business', 'entrepreneurship', 'management', 'marketing', 'sales', 'scrum']):
        return 'Business'
    
    # Health categories
    if any(keyword in course_name_lower for keyword in ['health', 'medical', 'healthcare', 'nutrition']):
        return 'Healthcare'
    
    # Agriculture categories
    if any(keyword in course_name_lower for keyword in ['agriculture', 'farming', 'crop', 'livestock', 'fpo']):
        return 'Agriculture'
    
    # Creative categories
    if any(keyword in course_name_lower for keyword in ['photography', 'design', 'creative', 'art']):
        return 'Creative'
    
    # Education categories
    if any(keyword in course_name_lower for keyword in ['education', 'teaching', 'learning']):
        return 'Education'
    
    return 'General'

def extract_skill_level(course_name):
    """Extract skill level from course name"""
    course_name_lower = course_name.lower()
    
    if any(keyword in course_name_lower for keyword in ['basic', 'fundamentals', 'essentials', 'introduction', 'exploring']):
        return 'beginner'
    elif any(keyword in course_name_lower for keyword in ['advanced', 'expert', 'mastery']):
        return 'advanced'
    elif any(keyword in course_name_lower for keyword in ['intermediate', 'practice']):
        return 'intermediate'
    
    return 'beginner'  # Default to beginner

def extract_course_tags(course_name):
    """Extract relevant tags from course name"""
    course_name_lower = course_name.lower()
    tags = []
    
    # Technology tags
    tech_keywords = ['ai', 'python', 'java', 'web', 'app', 'data', 'machine learning', 'cyber', 'computer', 'programming']
    for keyword in tech_keywords:
        if keyword in course_name_lower:
            tags.append(keyword)
    
    # Business tags
    business_keywords = ['finance', 'banking', 'business', 'management', 'marketing', 'scrum']
    for keyword in business_keywords:
        if keyword in course_name_lower:
            tags.append(keyword)
    
    # General tags
    if 'digital' in course_name_lower:
        tags.append('digital')
    if 'online' in course_name_lower:
        tags.append('online')
    if 'certification' in course_name_lower:
        tags.append('certification')
    
    return tags if tags else ['general']

def update_jobs_with_apply_urls():
    """Update existing jobs with apply URLs from JSON"""
    import json
    import os
    
    try:
        json_file_path = os.path.join(os.path.dirname(__file__), 'skill_india_all_jobs.json')
        if not os.path.exists(json_file_path):
            logger.warning(f"Jobs JSON file not found at {json_file_path}")
            return
            
        with open(json_file_path, 'r', encoding='utf-8') as f:
            jobs_data = json.load(f)
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Create a mapping of job_title + company to apply_url
        job_url_mapping = {}
        for job in jobs_data:
            if job.get('apply_url') and job.get('job_title') and job.get('company'):
                key = f"{job['job_title']}_{job['company']}"
                job_url_mapping[key] = job['apply_url']
        
        # Update existing jobs with apply URLs
        cursor.execute("SELECT id, job_title, company_name FROM job_postings WHERE apply_url IS NULL OR apply_url = ''")
        jobs_to_update = cursor.fetchall()
        
        updated_count = 0
        for job_id, job_title, company in jobs_to_update:
            key = f"{job_title}_{company}"
            if key in job_url_mapping:
                cursor.execute(
                    "UPDATE job_postings SET apply_url = ? WHERE id = ?",
                    (job_url_mapping[key], job_id)
                )
                updated_count += 1
        
        conn.commit()
        conn.close()
        logger.info(f"Successfully updated {updated_count} jobs with apply URLs")
        
    except Exception as e:
        logger.error(f"Error updating jobs with apply URLs: {e}")

def load_all_skill_india_data():
    """Load both jobs and courses data"""
    logger.info("Loading Skill India data...")
    load_skill_india_jobs()
    load_skill_india_courses()
    update_jobs_with_apply_urls()  # Ensure all jobs have apply URLs
    logger.info("Skill India data loading completed!")

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
            }),
            "marketing_highlights": json.dumps(["Featured on TechCrunch", "Won Best Hackathon Award"]),
            "success_metrics": json.dumps(["100+ participants", "50+ projects submitted", "10+ employment opportunities"]),
            "sections": json.dumps(["Introduction", "Problem Statement", "Solution", "Impact"])
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
            }),
            "marketing_highlights": json.dumps(["Pitch to top investors", "Winners get funding"]),
            "success_metrics": json.dumps(["50+ participants", "10+ innovative solutions"]),
            "sections": json.dumps(["Introduction", "Problem Statement", "Solution", "Impact"])
        }
    ]

    cursor.execute("DELETE FROM events")
    for event in sample_events:
        cursor.execute('''
            INSERT INTO events (
                title, description, event_type, category, location, state,
                start_date, end_date, max_participants, current_participants, budget, prize_pool,
                organizer_id, organizer_type, created_by, skills_required, 
                tags, status, impact_metrics, marketing_highlights, success_metrics, sections, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            event["title"], event["description"], event["event_type"],
            event["category"], event["location"], event["state"],
            event["start_date"], event["end_date"], event["max_participants"],
            0,  # current_participants
            event["budget"], event["prize_pool"], event["organizer_id"],
            event["organizer_type"], event["created_by"], event["skills_required"],
            event["tags"], 'active', event["impact_metrics"],
            event.get("marketing_highlights", json.dumps([])),
            event.get("success_metrics", json.dumps([])),
            event.get("sections", json.dumps([])),
            now, now
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