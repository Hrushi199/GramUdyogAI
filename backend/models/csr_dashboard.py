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
    conn = sqlite3.connect('database.db')
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
    conn = sqlite3.connect('database.db')
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
        },
        {
            "company_name": "Reliance Industries",
            "industry": "Petrochemicals & Energy",
            "company_size": "enterprise", 
            "csr_budget_annual": 120000000.0,
            "csr_focus_areas": ["healthcare", "education", "rural_development"],
            "established_year": 1966,
            "headquarters": "Mumbai, Maharashtra",
            "total_employees": 236000,
            "csr_rating": 4.1
        },
        {
            "company_name": "Infosys",
            "industry": "Information Technology",
            "company_size": "enterprise",
            "csr_budget_annual": 75000000.0,
            "csr_focus_areas": ["education", "healthcare", "environment"],
            "established_year": 1981,
            "headquarters": "Bengaluru, Karnataka",
            "total_employees": 292067,
            "csr_rating": 4.5
        },
        {
            "company_name": "Tata Consultancy Services",
            "industry": "Information Technology",
            "company_size": "enterprise",
            "csr_budget_annual": 80000000.0,
            "csr_focus_areas": ["education", "skill_development", "women_empowerment"],
            "established_year": 1968,
            "headquarters": "Mumbai, Maharashtra", 
            "total_employees": 528748,
            "csr_rating": 4.4
        },
        {
            "company_name": "HDFC Bank",
            "industry": "Banking & Financial Services",
            "company_size": "enterprise",
            "csr_budget_annual": 65000000.0,
            "csr_focus_areas": ["education", "healthcare", "rural_development"],
            "established_year": 1994,
            "headquarters": "Mumbai, Maharashtra",
            "total_employees": 177000,
            "csr_rating": 4.2
        },
        {
            "company_name": "Wipro",
            "industry": "Information Technology",
            "company_size": "enterprise",
            "csr_budget_annual": 45000000.0,
            "csr_focus_areas": ["education", "environment", "healthcare"],
            "established_year": 1945,
            "headquarters": "Bengaluru, Karnataka",
            "total_employees": 258000,
            "csr_rating": 4.0
        },
        {
            "company_name": "ITC Limited",
            "industry": "FMCG & Consumer Goods",
            "company_size": "enterprise",
            "csr_budget_annual": 55000000.0,
            "csr_focus_areas": ["environment", "rural_development", "education"],
            "established_year": 1910,
            "headquarters": "Kolkata, West Bengal",
            "total_employees": 25000,
            "csr_rating": 4.3
        },
        {
            "company_name": "Bharti Airtel",
            "industry": "Telecommunications",
            "company_size": "enterprise",
            "csr_budget_annual": 40000000.0,
            "csr_focus_areas": ["education", "healthcare", "digital_literacy"],
            "established_year": 1995,
            "headquarters": "New Delhi",
            "total_employees": 20000,
            "csr_rating": 3.9
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
    
    # Sample CSR events data
    indian_states = [
        "Andhra Pradesh", "Karnataka", "Tamil Nadu", "Maharashtra", "Gujarat", 
        "Rajasthan", "Uttar Pradesh", "Bihar", "West Bengal", "Odisha",
        "Madhya Pradesh", "Haryana", "Punjab", "Kerala", "Telangana"
    ]
    
    event_templates = {
        CSREventType.EDUCATION: [
            "Digital Learning Centers for Rural Schools",
            "Scholarship Program for Underprivileged Students", 
            "Teacher Training and Development Program",
            "Mobile Education Vans for Remote Areas",
            "STEM Education Initiative for Girls"
        ],
        CSREventType.HEALTHCARE: [
            "Free Health Camps in Rural Areas",
            "Mobile Medical Units for Remote Villages",
            "Mother and Child Healthcare Program",
            "Mental Health Awareness Campaign",
            "Vaccination Drive for Children"
        ],
        CSREventType.SKILL_DEVELOPMENT: [
            "Vocational Training for Youth",
            "Digital Skills Training Program",
            "Entrepreneurship Development Workshop",
            "Women's Skill Development Initiative",
            "Farmer Training and Development Program"
        ],
        CSREventType.ENVIRONMENT: [
            "Tree Plantation Drive",
            "Waste Management Awareness Program",
            "Solar Energy Installation in Villages",
            "Water Conservation Project",
            "Organic Farming Promotion"
        ],
        CSREventType.RURAL_DEVELOPMENT: [
            "Village Infrastructure Development",
            "Rural Connectivity Enhancement",
            "Livelihood Generation Program",
            "Community Development Initiative",
            "Rural Housing Project"
        ]
    }
    
    # Generate events for each company
    for company_name, company_id in company_ids.items():
        company_data = next(c for c in companies_data if c["company_name"] == company_name)
        focus_areas = company_data["csr_focus_areas"]
        
        # Generate 8-15 events per company over the last 2 years
        num_events = random.randint(8, 15)
        
        for _ in range(num_events):
            event_type = random.choice([CSREventType(area) for area in focus_areas if area in [e.value for e in CSREventType]])
            event_title = random.choice(event_templates.get(event_type, ["CSR Initiative"]))
            
            # Random dates within last 2 years
            start_date = datetime.now() - timedelta(days=random.randint(30, 730))
            end_date = start_date + timedelta(days=random.randint(1, 180))
            
            beneficiaries = random.randint(100, 10000)
            budget_allocated = random.randint(100000, 5000000)
            budget_spent = budget_allocated * random.uniform(0.85, 1.0)
            
            # Generate realistic impact metrics based on event type
            impact_metrics = {}
            if event_type == CSREventType.EDUCATION:
                impact_metrics = {
                    "students_enrolled": random.randint(50, beneficiaries),
                    "completion_rate": random.uniform(75, 95),
                    "literacy_improvement": random.uniform(15, 40),
                    "schools_covered": random.randint(5, 50)
                }
            elif event_type == CSREventType.HEALTHCARE:
                impact_metrics = {
                    "patients_treated": beneficiaries,
                    "villages_covered": random.randint(10, 100),
                    "health_improvement_rate": random.uniform(70, 90),
                    "preventive_care_provided": random.randint(100, 1000)
                }
            elif event_type == CSREventType.SKILL_DEVELOPMENT:
                impact_metrics = {
                    "people_trained": beneficiaries,
                    "job_placement_rate": random.uniform(60, 85),
                    "skills_acquired": random.randint(2, 8),
                    "certification_completion": random.uniform(70, 95)
                }
            elif event_type == CSREventType.ENVIRONMENT:
                impact_metrics = {
                    "trees_planted": random.randint(1000, 50000),
                    "carbon_offset_tons": random.randint(50, 500),
                    "water_saved_liters": random.randint(10000, 100000),
                    "communities_benefited": random.randint(5, 50)
                }
            
            location = f"{random.choice(['Rural', 'Urban', 'Semi-urban'])} {random.choice(['District', 'Taluka', 'Block'])}"
            state = random.choice(indian_states)
            
            cursor.execute('''
                INSERT INTO csr_events 
                (company_id, company_name, event_title, event_type, description, location, state,
                 beneficiaries_count, budget_allocated, budget_spent, start_date, end_date,
                 status, impact_metrics, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                company_id, company_name, event_title, event_type.value,
                f"Comprehensive {event_type.value.replace('_', ' ').title()} initiative aimed at improving quality of life and creating sustainable impact in the community.",
                location, state, beneficiaries, budget_allocated, budget_spent,
                start_date.isoformat(), end_date.isoformat(), "completed",
                json.dumps(impact_metrics), datetime.now().isoformat(), datetime.now().isoformat()
            ))
    
    conn.commit()
    conn.close()

# Initialize the database when this module is imported
init_csr_dashboard_db()
