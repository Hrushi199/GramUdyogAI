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
    
    # Create CSR courses table
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

    conn.commit()
    conn.close()

init_db()