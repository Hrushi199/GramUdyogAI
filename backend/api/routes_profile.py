from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import sqlite3
from datetime import datetime

router = APIRouter()

class UserProfile(BaseModel):
    name: str
    location: str
    district: str
    state: str
    language: str
    skills: List[str]
    jobTypes: List[str]
    needMentor: bool

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            district TEXT,
            state TEXT,
            language TEXT,
            skills TEXT,
            job_types TEXT,
            need_mentor BOOLEAN,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
init_db()
@router.post("/users/profile")
async def create_profile(profile: UserProfile):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        skills = ','.join(profile.skills)
        job_types = ','.join(profile.jobTypes)
        
        cursor.execute('''
            INSERT INTO user_profiles (
                name, location, district, state, language,
                skills, job_types, need_mentor, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            profile.name,
            profile.location,
            profile.district,
            profile.state,
            profile.language,
            skills,
            job_types,
            profile.needMentor,
            datetime.now(),
            datetime.now()
        ))
        
        conn.commit()
        profile_id = cursor.lastrowid
        conn.close()
        
        return {"message": "Profile created successfully", "profile_id": profile_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/profile/{profile_id}")
async def get_profile(profile_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        result = cursor.execute(
            'SELECT * FROM user_profiles WHERE id = ?',
            (profile_id,)
        ).fetchone()
        
        if result is None:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        profile_dict = dict(result)
        profile_dict['skills'] = profile_dict['skills'].split(',') if profile_dict['skills'] else []
        profile_dict['job_types'] = profile_dict['job_types'].split(',') if profile_dict['job_types'] else []
        
        return profile_dict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/profile")
async def get_latest_profile():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        result = cursor.execute(
            'SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1'
        ).fetchone()
        conn.close()
        if result is None:
            return {}
        profile_dict = dict(result)
        profile_dict['skills'] = profile_dict['skills'].split(',') if profile_dict['skills'] else []
        profile_dict['job_types'] = profile_dict['job_types'].split(',') if profile_dict['job_types'] else []
        return profile_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/profile/{profile_id}")
async def update_profile(profile_id: int, profile: UserProfile):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        skills = ','.join(profile.skills)
        job_types = ','.join(profile.jobTypes)
        
        cursor.execute('''
            UPDATE user_profiles 
            SET name=?, location=?, district=?, state=?, language=?,
                skills=?, job_types=?, need_mentor=?, updated_at=?
            WHERE id=?
        ''', (
            profile.name,
            profile.location,
            profile.district,
            profile.state,
            profile.language,
            skills,
            job_types,
            profile.needMentor,
            datetime.now(),
            profile_id
        ))
        
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
