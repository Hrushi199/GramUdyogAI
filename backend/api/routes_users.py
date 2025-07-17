from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
from datetime import datetime
import json
import logging
from api.routes_auth import get_current_user
from init_db import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Models
class UserUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    is_active: Optional[bool] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[str] = None
    goals: Optional[str] = None

def get_db():
    """Get database connection with row factory for dictionary access"""
    conn = sqlite3.connect('gramudyogai.db')
    conn.row_factory = sqlite3.Row  # This makes rows accessible by column name
    return conn

@router.get("/users")
async def get_users(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_type: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Get all users with optional filtering"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        query = "SELECT id, phone, user_type, name, organization, is_active, created_at, last_login FROM users WHERE 1=1"
        params = []
        
        if user_type:
            query += " AND user_type = ?"
            params.append(user_type)
        
        if is_active is not None:
            query += " AND is_active = ?"
            params.append(is_active)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        users_data = cursor.fetchall()
        
        users = []
        for row in users_data:
            user = {
                "id": row['id'],
                "phone": row['phone'],
                "user_type": row['user_type'],
                "name": row['name'],
                "organization": row['organization'],
                "is_active": bool(row['is_active']),
                "is_verified": True,
                "created_at": row['created_at'],
                "last_login": row['last_login']
            }
            users.append(user)
        
        conn.close()
        return users
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/search")
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
        logger.error(f"Error searching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}")
async def get_user_by_id(user_id: int):
    """Get a specific user by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, phone, user_type, name, organization, is_active, is_verified, created_at, last_login 
            FROM users WHERE id = ?
        """, (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = {
            "id": row['id'],
            "phone": row['phone'],
            "user_type": row['user_type'],
            "name": row['name'],
            "organization": row['organization'],
            "is_active": bool(row['is_active']),
            "is_verified": bool(row['is_verified']),
            "created_at": row['created_at'],
            "last_login": row['last_login']
        }
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
async def update_user(user_id: int, user_update: UserUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update a user (only the user themselves or admin can update)"""
    try:
        # Check if user is updating their own profile or is admin
        if current_user["id"] != user_id and current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this user")
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if user_update.name is not None:
            update_fields.append("name = ?")
            params.append(user_update.name)
        
        if user_update.organization is not None:
            update_fields.append("organization = ?")
            params.append(user_update.organization)
        
        if user_update.is_active is not None:
            update_fields.append("is_active = ?")
            params.append(user_update.is_active)
        
        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(user_id)
            
            query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            conn.close()
            
            return await get_user_by_id(user_id)
        else:
            conn.close()
            return await get_user_by_id(user_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a user (only admin can delete users)"""
    try:
        # Check if user is admin
        if current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete users")
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Soft delete by setting is_active to False
        cursor.execute("UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?", 
                      (datetime.now().isoformat(), user_id))
        
        conn.commit()
        conn.close()
        
        return {"message": "User deactivated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: int):
    """Get user statistics and metrics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user's projects count
        cursor.execute("SELECT COUNT(*) as count FROM projects WHERE created_by = ?", (user_id,))
        projects_count = cursor.fetchone()['count']
        
        # Get user's events count (as organizer)
        cursor.execute("SELECT COUNT(*) as count FROM events WHERE created_by = ?", (user_id,))
        events_count = cursor.fetchone()['count']
        
        # Get user's event participations
        cursor.execute("SELECT COUNT(*) as count FROM event_participants WHERE user_id = ?", (user_id,))
        participations_count = cursor.fetchone()['count']
        
        # Get user's team memberships
        cursor.execute("SELECT COUNT(*) as count FROM project_team_members WHERE user_id = ?", (user_id,))
        team_memberships_count = cursor.fetchone()['count']
        
        conn.close()
        
        return {
            "user_id": user_id,
            "projects_created": projects_count,
            "events_organized": events_count,
            "events_participated": participations_count,
            "team_memberships": team_memberships_count,
            "total_activities": projects_count + events_count + participations_count + team_memberships_count
        }
        
    except Exception as e:
        logger.error(f"Error fetching user stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/achievements")
async def get_user_achievements(user_id: int):
    """Get user achievements based on their activities"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        achievements = []
        
        # Get projects created achievements
        cursor.execute("SELECT COUNT(*) as count FROM projects WHERE created_by = ?", (user_id,))
        projects_count = cursor.fetchone()['count']
        
        if projects_count >= 1:
            achievements.append({
                "id": 1,
                "title": "Project Creator",
                "description": f"Created {projects_count} project{'s' if projects_count > 1 else ''}",
                "type": "project",
                "earned_at": None,
                "badge_color": "blue"
            })
        
        if projects_count >= 5:
            achievements.append({
                "id": 2,
                "title": "Project Master",
                "description": f"Created {projects_count} projects",
                "type": "project",
                "earned_at": None,
                "badge_color": "gold"
            })
        
        # Get events organized achievements
        cursor.execute("SELECT COUNT(*) as count FROM events WHERE created_by = ?", (user_id,))
        events_count = cursor.fetchone()['count']
        
        if events_count >= 1:
            achievements.append({
                "id": 3,
                "title": "Event Organizer",
                "description": f"Organized {events_count} event{'s' if events_count > 1 else ''}",
                "type": "event",
                "earned_at": None,
                "badge_color": "green"
            })
        
        # Get participation achievements
        cursor.execute("SELECT COUNT(*) as count FROM event_participants WHERE user_id = ?", (user_id,))
        participations_count = cursor.fetchone()['count']
        
        if participations_count >= 1:
            achievements.append({
                "id": 4,
                "title": "Active Participant",
                "description": f"Participated in {participations_count} event{'s' if participations_count > 1 else ''}",
                "type": "participation",
                "earned_at": None,
                "badge_color": "purple"
            })
        
        # Get team membership achievements
        cursor.execute("SELECT COUNT(*) as count FROM project_team_members WHERE user_id = ?", (user_id,))
        team_memberships_count = cursor.fetchone()['count']
        
        if team_memberships_count >= 1:
            achievements.append({
                "id": 5,
                "title": "Team Player",
                "description": f"Member of {team_memberships_count} project team{'s' if team_memberships_count > 1 else ''}",
                "type": "team",
                "earned_at": None,
                "badge_color": "orange"
            })
        
        return achievements
        
    except Exception as e:
        logger.error(f"Error fetching user achievements: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/activities")
async def get_user_activities(user_id: int, limit: int = Query(10, ge=1, le=50)):
    """Get user recent activities"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        activities = []
        
        # Get recent projects
        cursor.execute("""
            SELECT 'project_created' as type, title, description, created_at, id
            FROM projects 
            WHERE created_by = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        """, (user_id, limit // 2))
        
        for row in cursor.fetchall():
            activities.append({
                "id": f"project_{row['id']}",
                "type": "project_created",
                "title": f"Created project: {row['title']}",
                "description": row['description'][:100] + "..." if len(row['description']) > 100 else row['description'],
                "date": row['created_at'],
                "impact_score": 50
            })
        
        # Get recent events
        cursor.execute("""
            SELECT 'event_created' as type, title, description, created_at, id
            FROM events 
            WHERE created_by = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        """, (user_id, limit // 2))
        
        for row in cursor.fetchall():
            activities.append({
                "id": f"event_{row['id']}",
                "type": "event_created",
                "title": f"Organized event: {row['title']}",
                "description": row['description'][:100] + "..." if len(row['description']) > 100 else row['description'],
                "date": row['created_at'],
                "impact_score": 30
            })
        
        # Get recent event participations
        cursor.execute("""
            SELECT 'event_participated' as type, e.title, e.description, ep.joined_at, e.id
            FROM event_participants ep
            JOIN events e ON ep.event_id = e.id
            WHERE ep.user_id = ? 
            ORDER BY ep.joined_at DESC 
            LIMIT ?
        """, (user_id, limit // 2))
        
        for row in cursor.fetchall():
            activities.append({
                "id": f"participation_{row['id']}",
                "type": "event_participated",
                "title": f"Participated in: {row['title']}",
                "description": row['description'][:100] + "..." if len(row['description']) > 100 else row['description'],
                "date": row['joined_at'],
                "impact_score": 20
            })
        
        # Sort all activities by date
        activities.sort(key=lambda x: x['date'], reverse=True)
        
        return activities[:limit]
        
    except Exception as e:
        logger.error(f"Error fetching user activities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/recommendations")
async def get_user_recommendations(user_id: int):
    """Get personalized recommendations for user"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        recommendations = []
        
        # Get user profile to check completeness
        cursor.execute("""
            SELECT name, organization, location, state, skills, experience, goals
            FROM unified_profiles 
            WHERE user_id = ?
        """, (user_id,))
        
        profile = cursor.fetchone()
        
        if profile:
            # Check profile completeness
            missing_fields = []
            if not profile['name'] or profile['name'].strip() == '':
                missing_fields.append('name')
            if not profile['organization'] or profile['organization'] in ['None', '']:
                missing_fields.append('organization')
            if not profile['location'] or profile['location'].strip() == '':
                missing_fields.append('location')
            if not profile['skills'] or profile['skills'] == '[]':
                missing_fields.append('skills')
            if not profile['experience'] or profile['experience'].strip() == '':
                missing_fields.append('experience')
            if not profile['goals'] or profile['goals'].strip() == '':
                missing_fields.append('goals')
            
            if missing_fields:
                recommendations.append({
                    "id": 1,
                    "type": "profile",
                    "title": "Complete Your Profile",
                    "description": f"Add missing information: {', '.join(missing_fields)}",
                    "priority": "high",
                    "estimated_impact": 100
                })
        
        # Get project recommendations based on user's skills/interests
        cursor.execute("SELECT COUNT(*) as count FROM projects WHERE created_by = ?", (user_id,))
        projects_count = cursor.fetchone()['count']
        
        if projects_count == 0:
            recommendations.append({
                "id": 2,
                "type": "project",
                "title": "Create Your First Project",
                "description": "Start building your portfolio by creating your first project",
                "priority": "medium",
                "estimated_impact": 80
            })
        
        # Get event recommendations
        cursor.execute("SELECT COUNT(*) as count FROM event_participants WHERE user_id = ?", (user_id,))
        participations_count = cursor.fetchone()['count']
        
        if participations_count == 0:
            recommendations.append({
                "id": 3,
                "type": "event",
                "title": "Join an Event",
                "description": "Network and learn by participating in community events",
                "priority": "medium",
                "estimated_impact": 60
            })
        
        # Get skill recommendations
        recommendations.append({
            "id": 4,
            "type": "skill",
            "title": "Learn New Skills",
            "description": "Explore skill development opportunities to enhance your profile",
            "priority": "low",
            "estimated_impact": 40
        })
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Error fetching user recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/networking-suggestions")
async def get_user_networking_suggestions(user_id: int):
    """Get networking suggestions for user"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        suggestions = []
        
        # Get user's location for local networking
        cursor.execute("""
            SELECT location, state FROM unified_profiles WHERE user_id = ?
        """, (user_id,))
        
        profile = cursor.fetchone()
        
        if profile and profile['location']:
            suggestions.append({
                "id": 1,
                "title": f"Join events in {profile['location']}",
                "description": f"Connect with professionals in your area: {profile['location']}, {profile['state']}",
                "type": "local_networking"
            })
        
        # Get user's skills for skill-based networking
        cursor.execute("""
            SELECT skills FROM unified_profiles WHERE user_id = ?
        """, (user_id,))
        
        skills_row = cursor.fetchone()
        if skills_row and skills_row['skills']:
            try:
                skills = json.loads(skills_row['skills'])
                if skills:
                    suggestions.append({
                        "id": 2,
                        "title": f"Connect with {skills[0]} professionals",
                        "description": f"Network with others who share your {skills[0]} skills",
                        "type": "skill_networking"
                    })
            except json.JSONDecodeError:
                pass
        
        # Get event participation count for suggestions
        cursor.execute("SELECT COUNT(*) as count FROM event_participants WHERE user_id = ?", (user_id,))
        participations_count = cursor.fetchone()['count']
        
        if participations_count == 0:
            suggestions.append({
                "id": 3,
                "title": "Attend your first community event",
                "description": "Start building your network by joining local events",
                "type": "event_participation"
            })
        elif participations_count < 3:
            suggestions.append({
                "id": 4,
                "title": "Expand your network",
                "description": "Join more events to build stronger professional connections",
                "type": "network_expansion"
            })
        
        # Get projects count for collaboration suggestions
        cursor.execute("SELECT COUNT(*) as count FROM projects WHERE created_by = ?", (user_id,))
        projects_count = cursor.fetchone()['count']
        
        if projects_count == 0:
            suggestions.append({
                "id": 5,
                "title": "Start a collaborative project",
                "description": "Create projects to work with others and build your network",
                "type": "collaboration"
            })
        
        # Default networking suggestions
        if not suggestions:
            suggestions.extend([
                {
                    "id": 6,
                    "title": "Join relevant professional groups",
                    "description": "Find and connect with industry-specific communities",
                    "type": "professional_groups"
                },
                {
                    "id": 7,
                    "title": "Attend skill-building workshops",
                    "description": "Learn new skills while meeting like-minded professionals",
                    "type": "skill_workshops"
                },
                {
                    "id": 8,
                    "title": "Mentor or be mentored",
                    "description": "Build meaningful connections through mentorship",
                    "type": "mentorship"
                }
            ])
        
        return suggestions[:5]  # Return max 5 suggestions
        
    except Exception as e:
        logger.error(f"Error fetching networking suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

