"""
Helper functions to fetch data for AI Assistant feature renderers
"""
import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from init_db import get_db
from api.routes_events import get_user_name_by_id
from init_db import get_db
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
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "type": row["event_type"],
                "location": row["location"],
                "date": row["start_date"],  # start_date
                "organizer": "Event Team",  # Could be enhanced with actual organizer data
                "registration_link": f"/events/{row['id']}"  # Generate registration link
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
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "creator": "Project Team",  # Could be enhanced with actual creator data
                "status": row["status"],  # status
                "investment_needed": row["funding_status"] if row["funding_status"] else "Not specified",  # funding_status
                "tags": safe_json_loads(row["technologies"], []),  # technologies
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
            "name": profile_data["name"],  # name
            "experience": profile_data["experience"],  # experience
            "goals": profile_data["goals"],  # goals
            "skills": safe_json_loads(profile_data["skills"], []),  # skills
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
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "event_type": row["event_type"],
            "category": row["category"],
            "location": row["location"],
            "state": row["state"],
            "start_date": row["start_date"],
            "end_date": row["end_date"],
            "max_participants": row["max_participants"],
            "current_participants": row["current_participants"],
            "budget": row["budget"],
            "prize_pool": row["prize_pool"],
            "organizer": {
                "id": row["organizer_id"],
                "type": row["organizer_type"],
                "name": get_user_name_by_id(row["organizer_id"])
            },
            "skills_required": safe_json_loads(row["skills_required"], []),
            "tags": safe_json_loads(row["tags"], []),
            "status": row["status"],
            "impact_metrics": safe_json_loads(row["impact_metrics"], {
                "participants_target": 0,
                "skills_developed": 0,
                "projects_created": 0,
                "employment_generated": 0
            }),
            "marketing_highlights": safe_json_loads(row["marketing_highlights"], []),
            "success_metrics": safe_json_loads(row["success_metrics"], []),
            "sections": safe_json_loads(row["sections"], []),
            "social_media_posts": [],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
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
                "skills_required": safe_json_loads(row[16], []),
                "tags": safe_json_loads(row[17], []),
                "status": row[18],
                "impact_metrics": safe_json_loads(row[19], {
                    "participants_target": 0,
                    "skills_developed": 0,
                    "projects_created": 0,
                    "employment_generated": 0
                }),
                "marketing_highlights": safe_json_loads(row[20], []),
                "success_metrics": safe_json_loads(row[21], []),
                "sections": safe_json_loads(row[22], []),
                "social_media_posts": [],
                "created_at": row[23],
                "updated_at": row[24]
            }
            
            # Fetch social media posts for this event
            cursor.execute("SELECT * FROM social_media_posts WHERE event_id = ?", (event["id"],))
            posts_data = cursor.fetchall()
            event["social_media_posts"] = [
                {
                    "id": post["id"],
                    "platform": post["platform"],
                    "content": post["content"],
                    "image_url": post["image_url"],
                    "scheduled_at": post["scheduled_at"],
                    "status": post["status"]
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
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "category": row["category"],
                "event_id": row["event_id"],
                "event_name": row["event_name"],
                "event_type": row["event_type"],
                "team_members": safe_json_loads(row["team_members"], []),
                "technologies": safe_json_loads(row["technologies"], []),
                "impact_metrics": safe_json_loads(row["impact_metrics"], {}),
                "funding_status": row["funding_status"],
                "funding_amount": row["funding_amount"],
                "funding_goal": row["funding_goal"],
                "location": row["location"],
                "state": row["state"],
                "created_by": row["created_by"],
                "created_at": row["created_at"],
                "completed_at": row["completed_at"],
                "status": row["status"],
                "media": safe_json_loads(row["media"], {}),
                "testimonials": safe_json_loads(row["testimonials"], []),
                "awards": safe_json_loads(row["awards"], []),
                "tags": safe_json_loads(row["tags"], [])
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
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "category": row["category"],
                "event_id": row["event_id"],
                "event_name": row["event_name"],
                "event_type": row["event_type"],
                "team_members": team_members,  # Now using relational data
                "technologies": json.loads(row["technologies"]) if row["technologies"] else [],
                "impact_metrics": json.loads(row["impact_metrics"]) if row["impact_metrics"] else {},
                "funding_status": row["funding_status"],
                "funding_amount": row["funding_amount"],
                "funding_goal": row["funding_goal"],
                "location": row["location"],
                "state": row["state"],
                "created_by": row["created_by"],
                "created_at": row["created_at"],
                "completed_at": row["completed_at"],
                "status": row["status"],
                "media": json.loads(row["media"]) if row["media"] else {},
                "testimonials": json.loads(row["testimonials"]) if row["testimonials"] else [],
                "awards": json.loads(row["awards"]) if row["awards"] else [],
                "tags": json.loads(row["tags"]) if row["tags"] else []
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
                "id": row['id'],
                "phone": row['phone'],
                "user_type": row['user_type'],
                "name": row['name'],
                "organization": row['organization'],
                "is_active": row['is_active'],
                "is_verified": row['is_verified'],
                "created_at": row['created_at'],
                "last_login": row['last_login'],
                "skills": row['skills'] if len(row) > 9 else None
            }
            users.append(user)
        conn.close()
        return users
    except Exception as e:
        print(f"Error searching users: {e}")

async def get_jobs(limit: int = 20):
    """Get recent job postings with enhanced Skill India data"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, job_title, company_name, location, salary_range, description,
               industry, sector, job_type, employment_type, experience_required, 
               skills_required, posted_date, application_deadline, tags, source, 
               is_active, created_at, title, company, company_contact, pay
        FROM job_postings 
        WHERE is_active = 1 
        ORDER BY created_at DESC 
        LIMIT ?
    """, (limit,))
    jobs = cursor.fetchall()
    conn.close()

    return [
        {
            "id": job["id"],
            "job_title": job["job_title"] or job["title"],  # Use enhanced job_title or fallback to title
            "title": job["job_title"] or job["title"],
            "company_name": job["company_name"] or job["company"],  # Use enhanced company_name or fallback to company
            "company": job["company_name"] or job["company"],
            "location": job["location"],
            "salary_range": job["salary_range"] or job["pay"],  # Use enhanced salary_range or fallback to pay
            "pay": job["salary_range"] or job["pay"],
            "description": job["description"],
            "industry": job["industry"],
            "sector": job["sector"],
            "job_type": job["job_type"],
            "employment_type": job["employment_type"],
            "experience_required": job["experience_required"],
            "skills_required": json.loads(job["skills_required"]) if job["skills_required"] else [],
            "posted_date": job["posted_date"],
            "application_deadline": job["application_deadline"],
            "tags": json.loads(job["tags"]) if job["tags"] else [],
            "source": job["source"],
            "is_active": job["is_active"],
            "created_at": job["created_at"],
            "company_contact": job["company_contact"]
        }
        for job in jobs
    ]

