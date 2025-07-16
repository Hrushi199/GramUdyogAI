from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from core.job_recommender import *
from init_db import get_db
from groq import Groq
import os
from dotenv import load_dotenv, find_dotenv
import json
import time
from core.translation import llama_translate_string as translate_text, llama_chat_completion
from typing import Optional, List
import json
import os

router = APIRouter()
# os.environ.pop("GROQ_API_KEY", None)
# load_dotenv(find_dotenv())
api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key)

LLAMA_MODEL = "llama-3.3-70b-versatile"
class JobPosting(BaseModel):
    title: str
    description: str
    company: str
    location: str
    company_contact: str
    pay: str

class SkillIndiaJob(BaseModel):
    job_title: str
    company_name: str
    location: str
    salary_range: Optional[str] = None
    description: str
    industry: Optional[str] = None
    sector: Optional[str] = None
    job_type: Optional[str] = "Full-time"
    experience_required: Optional[str] = "0"
    employment_type: Optional[str] = "Full-time"
    skills_required: Optional[List[str]] = []
    posted_date: Optional[str] = None
    application_deadline: Optional[str] = None
    is_active: Optional[bool] = True

class EnhancedJobPosting(BaseModel):
    job_title: str
    company_name: str
    location: str
    salary_range: Optional[str] = None
    description: str
    industry: Optional[str] = None
    sector: Optional[str] = None
    job_type: Optional[str] = "Full-time"
    experience_required: Optional[str] = "0"
    employment_type: Optional[str] = "Full-time"
    skills_required: Optional[List[str]] = []
    is_active: Optional[bool] = True

