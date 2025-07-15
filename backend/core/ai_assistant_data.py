"""
Helper functions to fetch data for AI Assistant feature renderers
"""
import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from init_db import get_db
from api.routes_events import get_user_name_by_id

async def get_recent_events(args: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Get recent events based on user query"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Parse args to determine filters
        query = "SELECT * FROM events WHERE status = 'published'"
        params = []
        
        # Simple keyword matching for event type or location
        if args and args.strip():
            query += " AND (title LIKE ? OR description LIKE ? OR event_type LIKE ? OR location LIKE ?)"
            search_term = f"%{args}%"
            params.extend([search_term, search_term, search_term, search_term])
        
        query += " ORDER BY start_date ASC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        events_data = cursor.fetchall()
        
        events = []
        for row in events_data:
            # Safe JSON parsing
            def safe_json_loads(data, default=None):
                if data is None:
                    return default
                try:
                    return json.loads(data) if isinstance(data, str) else data
                except:
                    return default
            
            event = {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "type": row[3],
                "location": row[5],
                "date": row[7],  # start_date
                "organizer": "Event Team",  # Could be enhanced with actual organizer data
                "registration_link": f"/events/{row[0]}"  # Generate registration link
            }
            events.append(event)
        
        return events
    except Exception as e:
        print(f"Error fetching events: {e}")
        return []

async def get_featured_projects(args: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Get featured projects based on user query"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        query = "SELECT * FROM projects WHERE status = 'completed' OR status = 'ongoing'"
        params = []
        
        # Simple keyword matching
        if args and args.strip():
            query += " AND (title LIKE ? OR description LIKE ? OR category LIKE ?)"
            search_term = f"%{args}%"
            params.extend([search_term, search_term, search_term])
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        projects_data = cursor.fetchall()
        
        projects = []
        for row in projects_data:
            def safe_json_loads(data, default=None):
                if data is None:
                    return default
                try:
                    return json.loads(data) if isinstance(data, str) else data
                except:
                    return default
            
            project = {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "creator": "Project Team",  # Could be enhanced with actual creator data
                "status": row[14],  # status
                "investment_needed": row[12] if row[12] else "Not specified",  # funding_status
                "tags": safe_json_loads(row[6], []),  # technologies
            }
            projects.append(project)
        
        return projects
    except Exception as e:
        print(f"Error fetching projects: {e}")
        return []

async def get_youtube_summaries(args: str, limit: int = 3) -> List[Dict[str, Any]]:
    """Generate sample YouTube summaries based on query"""
    # For now, return sample data since this would require integration with YouTube API
    # In a real implementation, this would search for videos and generate summaries
    
    sample_summaries = [
        {
            "title": f"Educational Video: {args}",
            "summary": f"This video provides comprehensive coverage of {args}, including practical examples and real-world applications.",
            "duration": "15:30",
            "key_points": [
                f"Introduction to {args}",
                "Practical applications and examples",
                "Best practices and tips",
                "Common mistakes to avoid"
            ],
            "url": "https://youtube.com/example"
        },
        {
            "title": f"Tutorial: Getting Started with {args}",
            "summary": f"A beginner-friendly tutorial covering the basics of {args} with step-by-step instructions.",
            "duration": "22:45",
            "key_points": [
                "Prerequisites and setup",
                "Step-by-step tutorial",
                "Troubleshooting common issues"
            ],
            "url": "https://youtube.com/example2"
        }
    ]
    
    return sample_summaries[:limit]

async def get_user_profile_summary(user_id: Optional[int] = None) -> Dict[str, Any]:
    """Get user profile summary for dashboard view"""
    try:
        if not user_id:
            # Return sample profile data if no user ID provided
            return {
                "name": "Sample User",
                "experience": "3 years in software development",
                "goals": "Learn new technologies and advance career",
                "skills": ["Python", "JavaScript", "React", "SQL"],
                "achievements": [
                    "Completed 5 online courses this year",
                    "Participated in 2 hackathons",
                    "Built 3 personal projects"
                ]
            }
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user profile
        cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
        profile_data = cursor.fetchone()
        
        if not profile_data:
            return {
                "name": "User",
                "experience": "Getting started",
                "goals": "Explore opportunities",
                "skills": [],
                "achievements": []
            }
        
        # Parse skills
        def safe_json_loads(data, default=None):
            if data is None:
                return default
            try:
                return json.loads(data) if isinstance(data, str) else data
            except:
                return default
        
        # Get achievements
        cursor.execute("SELECT title FROM achievements WHERE user_id = ? ORDER BY date DESC LIMIT 5", (user_id,))
        achievements_data = cursor.fetchall()
        achievements = [row[0] for row in achievements_data] if achievements_data else []
        
        return {
            "name": profile_data[1],  # name
            "experience": profile_data[6],  # experience
            "goals": profile_data[7],  # goals
            "skills": safe_json_loads(profile_data[5], []),  # skills
            "achievements": achievements
        }
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        return {
            "name": "User",
            "experience": "Getting started",
            "goals": "Explore opportunities",
            "skills": [],
            "achievements": []
        }

async def get_event_by_id(event_id: int):
    """Get a specific event by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()
        
        if not row:
            print("Event not found")
            return None
        
        # Safe JSON parsing function
        def safe_json_loads(data, default=None):
            if data is None:
                return default
            try:
                if isinstance(data, str):
                    return json.loads(data)
                elif isinstance(data, (list, dict)):
                    return data
                else:
                    return default
            except (json.JSONDecodeError, TypeError):
                return default

        event = {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "event_type": row[3],
            "category": row[4],
            "location": row[5],
            "state": row[6],
            "start_date": row[7],
            "end_date": row[8],
            "max_participants": row[9],
            "current_participants": row[10],
            "budget": row[11],
            "prize_pool": row[12],
            "organizer": {
                "id": row[13],
                "type": row[14],
                "name": get_user_name_by_id(row[13])
            },
            "skills_required": safe_json_loads(row[15], []),
            "tags": safe_json_loads(row[16], []),
            "status": row[17],
            "impact_metrics": safe_json_loads(row[18], {
                "participants_target": 0,
                "skills_developed": 0,
                "projects_created": 0,
                "employment_generated": 0
            }),
            "marketing_highlights": safe_json_loads(row[19], []),
            "success_metrics": safe_json_loads(row[20], []),
            "sections": safe_json_loads(row[21], []),
            "social_media_posts": [],
            "created_at": row[19],
            "updated_at": row[20]
        }
        
        # Fetch social media posts
        cursor.execute("SELECT * FROM social_media_posts WHERE event_id = ?", (event_id,))
        posts_data = cursor.fetchall()
        event["social_media_posts"] = [
            {
                "id": post[0],
                "platform": post[2],
                "content": post[3],
                "image_url": post[4],
                "scheduled_at": post[5],
                "status": post[6]
            }
            for post in posts_data
        ]
        
        conn.close()
        return event
    except Exception as e:
        print(f"Error fetching event: {e}")

async def get_events(
    limit: int = 50,
    offset: int = 0,    
    event_type: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None
):
    """Get all events with optional filtering"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        query = "SELECT * FROM events WHERE 1=1"
        params = []
        
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if location:
            query += " AND (location LIKE ? OR state LIKE ?)"
            params.extend([f"%{location}%", f"%{location}%"])
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        events_data = cursor.fetchall()
        
        events = []
        for row in events_data:
            # Safe JSON parsing function
            def safe_json_loads(data, default=None):
                if data is None:
                    return default
                try:
                    if isinstance(data, str):
                        return json.loads(data)
                    elif isinstance(data, (list, dict)):
                        return data
                    else:
                        return default
                except (json.JSONDecodeError, TypeError):
                    return default

            event = {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "event_type": row[3],
                "category": row[4],
                "location": row[5],
                "state": row[6],
                "start_date": row[7],
                "end_date": row[8],
                "max_participants": row[9],
                "current_participants": row[10],
                "budget": row[11],
                "prize_pool": row[12],
                "organizer": {
                    "id": row[13],
                    "type": row[14],
                    "name": get_user_name_by_id(row[13])
                },
                "skills_required": safe_json_loads(row[15], []),
                "tags": safe_json_loads(row[16], []),
                "status": row[17],
                "impact_metrics": safe_json_loads(row[18], {
                    "participants_target": 0,
                    "skills_developed": 0,
                    "projects_created": 0,
                    "employment_generated": 0
                }),
                "marketing_highlights": safe_json_loads(row[19], []),
                "success_metrics": safe_json_loads(row[20], []),
                "sections": safe_json_loads(row[21], []),
                "social_media_posts": [],
                "created_at": row[19],
                "updated_at": row[20]
            }
            
            # Fetch social media posts for this event
            cursor.execute("SELECT * FROM social_media_posts WHERE event_id = ?", (event["id"],))
            posts_data = cursor.fetchall()
            event["social_media_posts"] = [
                {
                    "id": post[0],
                    "platform": post[2],
                    "content": post[3],
                    "image_url": post[4],
                    "scheduled_at": post[5],
                    "status": post[6]
                }
                for post in posts_data
            ]
            
            events.append(event)
        
        conn.close()
        return events
        
    except Exception as e:
        print(f"Error fetching events: {e}")

async def search_projects(query: str, limit: int = 10):
    """Search projects by name, description, or tags (for AI assistant and frontend helpers). Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "SELECT * FROM projects WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? ORDER BY created_at DESC LIMIT ?"
        like_query = f"%{query}%"
        cursor.execute(sql, (like_query, like_query, like_query, limit))
        projects_data = cursor.fetchall()
        def safe_json_loads(data, default=None):
            if data is None:
                return default
            try:
                if isinstance(data, str):
                    return json.loads(data)
                elif isinstance(data, (list, dict)):
                    return data
                else:
                    return default
            except (json.JSONDecodeError, TypeError):
                return default
        projects = []
        for row in projects_data:
            project = {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "category": row[3],
                "event_id": row[4],
                "event_name": row[5],
                "event_type": row[6],
                "team_members": safe_json_loads(row[7], []),
                "technologies": safe_json_loads(row[8], []),
                "impact_metrics": safe_json_loads(row[9], {}),
                "funding_status": row[10],
                "funding_amount": row[11],
                "funding_goal": row[12],
                "location": row[13],
                "state": row[14],
                "created_by": row[15],
                "created_at": row[16],
                "completed_at": row[17],
                "status": row[18],
                "media": safe_json_loads(row[19], {}),
                "testimonials": safe_json_loads(row[20], []),
                "awards": safe_json_loads(row[21], []),
                "tags": safe_json_loads(row[22], [])
            }
            projects.append(project)
        conn.close()
        return projects
    except Exception as e:
        print(f"Error searching projects: {e}")

async def get_projects(
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None,
    status: Optional[str] = None,
    funding_status: Optional[str] = None,
    location: Optional[str] = None,
    event_id: Optional[int] = None  # <-- Added event_id for filtering
):
    """Get all projects with optional filtering (category, status, funding_status, location, event_id). Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        query = "SELECT * FROM projects WHERE 1=1"
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if funding_status:
            query += " AND funding_status = ?"
            params.append(funding_status)
        
        if location:
            query += " AND (location LIKE ? OR state LIKE ?)"
            params.extend([f"%{location}%", f"%{location}%"])
        
        if event_id is not None:
            query += " AND event_id = ?"
            params.append(event_id)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        projects_data = cursor.fetchall()
        
        projects = []
        for row in projects_data:
            project_id = row[0]
            
            # Fetch team members from relational table
            cursor.execute('''
                SELECT ptm.id, ptm.user_id, ptm.role, ptm.skills, ptm.joined_at, ptm.event_id,
                       u.name, u.user_type
                FROM project_team_members ptm
                LEFT JOIN users u ON ptm.user_id = u.id
                WHERE ptm.project_id = ?
                ORDER BY ptm.id
            ''', (project_id,))
            
            team_members = []
            for tm_row in cursor.fetchall():
                team_member = {
                    "id": tm_row[0],
                    "user_id": tm_row[1],
                    "role": tm_row[2],
                    "skills": json.loads(tm_row[3]) if tm_row[3] else [],
                    "joined_at": tm_row[4],
                    "event_id": tm_row[5],
                    "name": tm_row[6] or "Unknown User",
                    "user_type": tm_row[7] or "unknown"
                }
                team_members.append(team_member)
            
            project = {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "category": row[3],
                "event_id": row[4],
                "event_name": row[5],
                "event_type": row[6],
                "team_members": team_members,  # Now using relational data
                "technologies": json.loads(row[7]) if row[7] else [],
                "impact_metrics": json.loads(row[8]) if row[8] else {},
                "funding_status": row[9],
                "funding_amount": row[10],
                "funding_goal": row[11],
                "location": row[12],
                "state": row[13],
                "created_by": row[14],
                "created_at": row[15],
                "completed_at": row[16],
                "status": row[17],
                "media": json.loads(row[18]) if row[18] else {},
                "testimonials": json.loads(row[19]) if row[19] else [],
                "awards": json.loads(row[20]) if row[20] else [],
                "tags": json.loads(row[21]) if row[21] else []
            }
            projects.append(project)
        
        conn.close()
        return projects
        
    except Exception as e:
        print(f"Error fetching projects: {e}")

async def search_users(query: str, limit: int = 10):
    """Search users by name, organization, or skills (for AI assistant and frontend helpers). Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "SELECT * FROM users WHERE name LIKE ? OR organization LIKE ? OR skills LIKE ? ORDER BY created_at DESC LIMIT ?"
        like_query = f"%{query}%"
        cursor.execute(sql, (like_query, like_query, like_query, limit))
        users_data = cursor.fetchall()
        users = []
        for row in users_data:
            user = {
                "id": row[0],
                "phone": row[1],
                "user_type": row[2],
                "name": row[3],
                "organization": row[4],
                "is_active": row[5],
                "is_verified": row[6],
                "created_at": row[7],
                "last_login": row[8],
                "skills": row[9] if len(row) > 9 else None
            }
            users.append(user)
        conn.close()
        return users
    except Exception as e:
        print(f"Error searching users: {e}")

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

##TODO checker if args matches UserInfo
from pydantic import BaseModel
class UserInfo(BaseModel):
    user_info: str  # Input from the user for job recommendation
async def recommend_job(user_info: UserInfo):
    """
    Recommend the best job for a user based on their information.
    """
    try:
        from core.job_recommender import get_all_job_names, get_relevant_jobs, load_selected_jobs, find_best_job
        all_job_names = await get_all_job_names()
        relevant_job_names = await get_relevant_jobs(user_info.user_info, all_job_names)
        print('Got relevant job names:', relevant_job_names)
        relevant_jobs = await load_selected_jobs(relevant_job_names.get('relevant_jobs', []) if isinstance(relevant_job_names, dict) else relevant_job_names)
        best_job = await find_best_job(user_info.user_info, relevant_jobs)
        print(best_job)
        return {"best_job": best_job}
    except Exception as e:
        print(f"Error recommending job: {e}")

async def search_schemes(query: str, limit: int = 10):
    """Search schemes by name, description, or target group (for AI assistant and frontend helpers). Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "SELECT * FROM schemes WHERE name LIKE ? OR description LIKE ? OR target_group LIKE ? ORDER BY created_at DESC LIMIT ?"
        like_query = f"%{query}%"
        cursor.execute(sql, (like_query, like_query, like_query, limit))
        schemes_data = cursor.fetchall()
        schemes = []
        for row in schemes_data:
            scheme = {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "target_group": row[3],
                "benefits": row[4],
                "eligibility": row[5],
                "application_process": row[6],
                "documents_required": row[7],
                "contact_info": row[8],
                "created_at": row[9],
                "updated_at": row[10]
            }
            schemes.append(scheme)
        conn.close()
        return schemes
    except Exception as e:
        print(f"Error searching schemes: {e}")


class YoutubeSummaryRequest(BaseModel):
    youtube_url: str
    language: str = "en"
async def youtube_audio_summary(request: YoutubeSummaryRequest):
    try:
        from core.youtube_summary import summarize_youtube_video
        result = summarize_youtube_video(request.youtube_url, request.language)
        return result
    except Exception as e:
        print(f"Error summarizing YouTube video: {e}")

from typing import Dict, Any, List, Optional

# --- Unified Profile (for dashboard/profile) ---
async def get_profile(user_id: Optional[int] = None) -> Dict[str, Any]:
    """Get unified profile for a user by user_id (or sample if not provided)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        if not user_id:
            return await get_user_profile_summary()
        cursor.execute("SELECT * FROM unified_profiles WHERE user_id = ?", (user_id,))
        profile_data = cursor.fetchone()
        if not profile_data:
            return await get_user_profile_summary()
        def safe_json_loads(data, default=None):
            if data is None:
                return default
            try:
                return json.loads(data) if isinstance(data, str) else data
            except:
                return default
        return {
            "user_id": profile_data[0],
            "user_type": profile_data[1],
            "name": profile_data[2],
            "organization": profile_data[3],
            "location": profile_data[4],
            "state": profile_data[5],
            "skills": safe_json_loads(profile_data[6], []),
            "experience": profile_data[7],
            "goals": profile_data[8],
            "impact_metrics": safe_json_loads(profile_data[10], {}),
            "achievements": safe_json_loads(profile_data[11], []),
            "recent_activities": safe_json_loads(profile_data[12], []),
            "recommendations": safe_json_loads(profile_data[13], []),
            "networking_suggestions": safe_json_loads(profile_data[14], []),
            "created_at": profile_data[15],
            "updated_at": profile_data[16],
        }
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return await get_user_profile_summary()

async def _get_unified_profile_by_user_id(user_id: int) -> Dict[str, Any]:
    return await get_profile(user_id)

# --- Schemes ---
async def get_schemes(limit: int = 10) -> List[Dict[str, Any]]:
    """Get a list of government schemes (limit N)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM schemes ORDER BY created_at DESC LIMIT ?", (limit,))
        schemes_data = cursor.fetchall()
        schemes = []
        for row in schemes_data:
            scheme = {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "target_group": row[3],
                "benefits": row[4],
                "eligibility": row[5],
                "application_process": row[6],
                "documents_required": row[7],
                "contact_info": row[8],
                "created_at": row[9],
                "updated_at": row[10]
            }
            schemes.append(scheme)
        return schemes
    except Exception as e:
        print(f"Error fetching schemes: {e}")
        return []

# --- CSR Companies ---
async def get_companies(limit: int = 10) -> List[Dict[str, Any]]:
    """Get a list of CSR companies (limit N)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM csr_companies ORDER BY company_name LIMIT ?', (limit,))
        rows = cursor.fetchall()
        companies = []
        for row in rows:
            company = dict(zip([col[0] for col in cursor.description], row))
            company['csr_focus_areas'] = json.loads(company['csr_focus_areas']) if 'csr_focus_areas' in company else []
            companies.append(company)
        return companies
    except Exception as e:
        print(f"Error fetching companies: {e}")
        return []

async def get_company_metrics(company_id: int) -> Dict[str, Any]:
    """Get dashboard metrics for a specific company"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        # Get company details
        cursor.execute('SELECT company_name FROM csr_companies WHERE id = ?', (company_id,))
        company_row = cursor.fetchone()
        if not company_row:
            return {"error": "Company not found"}
        company_name = company_row[0]
        # Get all events for this company
        cursor.execute('SELECT * FROM csr_events WHERE company_id = ? ORDER BY start_date DESC', (company_id,))
        events = cursor.fetchall()
        total_events = len(events)
        total_beneficiaries = sum(event[8] for event in events) if events else 0
        total_budget_allocated = sum(event[9] for event in events) if events else 0
        total_budget_spent = sum(event[10] for event in events) if events else 0
        budget_efficiency = (total_budget_spent / total_budget_allocated * 100) if total_budget_allocated > 0 else 0
        return {
            "company_id": company_id,
            "company_name": company_name,
            "total_events": total_events,
            "total_beneficiaries": total_beneficiaries,
            "total_budget_allocated": total_budget_allocated,
            "total_budget_spent": total_budget_spent,
            "budget_efficiency": round(budget_efficiency, 2)
        }
    except Exception as e:
        print(f"Error fetching company metrics: {e}")
        return {"error": str(e)}

# --- CSR Courses ---
async def get_courses(limit: int = 10) -> List[Dict[str, Any]]:
    """Get a list of CSR courses (limit N)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM csr_courses ORDER BY created_at DESC LIMIT ?', (limit,))
        rows = cursor.fetchall()
        courses = []
        for row in rows:
            course = dict(zip([col[0] for col in cursor.description], row))
            course['skills'] = course['skills'].split(',') if 'skills' in course and course['skills'] else []
            courses.append(course)
        return courses
    except Exception as e:
        print(f"Error fetching courses: {e}")
        return []