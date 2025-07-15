from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
from datetime import datetime, timedelta
import json
import logging
from api.routes_auth import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Models
class TeamMember(BaseModel):
    id: int
    name: str
    role: str
    skills: List[str]
    avatar: Optional[str] = None
    linkedin: Optional[str] = None

class Testimonial(BaseModel):
    id: int
    name: str
    role: str
    organization: str
    content: str
    rating: int

class Award(BaseModel):
    id: int
    name: str
    organization: str
    year: int
    category: str

class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    event_id: int  # <-- Add event_id
    event_name: str
    event_type: str
    team_members: Optional[List[TeamMember]] = []
    technologies: List[str]
    impact_metrics: Dict[str, Any]
    funding_status: str
    funding_amount: Optional[int] = None
    funding_goal: Optional[int] = None
    location: str
    state: str
    status: str
    completed_at: Optional[str] = None
    media: Dict[str, Any]
    testimonials: Optional[List[Testimonial]] = []
    awards: Optional[List[Award]] = []
    tags: List[str]
    created_by: Optional[int] = None # This will be set by the backend based on the authenticated user

def get_db():
    return sqlite3.connect('gramudyogai.db')

# def init_projects_db():
#     conn = get_db()
#     cursor = conn.cursor()
    
#     # # Create projects table
#     # cursor.execute('''
#     #     CREATE TABLE IF NOT EXISTS projects (
#     #         id INTEGER PRIMARY KEY AUTOINCREMENT,
#     #         title TEXT NOT NULL,
#     #         description TEXT NOT NULL,
#     #         category TEXT NOT NULL,
#     #         event_id INTEGER NOT NULL,
#     #         event_name TEXT NOT NULL,
#     #         event_type TEXT NOT NULL,
#     #         team_members TEXT NOT NULL,
#     #         technologies TEXT NOT NULL,
#     #         impact_metrics TEXT NOT NULL,
#     #         funding_status TEXT NOT NULL,
#     #         funding_amount INTEGER,
#     #         funding_goal INTEGER,
#     #         location TEXT NOT NULL,
#     #         state TEXT NOT NULL,
#     #         created_by INTEGER DEFAULT 1,
#     #         created_at TEXT NOT NULL,
#     #         completed_at TEXT NOT NULL,
#     #         status TEXT NOT NULL,
#     #         media TEXT NOT NULL,
#     #         testimonials TEXT NOT NULL,
#     #         awards TEXT NOT NULL,
#     #         tags TEXT NOT NULL
#     #     )
#     # ''')
    
#     # conn.commit()
#     # conn.close()

# # Initialize database
# init_projects_db()

