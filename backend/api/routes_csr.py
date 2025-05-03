from fastapi import APIRouter, HTTPException
from models.csr_course import CSRCourse, CourseEnrollment, EnrollmentStatus
import sqlite3
from typing import List
from datetime import datetime
from core.llm_recommendations import get_course_recommendations
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def get_db():
    return sqlite3.connect('database.db')

# Company Routes
@router.post("/courses")
async def create_course(course: CSRCourse):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO csr_courses 
            (company_id, title, description, skills, duration, language,
             certification, max_seats, start_date, status, content_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            course.company_id, course.title, course.description,
            ','.join(course.skills), course.duration, course.language,
            course.certification, course.max_seats, course.start_date,
            course.status, course.content_url, course.created_at, course.updated_at
        ))
        conn.commit()
        course.id = c.lastrowid
        return course.dict()
    except sqlite3.Error as e:
        logger.error(f"Database error creating course: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

@router.get("/courses/{course_id}")
async def get_course(course_id: int):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('SELECT * FROM csr_courses WHERE id = ?', (course_id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course = dict(zip([col[0] for col in c.description], row))
        course['skills'] = course['skills'].split(',')
        return course
    finally:
        conn.close()

@router.get("/courses/company/{company_id}")
async def get_company_courses(company_id: int):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('SELECT * FROM csr_courses WHERE company_id = ?', (company_id,))
        rows = c.fetchall()
        courses = []
        for row in rows:
            course = dict(zip([col[0] for col in c.description], row))
            course['skills'] = course['skills'].split(',')
            courses.append(course)
        return courses
    finally:
        conn.close()

@router.put("/courses/{course_id}")
async def update_course(course_id: int, course: CSRCourse):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE csr_courses SET
            title = ?, description = ?, skills = ?, duration = ?,
            language = ?, certification = ?, max_seats = ?,
            start_date = ?, status = ?, content_url = ?, updated_at = ?
            WHERE id = ?
        ''', (
            course.title, course.description, ','.join(course.skills),
            course.duration, course.language, course.certification,
            course.max_seats, course.start_date, course.status,
            course.content_url, datetime.now().isoformat(), course_id
        ))
        conn.commit()
        if c.rowcount == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        return {"message": "Course updated successfully"}
    except sqlite3.Error as e:
        logger.error(f"Database error updating course {course_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

@router.get("/courses")
async def get_all_courses():
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('SELECT * FROM csr_courses')
        rows = c.fetchall()
        courses = []
        for row in rows:
            course = dict(zip([col[0] for col in c.description], row))
            course['skills'] = course['skills'].split(',')
            courses.append(course)
        return courses
    finally:
        conn.close()

@router.get("/enrollments")
async def get_all_enrollments():
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('SELECT * FROM course_enrollments')
        rows = c.fetchall()
        enrollments = []
        for row in rows:
            enrollment = dict(zip([col[0] for col in c.description], row))
            enrollments.append(enrollment)
        return enrollments
    finally:
        conn.close()

# User/Student Routes
@router.post("/courses/{course_id}/enroll")
async def enroll_course(course_id: int, enrollment: CourseEnrollment):
    conn = get_db()
    c = conn.cursor()
    try:
        # Check if course exists
        c.execute('SELECT max_seats FROM csr_courses WHERE id = ?', (course_id,))
        course = c.fetchone()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        max_seats = course[0]
        
        # Check if seats are available
        c.execute('''
            SELECT COUNT(id) as enrolled
            FROM course_enrollments
            WHERE course_id = ? AND status != ?
        ''', (course_id, EnrollmentStatus.REJECTED))
        
        enrolled = c.fetchone()[0]
        if enrolled >= max_seats:
            raise HTTPException(status_code=400, detail="No seats available")

        # Check if user exists
        c.execute('SELECT id FROM user_profiles WHERE id = ?', (enrollment.user_id,))
        if not c.fetchone():
            raise HTTPException(status_code=422, detail="Invalid user_id")

        # Check if user is already enrolled
        c.execute('''
            SELECT id FROM course_enrollments 
            WHERE course_id = ? AND user_id = ?
        ''', (course_id, enrollment.user_id))
        if c.fetchone():
            raise HTTPException(status_code=400, detail="User already enrolled")

        # Create enrollment
        c.execute('''
            INSERT INTO course_enrollments 
            (course_id, user_id, status, progress, feedback, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            course_id, enrollment.user_id, enrollment.status.value,
            enrollment.progress, enrollment.feedback, enrollment.created_at, enrollment.updated_at
        ))
        conn.commit()
        enrollment.id = c.lastrowid
        return enrollment.dict()
    except sqlite3.IntegrityError as e:
        logger.error(f"Integrity error enrolling in course {course_id}: {str(e)}")
        raise HTTPException(status_code=422, detail="Invalid course_id or user_id")
    except Exception as e:
        logger.error(f"Error enrolling in course {course_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

@router.post("/courses/{course_id}/complete")
async def complete_course(course_id: int, enrollment: CourseEnrollment):
    conn = get_db()
    c = conn.cursor()
    try:
        # Check if enrollment exists
        c.execute('''
            SELECT id FROM course_enrollments 
            WHERE course_id = ? AND user_id = ?
        ''', (course_id, enrollment.user_id))
        enrollment_id = c.fetchone()
        if not enrollment_id:
            raise HTTPException(status_code=404, detail="Enrollment not found")

        # Update enrollment status to completed
        c.execute('''
            UPDATE course_enrollments 
            SET status = ?, progress = ?, updated_at = ?
            WHERE id = ?
        ''', (
            EnrollmentStatus.COMPLETED.value, 100,
            enrollment.updated_at, enrollment_id[0]
        ))
        conn.commit()
        if c.rowcount == 0:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        return {"message": "Course marked as completed"}
    except sqlite3.Error as e:
        logger.error(f"Database error completing course {course_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()

@router.get("/courses/recommended/{user_id}")
async def get_recommended_courses(user_id: int):
    conn = get_db()
    c = conn.cursor()
    try:
        # Get user profile
        c.execute('SELECT * FROM user_profiles WHERE id = ?', (user_id,))
        user = c.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_dict = dict(zip([col[0] for col in c.description], user))
        
        # Get active courses
        c.execute('SELECT * FROM csr_courses WHERE status = "active"')
        courses = c.fetchall()
        courses = [dict(zip([col[0] for col in c.description], row)) for row in courses]
        for course in courses:
            course['skills'] = course['skills'].split(',')
        
        # Use LLM to get personalized recommendations
        recommended = await get_course_recommendations(user_dict, courses)
        return recommended
    finally:
        conn.close()

# Admin Routes 
@router.put("/courses/{course_id}/status")
async def update_course_status(course_id: int, status: str):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE csr_courses 
            SET status = ?, updated_at = ?
            WHERE id = ?
        ''', (status, datetime.now().isoformat(), course_id))
        conn.commit()
        if c.rowcount == 0:
            raise HTTPException(status_code=404, detail="Course not found")
        return {"message": "Course status updated successfully"}
    except sqlite3.Error as e:
        logger.error(f"Database error updating course status {course_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()