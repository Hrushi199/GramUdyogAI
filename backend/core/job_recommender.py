import json
from typing import List, Dict, Optional
from groq import Groq
from dotenv import load_dotenv, find_dotenv
import os
import sqlite3
from pydantic import BaseModel

# Load environment variables from the .env file
# load_dotenv(find_dotenv())
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

DATABASE_PATH = "gramudyogai.db"  # Path to your SQLite database


# Pydantic Models for Validation
class JobDetails(BaseModel):
    id: int
    job_title: str
    description: str
    company_name: str
    location: str
    salary_range: str
    industry: Optional[str]
    sector: Optional[str]
    job_type: Optional[str]
    employment_type: Optional[str]
    experience_required: Optional[str]
    skills_required: Optional[List[str]]
    created_at: Optional[str]  # Made optional to handle missing field


class JobRecommendationResponse(BaseModel):
    best_job: JobDetails


async def get_all_job_names() -> List[str]:
    """
    Fetch all job names from the database.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT COALESCE(job_title, title) FROM job_postings WHERE is_active = 1 LIMIT 20")
    job_names = [row[0] for row in cursor.fetchall()]

    conn.close()
    return job_names


async def get_relevant_jobs(user_info: str, job_names: List[str]) -> List[str]:
    """
    Use Groq to select the most relevant jobs for the user based on their information.
    """
    prompt = (
        f"You are helping a user find the best job based on their information: '{user_info}'.\n\n"
        f"Below is a list of available job titles:\n"
        f"{json.dumps(job_names, indent=2)}\n\n"
        f"From this list, STRICTLY select only 3 jobs that are most relevant to the user's information.\n\n"
        f"Important instructions:\n"
        f"- ONLY select jobs from the provided list.\n"
        f"- DO NOT suggest new jobs or modify job titles.\n"
        f"- The names in your response MUST match exactly how they appear in the original list (case-sensitive, no typos, no changes).\n"
        f"- Return only the names of the 3 relevant jobs strictly as a JSON list, with key 'relevant_jobs'.\n"
    )
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a smart assistant that selects relevant jobs based on user information. Respond only with a JSON list of job titles from the provided list, without any modifications."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except:
        return []


async def load_selected_jobs(selected_names: List[str]) -> List[Dict]:
    """
    Load the details of the selected jobs from the database.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    placeholders = ",".join("?" for _ in selected_names)
    query = f"""
        SELECT id, COALESCE(job_title, title) as job_title, description, 
               COALESCE(company_name, company) as company_name, location, 
               COALESCE(salary_range, pay) as salary_range, 
               created_at, industry, sector, job_type, employment_type, 
               experience_required, skills_required
        FROM job_postings 
        WHERE (job_title IN ({placeholders}) OR title IN ({placeholders})) AND is_active = 1
    """
    cursor.execute(query, selected_names + selected_names)  # Double the params for both conditions
    rows = cursor.fetchall()

    conn.close()

    jobs = [
        {
            "id": row[0],
            "job_title": row[1],
            "title": row[1],  # For backward compatibility
            "description": row[2][:500] + "..." if len(row[2]) > 500 else row[2],  # Limit description length
            "company_name": row[3],
            "company": row[3],  # For backward compatibility
            "location": row[4],
            "salary_range": row[5],
            "pay": row[5],  # For backward compatibility
            "created_at": row[6],
            "industry": row[7],
            "sector": row[8],
            "job_type": row[9],
            "employment_type": row[10],
            "experience_required": row[11],
            "skills_required": json.loads(row[12]) if row[12] else []
        }
        for row in rows
    ]

    return jobs


async def find_best_job(user_info: str, selected_jobs: List[Dict]) -> Dict:
    """
    Use simple keyword matching to find the best job instead of LLM
    """
    if not selected_jobs:
        return {}
    
    user_keywords = user_info.lower().split()
    best_job = None
    best_score = 0
    
    for job in selected_jobs:
        score = 0
        job_text = f"{job.get('job_title', '')} {job.get('description', '')} {job.get('industry', '')}".lower()
        
        # Score based on keyword matches
        for keyword in user_keywords:
            if keyword in job_text:
                score += 1
        
        # Boost score for exact matches in job title
        job_title = job.get('job_title', '').lower()
        for keyword in user_keywords:
            if keyword in job_title:
                score += 2
        
        if score > best_score:
            best_score = score
            best_job = job
    
    # If no keyword matches, return the first job
    if not best_job and selected_jobs:
        best_job = selected_jobs[0]
    
    return best_job or {}


