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

DATABASE_PATH = "database.db"  # Path to your SQLite database


# Pydantic Models for Validation
class JobDetails(BaseModel):
    id: int
    title: str
    description: str
    company: str
    location: str
    company_contact: str
    pay: str
    created_at: Optional[str]  # Made optional to handle missing field


class JobRecommendationResponse(BaseModel):
    best_job: JobDetails


async def get_all_job_names() -> List[str]:
    """
    Fetch all job names from the database.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT title FROM job_postings")
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
    cursor = conn.cursor()

    placeholders = ",".join("?" for _ in selected_names)
    query = f"SELECT id, title, description, company, location, company_contact, pay, created_at FROM job_postings WHERE title IN ({placeholders})"
    cursor.execute(query, selected_names)
    rows = cursor.fetchall()

    conn.close()

    jobs = [
        {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "company": row[3],
            "location": row[4],
            "company_contact": row[5],
            "pay": row[6],
            "created_at": row[7],
        }
        for row in rows
    ]
    return jobs


async def find_best_job(user_info: str, selected_jobs: List[Dict]) -> Dict:
    """
    Use Groq to find the best job from the selected relevant jobs.
    """
    prompt = (
        f"Based on the user's information: '{user_info}', find the best job from the following list of relevant jobs:\n\n"
        f"{json.dumps(selected_jobs, indent=2)}\n\n"
        f"Return the best job as a JSON object with all its details."
    )
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a JSON API that selects the best job for a user based on their information."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    content = response.choices[0].message.content
    try:
        # Validate the response using Pydantic
        best_job = JobDetails.model_validate_json(content)
        print(f"Best job found: {best_job}")
        return best_job.model_dump(mode="json")
    except Exception as e:
        print(f"Error parsing/validating JSON: {e}")
        print(f"Raw response: {content}")
        return {}


