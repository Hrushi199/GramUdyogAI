from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from core.job_recommender import *
from init_db import get_db
from core.translation import llama_translate_string as translate_text
from typing import Optional, List
import json

router = APIRouter()

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
        INSERT INTO job_postings (title, description, company, location, company_contact, pay, job_title, company_name, salary_range, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (job.title, job.description, job.company, job.location, job.company_contact, job.pay, job.title, job.company, job.pay, True))

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
            job_title, company_name, location, salary_range, description,
            industry, sector, job_type, experience_required, employment_type,
            skills_required, is_active, title, company_contact, pay, company
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job.job_title, job.company_name, job.location, job.salary_range, job.description,
        job.industry, job.sector, job.job_type, job.experience_required, job.employment_type,
        json.dumps(job.skills_required), job.is_active,
        job.job_title, "Contact via apply_url", job.salary_range, job.company_name
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
        SELECT id, job_title, company_name, location, salary_range, description,
               industry, sector, job_type, employment_type, experience_required, 
               skills_required, posted_date, application_deadline, tags, source, 
               is_active, created_at, title, company, company_contact, pay, apply_url
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
                "id": job[0],
                "job_title": job[1] or job[18],  # job_title or title (legacy)
                "company_name": job[2] or job[19],  # company_name or company (legacy)
                "location": job[3],
                "salary_range": job[4] or job[21],  # salary_range or pay (legacy)
                "description": job[5],
                "industry": job[6],
                "sector": job[7],
                "job_type": job[8],
                "employment_type": job[9],
                "experience_required": job[10],
                "skills_required": json.loads(job[11]) if job[11] else [],
                "posted_date": job[12],
                "application_deadline": job[13],
                "tags": json.loads(job[14]) if job[14] else [],
                "source": job[15],
                "is_active": job[16],
                "created_at": job[17],
                "apply_url": job[22],
                # Legacy fields for backward compatibility
                "title": job[1] or job[18],
                "company": job[2] or job[19],
                "company_contact": job[20],
                "pay": job[4] or job[21]
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
        SELECT id, job_title, company_name, location, salary_range, description,
               industry, sector, job_type, employment_type, experience_required, 
               skills_required, posted_date, application_deadline, tags, source, 
               is_active, created_at, title, company, company_contact, pay, apply_url
        FROM job_postings 
        WHERE is_active = 1
    """
    
    conditions = []
    params = []
    
    if query:
        conditions.append("(job_title LIKE ? OR title LIKE ? OR company LIKE ? OR description LIKE ?)")
    params = []
    
    if query:
        conditions.append("(job_title LIKE ? OR description LIKE ? OR title LIKE ? OR company_name LIKE ? OR company LIKE ?)")
        search_term = f"%{query}%"
        params.extend([search_term, search_term, search_term, search_term, search_term])
    
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
                "id": job[0],
                "job_title": job[1] or job[18],
                "company_name": job[2] or job[19],
                "location": job[3],
                "salary_range": job[4] or job[21],
                "description": job[5],
                "industry": job[6],
                "sector": job[7],
                "job_type": job[8],
                "employment_type": job[9],
                "experience_required": job[10],
                "skills_required": json.loads(job[11]) if job[11] else [],
                "posted_date": job[12],
                "application_deadline": job[13],
                "tags": json.loads(job[14]) if job[14] else [],
                "source": job[15],
                "is_active": job[16],
                "created_at": job[17],
                "apply_url": job[22],
                # Legacy fields for backward compatibility
                "title": job[1] or job[18],
                "company": job[2] or job[19],
                "company_contact": job[20],
                "pay": job[4] or job[21]
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
        SELECT id, job_title, company_name, location, salary_range, description,
               industry, sector, job_type, employment_type, experience_required, 
               skills_required, posted_date, application_deadline, tags, source, 
               is_active, created_at, title, company, company_contact, pay
        FROM job_postings WHERE id = ?
    """, (job_id,))
    job = cursor.fetchone()

    conn.close()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job[0],
        "job_title": job[1] or job[18],
        "company_name": job[2] or job[19],
        "location": job[3],
        "salary_range": job[4] or job[21],
        "description": job[5],
        "industry": job[6],
        "sector": job[7],
        "job_type": job[8],
        "employment_type": job[9],
        "experience_required": job[10],
        "skills_required": json.loads(job[11]) if job[11] else [],
        "posted_date": job[12],
        "application_deadline": job[13],
        "tags": json.loads(job[14]) if job[14] else [],
        "source": job[15],
        "is_active": job[16],
        "created_at": job[17],
        # Legacy fields for backward compatibility
        "title": job[1] or job[18],
        "company": job[2] or job[19],
        "company_contact": job[20],
        "pay": job[4] or job[21]
    }

