from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from init_db import get_db
from core.translation import llama_translate_string as translate_text
from core.skill_tutorial import llama_chat_completion as get_llm_response
from typing import Optional, List
import json
import asyncio

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
        "id": course['id'],
        "name": course['name'],
        "link": course['link'],
        "category": course['category'],
        "skill_level": course['skill_level'],
        "duration": course['duration'],
        "provider": course['provider'],
        "description": course['description'],
        "tags": json.loads(course['tags'] or '[]'),
        "source": course['source'],
        "is_active": bool(course['is_active']),
        "created_at": course['created_at'],
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
        "id": course['id'],
        "name": course['name'],
        "link": course['link'],
        "category": course['category'],
        "skill_level": course['skill_level'],
        "duration": course['duration'],
        "provider": course['provider'],
        "description": course['description'],
        "tags": json.loads(course['tags'] or '[]'),
        "source": course['source'],
        "is_active": bool(course['is_active']),
        "created_at": course['created_at'],
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

    return  {
        "id": course['id'],
        "name": course['name'],
        "link": course['link'],
        "category": course['category'],
        "skill_level": course['skill_level'],
        "duration": course['duration'],
        "provider": course['provider'],
        "description": course['description'],
        "tags": json.loads(course['tags'] or '[]'),
        "source": course['source'],
        "is_active": bool(course['is_active']),
        "created_at": course['created_at'],
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
            "enrollment_id": enrollment["id"],
            "user_id": enrollment["user_id"],
            "enrolled_at": enrollment["enrolled_at"],
            "status": enrollment["status"],
            "progress": enrollment["progress"],
            "completion_date": enrollment["completion_date"]
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
            "course_id": course["id"],
            "name": course["name"],
            "link": course["link"],
            "category": course["category"],
            "skill_level": course["skill_level"],
            "provider": course["provider"],
            "enrolled_at": course["enrolled_at"],
            "status": course["status"],
            "progress": course["progress"],
            "completion_date": course["completion_date"]
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
    AI-powered course recommendation based on user query
    """
    query = user_query.get("query", "").strip()
    
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all available courses (remove the LIMIT to search through everything)
    cursor.execute("""
        SELECT id, name, link, category, skill_level, duration, provider, description, tags, source, is_active, created_at
        FROM courses 
        WHERE is_active = 1
        ORDER BY created_at DESC
    """)
    all_courses = cursor.fetchall()
    conn.close()
    
    if not all_courses:
        return {
            "courses": [],
            "total_found": 0,
            "query": query,
            "message": "No courses available in the database"
        }
    
    # Format courses for AI analysis
    courses_context = []
    for course in all_courses:
        course_info = {
            "id": course["id"],
            "name": course["name"],
            "link": course["link"],
            "category": course["category"],
            "skill_level": course["skill_level"],
            "duration": course["duration"],
            "provider": course["provider"],
            "description": course["description"] or "No description available",
            "tags": json.loads(course["tags"]) if course["tags"] else []
        }
        courses_context.append(course_info)
    
    # Create AI prompt for course recommendation
    ai_prompt = f"""
You are an expert course recommendation system. Analyze the user's query and recommend the most relevant courses from the available options.

User Query: "{query}"

Available Courses (Total: {len(courses_context)}):
{json.dumps(courses_context, indent=2)}

Instructions:
1. Analyze the user's query to understand their learning goals, skill level, and interests
2. Match the query against course names, descriptions, categories, tags, and providers
3. Use semantic understanding - for example:
   - "finance" should match "financial", "accounting", "money management", "investment", "banking"
   - "programming" should match "coding", "software development", "python", "java", "web development"
   - "business" should match "management", "entrepreneurship", "marketing", "sales"
4. Consider skill progression (beginner → intermediate → advanced)
5. Prioritize courses that best match the user's intent
6. Search thoroughly through ALL available courses
7. Select up to 8 most relevant courses (increased from 6)
8. Provide a relevance score (1-100) and detailed explanation for each recommendation

Return a JSON response with this exact structure:
{{
    "recommendations": [
        {{
            "course_id": <course_id>,
            "relevance_score": <1-100>,
            "reason": "<detailed explanation of why this course matches the query>",
            "skill_match": "<how this course aligns with user's skill level>",
            "learning_path": "<how this fits into a learning progression>"
        }}
    ],
    "analysis": "<detailed analysis of the user's query and learning goals>",
    "suggested_next_steps": "<specific recommendations for what to learn after these courses>"
}}

IMPORTANT: Be thorough in your search. If the user searches for "finance", make sure to find ALL finance, financial, accounting, investment, banking, economics, and money-related courses. Use semantic matching, not just exact keyword matching.
"""
    
    try:
        # Get AI recommendation
        ai_response = await get_llm_response(ai_prompt)
        
        # Parse AI response
        try:
            ai_data = json.loads(ai_response)
        except json.JSONDecodeError:
            # Fallback to simple matching if AI response is malformed
            return await fallback_recommendation(query, courses_context)
        
        # Build final response with course details
        recommended_courses = []
        
        for rec in ai_data.get("recommendations", [])[:8]:  # Increased to 8 courses
            course_id = rec.get("course_id")
            
            # Find the course details
            course_details = next((c for c in courses_context if c["id"] == course_id), None)
            
            if course_details:
                enhanced_course = {
                    **course_details,
                    "relevance_score": rec.get("relevance_score", 50),
                    "recommendation_reason": rec.get("reason", "Matches your query"),
                    "skill_match": rec.get("skill_match", "Suitable for your level"),
                    "learning_path": rec.get("learning_path", "Part of your learning journey")
                }
                recommended_courses.append(enhanced_course)
        
        # Sort by relevance score
        recommended_courses.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        
        return {
            "courses": recommended_courses,
            "total_found": len(recommended_courses),
            "query": query,
            "analysis": ai_data.get("analysis", "AI analysis of your learning goals"),
            "suggested_next_steps": ai_data.get("suggested_next_steps", "Continue learning in this area"),
            "ai_powered": True
        }
        
    except Exception as e:
        print(f"AI recommendation failed: {e}")
        # Fallback to simple matching
        return await fallback_recommendation(query, courses_context)

async def fallback_recommendation(query: str, courses_context: list):
    """
    Enhanced fallback recommendation using comprehensive keyword matching and fuzzy search
    """
    query_lower = query.lower()
    query_words = [word.strip() for word in query_lower.split() if len(word.strip()) > 2]
    
    scored_courses = []
    
    for course in courses_context:
        score = 0
        reasons = []
        course_text = ""
        
        # Create comprehensive searchable text for each course
        searchable_fields = [
            course.get("name", ""),
            course.get("description", ""),
            course.get("category", ""),
            " ".join(course.get("tags", [])),
            course.get("provider", ""),
            course.get("skill_level", "")
        ]
        course_text = " ".join(searchable_fields).lower()
        
        # Enhanced keyword matching with different weights
        for word in query_words:
            # Exact word match in title (highest weight)
            if word in course.get("name", "").lower():
                score += 50
                reasons.append(f"'{word}' found in course title")
            
            # Partial word match in title
            elif any(word in title_word for title_word in course.get("name", "").lower().split()):
                score += 35
                reasons.append(f"'{word}' partially matches title")
            
            # Exact word match in description
            elif word in course.get("description", "").lower():
                score += 30
                reasons.append(f"'{word}' found in description")
            
            # Category match
            elif word in course.get("category", "").lower():
                score += 40
                reasons.append(f"'{word}' matches category")
            
            # Tags match
            elif any(word in tag.lower() for tag in course.get("tags", [])):
                score += 25
                reasons.append(f"'{word}' found in course tags")
            
            # Provider match
            elif word in course.get("provider", "").lower():
                score += 15
                reasons.append(f"'{word}' matches provider")
            
            # Fuzzy match - check if query word is contained in any course text
            elif word in course_text:
                score += 10
                reasons.append(f"'{word}' found in course content")
        
        # Bonus for multiple word matches
        matched_words = sum(1 for word in query_words if word in course_text)
        if matched_words > 1:
            score += (matched_words - 1) * 10
            reasons.append(f"Multiple keywords matched ({matched_words}/{len(query_words)})")
        
        # Special handling for common synonyms and related terms
        finance_terms = ["finance", "financial", "money", "banking", "investment", "accounting", "economics", "budget"]
        tech_terms = ["programming", "coding", "software", "development", "python", "java", "web", "app"]
        business_terms = ["business", "management", "entrepreneur", "marketing", "sales", "leadership"]
        design_terms = ["design", "creative", "art", "graphics", "ui", "ux", "visual"]
        
        query_text = " ".join(query_words)
        
        # Check for finance-related queries
        if any(term in query_text for term in finance_terms):
            if any(term in course_text for term in finance_terms):
                score += 30
                reasons.append("Finance-related content detected")
        
        # Check for tech-related queries
        if any(term in query_text for term in tech_terms):
            if any(term in course_text for term in tech_terms):
                score += 30
                reasons.append("Technology-related content detected")
        
        # Check for business-related queries
        if any(term in query_text for term in business_terms):
            if any(term in course_text for term in business_terms):
                score += 30
                reasons.append("Business-related content detected")
        
        # Check for design-related queries
        if any(term in query_text for term in design_terms):
            if any(term in course_text for term in design_terms):
                score += 30
                reasons.append("Design-related content detected")
        
        # If we have any score, add to results
        if score > 0:
            enhanced_course = {
                **course,
                "relevance_score": min(score, 100),
                "recommendation_reason": "; ".join(reasons[:3]) if reasons else "General recommendation",  # Limit reasons to avoid clutter
                "skill_match": f"Suitable for {course.get('skill_level', 'all')} level",
                "learning_path": "Part of your learning journey",
                "search_score_details": f"Score: {score}, Matched: {matched_words}/{len(query_words)} keywords"
            }
            scored_courses.append(enhanced_course)
    
    # Sort by score and take top 8 (increased from 6)
    scored_courses.sort(key=lambda x: x["relevance_score"], reverse=True)
    recommended_courses = scored_courses[:8]
    
    return {
        "courses": recommended_courses,
        "total_found": len(recommended_courses),
        "query": query,
        "analysis": f"Enhanced search found {len(recommended_courses)} courses matching '{query}'. Searched across titles, descriptions, categories, tags, and providers.",
        "suggested_next_steps": "Explore these courses to build your skills. Try more specific keywords if you don't see what you're looking for.",
        "ai_powered": False,
        "fallback_used": True,
        "search_method": "Enhanced keyword matching with semantic grouping"
    }
