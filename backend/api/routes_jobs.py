from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3

router = APIRouter()

class JobPosting(BaseModel):
    title: str
    description: str
    company: str
    location: str

def create_jobs_table():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_postings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

create_jobs_table()

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