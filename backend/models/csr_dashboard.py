import sqlite3
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from enum import Enum
import random
import json

class CSREventType(str, Enum):
    EDUCATION = "education"
    HEALTHCARE = "healthcare" 
    ENVIRONMENT = "environment"
    POVERTY_ALLEVIATION = "poverty_alleviation"
    SKILL_DEVELOPMENT = "skill_development"
    DIGITAL_LITERACY = "digital_literacy"
    WOMEN_EMPOWERMENT = "women_empowerment"
    RURAL_DEVELOPMENT = "rural_development"

class CSREvent(BaseModel):
    id: Optional[int] = None
    company_id: int
    company_name: str
    event_title: str
    event_type: CSREventType
    description: str
    location: str
    state: str
    beneficiaries_count: int
    budget_allocated: float
    budget_spent: float
    start_date: str
    end_date: str
    status: str = "completed"  # planned, ongoing, completed
    impact_metrics: Dict[str, Any] = {}
    created_at: str = datetime.now().isoformat()
    updated_at: str = datetime.now().isoformat()

class CompanyCSRProfile(BaseModel):
    id: Optional[int] = None
    company_id: int
    company_name: str
    industry: str
    company_size: str  # startup, small, medium, large, enterprise
    csr_budget_annual: float
    csr_focus_areas: List[str]
    established_year: int
    headquarters: str
    total_employees: int
    csr_rating: float = 0.0
    created_at: str = datetime.now().isoformat()
    updated_at: str = datetime.now().isoformat()

class CSRDashboardMetrics(BaseModel):
    company_id: int
    company_name: str
    total_events: int
    total_beneficiaries: int
    total_budget_allocated: float
    total_budget_spent: float
    budget_efficiency: float
    average_impact_score: float
    events_by_type: Dict[str, int]
    geographical_reach: Dict[str, int]
    yearly_progress: Dict[str, Dict[str, Any]]
    sustainability_score: float
    community_feedback_score: float

def init_csr_dashboard_db():
    """Initialize CSR dashboard database tables"""
    conn = sqlite3.connect('gramudyogai.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Create companies table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS csr_companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL UNIQUE,
            industry TEXT NOT NULL,
            company_size TEXT NOT NULL,
            csr_budget_annual REAL NOT NULL,
            csr_focus_areas TEXT NOT NULL,  -- JSON string
            established_year INTEGER NOT NULL,
            headquarters TEXT NOT NULL,
            total_employees INTEGER NOT NULL,
            csr_rating REAL DEFAULT 0.0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Create CSR events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS csr_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            company_name TEXT NOT NULL,
            event_title TEXT NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT NOT NULL,
            state TEXT NOT NULL,
            beneficiaries_count INTEGER NOT NULL,
            budget_allocated REAL NOT NULL,
            budget_spent REAL NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT NOT NULL,
            impact_metrics TEXT,  -- JSON string
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (company_id) REFERENCES csr_companies (id)
        )
    ''')
    
    # Create CSR impact tracking table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS csr_impact_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            metric_name TEXT NOT NULL,
            metric_value REAL NOT NULL,
            measurement_date TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY (event_id) REFERENCES csr_events (id)
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_csr_company ON csr_events (company_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_csr_event_type ON csr_events (event_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_csr_state ON csr_events (state)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_csr_status ON csr_events (status)')
    
    conn.commit()
    conn.close()

def populate_dummy_csr_data():
    """Populate database with realistic dummy CSR data"""
    conn = sqlite3.connect('gramudyogai.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Sample companies data
    companies_data = [
        {
            "company_name": "TechMahindra",
            "industry": "Information Technology",
            "company_size": "enterprise",
            "csr_budget_annual": 50000000.0,
            "csr_focus_areas": ["education", "skill_development", "digital_literacy"],
            "established_year": 1986,
            "headquarters": "Pune, Maharashtra",
            "total_employees": 157000,
            "csr_rating": 4.3
        }
    ]
    
    # Insert companies
    company_ids = {}
    for company in companies_data:
        cursor.execute('''
            INSERT OR REPLACE INTO csr_companies 
            (company_name, industry, company_size, csr_budget_annual, csr_focus_areas,
             established_year, headquarters, total_employees, csr_rating, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            company["company_name"], company["industry"], company["company_size"],
            company["csr_budget_annual"], json.dumps(company["csr_focus_areas"]),
            company["established_year"], company["headquarters"], company["total_employees"],
            company["csr_rating"], datetime.now().isoformat(), datetime.now().isoformat()
        ))
        company_ids[company["company_name"]] = cursor.lastrowid
    
    conn.commit()
    conn.close()

# Initialize the database when this module is imported
init_csr_dashboard_db()
