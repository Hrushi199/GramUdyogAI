"""
Helper functions to fetch data for AI Assistant feature renderers
"""
import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
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