class JobSearchQuery(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[int] = None
    limit: Optional[int] = 20
    offset: Optional[int] = 0

class UserInfo(BaseModel):
    user_info: str  # Input from the user for job recommendation

@router.post("/jobs")
async def create_job(job: JobPosting):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO job_postings (title, description, company, location, company_contact, pay, job_title, salary_range, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (job.title, job.description, job.company, job.location, job.company_contact, job.pay, job.title, job.pay, True))

    conn.commit()
    conn.close()

    return {"message": "Job posted successfully"}

@router.post("/jobs/enhanced")
async def create_enhanced_job(job: EnhancedJobPosting):
    """Create a new job posting with enhanced fields"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO job_postings (
            job_title, company, location, salary_range, description,
            industry, sector, job_type, experience_required, employment_type,
            skills_required, is_active, title, company_contact, pay
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job.job_title, job.company_name, job.location, job.salary_range, job.description,
        job.industry, job.sector, job.job_type, job.experience_required, job.employment_type,
        json.dumps(job.skills_required), job.is_active,
        job.job_title, "Contact via apply_url", job.salary_range
    ))

    conn.commit()
    job_id = cursor.lastrowid
    conn.close()

    return {"message": "Enhanced job posted successfully", "job_id": job_id}

@router.get("/jobs")
async def get_jobs(
    limit: int = Query(20, description="Number of jobs to return"),
    offset: int = Query(0, description="Number of jobs to skip"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    location: Optional[str] = Query(None, description="Filter by location"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    experience_level: Optional[str] = Query(None, description="Filter by experience required"),
    source: Optional[str] = Query(None, description="Filter by source"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in job title and description"),
    diverse: Optional[bool] = Query(True, description="Show diverse job types")
):
    """Get all jobs with optional filtering"""
    conn = get_db()
    cursor = conn.cursor()
    
    base_query = """
        SELECT id, job_title, company, location, salary_range, description,
               industry, sector, job_type, employment_type, experience_required, 
               skills_required, posted_date, application_deadline, tags, source, 
               is_active, created_at, title, company_contact, pay, apply_url
        FROM job_postings
        WHERE is_active = ?
    """
    
    conditions = []
    params = [is_active]
    
    # Add diversity filter to reduce repetitive delivery jobs in main listing
    if diverse:
        conditions.append("(job_title NOT LIKE '%delivery%' OR ROWID % 5 = 0)")  # Show 1 in 5 delivery jobs
    
    if industry:
        conditions.append("industry LIKE ?")
        params.append(f"%{industry}%")
    
    if location:
        conditions.append("location LIKE ?")
        params.append(f"%{location}%")
    
    if job_type:
        conditions.append("job_type LIKE ?")
        params.append(f"%{job_type}%")
    
    if experience_level:
        conditions.append("experience_required LIKE ?")
        params.append(f"%{experience_level}%")
    
    if source:
        conditions.append("source = ?")
        params.append(source)
    
    if search:
        conditions.append("(job_title LIKE ? OR description LIKE ? OR title LIKE ?)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])
    
    if conditions:
        base_query += " AND " + " AND ".join(conditions)
    
    # Order by diversity and recency
    base_query += """ 
        ORDER BY 
            CASE 
                WHEN industry IN ('Information Technology', 'Software', 'Healthcare', 'Education', 'Finance') THEN 1
                ELSE 0
            END DESC,
            created_at DESC 
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    
    cursor.execute(base_query, params)
    jobs = cursor.fetchall()
    
    # Get total count
    count_query = "SELECT COUNT(*) FROM job_postings WHERE is_active = ?"
    count_params = [is_active]
    if conditions:
        count_query += " AND " + " AND ".join(conditions)
        count_params.extend(params[1:-2])  # Exclude limit and offset
    
    cursor.execute(count_query, count_params)
    total_count = cursor.fetchone()[0]
    
    conn.close()

    return {
        "jobs": [
            {
                "id": job["id"],
                "job_title": job["job_title"] or job["title"],  # job_title or title (legacy)
                "company_name": job["company"] if job["company"] else "",  # company_name or company
                "location": job["location"],
                "salary_range": job["salary_range"] or job["pay"] or "",  # salary_range or pay (legacy)
                "description": job["description"],
                "industry": job["industry"],
                "sector": job["sector"],
                "job_type": job["job_type"],
                "employment_type": job["employment_type"],
                "experience_required": job["experience_required"],
                "skills_required": json.loads(job["skills_required"]) if job["skills_required"] else [],
                "posted_date": job["posted_date"],
                "application_deadline": job["application_deadline"],
                "tags": json.loads(job["tags"]) if job["tags"] else [],
                "source": job["source"],
                "is_active": job["is_active"],
                "created_at": job["created_at"],
                "apply_url": job["apply_url"],
                # Legacy fields for backward compatibility
                "title": job["job_title"] or job["title"],
                "company": job["company"] if job["company"] else "",
                "company_contact": job["company_contact"] if job["company_contact"] else "",
                "pay": job["salary_range"] or job["pay"] or ""
            }
            for job in jobs
        ],
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }

@router.get("/jobs/search")
async def search_jobs(
    query: Optional[str] = Query(None, description="Search query for job title, company, or description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    limit: int = Query(20, description="Number of results to return"),
    offset: int = Query(0, description="Number of results to skip")
):
    """Advanced job search with filters"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Build dynamic query
    base_query = """
        SELECT id, job_title, company, location, salary_range, description,
               industry, sector, job_type, employment_type, experience_required, 
               skills_required, posted_date, application_deadline, tags, source, 
               is_active, created_at, title, company_contact, pay, apply_url
        FROM job_postings 
        WHERE is_active = 1
    """
    
    conditions = []
    params = []
    
    if query:
        conditions.append("(job_title LIKE ? OR title LIKE ? OR company LIKE ? OR description LIKE ?)")
    params = []
    
    if query:
        conditions.append("(job_title LIKE ? OR description LIKE ? OR title LIKE ? OR company LIKE ?)")
        search_term = f"%{query}%"
        params.extend([search_term, search_term, search_term, search_term])
    
    if location:
        conditions.append("location LIKE ?")
        params.append(f"%{location}%")
    
    if industry:
        conditions.append("industry LIKE ?")
        params.append(f"%{industry}%")
    
    if job_type:
        conditions.append("job_type LIKE ?")
        params.append(f"%{job_type}%")
    
    if experience_level:
        conditions.append("experience_required LIKE ?")
        params.append(f"%{experience_level}%")
    
    if conditions:
        base_query += " AND " + " AND ".join(conditions)
    
    base_query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(base_query, params)
    jobs = cursor.fetchall()
    
    # Get total count for pagination
    count_query = "SELECT COUNT(*) FROM job_postings WHERE is_active = 1"
    if conditions:
        count_query += " AND " + " AND ".join(conditions)
    
    cursor.execute(count_query, params[:-2])  # Exclude limit and offset
    total_count = cursor.fetchone()[0]
    
    conn.close()

    return {
        "jobs": [
            {
                "id": job["id"],
                "job_title": job["job_title"] or job["title"],
                "company_name": job["company"] or "",
                "location": job["location"],
                "salary_range": job["salary_range"] or job["pay"] or "",
                "description": job["description"],
                "industry": job["industry"],
                "sector": job["sector"],
                "job_type": job["job_type"],
                "employment_type": job["employment_type"],
                "experience_required": job["experience_required"],
                "skills_required": json.loads(job["skills_required"]) if job["skills_required"] else [],
                "posted_date": job["posted_date"],
                "application_deadline": job["application_deadline"],
                "tags": json.loads(job["tags"]) if job["tags"] else [],
                "source": job["source"],
                "is_active": job["is_active"],
                "created_at": job["created_at"],
                "apply_url": job["apply_url"],
                # Legacy fields for backward compatibility
                "title": job["job_title"] or job["title"],
                "company": job["company"] or "",
                "company_contact": job["company_contact"] or "",
                "pay": job["salary_range"] or job["pay"] or ""
            }
            for job in jobs
        ],
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }

@router.get("/jobs/{job_id}")
async def get_job_by_id(job_id: int):
    """Get a specific job by ID"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, job_title, company, location, salary_range, description,
               industry, sector, job_type, employment_type, experience_required, 
               skills_required, posted_date, application_deadline, tags, source, 
               is_active, created_at, title, company_contact, pay
        FROM job_postings WHERE id = ?
    """, (job_id,))
    job = cursor.fetchone()

    conn.close()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job["id"],
        "job_title": job["job_title"] or job["title"],
        "company_name": job["company"] or "",
        "location": job["location"],
        "salary_range": job["salary_range"] or job["pay"] or "",
        "description": job["description"],
        "industry": job["industry"],
        "sector": job["sector"],
        "job_type": job["job_type"],
        "employment_type": job["employment_type"],
        "experience_required": job["experience_required"],
        "skills_required": json.loads(job["skills_required"]) if job["skills_required"] else [],
        "posted_date": job["posted_date"],
        "application_deadline": job["application_deadline"],
        "tags": json.loads(job["tags"]) if job["tags"] else [],
        "source": job["source"],
        "is_active": job["is_active"],
        "created_at": job["created_at"],
        # Legacy fields for backward compatibility
        "title": job["job_title"] or job["title"],
        "company": job["company"] or "",
        "company_contact": job["company_contact"] or "",
        "pay": job["salary_range"] or job["pay"] or ""
    }

@router.put("/jobs/{job_id}")
async def update_job(job_id: int, job_update: SkillIndiaJob):
    """Update a job posting"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE job_postings 
        SET job_title = ?, description = ?, company = ?, location = ?, 
            salary_range = ?, industry = ?, sector = ?, job_type = ?, 
            employment_type = ?, experience_required = ?, skills_required = ?, 
            posted_date = ?, application_deadline = ?, tags = ?, source = ?, is_active = ?
        WHERE id = ?
    """, (
        job_update.job_title, job_update.description, job_update.company_name, 
        job_update.location, job_update.salary_range, job_update.industry, 
        job_update.sector, job_update.job_type, job_update.employment_type, 
        job_update.experience_required, json.dumps(job_update.skills_required), 
        job_update.posted_date, job_update.application_deadline, 
        json.dumps(job_update.tags), job_update.source, job_update.is_active, job_id
    ))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found")

    conn.commit()
    conn.close()

    return {"message": "Job updated successfully"}

@router.delete("/jobs/{job_id}")
async def delete_job(job_id: int):
    """Delete a job posting"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM job_postings WHERE id = ?", (job_id,))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Job not found")

    conn.commit()
    conn.close()

    return {"message": "Job deleted successfully"}

@router.post("/recommend-job")
async def recommend_job(user_info: UserInfo):
    """
    Smart job recommendation using keyword matching and scoring
    """
    try:
        return await smart_recommend_job(user_info)
    except Exception as e:
        print(f"Error in recommend_job: {str(e)}")
        # Fallback to simple recommendation
        return await simple_recommend_job(user_info)

@router.post("/recommend-job-smart")
async def smart_recommend_job(user_info: UserInfo):
    """
    AI-powered smart job recommendation using Llama model via Groq
    """
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        user_text = user_info.user_info.lower()
        
        # Step 1: Use AI to analyze user intent and extract key information
        intent_analysis = await analyze_user_intent_with_ai(user_text)
        
        # Step 2: Get relevant jobs based on AI analysis
        jobs = await get_jobs_based_on_ai_analysis(cursor, intent_analysis, user_text)
        
        if not jobs:
            conn.close()
            return {"best_job": None, "alternative_jobs": [], "message": "No relevant jobs found. Please try a different search."}
        
        # Step 3: Use AI to score and rank jobs
        scored_jobs = await score_jobs_with_ai(jobs, user_text, intent_analysis)
        
        conn.close()
        
        if not scored_jobs:
            return {"best_job": None, "alternative_jobs": [], "message": "No relevant jobs found. Please try a different search."}

        # Format the best job and alternatives
        best_job_formatted = format_job_response(scored_jobs[0][1], scored_jobs[0][0])
        alternative_jobs_formatted = [
            format_job_response(job_data[1], job_data[0]) for job_data in scored_jobs[1:6]
        ]
        
        return {
            "best_job": best_job_formatted,
            "alternative_jobs": alternative_jobs_formatted,
            "ai_analysis": intent_analysis
        }
        
    except Exception as e:
        print(f"Error in AI-powered recommendation: {str(e)}")
        # Fallback to the original smart recommendation
        return await smart_recommend_job_fallback(user_info)

async def analyze_user_intent_with_ai(user_text: str) -> dict:
    """
    Use Llama to analyze user intent and extract key job search criteria with precise categorization
    """
    try:
        system_prompt = """You are an expert job search analyst. Analyze the user's job search request and extract key information with PRECISE job categorization.

        Return your analysis in JSON format with these fields:
        {
            "job_roles": ["list of EXACT job titles/roles the user is looking for"],
            "skills": ["list of specific technical/professional skills mentioned"],
            "industries": ["list of industries mentioned or strongly implied"],
            "experience_level": "entry/junior/mid/senior/expert",
            "location_preferences": ["list of locations if mentioned"],
            "job_types": ["full-time/part-time/contract/freelance"],
            "salary_expectations": "any salary mentions or 'not_mentioned'",
            "key_requirements": ["list of important requirements"],
            "career_goals": "brief description of what user wants to achieve",
            "search_intent": "job_search/career_change/skill_development/specific_company",
            "primary_category": "one primary job category: software_engineer/data_analyst/sales/marketing/teacher/healthcare/finance/delivery/customer_service/management/other"
        }
        
        IMPORTANT RULES:
        1. If user mentions "software engineer" or "developer" or "programming", set primary_category to "software_engineer"
        2. If user mentions "analyst" or "data", set primary_category to "data_analyst"  
        3. If user mentions "sales" or "business development", set primary_category to "sales"
        4. If user mentions "teacher" or "education", set primary_category to "teacher"
        5. If user mentions "delivery" or "driver", set primary_category to "delivery"
        6. Be VERY specific about job_roles - don't include generic terms
        7. Distinguish clearly between different job categories to avoid mismatches
        
        If information is not clear or missing, use reasonable defaults based on context but be conservative."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyze this job search request: {user_text}"}
        ]
        
        response = llama_chat_completion(messages, temperature=0.1, max_tokens=800)
        analysis = json.loads(response)
        
        # Additional validation and cleanup
        if not analysis.get("primary_category"):
            # Determine primary category from job_roles if not set
            job_roles = analysis.get("job_roles", [])
            for role in job_roles:
                role_lower = role.lower()
                if any(term in role_lower for term in ['software', 'developer', 'engineer', 'programmer']):
                    analysis["primary_category"] = "software_engineer"
                    break
                elif any(term in role_lower for term in ['analyst', 'data']):
                    analysis["primary_category"] = "data_analyst"
                    break
                elif 'sales' in role_lower:
                    analysis["primary_category"] = "sales"
                    break
                elif any(term in role_lower for term in ['teacher', 'education']):
                    analysis["primary_category"] = "teacher"
                    break
                elif any(term in role_lower for term in ['delivery', 'driver']):
                    analysis["primary_category"] = "delivery"
                    break
            
            if not analysis.get("primary_category"):
                analysis["primary_category"] = "other"
        
        return analysis
        
    except Exception as e:
        print(f"Error in AI intent analysis: {str(e)}")
        # Fallback analysis with basic categorization
        user_lower = user_text.lower()
        primary_category = "other"
        
        if any(term in user_lower for term in ['software', 'developer', 'engineer', 'programmer', 'coding']):
            primary_category = "software_engineer"
        elif any(term in user_lower for term in ['analyst', 'data']):
            primary_category = "data_analyst"
        elif 'sales' in user_lower:
            primary_category = "sales"
        elif any(term in user_lower for term in ['teacher', 'education']):
            primary_category = "teacher"
        elif any(term in user_lower for term in ['delivery', 'driver']):
            primary_category = "delivery"
        
        return {
            "job_roles": [user_text],
            "skills": user_text.split(),
            "industries": [],
            "experience_level": "entry",
            "location_preferences": [],
            "job_types": ["full-time"],
            "salary_expectations": "not_mentioned",
            "key_requirements": [],
            "career_goals": "Find relevant job opportunities",
            "search_intent": "job_search",
            "primary_category": primary_category
        }

async def get_jobs_based_on_ai_analysis(cursor, intent_analysis: dict, user_text: str) -> list:
    """
    Query database for jobs based on AI analysis with robust filtering
    """
    # Define job category exclusions to prevent mismatches
    job_category_exclusions = {
        'software': ['telecaller', 'telemarketing', 'call center', 'sales', 'delivery', 'driver', 'cook', 'cleaner', 'guard', 'security'],
        'engineer': ['telecaller', 'telemarketing', 'call center', 'sales', 'delivery', 'driver', 'cook', 'cleaner'],
        'developer': ['telecaller', 'telemarketing', 'call center', 'sales', 'delivery', 'driver', 'cook', 'cleaner'],
        'analyst': ['telecaller', 'telemarketing', 'delivery', 'driver', 'cook', 'cleaner', 'guard'],
        'teacher': ['telecaller', 'telemarketing', 'delivery', 'driver', 'software', 'developer'],
        'healthcare': ['telecaller', 'software', 'developer', 'delivery', 'driver'],
        'finance': ['delivery', 'driver', 'cook', 'cleaner']
    }
    
    # Build dynamic query conditions based on AI analysis
    conditions = []
    exclusion_conditions = []
    params = []
    
    # Get primary job roles for more precise matching
    primary_roles = intent_analysis.get("job_roles", [])
    primary_skills = intent_analysis.get("skills", [])
    
    # Job roles and titles - More precise matching
    if primary_roles:
        role_conditions = []
        for role in primary_roles:
            role_lower = role.lower()
            # Primary match in job title (most important)
            role_conditions.append("(job_title LIKE ? OR title LIKE ?)")
            params.extend([f"%{role}%", f"%{role}%"])
            
            # Add exclusions for this role category
            for category, exclusions in job_category_exclusions.items():
                if category in role_lower:
                    for exclusion in exclusions:
                        exclusion_conditions.append("job_title NOT LIKE ?")
                        exclusion_conditions.append("title NOT LIKE ?")
                        params.extend([f"%{exclusion}%", f"%{exclusion}%"])
        
        if role_conditions:
            conditions.append(f"({' OR '.join(role_conditions)})")
    
    # Skills - Focus on job title and skills_required field
    if primary_skills:
        skill_conditions = []
        for skill in primary_skills:
            if len(skill) > 2:  # Avoid short words
                skill_lower = skill.lower()
                # Primary match in job title and skills
                skill_conditions.append("(job_title LIKE ? OR skills_required LIKE ?)")
                params.extend([f"%{skill}%", f"%{skill}%"])
                
                # Add exclusions for this skill category
                for category, exclusions in job_category_exclusions.items():
                    if category in skill_lower:
                        for exclusion in exclusions:
                            exclusion_conditions.append("job_title NOT LIKE ?")
                            exclusion_conditions.append("title NOT LIKE ?")
                            params.extend([f"%{exclusion}%", f"%{exclusion}%"])
        
        if skill_conditions:
            conditions.append(f"({' OR '.join(skill_conditions)})")
    
    # Industries - More precise industry matching
    if intent_analysis.get("industries"):
        industry_conditions = []
        for industry in intent_analysis["industries"]:
            industry_conditions.append("(industry LIKE ? OR sector LIKE ?)")
            params.extend([f"%{industry}%", f"%{industry}%"])
        if industry_conditions:
            conditions.append(f"({' OR '.join(industry_conditions)})")
    
    # Location
    if intent_analysis.get("location_preferences"):
        location_conditions = []
        for location in intent_analysis["location_preferences"]:
            location_conditions.append("location LIKE ?")
            params.append(f"%{location}%")
        if location_conditions:
            conditions.append(f"({' OR '.join(location_conditions)})")
    
    # Experience level mapping
    experience_mapping = {
        "entry": "0",
        "junior": "12",
        "mid": "24",
        "senior": "60",
        "expert": "120"
    }
    experience_level = experience_mapping.get(intent_analysis.get("experience_level", "entry"), "0")
    
    # Build the final query with robust filtering
    base_query = """
        SELECT id, job_title, company, location, salary_range, description,
               industry, sector, job_type, employment_type, experience_required, 
               skills_required, posted_date, application_deadline, tags, source, 
               is_active, created_at, title, company_contact, pay, apply_url
        FROM job_postings 
        WHERE is_active = 1
    """
    
    # Add positive conditions (what we want)
    if conditions:
        base_query += " AND (" + " OR ".join(conditions) + ")"
    
    # Add exclusion conditions (what we don't want)
    if exclusion_conditions:
        base_query += " AND (" + " AND ".join(exclusion_conditions) + ")"
    
    # Add experience filter
    base_query += " AND (experience_required <= ? OR experience_required IS NULL)"
    params.append(str(int(experience_level) + 24))  # Allow some flexibility
    
    # If no specific conditions, fall back to broad search with strong exclusions
    if not conditions:
        # Extract key terms from user text for fallback
        user_words = [word for word in user_text.lower().split() if len(word) > 2]
        if user_words:
            fallback_conditions = []
            for word in user_words[:3]:  # Use top 3 words
                fallback_conditions.append("(job_title LIKE ? OR description LIKE ?)")
                params.extend([f"%{word}%", f"%{word}%"])
            
            if fallback_conditions:
                base_query = base_query.replace("WHERE is_active = 1", 
                    f"WHERE is_active = 1 AND ({' OR '.join(fallback_conditions)})")
    
    # Order by relevance and recency
    base_query += """ 
        ORDER BY 
            CASE 
                WHEN job_title LIKE ? OR title LIKE ? THEN 3
                WHEN skills_required LIKE ? THEN 2
                ELSE 1
            END DESC,
            created_at DESC 
        LIMIT 30
    """
    
    # Add ordering parameters
    if primary_roles:
        main_role = primary_roles[0]
        params.extend([f"%{main_role}%", f"%{main_role}%", f"%{main_role}%"])
    else:
        params.extend(['%software%', '%software%', '%software%'])  # Default
    
    cursor.execute(base_query, params)
    return cursor.fetchall()

async def score_jobs_with_ai(jobs: list, user_text: str, intent_analysis: dict) -> list:
    """
    Use AI to score and rank jobs based on relevance with enhanced category matching
    """
    if not jobs:
        return []
    
    try:
        # Prepare job summaries for AI scoring
        job_summaries = []
        primary_category = intent_analysis.get("primary_category", "other")
        
        for i, job in enumerate(jobs[:20]):  # Limit to top 20 for AI processing
            job_summary = {
                "index": i,
                "job_title": job[1] or job[18],
                "company": job[2] or job[19],
                "location": job[3],
                "salary": job[4] or job[21],
                "description": (job[5] or "")[:300],  # Increased for better analysis
                "industry": job[6],
                "job_type": job[8],
                "experience_required": job[10],
                "skills": job[11]
            }
            job_summaries.append(job_summary)
        
        # Enhanced AI scoring prompt with category awareness
        system_prompt = f"""You are an expert job matching specialist. Score each job based on how well it matches the user's requirements.

        CRITICAL MATCHING RULES:
        1. The user is looking for "{primary_category}" category jobs
        2. Jobs outside this category should get VERY LOW scores (0-30)
        3. Exact job title matches should get highest priority
        4. Consider semantic similarity but prioritize category alignment
        
        CATEGORY DEFINITIONS:
        - software_engineer: Developer, programmer, software engineer, coding roles
        - data_analyst: Data analyst, business analyst, research analyst
        - sales: Sales representative, business development, account manager
        - teacher: Teacher, instructor, trainer, education roles
        - delivery: Delivery driver, courier, logistics
        - customer_service: Customer service, call center, telecaller, support
        
        Return a JSON object with job scores:
        {{
            "scores": {{
                "0": 85,
                "1": 72,
                "2": 90,
                ...
            }},
            "reasoning": {{
                "0": "Excellent match for skills and experience level",
                "1": "Good match but location might not be ideal",
                ...
            }}
        }}
        
        Score from 0-100 where:
        - 90-100: Perfect match (exact job title + category match)
        - 80-89: Excellent match (close job title + category match)
        - 70-79: Good match (related role in same category)
        - 60-69: Fair match (loosely related)
        - 30-59: Poor match (wrong category but some overlap)
        - 0-29: Very poor match (completely different category)
        
        PRIORITIZE: Job title relevance > Category alignment > Skills > Experience > Location"""

        user_prompt = f"""
        User Search: {user_text}
        User's Target Category: {primary_category}
        
        User Intent Analysis: {json.dumps(intent_analysis, indent=2)}
        
        Jobs to Score: {json.dumps(job_summaries, indent=2)}
        
        Score each job focusing on category alignment and job title relevance. 
        Be STRICT about category mismatches - if someone wants a software engineer job, don't give high scores to telecaller positions.
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = llama_chat_completion(messages, temperature=0.1, max_tokens=2000)
        ai_scores = json.loads(response)
        
        # Combine AI scores with jobs and add additional category-based filtering
        scored_jobs = []
        for i, job in enumerate(jobs[:20]):
            ai_score = ai_scores.get("scores", {}).get(str(i), 30)  # Lower default score
            
            # Additional category validation to prevent mismatches
            job_title_lower = (job[1] or job[18] or "").lower()
            job_desc_lower = (job[5] or "").lower()
            
            # Apply strict category filtering
            category_mismatch_penalty = 0
            if primary_category == "software_engineer":
                if any(term in job_title_lower for term in ['telecaller', 'call center', 'sales', 'delivery', 'driver', 'cook', 'cleaner']):
                    category_mismatch_penalty = 50
            elif primary_category == "data_analyst":
                if any(term in job_title_lower for term in ['telecaller', 'delivery', 'driver', 'cook', 'cleaner', 'guard']):
                    category_mismatch_penalty = 50
            elif primary_category == "sales":
                if any(term in job_title_lower for term in ['developer', 'engineer', 'programmer', 'analyst']):
                    category_mismatch_penalty = 30
            
            # Apply penalty
            final_score = max(0, ai_score - category_mismatch_penalty)
            scored_jobs.append((final_score, job))
        
        # Sort by AI score
        scored_jobs.sort(key=lambda x: x[0], reverse=True)
        
        # Add remaining jobs with very low default score
        for job in jobs[20:]:
            scored_jobs.append((20, job))  # Very low score for unprocessed jobs
        
        # Filter out jobs with very low scores if we have enough good matches
        high_score_jobs = [job for score, job in scored_jobs if score >= 60]
        if len(high_score_jobs) >= 5:
            scored_jobs = [(score, job) for score, job in scored_jobs if score >= 40]
        
        return scored_jobs
        
    except Exception as e:
        print(f"Error in AI scoring: {str(e)}")
        # Fallback to simple scoring with category awareness
        primary_category = intent_analysis.get("primary_category", "other")
        fallback_scored = []
        
        for job in jobs:
            job_title_lower = (job[1] or job[18] or "").lower()
            score = 40  # Base score
            
            # Category-based scoring
            if primary_category == "software_engineer":
                if any(term in job_title_lower for term in ['software', 'developer', 'engineer', 'programmer']):
                    score = 70
                elif any(term in job_title_lower for term in ['telecaller', 'sales', 'delivery']):
                    score = 10
            elif primary_category == "data_analyst":
                if 'analyst' in job_title_lower:
                    score = 70
                elif any(term in job_title_lower for term in ['telecaller', 'delivery']):
                    score = 10
            
            fallback_scored.append((score, job))
        
        fallback_scored.sort(key=lambda x: x[0], reverse=True)
        return fallback_scored
        
        # Sort by AI score
        scored_jobs.sort(key=lambda x: x[0], reverse=True)
        
        # Add remaining jobs with default score
        for job in jobs[20:]:
            scored_jobs.append((30, job))  # Lower default score for unprocessed jobs
        
        return scored_jobs
        
    except Exception as e:
        print(f"Error in AI scoring: {str(e)}")
        # Fallback to simple scoring
        return [(50, job) for job in jobs]

def format_job_response(job_data, score=0):
    """Format job data for API response"""
    return {
        "id": job_data["id"],
        "job_title": job_data["job_title"] or job_data["title"] or "",
        "company_name": job_data["company"] or "",
        "location": job_data["location"] or "",
        "salary_range": job_data["salary_range"] or job_data["pay"] or "",
        "description": (job_data["description"] or "")[:250] + "..." if job_data["description"] and len(job_data["description"]) > 250 else (job_data["description"] or ""),
        "industry": job_data["industry"] or "",
        "sector": job_data["sector"] or "",
        "job_type": job_data["job_type"] or "",
        "employment_type": job_data["employment_type"] or "",
        "experience_required": job_data["experience_required"] or "",
        "skills_required": json.loads(job_data["skills_required"]) if job_data["skills_required"] and job_data["skills_required"] != "null" else [],
        "source": job_data["source"] or "",
        "company_contact": job_data["company_contact"] or "",
        "apply_url": job_data["apply_url"] or "",
        "relevance_score": score,
        "ai_powered": True
    }

async def smart_recommend_job_fallback(user_info: UserInfo):
    """
    Fallback to original smart recommendation if AI fails
    """
    conn = get_db()
    cursor = conn.cursor()
    
    user_text = user_info.user_info.lower()
    
    # Add delivery/logistics to skill categories
    skill_keywords = {
        'delivery': ['delivery', 'driver', 'courier', 'logistics', 'transport', 'fleet', 'dispatch', 'shipping', 'swiggy', 'zomato', 'dunzo'],
        'software': ['software', 'developer', 'programming', 'coding', 'python', 'java', 'javascript', 'react', 'node', 'web', 'app', 'frontend', 'backend', 'fullstack', 'mobile', 'android', 'ios'],
        'sales': ['sales', 'marketing', 'business', 'customer', 'client', 'revenue', 'target', 'account', 'relationship', 'telesales'],
        'healthcare': ['nurse', 'doctor', 'medical', 'healthcare', 'hospital', 'clinic', 'patient', 'pharmacy', 'therapy'],
        'education': ['teacher', 'education', 'tutor', 'instructor', 'training', 'academic', 'professor', 'coach', 'school'],
        'engineering': ['engineer', 'technical', 'mechanical', 'civil', 'electrical', 'design', 'manufacturing', 'quality'],
        'finance': ['finance', 'accounting', 'bank', 'investment', 'analyst', 'financial', 'audit', 'tax', 'insurance', 'advisor'],
        'management': ['manager', 'management', 'supervisor', 'lead', 'director', 'coordinator', 'admin', 'executive'],
        'operations': ['operations', 'logistics', 'supply', 'warehouse', 'procurement', 'planning'],
        'design': ['design', 'creative', 'graphics', 'ui', 'ux', 'visual', 'artist', 'architect'],
        'hospitality': ['hotel', 'restaurant', 'hospitality', 'chef', 'food', 'service', 'tourism'],
        'manufacturing': ['manufacturing', 'production', 'factory', 'assembly', 'quality', 'maintenance'],
        'retail': ['retail', 'store', 'cashier', 'merchandise', 'inventory', 'shop'],
        'analyst': ['analyst', 'research', 'data', 'insights']
    }
    
    # Score jobs based on user input - improved algorithm
    user_skills = []
    user_categories = []
    
    # Extract keywords from user query
    user_words = [word for word in user_text.split() if len(word) > 2 and word not in ['the', 'and', 'for', 'job', 'work', 'looking', 'want', 'i']]

    for category, keywords in skill_keywords.items():
        matches = sum(1 for keyword in keywords if keyword in user_words)
        if matches > 0:
            user_skills.extend([kw for kw in keywords if kw in user_words])
            user_categories.append(category)

    # If no categories matched, use the user's words as skills
    if not user_skills:
        user_skills.extend(user_words)

    # Extract experience level with better detection
    experience_level = "0"
    if any(word in user_text for word in ['senior', 'experienced', '5+', 'five', 'lead', 'principal', 'expert']):
        experience_level = "60"
    elif any(word in user_text for word in ['mid', 'intermediate', '2-5', 'few years', '3 year', '4 year']):
        experience_level = "24"
    elif any(word in user_text for word in ['junior', 'fresher', 'entry', 'new', 'graduate', 'beginner']):
        experience_level = "0"
    
    # Build diversified query based on user input
    if user_skills:
        # Create a comprehensive search that includes direct keyword matching
        skill_conditions = []
        
        # Add skill-based conditions
        for skill in set(user_skills): # Use set to avoid duplicate conditions
            skill_conditions.append(f"(job_title LIKE '%{skill}%' OR description LIKE '%{skill}%' OR industry LIKE '%{skill}%' OR tags LIKE '%{skill}%')")
        
        if skill_conditions:
            query = f"""
                SELECT id, job_title, company, location, salary_range, description,
                       industry, sector, job_type, employment_type, experience_required, 
                       skills_required, posted_date, application_deadline, tags, source, 
                       is_active, created_at, title, company_contact, pay, apply_url,
                       -- Scoring for relevance
                       (CASE 
                            WHEN experience_required <= ? THEN 3
                            WHEN experience_required <= ? THEN 2 
                            ELSE 1 
                       END) as exp_score
                FROM job_postings 
                WHERE is_active = 1 
                AND ({' OR '.join(skill_conditions)})
                ORDER BY exp_score DESC, created_at DESC
                LIMIT 30
            """
            params = [experience_level, str(int(experience_level) + 24)]
        else:
            # Fallback to general search if no skill conditions were generated
            query = """
                SELECT id, job_title, company, location, salary_range, description,
                       industry, sector, job_type, employment_type, experience_required, 
                       skills_required, posted_date, application_deadline, tags, source, 
                       is_active, created_at, title, company_contact, pay, apply_url,
                       1 as exp_score
                FROM job_postings 
                WHERE is_active = 1
                ORDER BY created_at DESC 
                LIMIT 15
            """
            params = []
        
    else:
        # Default query for diverse recent jobs when no specific input
        query = """
            SELECT id, job_title, company, location, salary_range, description,
                   industry, sector, job_type, employment_type, experience_required, 
                   skills_required, posted_date, application_deadline, tags, source, 
                   is_active, created_at, title, company_contact, pay, apply_url,
                   1 as exp_score
            FROM job_postings 
            WHERE is_active = 1
            AND industry IS NOT NULL
            ORDER BY 
                CASE 
                    WHEN industry IN ('Information Technology', 'Software', 'Healthcare', 'Education', 'Finance') THEN 1
                    ELSE 0
                END DESC,
                created_at DESC 
            LIMIT 15
        """
        params = []
    
    cursor.execute(query, params)
    jobs = cursor.fetchall()
    conn.close()
    
    if jobs:
        # Score and rank jobs based on relevance with diversity
        scored_jobs = []
        for job in jobs:
            score = 0
            # Convert job (which may be a Row or tuple) to a dict for string indices
            if isinstance(job, dict):
                job_title_lower = (job.get("job_title") or "").lower()
                description_lower = (job.get("description") or "").lower()
                industry_lower = (job.get("industry") or "").lower()
                tags_lower = (job.get("tags") or "").lower()
            else:
                # fallback for tuple/Row with known indices
                job_title_lower = (job[1] or "").lower()
                description_lower = (job[5] or "").lower()
                industry_lower = (job[6] or "").lower()
                tags_lower = (job[14] or "").lower()
            job_text = f"{job_title_lower} {description_lower} {industry_lower} {tags_lower}"
            
            # Direct exact phrase matching gets highest score
            if user_text in job_text:
                score += 20
            
            # Score based on individual user input keywords
            for word in user_words:
                if word in job_text:
                    score += 5
            
            # Boost for exact job title matches
            if any(word in job_title_lower for word in user_words):
                score += 10

            # Boost for matching category keywords
            for cat in user_categories:
                for keyword in skill_keywords.get(cat, []):
                    if keyword in job_text:
                        score += 2
            
            # Negative score for mismatches
            if "analyst" in user_categories and "delivery" in job_title_lower:
                score -= 10
            if "delivery" in user_categories and "analyst" in job_title_lower:
                score -= 10

            scored_jobs.append((score, job))
        
        # Sort by score and get best jobs
        scored_jobs.sort(key=lambda x: x[0], reverse=True)
        
        # Remove duplicates by job_title and company
        seen_jobs = set()
        unique_scored_jobs = []
        for score, job in scored_jobs:
            if isinstance(job, dict):
                job_title = job.get("job_title")
                company = job.get("company")
            else:
                job_title = job[1] if len(job) > 1 else None
                company = job[2] if len(job) > 2 else None
            job_key = (job_title, company)
            if job_key not in seen_jobs:
                seen_jobs.add(job_key)
                unique_scored_jobs.append((score, job))
        
        # Filter out jobs with a score of 0 unless we have very few results
        final_jobs = [job for score, job in unique_scored_jobs if score > 0]
        if len(final_jobs) < 5:
             final_jobs = [job for score, job in unique_scored_jobs][:10]


        if not final_jobs:
            return {"best_job": None, "alternative_jobs": [], "message": "No relevant jobs found. Please try a different search."}

        best_job_data = unique_scored_jobs[0]
        best_job_formatted = format_job_response(best_job_data[1], best_job_data[0])

        alternative_jobs_formatted = [
            format_job_response(job_data["job"], job_data["score"]) if isinstance(job_data, dict)
            else format_job_response(job_data[1], job_data[0])
            for job_data in unique_scored_jobs[1:6]
        ]
        
        return {
            "best_job": best_job_formatted,
            "alternative_jobs": alternative_jobs_formatted
        }
    else:
        return {"best_job": None, "alternative_jobs": [], "message": "No matching jobs found. Try different keywords or check back later for new opportunities."}

@router.post("/recommend-job-simple") 
async def simple_recommend_job(user_info: UserInfo):
    """
    Simple job recommendation without external AI services
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # Extract keywords from user info
    user_text = user_info.user_info.lower()
    keywords = []
    
    # Check for common job-related keywords
    if any(word in user_text for word in ['software', 'developer', 'programming', 'coding', 'python', 'java', 'web']):
        keywords.append('Software')
    if any(word in user_text for word in ['sales', 'marketing', 'business']):
        keywords.append('Sales')
    if any(word in user_text for word in ['teacher', 'education', 'tutor']):
        keywords.append('Education')
    if any(word in user_text for word in ['nurse', 'doctor', 'medical', 'healthcare']):
        keywords.append('Healthcare')
    if any(word in user_text for word in ['engineer', 'technical', 'mechanical']):
        keywords.append('Engineering')
    
    # Build query based on keywords
    if keywords:
        keyword_conditions = " OR ".join([f"job_title LIKE '%{keyword}%' OR industry LIKE '%{keyword}%'" for keyword in keywords])
        query = f"""
            SELECT id, job_title, company, location, salary_range, description,
                   industry, sector, job_type, employment_type, experience_required, 
                   skills_required, posted_date, application_deadline, tags, source, 
                   is_active, created_at, title, company_contact, pay
            FROM job_postings 
            WHERE is_active = 1 AND ({keyword_conditions})
            ORDER BY created_at DESC 
            LIMIT 1
        """
    else:
        # Default to recent jobs
        query = """
            SELECT id, job_title, company, location, salary_range, description,
                   industry, sector, job_type, employment_type, experience_required, 
                   skills_required, posted_date, application_deadline, tags, source, 
                   is_active, created_at, title, company_contact, pay
            FROM job_postings 
            WHERE is_active = 1
            ORDER BY created_at DESC 
            LIMIT 1
        """
    
    cursor.execute(query)
    job = cursor.fetchone()
    conn.close()
    
    if job:
        # Use string indices (dict-style access) for job row if cursor.row_factory is set to sqlite3.Row
        return {
            "best_job": {
                "id": job["id"],
                "job_title": job["job_title"] or job.get("title"),
                "company_name": job["company"] or job.get("company"),
                "location": job["location"],
                "salary_range": job["salary_range"] or job.get("pay"),
                "description": job["description"][:500] + "..." if len(job["description"]) > 500 else job["description"],
                "industry": job["industry"],
                "sector": job["sector"],
                "job_type": job["job_type"],
                "employment_type": job["employment_type"],
                "experience_required": job["experience_required"],
                "skills_required": json.loads(job["skills_required"]) if job["skills_required"] else [],
                "source": job["source"],
                "created_at": job["created_at"]
            }
        }
    else:
        return {"best_job": None, "message": "No matching jobs found"}

@router.get("/jobs/industries")
async def get_job_industries():
    """Get all available job industries"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT industry, COUNT(*) as count FROM job_postings WHERE industry IS NOT NULL AND is_active = 1 GROUP BY industry ORDER BY count DESC")
    industries = cursor.fetchall()

    conn.close()

    return [
        {
            "industry": industry["industry"],
            "count": industry["count"]
        }
        for industry in industries
    ]

