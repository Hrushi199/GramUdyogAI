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

# Pydantic models for request validation
class ProjectCreate(BaseModel):
    title: str
    description: str
    category: str
    event_id: int
    event_name: str
    event_type: str
    location: str
    state: str
    technologies: Optional[List[str]] = []
    funding_goal: Optional[int] = 0
    tags: Optional[List[str]] = []

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    technologies: Optional[List[str]] = None
    funding_status: Optional[str] = None
    funding_amount: Optional[int] = None
    funding_goal: Optional[int] = None
    location: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    completed_at: Optional[str] = None
    media: Optional[Dict[str, List[str]]] = None
    testimonials: Optional[List[Dict[str, str]]] = None
    awards: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class ProjectTeamMemberCreate(BaseModel):
    project_id: int
    user_id: int
    event_id: Optional[int] = None
    role: str
    skills: List[str]

class ProjectTeamMemberUpdate(BaseModel):
    role: Optional[str] = None
    skills: Optional[List[str]] = None

class ProjectInvestmentCreate(BaseModel):
    project_id: int
    investor_name: str
    investor_email: Optional[str] = None
    investor_phone: str
    investment_amount: int
    investment_type: str  # equity, loan, grant, partnership
    equity_percentage: Optional[float] = 0
    expected_returns: str
    terms_conditions: Optional[str] = None
    message: Optional[str] = None

class ProjectInvestmentUpdate(BaseModel):
    status: str  # pending, accepted, rejected, negotiating
    response_message: Optional[str] = None

