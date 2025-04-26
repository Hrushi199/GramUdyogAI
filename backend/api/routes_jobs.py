from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
from core.job_recommender import *
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

@router.post("/jobs")
async def create_job(job: JobPosting):
    conn = sqlite3.connect("database.db")
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
    conn = sqlite3.connect("database.db")
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

@router.post("/recommend-job")
async def recommend_job(user_info: UserInfo):
    """
    Recommend the best job for a user based on their information.
    """
    try:
        all_job_names = get_all_job_names()
        relevant_job_names = get_relevant_jobs(user_info.user_info, all_job_names)
        relevant_jobs = load_selected_jobs(relevant_job_names)
        best_job = find_best_job(user_info.user_info, relevant_jobs)
        return {"best_job": best_job}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))