@router.get("/jobs/locations")
async def get_job_locations():
    """Get all available job locations"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT location, COUNT(*) as count FROM job_postings WHERE location IS NOT NULL AND is_active = 1 GROUP BY location ORDER BY count DESC LIMIT 50")
    locations = cursor.fetchall()

    conn.close()

    return [
        {
            "location": location["location"],
            "count": location["count"]
        }
        for location in locations
    ]

@router.get("/jobs/sectors")
async def get_job_sectors():
    """Get all available job sectors"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT sector, COUNT(*) as count FROM job_postings WHERE sector IS NOT NULL AND is_active = 1 GROUP BY sector ORDER BY count DESC")
    sectors = cursor.fetchall()

    conn.close()

    return [
        {
            "sector": sector["sector"],
            "count": sector["count"]
        }
        for sector in sectors
    ]

@router.get("/jobs/stats")
async def get_job_statistics():
    """Get overall job statistics"""
    conn = get_db()
    cursor = conn.cursor()

    # Total jobs
    cursor.execute("SELECT COUNT(*) as total FROM job_postings WHERE is_active = 1")
    total_jobs_row = cursor.fetchone()
    if isinstance(total_jobs_row, dict):
        total_jobs = total_jobs_row.get("total")
    else:
        total_jobs = total_jobs_row[0]

    # Jobs by experience level
    cursor.execute("SELECT experience_required, COUNT(*) as count FROM job_postings WHERE is_active = 1 GROUP BY experience_required ORDER BY experience_required")
    exp_levels = cursor.fetchall()

    # Top industries
    cursor.execute("SELECT industry, COUNT(*) as count FROM job_postings WHERE industry IS NOT NULL AND is_active = 1 GROUP BY industry ORDER BY count DESC LIMIT 10")
    top_industries = cursor.fetchall()

    # Top locations
    cursor.execute("SELECT location, COUNT(*) as count FROM job_postings WHERE location IS NOT NULL AND is_active = 1 GROUP BY location ORDER BY count DESC LIMIT 10")
    top_locations = cursor.fetchall()

    # Average salary from salary_range field (extract numeric values where possible)
    cursor.execute("SELECT salary_range FROM job_postings WHERE salary_range IS NOT NULL AND salary_range != '' AND is_active = 1")
    salary_ranges = cursor.fetchall()
    
    # Try to extract average salary from salary_range strings
    total_salary = 0
    salary_count = 0
    import re
    for salary_range in salary_ranges:
        if isinstance(salary_range, dict):
            salary_str = salary_range.get("salary_range")
        else:
            salary_str = salary_range[0]
        if not salary_str:
            continue
        # Try to extract numbers from salary strings
        numbers = re.findall(r'\d+', salary_str.replace(',', ''))
        if numbers:
            try:
                if len(numbers) >= 2:
                    # If we have a range like "30,000 - 50,000"
                    avg_for_this_job = (int(numbers[0]) + int(numbers[1])) / 2
                else:
                    # If we have a single number
                    avg_for_this_job = int(numbers[0])
                total_salary += avg_for_this_job
                salary_count += 1
            except ValueError:
                continue
    
    avg_salary = total_salary / salary_count if salary_count > 0 else None

    conn.close()

    def get_val(row, key, idx):
        if isinstance(row, dict):
            return row.get(key)
        else:
            return row[idx]

    return {
        "total_jobs": total_jobs,
        "experience_levels": [
            {
                "experience_required": get_val(exp, "experience_required", 0),
                "count": get_val(exp, "count", 1)
            }
            for exp in exp_levels
        ],
        "top_industries": [
            {
                "industry": get_val(ind, "industry", 0),
                "count": get_val(ind, "count", 1)
            }
            for ind in top_industries
        ],
        "top_locations": [
            {
                "location": get_val(loc, "location", 0),
                "count": get_val(loc, "count", 1)
            }
            for loc in top_locations
        ],
        "average_salary": round(avg_salary, 2) if avg_salary else None
    }
