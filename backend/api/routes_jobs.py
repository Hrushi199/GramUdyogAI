from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3

router = APIRouter()

class JobPosting(BaseModel):
    title: str
    description: str
    company: str
    location: str

@router.post("/jobs")
async def create_job(job: JobPosting):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO job_postings (title, description, company, location)
        VALUES (?, ?, ?, ?)
    """, (job.title, job.description, job.company, job.location))

    conn.commit()
    conn.close()

    return {"message": "Job posted successfully"}

@router.get("/jobs")
async def get_jobs():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("SELECT id, title, description, company, location, created_at FROM job_postings ORDER BY created_at DESC")
    jobs = cursor.fetchall()

    conn.close()

    return [
        {
            "id": job[0],
            "title": job[1],
            "description": job[2],
            "company": job[3],
            "location": job[4],
            "created_at": job[5]
        }
        for job in jobs
    ]