@router.put("/jobs/{job_id}")
async def update_job(job_id: int, job_update: SkillIndiaJob):
    """Update a job posting"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE job_postings 
        SET job_title = ?, description = ?, company_name = ?, location = ?, 
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
    Smart job recommendation using advanced keyword matching and scoring
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
                SELECT id, job_title, company_name, location, salary_range, description,
                       industry, sector, job_type, employment_type, experience_required, 
                       skills_required, posted_date, application_deadline, tags, source, 
                       is_active, created_at, title, company, company_contact, pay, apply_url,
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
                SELECT id, job_title, company_name, location, salary_range, description,
                       industry, sector, job_type, employment_type, experience_required, 
                       skills_required, posted_date, application_deadline, tags, source, 
                       is_active, created_at, title, company, company_contact, pay, apply_url,
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
            SELECT id, job_title, company_name, location, salary_range, description,
                   industry, sector, job_type, employment_type, experience_required, 
                   skills_required, posted_date, application_deadline, tags, source, 
                   is_active, created_at, title, company, company_contact, pay, apply_url,
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
        
        # Remove duplicates by job_title and company_name
        seen_jobs = set()
        unique_scored_jobs = []
        for score, job in scored_jobs:
            job_key = (job[1] or job[18], job[2] or job[19])  # (job_title, company_name)
            if job_key not in seen_jobs:
                seen_jobs.add(job_key)
                unique_scored_jobs.append((score, job))
        
        # Filter out jobs with a score of 0 unless we have very few results
        final_jobs = [job for score, job in unique_scored_jobs if score > 0]
        if len(final_jobs) < 5:
             final_jobs = [job for score, job in unique_scored_jobs][:10]


        if not final_jobs:
            return {"best_job": None, "alternative_jobs": [], "message": "No relevant jobs found. Please try a different search."}

        # Prepare response
        def format_job(job_data, score=0):
            return {
                "id": job_data[0],
                "job_title": job_data[1] or job_data[18],
                "company_name": job_data[2] or job_data[19],
                "location": job_data[3],
                "salary_range": job_data[4] or job_data[21],
                "description": job_data[5][:250] + "..." if job_data[5] and len(job_data[5]) > 250 else job_data[5],
                "industry": job_data[6],
                "sector": job_data[7],
                "job_type": job_data[8],
                "employment_type": job_data[9],
                "experience_required": job_data[10],
                "skills_required": json.loads(job_data[11]) if job_data[11] and job_data[11] != "null" else [],
                "source": job_data[15],
                "apply_url": job_data[22],
                "relevance_score": score,
                "debug_info": f"Query: '{user_text}', Score: {score}"
            }

        best_job_data = unique_scored_jobs[0]
        best_job_formatted = format_job(best_job_data[1], best_job_data[0])

        alternative_jobs_formatted = [
            format_job(job_data[1], job_data[0]) for job_data in unique_scored_jobs[1:6]
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
            SELECT id, job_title, company_name, location, salary_range, description,
                   industry, sector, job_type, employment_type, experience_required, 
                   skills_required, posted_date, application_deadline, tags, source, 
                   is_active, created_at, title, company, company_contact, pay
            FROM job_postings 
            WHERE is_active = 1 AND ({keyword_conditions})
            ORDER BY created_at DESC 
            LIMIT 1
        """
    else:
        # Default to recent jobs
        query = """
            SELECT id, job_title, company_name, location, salary_range, description,
                   industry, sector, job_type, employment_type, experience_required, 
                   skills_required, posted_date, application_deadline, tags, source, 
                   is_active, created_at, title, company, company_contact, pay
            FROM job_postings 
            WHERE is_active = 1
            ORDER BY created_at DESC 
            LIMIT 1
        """
    
    cursor.execute(query)
    job = cursor.fetchone()
    conn.close()
    
    if job:
        return {
            "best_job": {
                "id": job[0],
                "job_title": job[1] or job[18],
                "company_name": job[2] or job[19],
                "location": job[3],
                "salary_range": job[4] or job[21],
                "description": job[5][:500] + "..." if len(job[5]) > 500 else job[5],
                "industry": job[6],
                "sector": job[7],
                "job_type": job[8],
                "employment_type": job[9],
                "experience_required": job[10],
                "skills_required": json.loads(job[11]) if job[11] else [],
                "source": job[15],
                "created_at": job[17]
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
            "industry": industry[0],
            "count": industry[1]
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
            "location": location[0],
            "count": location[1]
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
            "sector": sector[0],
            "count": sector[1]
        }
        for sector in sectors
    ]

@router.get("/jobs/stats")
async def get_job_statistics():
    """Get overall job statistics"""
    conn = get_db()
    cursor = conn.cursor()

    # Total jobs
    cursor.execute("SELECT COUNT(*) FROM job_postings WHERE is_active = 1")
    total_jobs = cursor.fetchone()[0]

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
    for salary_range in salary_ranges:
        salary_str = salary_range[0]
        # Try to extract numbers from salary strings
        import re
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

    return {
        "total_jobs": total_jobs,
        "experience_levels": [{"experience_required": exp[0], "count": exp[1]} for exp in exp_levels],
        "top_industries": [{"industry": ind[0], "count": ind[1]} for ind in top_industries],
        "top_locations": [{"location": loc[0], "count": loc[1]} for loc in top_locations],
        "average_salary": round(avg_salary, 2) if avg_salary else None
    }
