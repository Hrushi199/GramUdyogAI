from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
from datetime import datetime
import json
import logging
from api.routes_auth import get_current_user

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
    return sqlite3.connect('gramudyogai.db')

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
        
        query = "SELECT id, phone, user_type, name, organization, is_active, is_verified, created_at, last_login FROM users WHERE 1=1"
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
                "id": row[0],
                "phone": row[1],
                "user_type": row[2],
                "name": row[3],
                "organization": row[4],
                "is_active": bool(row[5]),
                "is_verified": bool(row[6]),
                "created_at": row[7],
                "last_login": row[8]
            }
            users.append(user)
        
        conn.close()
        return users
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
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
            "id": row[0],
            "phone": row[1],
            "user_type": row[2],
            "name": row[3],
            "organization": row[4],
            "is_active": bool(row[5]),
            "is_verified": bool(row[6]),
            "created_at": row[7],
            "last_login": row[8]
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

@router.get("/users/search")
async def search_users(query: str = Query(..., min_length=2)):
    """Search users by name or organization"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, phone, user_type, name, organization, is_active, is_verified, created_at, last_login 
            FROM users 
            WHERE (name LIKE ? OR organization LIKE ?) AND is_active = 1
            ORDER BY name
            LIMIT 20
        """, (f"%{query}%", f"%{query}%"))
        
        users_data = cursor.fetchall()
        conn.close()
        
        users = []
        for row in users_data:
            user = {
                "id": row[0],
                "phone": row[1],
                "user_type": row[2],
                "name": row[3],
                "organization": row[4],
                "is_active": bool(row[5]),
                "is_verified": bool(row[6]),
                "created_at": row[7],
                "last_login": row[8]
            }
            users.append(user)
        
        return users
        
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/stats")
async def get_user_stats(user_id: int):
    """Get user statistics and metrics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user's projects count
        cursor.execute("SELECT COUNT(*) FROM projects WHERE created_by = ?", (user_id,))
        projects_count = cursor.fetchone()[0]
        
        # Get user's events count (as organizer)
        cursor.execute("SELECT COUNT(*) FROM events WHERE created_by = ?", (user_id,))
        events_count = cursor.fetchone()[0]
        
        # Get user's event participations
        cursor.execute("SELECT COUNT(*) FROM event_participants WHERE user_id = ?", (user_id,))
        participations_count = cursor.fetchone()[0]
        
        # Get user's team memberships
        cursor.execute("SELECT COUNT(*) FROM project_team_members WHERE user_id = ?", (user_id,))
        team_memberships_count = cursor.fetchone()[0]
        
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

@router.get("/users/search")
async def search_users(query: str = Query(..., min_length=2)):
    """Search users by name or organization"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, phone, user_type, name, organization, is_active, is_verified, created_at, last_login 
            FROM users 
            WHERE (name LIKE ? OR organization LIKE ?) AND is_active = 1
            ORDER BY name
            LIMIT 20
        """, (f"%{query}%", f"%{query}%"))
        
        users_data = cursor.fetchall()
        conn.close()
        
        users = []
        for row in users_data:
            user = {
                "id": row[0],
                "phone": row[1],
                "user_type": row[2],
                "name": row[3],
                "organization": row[4],
                "is_active": bool(row[5]),
                "is_verified": bool(row[6]),
                "created_at": row[7],
                "last_login": row[8]
            }
            users.append(user)
        
        return users
        
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 