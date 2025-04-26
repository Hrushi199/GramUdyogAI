from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3

router = APIRouter()

class JobPosting(BaseModel):
    title: str
    description: str
    company: str
    location: str
    company_contact: str
    pay: str

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