from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
from core.job_recommender import *
from init_db import get_db
from core.translation import llama_translate_string as translate_text
router = APIRouter()

class JobPosting(BaseModel):
    title: str
    description: str
    company: str
    location: str
    company_contact: str
    pay: str

class UserInfo(BaseModel):
    user_info: str  # Input from the user for job recommendation

def create_jobs_table():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_postings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            company_contact TEXT NOT NULL,
            pay TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

create_jobs_table()

@router.post("/jobs")
async def create_job(job: JobPosting):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO job_postings (title, description, company, location, company_contact, pay)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (job.title, job.description, job.company, job.location, job.company_contact, job.pay))

    conn.commit()
    conn.close()

    return {"message": "Job posted successfully"}

@router.get("/jobs")
async def get_jobs():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, title, description, company, location, company_contact, pay, created_at FROM job_postings ORDER BY created_at DESC")
    jobs = cursor.fetchall()

    conn.close()

    return [
        {
            "id": job[0],
            "title": job[1],
            "description": job[2],
            "company": job[3],
            "location": job[4],
            "company_contact": job[5],
            "pay": job[6],
            "created_at": job[7]
        }
        for job in jobs
    ]

@router.get("/jobs/{job_id}")
async def get_job_by_id(job_id: int):
    """Get a specific job by ID"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, title, description, company, location, company_contact, pay, created_at FROM job_postings WHERE id = ?", (job_id,))
    job = cursor.fetchone()

    conn.close()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job[0],
        "title": job[1],
        "description": job[2],
        "company": job[3],
        "location": job[4],
        "company_contact": job[5],
        "pay": job[6],
        "created_at": job[7]
    }

@router.put("/jobs/{job_id}")
async def update_job(job_id: int, job_update: JobPosting):
    """Update a job posting"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE job_postings 
        SET title = ?, description = ?, company = ?, location = ?, company_contact = ?, pay = ?
        WHERE id = ?
    """, (job_update.title, job_update.description, job_update.company, job_update.location, job_update.company_contact, job_update.pay, job_id))

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
    Recommend the best job for a user based on their information.
    """
    try:
        all_job_names = await get_all_job_names()
        relevant_job_names = await get_relevant_jobs(user_info.user_info, all_job_names)
        print('Got relevant job names:', relevant_job_names)
        relevant_jobs = await load_selected_jobs(relevant_job_names.get('relevant_jobs', []) if isinstance(relevant_job_names, dict) else relevant_job_names)
        best_job = await find_best_job(user_info.user_info, relevant_jobs)
        print(best_job)
        return {"best_job": best_job}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