@router.get("/projects")
async def get_projects(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None,
    status: Optional[str] = None,
    event_id: Optional[int] = None
):
    """Get all projects with optional filtering"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        query = """
            SELECT id, title, description, category, event_id, event_name, event_type,
                   team_members, technologies, impact_metrics, funding_status, funding_amount,
                   funding_goal, location, state, created_by, created_at, completed_at,
                   status, media, testimonials, awards, tags
            FROM projects WHERE 1=1
        """
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
        
        if status:
            query += " AND status = ?"
            params.append(status)
        
        if event_id:
            query += " AND event_id = ?"
            params.append(event_id)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        projects_data = cursor.fetchall()
        
        projects = []
        for row in projects_data:
            project = {
                "id": row['id'],
                "title": row['title'],
                "description": row['description'],
                "category": row['category'],
                "event_id": row['event_id'],
                "event_name": row['event_name'],
                "event_type": row['event_type'],
                "team_members": json.loads(row['team_members'] or '[]'),
                "technologies": json.loads(row['technologies'] or '[]'),
                "impact_metrics": json.loads(row['impact_metrics'] or '{}'),
                "funding_status": row['funding_status'],
                "funding_amount": row['funding_amount'],
                "funding_goal": row['funding_goal'],
                "location": row['location'],
                "state": row['state'],
                "created_by": row['created_by'],
                "created_at": row['created_at'],
                "completed_at": row['completed_at'],
                "status": row['status'],
                "media": json.loads(row['media'] or '{"images": [], "videos": []}'),
                "testimonials": json.loads(row['testimonials'] or '[]'),
                "awards": json.loads(row['awards'] or '[]'),
                "tags": json.loads(row['tags'] or '[]')
            }
            projects.append(project)
        
        conn.close()
        return projects
        
    except Exception as e:
        logger.error(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{project_id}")
async def get_project_by_id(project_id: int):
    """Get a specific project by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, title, description, category, event_id, event_name, event_type,
                   team_members, technologies, impact_metrics, funding_status, funding_amount,
                   funding_goal, location, state, created_by, created_at, completed_at,
                   status, media, testimonials, awards, tags
            FROM projects WHERE id = ?
        """, (project_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = {
            "id": row['id'],
            "title": row['title'],
            "description": row['description'],
            "category": row['category'],
            "event_id": row['event_id'],
            "event_name": row['event_name'],
            "event_type": row['event_type'],
            "team_members": json.loads(row['team_members'] or '[]'),
            "technologies": json.loads(row['technologies'] or '[]'),
            "impact_metrics": json.loads(row['impact_metrics'] or '{}'),
            "funding_status": row['funding_status'],
            "funding_amount": row['funding_amount'],
            "funding_goal": row['funding_goal'],
            "location": row['location'],
            "state": row['state'],
            "created_by": row['created_by'],
            "created_at": row['created_at'],
            "completed_at": row['completed_at'],
            "status": row['status'],
            "media": json.loads(row['media'] or '{"images": [], "videos": []}'),
            "testimonials": json.loads(row['testimonials'] or '[]'),
            "awards": json.loads(row['awards'] or '[]'),
            "tags": json.loads(row['tags'] or '[]')
        }
        
        return project
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects")
async def create_project(project: ProjectCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new project"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verify event exists
        cursor.execute("SELECT id FROM events WHERE id = ?", (project.event_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Insert project
        cursor.execute("""
            INSERT INTO projects (
                title, description, category, event_id, event_name, event_type,
                team_members, technologies, impact_metrics, funding_status, funding_amount,
                funding_goal, location, state, created_by, created_at, status, media, testimonials, awards, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            project.title,
            project.description,
            project.category,
            project.event_id,
            project.event_name,
            project.event_type,
            json.dumps([]),  # Initialize empty team_members
            json.dumps(project.technologies),
            json.dumps({"users_reached": 0, "revenue_generated": 0}),
            "seeking",
            0,
            project.funding_goal,
            project.location,
            project.state,
            current_user["id"],
            datetime.now().isoformat(),
            "active",
            json.dumps({"images": [], "videos": []}),
            json.dumps([]),
            json.dumps([]),
            json.dumps(project.tags)
        ))
        
        project_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return await get_project_by_id(project_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/projects/{project_id}")
async def update_project(project_id: int, project_update: ProjectUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update a project (only the creator or admin can update)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists and user has permission
        cursor.execute("SELECT created_by FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        if row['created_by'] != current_user["id"] and current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update this project")
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if project_update.title is not None:
            update_fields.append("title = ?")
            params.append(project_update.title)
        
        if project_update.description is not None:
            update_fields.append("description = ?")
            params.append(project_update.description)
        
        if project_update.category is not None:
            update_fields.append("category = ?")
            params.append(project_update.category)
        
        if project_update.technologies is not None:
            update_fields.append("technologies = ?")
            params.append(json.dumps(project_update.technologies))
        
        if project_update.funding_status is not None:
            update_fields.append("funding_status = ?")
            params.append(project_update.funding_status)
        
        if project_update.funding_amount is not None:
            update_fields.append("funding_amount = ?")
            params.append(project_update.funding_amount)
        
        if project_update.funding_goal is not None:
            update_fields.append("funding_goal = ?")
            params.append(project_update.funding_goal)
        
        if project_update.location is not None:
            update_fields.append("location = ?")
            params.append(project_update.location)
        
        if project_update.state is not None:
            update_fields.append("state = ?")
            params.append(project_update.state)
        
        if project_update.status is not None:
            update_fields.append("status = ?")
            params.append(project_update.status)
        
        if project_update.completed_at is not None:
            update_fields.append("completed_at = ?")
            params.append(project_update.completed_at)
        
        if project_update.media is not None:
            update_fields.append("media = ?")
            params.append(json.dumps(project_update.media))
        
        if project_update.testimonials is not None:
            update_fields.append("testimonials = ?")
            params.append(json.dumps(project_update.testimonials))
        
        if project_update.awards is not None:
            update_fields.append("awards = ?")
            params.append(json.dumps(project_update.awards))
        
        if project_update.tags is not None:
            update_fields.append("tags = ?")
            params.append(json.dumps(project_update.tags))
        
        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(project_id)
            
            query = f"UPDATE projects SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            conn.close()
            
            return await get_project_by_id(project_id)
        else:
            conn.close()
            return await get_project_by_id(project_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/projects/{project_id}")
async def delete_project(project_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Delete a project (only creator or admin can delete, soft delete by setting status to 'deleted')"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists and user has permission
        cursor.execute("SELECT created_by FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        if row['created_by'] != current_user["id"] and current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to delete this project")
        
        # Soft delete by setting status to 'deleted'
        cursor.execute("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?",
                      ("deleted", datetime.now().isoformat(), project_id))
        
        conn.commit()
        conn.close()
        
        return {"message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects/{project_id}/team-members")
async def add_team_member(project_id: int, team_member: ProjectTeamMemberCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Add a team member to a project"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists and user has permission
        cursor.execute("SELECT created_by FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        if row['created_by'] != current_user["id"] and current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to add team members to this project")
        
        # Verify user exists
        cursor.execute("SELECT id FROM users WHERE id = ?", (team_member.user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify event_id if provided
        if team_member.event_id:
            cursor.execute("SELECT id FROM events WHERE id = ?", (team_member.event_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if team member already exists
        cursor.execute("SELECT id FROM project_team_members WHERE project_id = ? AND user_id = ?",
                      (project_id, team_member.user_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User is already a team member of this project")
        
        # Insert team member
        cursor.execute("""
            INSERT INTO project_team_members (project_id, user_id, event_id, role, skills, joined_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            project_id,
            team_member.user_id,
            team_member.event_id,
            team_member.role,
            json.dumps(team_member.skills),
            datetime.now().isoformat()
        ))
        
        team_member_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "id": team_member_id,
            "project_id": project_id,
            "user_id": team_member.user_id,
            "event_id": team_member.event_id,
            "role": team_member.role,
            "skills": team_member.skills,
            "joined_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding team member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{project_id}/team-members")
async def get_team_members(project_id: int):
    """Get all team members for a project"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, project_id, user_id, event_id, role, skills, joined_at
            FROM project_team_members WHERE project_id = ?
        """, (project_id,))
        
        team_members_data = cursor.fetchall()
        conn.close()
        
        team_members = []
        for row in team_members_data:
            team_member = {
                "id": row['id'],
                "project_id": row['project_id'],
                "user_id": row['user_id'],
                "event_id": row['event_id'],
                "role": row['role'],
                "skills": json.loads(row['skills'] or '[]'),
                "joined_at": row['joined_at']
            }
            team_members.append(team_member)
        
        return team_members
        
    except Exception as e:
        logger.error(f"Error fetching team members: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/projects/{project_id}/team-members/{team_member_id}")
async def update_team_member(project_id: int, team_member_id: int, team_member_update: ProjectTeamMemberUpdate,
                           current_user: Dict[str, Any] = Depends(get_current_user)):
    """Update a team member's role or skills"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists and user has permission
        cursor.execute("SELECT created_by FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        if row['created_by'] != current_user["id"] and current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to update team members for this project")
        
        # Check if team member exists
        cursor.execute("SELECT id FROM project_team_members WHERE id = ? AND project_id = ?",
                      (team_member_id, project_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Team member not found")
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if team_member_update.role is not None:
            update_fields.append("role = ?")
            params.append(team_member_update.role)
        
        if team_member_update.skills is not None:
            update_fields.append("skills = ?")
            params.append(json.dumps(team_member_update.skills))
        
        if update_fields:
            params.append(team_member_id)
            query = f"UPDATE project_team_members SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            conn.close()
            
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, project_id, user_id, event_id, role, skills, joined_at
                FROM project_team_members WHERE id = ?
            """, (team_member_id,))
            row = cursor.fetchone()
            conn.close()
            
            return {
                "id": row['id'],
                "project_id": row['project_id'],
                "user_id": row['user_id'],
                "event_id": row['event_id'],
                "role": row['role'],
                "skills": json.loads(row['skills'] or '[]'),
                "joined_at": row['joined_at']
            }
        else:
            conn.close()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, project_id, user_id, event_id, role, skills, joined_at
                FROM project_team_members WHERE id = ?
            """, (team_member_id,))
            row = cursor.fetchone()
            conn.close()
            
            return {
                "id": row['id'],
                "project_id": row['project_id'],
                "user_id": row['user_id'],
                "event_id": row['event_id'],
                "role": row['role'],
                "skills": json.loads(row['skills'] or '[]'),
                "joined_at": row['joined_at']
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating team member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/projects/{project_id}/team-members/{team_member_id}")
async def delete_team_member(project_id: int, team_member_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Remove a team member from a project"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists and user has permission
        cursor.execute("SELECT created_by FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        if row['created_by'] != current_user["id"] and current_user["user_type"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized to remove team members from this project")
        
        # Check if team member exists
        cursor.execute("SELECT id FROM project_team_members WHERE id = ? AND project_id = ?",
                      (team_member_id, project_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Team member not found")
        
        cursor.execute("DELETE FROM project_team_members WHERE id = ? AND project_id = ?",
                      (team_member_id, project_id))
        
        conn.commit()
        conn.close()
        
        return {"message": "Team member removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting team member: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Investment endpoints
@router.post("/projects/{project_id}/invest")
async def create_investment(
    project_id: int, 
    investment: ProjectInvestmentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new investment proposal for a project"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists
        cursor.execute("SELECT id, title, created_by FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if investor already has an investment for this project
        cursor.execute("SELECT id FROM project_investments WHERE project_id = ? AND investor_id = ?",
                      (project_id, current_user["id"]))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="You have already invested in this project")
        
        # Validate investment data
        if investment.investment_amount <= 0:
            raise HTTPException(status_code=400, detail="Investment amount must be positive")
        
        if investment.investment_type not in ['equity', 'loan', 'grant', 'partnership']:
            raise HTTPException(status_code=400, detail="Invalid investment type")
        
        if investment.investment_type == 'equity' and (investment.equity_percentage < 0 or investment.equity_percentage > 100):
            raise HTTPException(status_code=400, detail="Equity percentage must be between 0 and 100")
        
        cursor.execute('''
            INSERT INTO project_investments (
                project_id, investor_id, investor_name, investor_email, investor_phone,
                investment_amount, investment_type, equity_percentage, expected_returns,
                terms_conditions, message, status, invested_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            project_id, current_user["id"], investment.investor_name, investment.investor_email,
            investment.investor_phone, investment.investment_amount, investment.investment_type,
            investment.equity_percentage, investment.expected_returns, investment.terms_conditions,
            investment.message, 'pending', datetime.now().isoformat()
        ))
        
        investment_id = cursor.lastrowid
        
        # Create notification for project owner
        cursor.execute('''
            INSERT INTO notifications (
                user_id, title, message, notification_type, related_id, related_type,
                project_id, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            project['created_by'],
            'New Investment Proposal',
            f'{investment.investor_name} wants to invest ₹{investment.investment_amount:,} in your project "{project["title"]}"',
            'investment_proposal',
            investment_id,
            'investment',
            project_id,
            json.dumps({
                'investor_name': investment.investor_name,
                'amount': investment.investment_amount,
                'type': investment.investment_type
            }),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return {"id": investment_id, "message": "Investment proposal submitted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating investment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{project_id}/investments")
async def get_project_investments(
    project_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all investments for a specific project"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists
        cursor.execute("SELECT id, created_by FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Everyone can see all investments for a project (public information)
        cursor.execute('''
            SELECT id, investor_id, investor_name, investor_email, investor_phone,
                   investment_amount, investment_type, equity_percentage, expected_returns,
                   terms_conditions, message, status, invested_at, response_message, response_at
            FROM project_investments 
            WHERE project_id = ?
            ORDER BY invested_at DESC
        ''', (project_id,))
        
        investments_data = cursor.fetchall()
        print(f"DEBUG: Found {len(investments_data)} investments for project {project_id}")
        if investments_data:
            print(f"DEBUG: First investment: {dict(investments_data[0])}")
        conn.close()
        
        investments = []
        for row in investments_data:
            investment = {
                "id": row['id'],
                "investor_id": row['investor_id'],  # Always include investor_id since investments are public
                "investor_name": row['investor_name'],
                "investor_email": row['investor_email'],
                "investor_phone": row['investor_phone'],
                "investment_amount": row['investment_amount'],
                "investment_type": row['investment_type'],
                "equity_percentage": row['equity_percentage'],
                "expected_returns": row['expected_returns'],
                "terms_conditions": row['terms_conditions'],
                "message": row['message'],
                "status": row['status'],
                "invested_at": row['invested_at'],
                "response_message": row['response_message'],
                "response_at": row['response_at']
            }
            
            investments.append(investment)
        
        print(f"DEBUG: Returning {len(investments)} investments")
        return investments
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching investments: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/projects/{project_id}/investments/{investment_id}")
async def update_investment_status(
    project_id: int,
    investment_id: int,
    update_data: ProjectInvestmentUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update investment status (only project owner can do this)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if project exists and user is the owner
        cursor.execute("SELECT id, created_by, title FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project['created_by'] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Only project owner can update investment status")
        
        # Check if investment exists
        cursor.execute('''
            SELECT id, investor_id, investor_name, investment_amount, investment_type, status
            FROM project_investments 
            WHERE id = ? AND project_id = ?
        ''', (investment_id, project_id))
        
        investment = cursor.fetchone()
        if not investment:
            raise HTTPException(status_code=404, detail="Investment not found")
        
        # Validate status
        if update_data.status not in ['pending', 'accepted', 'rejected', 'negotiating']:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        # Update investment status
        cursor.execute('''
            UPDATE project_investments 
            SET status = ?, response_message = ?, response_at = ?
            WHERE id = ? AND project_id = ?
        ''', (
            update_data.status, 
            update_data.response_message, 
            datetime.now().isoformat(),
            investment_id, 
            project_id
        ))
        
        # Create notification for investor
        cursor.execute('''
            INSERT INTO notifications (
                user_id, title, message, notification_type, related_id, related_type,
                project_id, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            investment['investor_id'],
            f'Investment {update_data.status.title()}',
            f'Your investment proposal of ₹{investment["investment_amount"]:,} for "{project["title"]}" has been {update_data.status}',
            'investment_update',
            investment_id,
            'investment',
            project_id,
            json.dumps({
                'status': update_data.status,
                'amount': investment['investment_amount'],
                'type': investment['investment_type']
            }),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return {"message": f"Investment status updated to {update_data.status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating investment status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/investments/my")
async def get_my_investments(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all investments made by the current user"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT pi.id, pi.project_id, p.title as project_title, pi.investment_amount,
                   pi.investment_type, pi.equity_percentage, pi.expected_returns,
                   pi.status, pi.invested_at, pi.response_message, pi.response_at
            FROM project_investments pi
            JOIN projects p ON pi.project_id = p.id
            WHERE pi.investor_id = ?
            ORDER BY pi.invested_at DESC
        ''', (current_user["id"],))
        
        investments_data = cursor.fetchall()
        conn.close()
        
        investments = []
        for row in investments_data:
            investment = {
                "id": row['id'],
                "project_id": row['project_id'],
                "project_title": row['project_title'],
                "investment_amount": row['investment_amount'],
                "investment_type": row['investment_type'],
                "equity_percentage": row['equity_percentage'],
                "expected_returns": row['expected_returns'],
                "status": row['status'],
                "invested_at": row['invested_at'],
                "response_message": row['response_message'],
                "response_at": row['response_at']
            }
            investments.append(investment)
        
        return investments
        
    except Exception as e:
        logger.error(f"Error fetching user investments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}/projects")
async def get_user_projects(user_id: int):
    """Get all projects for a specific user (both created and participated)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get projects created by user
        cursor.execute("""
            SELECT p.id, p.title, p.description, p.category, p.event_id, p.event_name, p.event_type,
                   p.team_members, p.technologies, p.impact_metrics, p.funding_status, p.funding_amount,
                   p.funding_goal, p.location, p.state, p.created_by, p.created_at, p.completed_at,
                   p.status, p.media, p.testimonials, p.awards, p.tags
            FROM projects p
            WHERE p.created_by = ?
            ORDER BY p.created_at DESC
        """, (user_id,))
        
        projects = []
        for row in cursor.fetchall():
            project = {
                "id": row['id'],
                "title": row['title'],
                "description": row['description'],
                "category": row['category'],
                "event_id": row['event_id'],
                "event_name": row['event_name'],
                "event_type": row['event_type'],
                "team_members": json.loads(row['team_members']) if row['team_members'] else [],
                "technologies": json.loads(row['technologies']) if row['technologies'] else [],
                "impact_metrics": json.loads(row['impact_metrics']) if row['impact_metrics'] else {},
                "funding_status": row['funding_status'],
                "funding_amount": row['funding_amount'],
                "funding_goal": row['funding_goal'],
                "location": row['location'],
                "state": row['state'],
                "created_by": row['created_by'],
                "created_at": row['created_at'],
                "completed_at": row['completed_at'],
                "status": row['status'],
                "media": json.loads(row['media']) if row['media'] else [],
                "testimonials": json.loads(row['testimonials']) if row['testimonials'] else [],
                "awards": json.loads(row['awards']) if row['awards'] else [],
                "tags": json.loads(row['tags']) if row['tags'] else []
            }
            projects.append(project)
        
        return projects
        
    except Exception as e:
        logger.error(f"Error fetching user projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))