from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from init_db import get_db
from core.translation import llama_translate_string as translate_text
from typing import Optional, List
import json

router = APIRouter()

class CourseCreate(BaseModel):
    name: str
    link: str
    category: Optional[str] = "General"
    skill_level: Optional[str] = "beginner"
    duration: Optional[str] = None
    provider: Optional[str] = "Skill India Digital"
    description: Optional[str] = None

class CourseEnrollment(BaseModel):
    course_id: int
    user_id: int
    status: Optional[str] = "enrolled"

class CourseSearchQuery(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    skill_level: Optional[str] = None
    provider: Optional[str] = None
    limit: Optional[int] = 20
    offset: Optional[int] = 0

@router.get("/courses")
async def get_courses(
    limit: int = Query(20, description="Number of courses to return"),
    offset: int = Query(0, description="Number of courses to skip"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skill_level: Optional[str] = Query(None, description="Filter by skill level")
):
    """Get all courses with optional filtering"""
    conn = get_db()
    cursor = conn.cursor()
    
    base_query = """
        SELECT id, name, link, category, skill_level, duration, provider, description, tags, source, is_active, created_at
        FROM courses
        WHERE is_active = 1
    """
    
    conditions = []
    params = []
    
    if category:
        conditions.append("category = ?")
        params.append(category)
    
    if skill_level:
        conditions.append("skill_level = ?")
        params.append(skill_level)
    
    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)
    
    base_query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(base_query, params)
    courses = cursor.fetchall()
    
    # Get total count
    count_query = "SELECT COUNT(*) FROM courses WHERE is_active = 1"
    if conditions:
        count_query += " AND " + " AND ".join(conditions)
    
    cursor.execute(count_query, params[:-2])  # Exclude limit and offset
    total_count = cursor.fetchone()[0]
    
    conn.close()

    return {
        "courses": [
            {
                "id": course[0],
                "name": course[1],
                "link": course[2],
                "category": course[3],
                "skill_level": course[4],
                "duration": course[5],
                "provider": course[6],
                "description": course[7],
                "tags": json.loads(course[8]) if course[8] else [],
                "source": course[9],
                "is_active": course[10],
                "created_at": course[11]
            }
            for course in courses
        ],
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }

@router.get("/courses/search")
async def search_courses(
    query: Optional[str] = Query(None, description="Search query for course name or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skill_level: Optional[str] = Query(None, description="Filter by skill level"),
    provider: Optional[str] = Query(None, description="Filter by provider"),
    limit: int = Query(20, description="Number of results to return"),
    offset: int = Query(0, description="Number of results to skip")
):
    """Advanced course search with filters"""
    conn = get_db()
    cursor = conn.cursor()
    
    base_query = """
        SELECT id, name, link, category, skill_level, duration, provider, description, tags, source, is_active, created_at
        FROM courses
        WHERE is_active = 1
    """
    
    conditions = []
    params = []
    
    if query:
        conditions.append("(name LIKE ? OR description LIKE ? OR tags LIKE ?)")
        search_term = f"%{query}%"
        params.extend([search_term, search_term, search_term])
    
    if category:
        conditions.append("category = ?")
        params.append(category)
    
    if skill_level:
        conditions.append("skill_level = ?")
        params.append(skill_level)
    
    if provider:
        conditions.append("provider LIKE ?")
        params.append(f"%{provider}%")
    
    if conditions:
        base_query += " AND " + " AND ".join(conditions)
    
    base_query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(base_query, params)
    courses = cursor.fetchall()
    
    # Get total count
    count_query = "SELECT COUNT(*) FROM courses WHERE is_active = 1"
    if conditions:
        count_query += " AND " + " AND ".join(conditions)
    
    cursor.execute(count_query, params[:-2])
    total_count = cursor.fetchone()[0]
    
    conn.close()

    return {
        "courses": [
            {
                "id": course[0],
                "name": course[1],
                "link": course[2],
                "category": course[3],
                "skill_level": course[4],
                "duration": course[5],
                "provider": course[6],
                "description": course[7],
                "tags": json.loads(course[8]) if course[8] else [],
                "source": course[9],
                "is_active": course[10],
                "created_at": course[11]
            }
            for course in courses
        ],
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }

@router.get("/courses/{course_id}")
async def get_course_by_id(course_id: int):
    """Get a specific course by ID"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, link, category, skill_level, duration, provider, description, tags, source, is_active, created_at
        FROM courses WHERE id = ? AND is_active = 1
    """, (course_id,))
    course = cursor.fetchone()

    conn.close()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return {
        "id": course[0],
        "name": course[1],
        "link": course[2],
        "category": course[3],
        "skill_level": course[4],
        "duration": course[5],
        "provider": course[6],
        "description": course[7],
        "tags": json.loads(course[8]) if course[8] else [],
        "source": course[9],
        "is_active": course[10],
        "created_at": course[11]
    }

@router.get("/courses/categories")
async def get_course_categories():
    """Get all available course categories"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT category, COUNT(*) as count FROM courses WHERE is_active = 1 GROUP BY category ORDER BY count DESC")
    categories = cursor.fetchall()

    conn.close()

    return [
        {
            "category": cat[0],
            "count": cat[1]
        }
        for cat in categories
    ]

@router.get("/courses/skill-levels")
async def get_skill_levels():
    """Get all available skill levels"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT DISTINCT skill_level, COUNT(*) as count FROM courses WHERE is_active = 1 GROUP BY skill_level ORDER BY count DESC")
    levels = cursor.fetchall()

    conn.close()

    return [
        {
            "skill_level": level[0],
            "count": level[1]
        }
        for level in levels
    ]