##TODO checker if args matches UserInfo
from pydantic import BaseModel
class UserInfo(BaseModel):
    user_info: str  # Input from the user for job recommendation
async def recommend_job(user_info: UserInfo):
    """
    Recommend the best job for a user based on their information using the smart recommendation system.
    """
    try:
        # Use the smart recommendation API from routes_jobs
        from api.routes_jobs import smart_recommend_job
        job_result = await smart_recommend_job(user_info)
        
        if job_result and job_result.get('best_job'):
            # Format the response to match the frontend expectations
            best_job = job_result['best_job']
            alternative_jobs = job_result.get('alternative_jobs', [])
            
            # Convert to jobs list format expected by frontend
            jobs = [best_job]
            if alternative_jobs:
                jobs.extend(alternative_jobs)
            
            return jobs
        else:
            # Fallback to basic job list if no specific recommendation found
            return await get_jobs(limit=5)
            
    except Exception as e:
        print(f"Error in smart job recommendation: {e}")
        # Fallback to the original recommendation logic
        try:
            from core.job_recommender import get_all_job_names, get_relevant_jobs, load_selected_jobs, find_best_job
            all_job_names = await get_all_job_names()
            relevant_job_names = await get_relevant_jobs(user_info.user_info, all_job_names)
            print('Got relevant job names:', relevant_job_names)
            relevant_jobs = await load_selected_jobs(relevant_job_names.get('relevant_jobs', []) if isinstance(relevant_job_names, dict) else relevant_job_names)
            best_job = await find_best_job(user_info.user_info, relevant_jobs)
            print(best_job)
            if best_job:
                return [best_job]
            else:
                return await get_jobs(limit=5)
        except Exception as fallback_error:
            print(f"Error in fallback job recommendation: {fallback_error}")
            return await get_jobs(limit=5)

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
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "target_group": row["target_group"],
                "benefits": row["benefits"],
                "eligibility": row["eligibility"],
                "application_process": row["application_process"],
                "documents_required": row["documents_required"],
                "contact_info": row["contact_info"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
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
            "user_id": profile_data["user_id"],
            "user_type": profile_data["user_type"],
            "name": profile_data["name"],
            "organization": profile_data["organization"],
            "location": profile_data["location"],
            "state": profile_data["state"],
            "skills": safe_json_loads(profile_data["skills"], []),
            "experience": profile_data["experience"],
            "goals": profile_data["goals"],
            "impact_metrics": safe_json_loads(profile_data["impact_metrics"], {}),
            "achievements": safe_json_loads(profile_data["achievements"], []),
            "recent_activities": safe_json_loads(profile_data["recent_activities"], []),
            "recommendations": safe_json_loads(profile_data["recommendations"], []),
            "networking_suggestions": safe_json_loads(profile_data["networking_suggestions"], []),
            "created_at": profile_data["created_at"],
            "updated_at": profile_data["updated_at"],
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
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "target_group": row["target_group"],
                "benefits": row["benefits"],
                "eligibility": row["eligibility"],
                "application_process": row["application_process"],
                "documents_required": row["documents_required"],
                "contact_info": row["contact_info"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
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

async def recommend_courses(user_query: str):
    """
    AI-powered course recommendation based on user query
    """
    query = user_query.strip()
    
    if not query:
        return {
            "courses": [],
            "total_found": 0,
            "query": query,
            "message": "Query cannot be empty"
        }
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all available courses (remove limit to search through everything)
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
            "id": course[0],
            "name": course[1],
            "link": course[2],
            "category": course[3],
            "skill_level": course[4],
            "duration": course[5],
            "provider": course[6],
            "description": course[7] or "No description available",
            "tags": json.loads(course[8]) if course[8] else []
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
7. Select up to 8 most relevant courses
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
        # Get AI recommendation using the skill_tutorial LLM function
        from core.skill_tutorial import llama_chat_completion as get_llm_response
        ai_response = await get_llm_response(ai_prompt)
        
        # Parse AI response
        try:
            ai_data = json.loads(ai_response)
        except json.JSONDecodeError:
            # Fallback to enhanced matching if AI response is malformed
            return await enhanced_fallback_recommendation(query, courses_context)
        
        # Build final response with course details
        recommended_courses = []
        
        for rec in ai_data.get("recommendations", [])[:8]:  # Limit to 8 courses
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
        # Fallback to enhanced matching
        return await enhanced_fallback_recommendation(query, courses_context)

async def enhanced_fallback_recommendation(query: str, courses_context: list):
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
    
    # Sort by score and take top 8
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

from api.routes_jobs import analyze_user_intent_with_ai, get_jobs_based_on_ai_analysis, score_jobs_with_ai, format_job_response
async def smart_recommend_job(user_info: UserInfo):
    """
    AI-powered smart job recommendation using Llama model via Groq
    """
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        user_text = user_info.user_info.lower()
        
        # Step 1: Use AI to analyze user intent and extract key information
        intent_analysis = await analyze_user_intent_with_ai(user_text)
        
        # Step 2: Get relevant jobs based on AI analysis
        jobs = await get_jobs_based_on_ai_analysis(cursor, intent_analysis, user_text)
        
        if not jobs:
            conn.close()
            return {"best_job": None, "alternative_jobs": [], "message": "No relevant jobs found. Please try a different search."}
        
        # Step 3: Use AI to score and rank jobs
        scored_jobs = await score_jobs_with_ai(jobs, user_text, intent_analysis)
        
        conn.close()
        
        if not scored_jobs:
            return {"best_job": None, "alternative_jobs": [], "message": "No relevant jobs found. Please try a different search."}

        # Format the best job and alternatives
        best_job_formatted = format_job_response(scored_jobs[0][1], scored_jobs[0][0])
        alternative_jobs_formatted = [
            format_job_response(job_data[1], job_data[0]) for job_data in scored_jobs[1:6]
        ]
        stuff =  {
            "best_job": best_job_formatted,
            "alternative_jobs": alternative_jobs_formatted,
            "ai_analysis": intent_analysis
        }
        print(stuff)
        return stuff
        
    except Exception as e:
        print(f"Error in AI-powered recommendation: {str(e)}")
        # Fallback to the original smart recommendation
        return await smart_recommend_job_fallback(user_info)


async def smart_recommend_job_fallback(user_info: UserInfo):
    """
    Fallback to original smart recommendation if AI fails
    """
    conn = get_db()
    cursor = conn.cursor()
    
    user_text = user_info.user_info.lower()
    
    # Add delivery/logistics to skill categories
    skill_keywords = {
        'delivery': ['delivery', 'driver', 'courier', 'logistics', 'transport', 'fleet', 'dispatch', 'shipping', 'swiggy', 'zomato', 'dunzo'],
        'software': ['software', 'developer', 'programming', 'coding', 'python', 'java', 'javascript', 'react', 'node', 'web', 'app', 'frontend', 'backend', 'fullstack', 'mobile', 'android', 'ios'],
        'sales': ['sales', 'marketing', 'business', 'customer', 'client', 'revenue', 'target', 'account', 'relationship', 'telesales'],
        'healthcare': ['nurse', 'doctor', 'medical', 'healthcare', 'hospital', 'clinic', 'patient', 'pharmacy', 'therapy'],
        'education': ['teacher', 'education', 'tutor', 'instructor', 'training', 'academic', 'professor', 'coach', 'school'],
        'engineering': ['engineer', 'technical', 'mechanical', 'civil', 'electrical', 'design', 'manufacturing', 'quality'],
        'finance': ['finance', 'accounting', 'bank', 'investment', 'analyst', 'financial', 'audit', 'tax', 'insurance', 'advisor'],
        'management': ['manager', 'management', 'supervisor', 'lead', 'director', 'coordinator', 'admin', 'executive'],
        'operations': ['operations', 'logistics', 'supply', 'warehouse', 'procurement', 'planning'],
        'design': ['design', 'creative', 'graphics', 'ui', 'ux', 'visual', 'artist', 'architect'],
        'hospitality': ['hotel', 'restaurant', 'hospitality', 'chef', 'food', 'service', 'tourism'],
        'manufacturing': ['manufacturing', 'production', 'factory', 'assembly', 'quality', 'maintenance'],
        'retail': ['retail', 'store', 'cashier', 'merchandise', 'inventory', 'shop'],
        'analyst': ['analyst', 'research', 'data', 'insights']
    }
    
    # Score jobs based on user input - improved algorithm
    user_skills = []
    user_categories = []
    
    # Extract keywords from user query
    user_words = [word for word in user_text.split() if len(word) > 2 and word not in ['the', 'and', 'for', 'job', 'work', 'looking', 'want', 'i']]

    for category, keywords in skill_keywords.items():
        matches = sum(1 for keyword in keywords if keyword in user_words)
        if matches > 0:
            user_skills.extend([kw for kw in keywords if kw in user_words])
            user_categories.append(category)

    # If no categories matched, use the user's words as skills
    if not user_skills:
        user_skills.extend(user_words)

    # Extract experience level with better detection
    experience_level = "0"
    if any(word in user_text for word in ['senior', 'experienced', '5+', 'five', 'lead', 'principal', 'expert']):
        experience_level = "60"
    elif any(word in user_text for word in ['mid', 'intermediate', '2-5', 'few years', '3 year', '4 year']):
        experience_level = "24"
    elif any(word in user_text for word in ['junior', 'fresher', 'entry', 'new', 'graduate', 'beginner']):
        experience_level = "0"
    
    # Build diversified query based on user input
    if user_skills:
        # Create a comprehensive search that includes direct keyword matching
        skill_conditions = []
        
        # Add skill-based conditions
        for skill in set(user_skills): # Use set to avoid duplicate conditions
            skill_conditions.append(f"(job_title LIKE '%{skill}%' OR description LIKE '%{skill}%' OR industry LIKE '%{skill}%' OR tags LIKE '%{skill}%')")
        
        if skill_conditions:
            query = f"""
                SELECT id, job_title, company_name, location, salary_range, description,
                       industry, sector, job_type, employment_type, experience_required, 
                       skills_required, posted_date, application_deadline, tags, source, 
                       is_active, created_at, title, company, company_contact, pay, apply_url,
                       -- Scoring for relevance
                       (CASE 
                            WHEN experience_required <= ? THEN 3
                            WHEN experience_required <= ? THEN 2 
                            ELSE 1 
                       END) as exp_score
                FROM job_postings 
                WHERE is_active = 1 
                AND ({' OR '.join(skill_conditions)})
                ORDER BY exp_score DESC, created_at DESC
                LIMIT 30
            """
            params = [experience_level, str(int(experience_level) + 24)]
        else:
            # Fallback to general search if no skill conditions were generated
            query = """
                SELECT id, job_title, company_name, location, salary_range, description,
                       industry, sector, job_type, employment_type, experience_required, 
                       skills_required, posted_date, application_deadline, tags, source, 
                       is_active, created_at, title, company, company_contact, pay, apply_url,
                       1 as exp_score
                FROM job_postings 
                WHERE is_active = 1
                ORDER BY created_at DESC 
                LIMIT 15
            """
            params = []
        
    else:
        # Default query for diverse recent jobs when no specific input
        query = """
            SELECT id, job_title, company_name, location, salary_range, description,
                   industry, sector, job_type, employment_type, experience_required, 
                   skills_required, posted_date, application_deadline, tags, source, 
                   is_active, created_at, title, company, company_contact, pay, apply_url,
                   1 as exp_score
            FROM job_postings 
            WHERE is_active = 1
            AND industry IS NOT NULL
            ORDER BY 
                CASE 
                    WHEN industry IN ('Information Technology', 'Software', 'Healthcare', 'Education', 'Finance') THEN 1
                    ELSE 0
                END DESC,
                created_at DESC 
            LIMIT 15
        """
        params = []
    
    cursor.execute(query, params)
    jobs = cursor.fetchall()
    conn.close()
    
    if jobs:
        # Score and rank jobs based on relevance with diversity
        scored_jobs = []
        for job in jobs:
            score = 0
            # Use string keys for dict-like access, with safety for both Row and dict types
            def safe_get(j, key):
                if isinstance(j, dict):
                    return j.get(key, "")
                try:
                    return j[key]
                except (KeyError, IndexError, TypeError):
                    return ""
            job_title_lower = (safe_get(job, "job_title") or safe_get(job, "title") or "").lower()
            description_lower = (safe_get(job, "description") or "").lower()
            industry_lower = (safe_get(job, "industry") or "").lower()
            tags_lower = (safe_get(job, "tags") or "").lower()
            job_text = f"{job_title_lower} {description_lower} {industry_lower} {tags_lower}"
            
            # Direct exact phrase matching gets highest score
            if user_text in job_text:
                score += 20
            
            # Score based on individual user input keywords
            for word in user_words:
                if word in job_text:
                    score += 5
            
            # Boost for exact job title matches
            if any(word in job_title_lower for word in user_words):
                score += 10

            # Boost for matching category keywords
            for cat in user_categories:
                for keyword in skill_keywords.get(cat, []):
                    if keyword in job_text:
                        score += 2
            
            # Negative score for mismatches
            if "analyst" in user_categories and "delivery" in job_title_lower:
                score -= 10
            if "delivery" in user_categories and "analyst" in job_title_lower:
                score -= 10

            scored_jobs.append((score, job))
        
        # Sort by score and get best jobs
        scored_jobs.sort(key=lambda x: x[0], reverse=True)
        
        # Remove duplicates by job_title and company_name
        seen_jobs = set()
        unique_scored_jobs = []
        for score, job in scored_jobs:
            # Use string keys if possible, fallback to index if not a dict
            if isinstance(job, dict):
                job_title = job.get("job_title") or job.get("title")
                company_name = job.get("company_name") or job.get("company")
            else:
                # Fallback for Row or tuple-like
                try:
                    job_title = job["job_title"] if "job_title" in job.keys() else job["title"]
                except Exception:
                    job_title = job[1] if len(job) > 1 else (job[18] if len(job) > 18 else None)
                try:
                    company_name = job["company_name"] if "company_name" in job.keys() else job["company"]
                except Exception:
                    company_name = job[2] if len(job) > 2 else (job[19] if len(job) > 19 else None)
            job_key = (job_title, company_name)
            if job_key not in seen_jobs:
                seen_jobs.add(job_key)
                unique_scored_jobs.append((score, job))
        
        # Filter out jobs with a score of 0 unless we have very few results
        final_jobs = [job for score, job in unique_scored_jobs if score > 0]
        if len(final_jobs) < 5:
             final_jobs = [job for score, job in unique_scored_jobs][:10]


        if not final_jobs:
            return {"best_job": None, "alternative_jobs": [], "message": "No relevant jobs found. Please try a different search."}

        best_job_data = unique_scored_jobs[0]
        best_job_formatted = format_job_response(best_job_data[1], best_job_data[0])

        alternative_jobs_formatted = [
            format_job_response(job_data[1], job_data[0]) for job_data in unique_scored_jobs[1:6]
        ]
        
        return {
            "best_job": best_job_formatted,
            "alternative_jobs": alternative_jobs_formatted
        }
    else:
        return {"best_job": None, "alternative_jobs": [], "message": "No matching jobs found. Try different keywords or check back later for new opportunities."}