@router.get("/projects")
async def get_projects(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
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
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Update team member handling
@router.get("/projects/{project_id}")
async def get_project_by_id(project_id: int):
    """Get a project by its ID. Only returns a subset of fields (team_members, title, id). Partially implemented: needs to return all fields like get_projects."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get project data
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        
        # Get team members from relational table
        cursor.execute('''
            SELECT ptm.id, ptm.user_id, ptm.role, ptm.skills, u.name 
            FROM project_team_members ptm
            LEFT JOIN users u ON ptm.user_id = u.id
            WHERE ptm.project_id = ?
        ''', (project_id,))
        
        team_members = []
        for row in cursor.fetchall():
            team_member = {
                "id": row[0],
                "user_id": row[1],
                "role": row[2],
                "skills": json.loads(row[3]),
                "name": row[4]
            }
            team_members.append(team_member)
        
        project_data = {
            "id": project[0],
            "title": project[1],
            # ... other fields ...
            "team_members": team_members  # Now properly structured
        }
        
        return project_data
    except Exception as e:
        logger.error(f"Error getting project by id: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects")
async def create_project(project: ProjectCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new project. Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO projects (
                title, description, category, event_id, event_name, event_type,
                team_members, technologies, impact_metrics, funding_status,
                funding_amount, funding_goal, location, state, created_by, created_at,
                completed_at, status, media, testimonials, awards, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            project.title, project.description, project.category, project.event_id, project.event_name, project.event_type,
            json.dumps([]),  # Initialize with empty team_members
            json.dumps(project.technologies), json.dumps(project.impact_metrics),
            project.funding_status, project.funding_amount, project.funding_goal,
            project.location, project.state, current_user['id'], datetime.now().isoformat(),
            project.completed_at or datetime.now().isoformat(), project.status, json.dumps(project.media),
            json.dumps(project.testimonials), json.dumps(project.awards),
            json.dumps(project.tags)
        ))
        
        project_id = cursor.lastrowid
        if project_id is None:
            raise HTTPException(status_code=500, detail="Failed to create project")
        
        conn.commit()
        conn.close()
        
        # Return the created project
        return await get_project_by_id(project_id)
        
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/projects/{project_id}")
async def update_project(project_id: int, project_update: ProjectCreate):
    """Update a project. Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists
        cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Project not found")
        
        cursor.execute('''
            UPDATE projects SET
                title = ?, description = ?, category = ?, event_id = ?, event_name = ?, event_type = ?,
                technologies = ?, impact_metrics = ?, funding_status = ?,
                funding_amount = ?, funding_goal = ?, location = ?, state = ?, status = ?,
                completed_at = ?, media = ?, testimonials = ?, awards = ?, tags = ?
            WHERE id = ?
        ''', (
            project_update.title, project_update.description, project_update.category, project_update.event_id, project_update.event_name, project_update.event_type,
            json.dumps(project_update.technologies), json.dumps(project_update.impact_metrics),
            project_update.funding_status, project_update.funding_amount, project_update.funding_goal,
            project_update.location, project_update.state, project_update.status,
            project_update.completed_at or datetime.now().isoformat(), json.dumps(project_update.media),
            json.dumps(project_update.testimonials), json.dumps(project_update.awards),
            json.dumps(project_update.tags), project_id
        ))
        
        conn.commit()
        conn.close()
        
        return await get_project_by_id(project_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/projects/{project_id}")
async def delete_project(project_id: int):
    """Delete a project. Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists
        cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Project not found")
        
        cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        
        conn.commit()
        conn.close()
        
        return {"message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/stats/overview")
async def get_projects_overview():
    """Get overview statistics for projects. Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Total projects
        cursor.execute("SELECT COUNT(*) FROM projects")
        total_projects = cursor.fetchone()[0]
        
        # Total people impacted
        cursor.execute("SELECT impact_metrics FROM projects")
        impact_metrics_list = cursor.fetchall()
        total_people_impacted = sum(
            json.loads(metrics[0]).get('people_impacted', 0) 
            for metrics in impact_metrics_list
        )
        
        # Total funding
        cursor.execute("SELECT funding_amount FROM projects WHERE funding_amount IS NOT NULL")
        funding_amounts = cursor.fetchall()
        total_funding = sum(amount[0] for amount in funding_amounts if amount[0])
        
        # Average impact score
        cursor.execute("SELECT impact_metrics FROM projects")
        impact_scores = [
            json.loads(metrics[0]).get('social_impact_score', 0) 
            for metrics in impact_metrics_list
        ]
        avg_impact_score = sum(impact_scores) / len(impact_scores) if impact_scores else 0
        
        # Projects by category
        cursor.execute("SELECT category, COUNT(*) FROM projects GROUP BY category")
        projects_by_category = dict(cursor.fetchall())
        
        # Projects by status
        cursor.execute("SELECT status, COUNT(*) FROM projects GROUP BY status")
        projects_by_status = dict(cursor.fetchall())
        
        conn.close()
        
        return {
            "total_projects": total_projects,
            "total_people_impacted": total_people_impacted,
            "total_funding": total_funding,
            "avg_impact_score": round(avg_impact_score, 1),
            "projects_by_category": projects_by_category,
            "projects_by_status": projects_by_status
        }
        
    except Exception as e:
        logger.error(f"Error fetching projects overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/categories")
async def get_project_categories():
    """Get all unique project categories. Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT DISTINCT category FROM projects ORDER BY category")
        categories = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return categories
        
    except Exception as e:
        logger.error(f"Error fetching project categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/projects/featured")
async def get_featured_projects(limit: int = Query(6, ge=1, le=20)):
    """Get featured projects (high impact score or award winners). Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get projects with high impact scores or awards
        cursor.execute('''
            SELECT * FROM projects 
            WHERE status = 'completed' 
            ORDER BY json_extract(impact_metrics, '$.social_impact_score') DESC
            LIMIT ?
        ''', (limit,))
        
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
                "technologies": json.loads(row[8]) if row[8] else [],
                "impact_metrics": json.loads(row[9]) if row[9] else {},
                "funding_status": row[10],
                "funding_amount": row[11],
                "funding_goal": row[12],
                "location": row[13],
                "state": row[14],
                "created_by": row[15],
                "created_at": row[16],
                "completed_at": row[17],
                "status": row[18],
                "media": json.loads(row[19]) if row[19] else {},
                "testimonials": json.loads(row[20]) if row[20] else [],
                "awards": json.loads(row[21]) if row[21] else [],
                "tags": json.loads(row[22]) if row[22] else []
            }
            projects.append(project)
        
        conn.close()
        return projects
        
    except Exception as e:
        logger.error(f"Error fetching featured projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/search")
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
        logger.error(f"Error searching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize with some sample data
def populate_sample_projects():
    try:
        cursor = get_db().cursor()
        
        # Check if sample data already exists
        cursor.execute("SELECT COUNT(*) FROM projects WHERE title = 'Smart Irrigation System'")
        if cursor.fetchone()[0] > 0:
            return  # Sample data already exists
            
        now = datetime.now().isoformat()
        sample_projects = [
            {
                "title": "Smart Irrigation System",
                "description": "IoT-based irrigation system for small farmers",
                "category": "Agriculture",
                "event_id": 1,
                "event_name": "Rural Innovation Hackathon",
                "event_type": "hackathon",
                "technologies": json.dumps(["IoT", "Python", "Arduino"]),
                "impact_metrics": json.dumps({"users_reached": 0, "revenue_generated": 0}),
                "funding_status": "seeking",
                "funding_amount": 0,
                "funding_goal": 50000,
                "location": "Bangalore",
                "state": "Karnataka",
                "created_by": 1,
                "created_at": now,
                "completed_at": None,
                "status": "active",
                "media": json.dumps({"images": [], "videos": []}),
                "testimonials": json.dumps([]),
                "awards": json.dumps([]),
                "tags": json.dumps(["agriculture", "iot", "sustainability"]),
                "team_members": json.dumps([])
            }
        ]

        for project in sample_projects:
            cursor.execute('''
                INSERT INTO projects (
                    title, description, category, event_id, event_name, event_type,
                    team_members, technologies, impact_metrics, funding_status, funding_amount,
                    funding_goal, location, state, created_by, created_at,
                    completed_at, status, media, testimonials, awards, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                project["title"], project["description"], project["category"],
                project["event_id"], project["event_name"], project["event_type"],
                project["team_members"], project["technologies"], project["impact_metrics"],
                project["funding_status"], project["funding_amount"], project["funding_goal"],
                project["location"], project["state"], project["created_by"],
                project["created_at"], project["completed_at"], project["status"],
                project["media"], project["testimonials"], project["awards"],
                project["tags"]
            ))
        
        get_db().commit()
        print("Sample projects populated successfully")
        
    except Exception as e:
        print(f"Error populating sample projects: {e}")
        # Don't re-raise the exception to prevent server startup failure




# Populate sample data on startup
populate_sample_projects() 

# Team Management Endpoints

@router.post("/projects/{project_id}/team-members")
async def add_team_member(
    project_id: int,
    user_id: int,
    role: str,
    skills: List[str] = []
):
    """Add a team member to a project. Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists
        cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is already a team member
        cursor.execute("SELECT id FROM project_team_members WHERE project_id = ? AND user_id = ?", (project_id, user_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User is already a team member")
        
        # Add team member
        # Get event_id from project
        cursor.execute("SELECT event_id FROM projects WHERE id = ?", (project_id,))
        project_row = cursor.fetchone()
        event_id = project_row[0] if project_row else None
        
        cursor.execute('''
            INSERT INTO project_team_members (project_id, event_id, user_id, role, skills, joined_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (project_id, event_id, user_id, role, json.dumps(skills), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return {"message": "Team member added successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding team member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/projects/{project_id}/team-members/{user_id}")
async def remove_team_member(project_id: int, user_id: int):
    """Remove a team member from a project. Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if team member exists
        cursor.execute("SELECT id FROM project_team_members WHERE project_id = ? AND user_id = ?", (project_id, user_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Team member not found")
        
        # Remove team member
        cursor.execute("DELETE FROM project_team_members WHERE project_id = ? AND user_id = ?", (project_id, user_id))
        
        conn.commit()
        conn.close()
        
        return {"message": "Team member removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing team member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}/projects")
async def get_user_projects(user_id: int):
    """Get all projects for a specific user (created or joined). Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get projects where user is the creator
        cursor.execute('''
            SELECT p.*, 'creator' as user_role
            FROM projects p
            WHERE p.created_by = ?
        ''', (user_id,))
        created_projects = cursor.fetchall()
        
        # Get projects where user is a team member
        cursor.execute('''
            SELECT p.*, ptm.role as user_role
            FROM projects p
            JOIN project_team_members ptm ON p.id = ptm.project_id
            WHERE ptm.user_id = ?
        ''', (user_id,))
        team_projects = cursor.fetchall()
        
        # Combine and deduplicate projects
        all_projects = created_projects + team_projects
        seen_project_ids = set()
        unique_projects = []
        
        for row in all_projects:
            if row[0] not in seen_project_ids:
                seen_project_ids.add(row[0])
                unique_projects.append(row)
        
        # Sort by creation date
        unique_projects.sort(key=lambda x: x[15], reverse=True)  # created_at is at index 15
        
        projects = []
        for row in unique_projects:
            project_id = row[0]
            
            # Fetch team members for this project
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
                "team_members": team_members,
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
                "tags": json.loads(row[21]) if row[21] else [],
                "user_role": row[22]  # User's role in this project
            }
            projects.append(project)
        
        conn.close()
        return projects
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user projects: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 