@router.post("/courses")
async def create_course(course: CourseCreate):
    """Create a new course"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO courses (name, link, category, skill_level, duration, provider, description, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        course.name, 
        course.link, 
        course.category, 
        course.skill_level, 
        course.duration, 
        course.provider, 
        course.description,
        json.dumps([])  # Empty tags for now
    ))

    conn.commit()
    course_id = cursor.lastrowid
    conn.close()

    return {"message": "Course created successfully", "course_id": course_id}

@router.post("/courses/{course_id}/enroll")
async def enroll_in_course(course_id: int, enrollment: CourseEnrollment):
    """Enroll a user in a course"""
    conn = get_db()
    cursor = conn.cursor()

    # Check if course exists
    cursor.execute("SELECT id FROM courses WHERE id = ?", (course_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Course not found")

    try:
        cursor.execute("""
            INSERT INTO course_enrollments (course_id, user_id, status)
            VALUES (?, ?, ?)
        """, (course_id, enrollment.user_id, enrollment.status))
        
        conn.commit()
        enrollment_id = cursor.lastrowid
        conn.close()
        
        return {"message": "Successfully enrolled in course", "enrollment_id": enrollment_id}
    
    except Exception as e:
        conn.close()
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=409, detail="User already enrolled in this course")
        raise HTTPException(status_code=500, detail="Enrollment failed")

@router.get("/courses/{course_id}/enrollments")
async def get_course_enrollments(course_id: int):
    """Get all enrollments for a specific course"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT ce.id, ce.user_id, ce.enrolled_at, ce.status, ce.progress, ce.completion_date
        FROM course_enrollments ce
        WHERE ce.course_id = ?
        ORDER BY ce.enrolled_at DESC
    """, (course_id,))
    
    enrollments = cursor.fetchall()
    conn.close()

    return [
        {
            "enrollment_id": enrollment[0],
            "user_id": enrollment[1],
            "enrolled_at": enrollment[2],
            "status": enrollment[3],
            "progress": enrollment[4],
            "completion_date": enrollment[5]
        }
        for enrollment in enrollments
    ]

@router.get("/users/{user_id}/courses")
async def get_user_courses(user_id: int):
    """Get all courses a user is enrolled in"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.id, c.name, c.link, c.category, c.skill_level, c.provider,
               ce.enrolled_at, ce.status, ce.progress, ce.completion_date
        FROM courses c
        JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE ce.user_id = ?
        ORDER BY ce.enrolled_at DESC
    """, (user_id,))
    
    courses = cursor.fetchall()
    conn.close()

    return [
        {
            "course_id": course[0],
            "name": course[1],
            "link": course[2],
            "category": course[3],
            "skill_level": course[4],
            "provider": course[5],
            "enrolled_at": course[6],
            "status": course[7],
            "progress": course[8],
            "completion_date": course[9]
        }
        for course in courses
    ]

@router.put("/enrollments/{enrollment_id}/progress")
async def update_course_progress(enrollment_id: int, progress: int):
    """Update course progress for an enrollment"""
    if progress < 0 or progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    
    conn = get_db()
    cursor = conn.cursor()

    # Update progress and mark as completed if 100%
    if progress == 100:
        cursor.execute("""
            UPDATE course_enrollments 
            SET progress = ?, status = 'completed', completion_date = datetime('now')
            WHERE id = ?
        """, (progress, enrollment_id))
    else:
        cursor.execute("""
            UPDATE course_enrollments 
            SET progress = ?, status = 'in_progress'
            WHERE id = ?
        """, (progress, enrollment_id))

    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Enrollment not found")

    conn.commit()
    conn.close()

    return {"message": "Progress updated successfully"}

@router.post("/courses/recommend")
async def recommend_courses(user_query: dict):
    """
    Simple course recommendation based on user query
    """
    query = user_query.get("query", "").lower()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Extract keywords from user query
    keywords = []
    
    # Check for common skill-related keywords
    if any(word in query for word in ['software', 'developer', 'programming', 'coding', 'python', 'java', 'web']):
        keywords.extend(['programming', 'python', 'software', 'web'])
    if any(word in query for word in ['ai', 'artificial intelligence', 'machine learning']):
        keywords.extend(['ai', 'artificial'])
    if any(word in query for word in ['business', 'management', 'entrepreneur']):
        keywords.extend(['business', 'management'])
    if any(word in query for word in ['design', 'creative', 'graphics']):
        keywords.extend(['design', 'creative'])
    
    # Build query based on keywords
    if keywords:
        keyword_conditions = " OR ".join([f"name LIKE '%{keyword}%' OR description LIKE '%{keyword}%' OR tags LIKE '%{keyword}%'" for keyword in keywords])
        sql_query = f"""
            SELECT id, name, link, category, skill_level, duration, provider, description, tags, source, is_active, created_at
            FROM courses 
            WHERE is_active = 1 AND ({keyword_conditions})
            ORDER BY created_at DESC 
            LIMIT 5
        """
    else:
        # Default to recent courses
        sql_query = """
            SELECT id, name, link, category, skill_level, duration, provider, description, tags, source, is_active, created_at
            FROM courses 
            WHERE is_active = 1
            ORDER BY created_at DESC 
            LIMIT 5
        """
    
    cursor.execute(sql_query)
    courses = cursor.fetchall()
    conn.close()
    
    recommended_courses = [
        {
            "id": course[0],
            "name": course[1],
            "link": course[2],
            "category": course[3],
            "skill_level": course[4],
            "duration": course[5],
            "provider": course[6],
            "description": course[7],
            "tags": json.loads(course[8]) if course[8] else [],
            "source": course[9],
            "is_active": course[10],
            "created_at": course[11]
        }
        for course in courses
    ]
    
    return {
        "courses": recommended_courses,
        "total_found": len(recommended_courses),
        "query": user_query.get("query", "")
    }
