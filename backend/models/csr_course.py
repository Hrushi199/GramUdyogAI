import sqlite3
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum

class EnrollmentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

class CSRCourse(BaseModel):
    id: Optional[int] = None
    company_id: int
    title: str 
    description: str
    skills: List[str]
    duration: str
    language: str
    certification: bool
    max_seats: int
    start_date: str
    status: str = "draft"  # draft, active, completed
    content_url: Optional[str] = None
    created_at: str = datetime.now().isoformat()
    updated_at: str = datetime.now().isoformat()

class CourseEnrollment(BaseModel):
    id: Optional[int] = None
    course_id: int
    user_id: int
    status: EnrollmentStatus = EnrollmentStatus.PENDING
    progress: int = 0
    feedback: Optional[str] = None
    created_at: str = datetime.now().isoformat()
    updated_at: str = datetime.now().isoformat()

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # Create user_profiles table (minimal, assuming needed for foreign key)
    # c.execute('''
    #     CREATE TABLE IF NOT EXISTS user_profiles (
    #         id INTEGER PRIMARY KEY AUTOINCREMENT,
    #         name TEXT NOT NULL,
    #         created_at TEXT NOT NULL
    #     )
    # ''')

    # Check if csr_courses table exists and has content_url column
    c.execute("PRAGMA table_info(csr_courses)")
    columns = [col[1] for col in c.fetchall()]
    table_exists = len(columns) > 0
    has_content_url = 'content_url' in columns

    if table_exists and not has_content_url:
        # Create a new table with the updated schema
        c.execute('''
            CREATE TABLE csr_courses_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                skills TEXT NOT NULL,
                duration TEXT NOT NULL,
                language TEXT NOT NULL,
                certification BOOLEAN NOT NULL,
                max_seats INTEGER NOT NULL,
                start_date TEXT NOT NULL,
                status TEXT NOT NULL,
                content_url TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')

        # Copy data from old table to new table
        c.execute('''
            INSERT INTO csr_courses_new (
                id, company_id, title, description, skills, duration, language,
                certification, max_seats, start_date, status, created_at, updated_at
            )
            SELECT 
                id, company_id, title, description, skills, duration, language,
                certification, max_seats, start_date, status, created_at, updated_at
            FROM csr_courses
        ''')

        # Drop the old table and rename the new one
        c.execute('DROP TABLE csr_courses')
        c.execute('ALTER TABLE csr_courses_new RENAME TO csr_courses')

    # Create csr_courses table if it doesn't exist
    c.execute('''
        CREATE TABLE IF NOT EXISTS csr_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            skills TEXT NOT NULL,
            duration TEXT NOT NULL,
            language TEXT NOT NULL,
            certification BOOLEAN NOT NULL,
            max_seats INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            status TEXT NOT NULL,
            content_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')

    # Create enrollments table
    c.execute('''
        CREATE TABLE IF NOT EXISTS course_enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            progress INTEGER NOT NULL,
            feedback TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (course_id) REFERENCES csr_courses (id),
            FOREIGN KEY (user_id) REFERENCES user_profiles (id)
        )
    ''')

    # Create indexes for performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_course_company ON csr_courses (company_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_enrollment_course ON course_enrollments (course_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_enrollment_user ON course_enrollments (user_id)')

    conn.commit()
    conn.close()

init_db()