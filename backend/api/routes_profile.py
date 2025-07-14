<<<<<<< HEAD
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import json
from datetime import datetime
import logging
from api.routes_auth import get_current_user
from core.enhanced_llm import enhance_user_profile, calculate_impact_score

# Configure logging with format and stream handler
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/api/profile",
    tags=["profile"]
)

# Pydantic models
class ProfileCreate(BaseModel):
    name: str
    organization: Optional[str] = None
    location: str
    state: str
    skills: List[str]
    experience: str
    goals: str
    user_type: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[str] = None
    goals: Optional[str] = None

class AchievementCreate(BaseModel):
    title: str
    description: str
    type: str
    date: str
    impact_score: int

def get_db():
    conn = sqlite3.connect('gramudyogai.db')
    conn.row_factory = sqlite3.Row
    return conn

@router.post("/")
async def create_profile(profile_data: ProfileCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    try:
        logger.info("Current user:", current_user)  # See what we get from auth
        user_id = current_user['id']
        logger.info("User ID:", user_id)  # Check the user_id value
        logger.info("Profile data:", profile_data.dict())  # See full profile data
        
        # Set user_id in profile data

        
        conn = get_db()
        cursor = conn.cursor()
        
        # Create profile with validated data
        cursor.execute('''
            INSERT INTO unified_profiles (
                user_id, user_type, name, organization, location, state,
                skills, experience, goals, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, profile_data.user_type, profile_data.name,
            profile_data.organization, profile_data.location, profile_data.state,
            json.dumps(profile_data.skills), profile_data.experience,
            profile_data.goals, datetime.now().isoformat(), datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return {"message": "Profile created successfully", "user_id": user_id}
        
    except Exception as e:
        logger.error(f"Errorasd creating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_unified_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get unified profile for the currently authenticated user"""
    try:
        user_id = current_user['id']
        conn = get_db()
        cursor = conn.cursor()
        
        # Get base profile
        cursor.execute('''
            SELECT * FROM unified_profiles WHERE user_id = ?
        ''', (user_id,))
        
        profile_row = cursor.fetchone()
        
        if not profile_row:
            # Create a default profile if none exists
            return create_default_profile(user_id)
        
        # Parse JSON fields
        profile = {
            "id": profile_row["id"],
            "user_id": profile_row["user_id"],
            "user_type": profile_row["user_type"],
            "name": profile_row["name"],
            "organization": profile_row["organization"],
            "location": profile_row["location"],
            "state": profile_row["state"],
            "skills": json.loads(profile_row["skills"] or "[]"),
            "experience": profile_row["experience"],
            "goals": profile_row["goals"],
            "impact_metrics": json.loads(profile_row["impact_metrics"] or "{}"),
            "achievements": json.loads(profile_row["achievements"] or "[]"),
            "recent_activities": json.loads(profile_row["recent_activities"] or "[]"),
            "recommendations": json.loads(profile_row["recommendations"] or "[]"),
            "networking_suggestions": json.loads(profile_row["networking_suggestions"] or "[]"),
            "created_at": profile_row["created_at"],
            "updated_at": profile_row["updated_at"]
        }
        
        # Enhance with real-time data
        profile = await enhance_profile_with_realtime_data(profile, user_id)
        
        conn.close()
        return profile
        
    except Exception as e:
        logger.error(f"Error fetching unified profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# @router.post("/profile")
# async def create_profile(profile_data: ProfileCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
#     """Create a new user profile from voice input data"""
#     try:
#         conn = get_db()
#         cursor = conn.cursor()
        
#         # Get current user ID from JWT token
#         user_id = current_user['user_id']
        
#         # Combine skills and custom skills
#         all_skills = profile_data.skills + profile_data.customSkills
#         all_job_types = profile_data.jobTypes + profile_data.customJobTypes
        
#         # Create profile data
#         profile = {
#             "user_id": user_id,
#             "user_type": "individual",  # Default for voice profile creation
#             "name": profile_data.name,
#             "organization": None,
#             "location": f"{profile_data.district}, {profile_data.state}",
#             "state": profile_data.state,
#             "skills": json.dumps(all_skills),
#             "experience": "Beginner",  # Default
#             "goals": f"Looking for {', '.join(all_job_types)} opportunities",
#             "impact_metrics": json.dumps({
#                 "events_hosted": 0,
#                 "events_participated": 0,
#                 "projects_created": 0,
#                 "people_impacted": 0,
#                 "revenue_generated": 0,
#                 "jobs_created": 0,
#                 "social_impact_score": 0,
#                 "sustainability_score": 0
#             }),
#             "achievements": json.dumps([]),
#             "recent_activities": json.dumps([]),
#             "recommendations": json.dumps([]),
#             "networking_suggestions": json.dumps([]),
#             "created_at": datetime.now().isoformat(),
#             "updated_at": datetime.now().isoformat()
#         }
        
#         # Check if profile already exists for this user
#         cursor.execute('SELECT id FROM unified_profiles WHERE user_id = ?', (user_id,))
#         existing_profile = cursor.fetchone()
        
#         if existing_profile:
#             # Update existing profile
#             cursor.execute('''
#                 UPDATE unified_profiles SET
#                     name = ?, organization = ?, location = ?, state = ?,
#                     skills = ?, experience = ?, goals = ?, updated_at = ?
#                 WHERE user_id = ?
#             ''', (
#                 profile["name"], profile["organization"], profile["location"], 
#                 profile["state"], profile["skills"], profile["experience"], 
#                 profile["goals"], profile["updated_at"], user_id
#             ))
#         else:
#             # Create new profile
#             cursor.execute('''
#                 INSERT INTO unified_profiles (
#                     user_id, user_type, name, organization, location, state,
#                     skills, experience, goals, impact_metrics, achievements,
#                     recent_activities, recommendations, networking_suggestions,
#                     created_at, updated_at
#                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#             ''', (
#                 profile["user_id"], profile["user_type"], profile["name"], 
#                 profile["organization"], profile["location"], profile["state"],
#                 profile["skills"], profile["experience"], profile["goals"],
#                 profile["impact_metrics"], profile["achievements"],
#                 profile["recent_activities"], profile["recommendations"],
#                 profile["networking_suggestions"], profile["created_at"],
#                 profile["updated_at"]
#             ))
        
#         conn.commit()
#         conn.close()
        
#         return {"message": "Profile created successfully", "profile": profile}
        
#     except Exception as e:
#         logger.error(f"Error creating profile: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

def create_default_profile(user_id: int) -> Dict[str, Any]:
    """Create a default profile for new users"""
    default_profile = {
        "id": 1,
        "user_id": user_id,
        "user_type": "individual",
        "name": "New User",
        "organization": None,
        "location": "Mumbai",
        "state": "Maharashtra",
        "skills": ["Problem Solving", "Communication", "Teamwork"],
        "experience": "Beginner",
        "goals": "Learn new skills and build impactful projects",
        "impact_metrics": {
            "events_hosted": 0,
            "events_participated": 0,
            "projects_created": 0,
            "people_impacted": 0,
            "revenue_generated": 0,
            "jobs_created": 0,
            "social_impact_score": 0,
            "sustainability_score": 0
        },
        "achievements": [],
        "recent_activities": [],
        "recommendations": [
            {
                "id": 1,
                "type": "skill",
                "title": "Complete Your Profile",
                "description": "Add more details to your profile to get better recommendations",
                "priority": "high"
            }
        ],
        "networking_suggestions": [
            "Join relevant events in your area",
            "Connect with professionals in your field",
            "Participate in community discussions"
        ],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    # Save to database
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO unified_profiles (
            user_id, user_type, name, organization, location, state,
            skills, experience, goals, impact_metrics, achievements,
            recent_activities, recommendations, networking_suggestions,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id, default_profile["user_type"], default_profile["name"],
        default_profile["organization"], default_profile["location"],
        default_profile["state"], json.dumps(default_profile["skills"]),
        default_profile["experience"], default_profile["goals"],
        json.dumps(default_profile["impact_metrics"]),
        json.dumps(default_profile["achievements"]),
        json.dumps(default_profile["recent_activities"]),
        json.dumps(default_profile["recommendations"]),
        json.dumps(default_profile["networking_suggestions"]),
        default_profile["created_at"], default_profile["updated_at"]
    ))
    
    conn.commit()
    conn.close()
    
    return default_profile

async def enhance_profile_with_realtime_data(profile: Dict[str, Any], user_id: int) -> Dict[str, Any]:
    """Enhance profile with real-time data from events and projects"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get events created by user
        cursor.execute('''
            SELECT COUNT(*) as count FROM events WHERE created_by = ?
        ''', (user_id,))
        events_hosted = cursor.fetchone()["count"]
        
        # Get events participated in (simulated)
        events_participated = min(events_hosted + 2, 10)  # Demo data
        
        # Get projects created by user
        cursor.execute('''
            SELECT COUNT(*) as count FROM projects WHERE created_by = ?
        ''', (user_id,))
        projects_created = cursor.fetchone()["count"]
        
        # Calculate impact metrics
        people_impacted = events_hosted * 50 + projects_created * 100  # Demo calculation
        revenue_generated = events_hosted * 50000 + projects_created * 100000  # Demo calculation
        jobs_created = projects_created * 5  # Demo calculation
        
        # Update impact metrics
        profile["impact_metrics"].update({
            "events_hosted": events_hosted,
            "events_participated": events_participated,
            "projects_created": projects_created,
            "people_impacted": people_impacted,
            "revenue_generated": revenue_generated,
            "jobs_created": jobs_created,
            "social_impact_score": calculate_impact_score(profile["impact_metrics"]),
            "sustainability_score": 75  # Demo score
        })
        
        # Get recent activities from database
        cursor.execute('''
            SELECT * FROM profile_activities 
            WHERE profile_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        ''', (profile["id"],))
        
        activities = []
        for row in cursor.fetchall():
            activities.append({
                "id": row["id"],
                "type": row["type"],
                "title": row["title"],
                "description": row["description"],
                "date": row["date"],
                "impact_score": row["impact_score"]
            })
        
        if activities:
            profile["recent_activities"] = activities
        
        # Generate AI recommendations
        user_data = {
            "user_type": profile["user_type"],
            "skills": profile["skills"],
            "experience": profile["experience"],
            "goals": profile["goals"]
        }
        
        enhanced_profile = await enhance_user_profile(user_data)
        if enhanced_profile:
            profile["recommendations"] = [
                {
                    "id": i + 1,
                    "type": "skill",
                    "title": rec,
                    "description": f"AI recommendation based on your profile",
                    "priority": "medium"
                }
                for i, rec in enumerate(enhanced_profile.recommendations[:5])
            ]
            profile["networking_suggestions"] = enhanced_profile.networking_suggestions[:3]
        
        conn.close()
        return profile
        
    except Exception as e:
        logger.error(f"Error enhancing profile: {e}")
        return profile

@router.put("/")
async def update_unified_profile(profile_update: ProfileUpdate, user_id: int = Query(..., description="User ID")):
    """Update unified profile"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if profile_update.name is not None:
            update_fields.append("name = ?")
            params.append(profile_update.name)
        
        if profile_update.organization is not None:
            update_fields.append("organization = ?")
            params.append(profile_update.organization)
        
        if profile_update.location is not None:
            update_fields.append("location = ?")
            params.append(profile_update.location)
        
        if profile_update.state is not None:
            update_fields.append("state = ?")
            params.append(profile_update.state)
        
        if profile_update.skills is not None:
            update_fields.append("skills = ?")
            params.append(json.dumps(profile_update.skills))
        
        if profile_update.experience is not None:
            update_fields.append("experience = ?")
            params.append(profile_update.experience)
        
        if profile_update.goals is not None:
            update_fields.append("goals = ?")
            params.append(profile_update.goals)
        
        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(user_id)
            
            query = f'''
                UPDATE unified_profiles 
                SET {', '.join(update_fields)}
                WHERE user_id = ?
            '''
            
            cursor.execute(query, params)
            conn.commit()
        
        conn.close()
        
        # Return updated profile
        return await get_unified_profile(user_id)
        
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/achievements")
async def add_achievement(achievement: AchievementCreate, user_id: int = Query(1)):
    """Add achievement to user profile"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Get profile ID
        cursor.execute('SELECT id FROM unified_profiles WHERE user_id = ?', (user_id,))
        profile_row = cursor.fetchone()
        
        if not profile_row:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_id = profile_row["id"]
        
        # Add achievement
        cursor.execute('''
            INSERT INTO achievements (
                profile_id, title, description, type, date, impact_score, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            profile_id, achievement.title, achievement.description,
            achievement.type, achievement.date, achievement.impact_score,
            datetime.now().isoformat()
        ))
        
        achievement_id = cursor.lastrowid
        
        # Update profile achievements
        cursor.execute('''
            SELECT achievements FROM unified_profiles WHERE id = ?
        ''', (profile_id,))
        
        current_achievements = json.loads(cursor.fetchone()["achievements"] or "[]")
        current_achievements.append({
            "id": achievement_id,
            "title": achievement.title,
            "description": achievement.description,
            "type": achievement.type,
            "date": achievement.date,
            "impact_score": achievement.impact_score
        })
        
        cursor.execute('''
            UPDATE unified_profiles 
            SET achievements = ?, updated_at = ?
            WHERE id = ?
        ''', (json.dumps(current_achievements), datetime.now().isoformat(), profile_id))
        
        conn.commit()
        conn.close()
        
        return {"message": "Achievement added successfully", "achievement_id": achievement_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding achievement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_user_analytics(user_id: int = Query(1)):
    """Get comprehensive user analytics"""
    try:
        profile = await get_unified_profile(user_id)
        
        # Calculate additional analytics
        analytics = {
            "profile_completion": calculate_profile_completion(profile),
            "impact_trends": calculate_impact_trends(profile),
            "skill_gaps": identify_skill_gaps(profile),
            "recommendations": generate_analytics_recommendations(profile),
            "comparison": compare_with_peers(profile)
        }
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error generating analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_profile_completion(profile: Dict[str, Any]) -> int:
    """Calculate profile completion percentage"""
    fields = [
        profile.get("name"), profile.get("organization"), profile.get("location"),
        profile.get("state"), profile.get("skills"), profile.get("experience"),
        profile.get("goals")
    ]
    
    completed_fields = sum(1 for field in fields if field and field != "")
    return int((completed_fields / len(fields)) * 100)

def calculate_impact_trends(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate impact trends over time"""
    metrics = profile["impact_metrics"]
    
    return {
        "growth_rate": {
            "events": ((metrics["events_hosted"] - 0) / max(1, 0)) * 100,
            "projects": ((metrics["projects_created"] - 0) / max(1, 0)) * 100,
            "impact": ((metrics["social_impact_score"] - 0) / max(1, 0)) * 100
        },
        "projected_impact": {
            "next_month": metrics["people_impacted"] * 1.2,
            "next_quarter": metrics["people_impacted"] * 1.5,
            "next_year": metrics["people_impacted"] * 2.5
        }
    }

def identify_skill_gaps(profile: Dict[str, Any]) -> List[str]:
    """Identify skill gaps based on user type and goals"""
    current_skills = set(profile["skills"])
    
    skill_gaps = {
        "individual": ["Leadership", "Project Management", "Data Analysis"],
        "company": ["CSR Strategy", "Impact Measurement", "Stakeholder Engagement"],
        "ngo": ["Grant Writing", "Program Evaluation", "Community Outreach"],
        "investor": ["Due Diligence", "Impact Investing", "Portfolio Management"]
    }
    
    user_type_gaps = skill_gaps.get(profile["user_type"], [])
    return [skill for skill in user_type_gaps if skill not in current_skills]

def generate_analytics_recommendations(profile: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate analytics-based recommendations"""
    recommendations = []
    
    # Profile completion recommendation
    completion = calculate_profile_completion(profile)
    if completion < 80:
        recommendations.append({
            "type": "profile",
            "title": "Complete Your Profile",
            "description": f"Your profile is {completion}% complete. Add more details to get better recommendations.",
            "priority": "high"
        })
    
    # Skill development recommendation
    skill_gaps = identify_skill_gaps(profile)
    if skill_gaps:
        recommendations.append({
            "type": "skill",
            "title": "Develop Key Skills",
            "description": f"Consider developing: {', '.join(skill_gaps[:3])}",
            "priority": "medium"
        })
    
    # Event participation recommendation
    if profile["impact_metrics"]["events_participated"] < 3:
        recommendations.append({
            "type": "event",
            "title": "Participate in Events",
            "description": "Join more events to expand your network and skills.",
            "priority": "medium"
        })
    
    return recommendations

def compare_with_peers(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Compare user metrics with peer averages"""
    # Demo peer comparison data
    peer_averages = {
        "events_hosted": 2.5,
        "projects_created": 1.8,
        "people_impacted": 250,
        "social_impact_score": 65
    }
    
    user_metrics = profile["impact_metrics"]
    
    return {
        "events_hosted": {
            "user": user_metrics["events_hosted"],
            "peer_avg": peer_averages["events_hosted"],
            "percentile": min(100, (user_metrics["events_hosted"] / peer_averages["events_hosted"]) * 100)
        },
        "projects_created": {
            "user": user_metrics["projects_created"],
            "peer_avg": peer_averages["projects_created"],
            "percentile": min(100, (user_metrics["projects_created"] / peer_averages["projects_created"]) * 100)
        },
        "people_impacted": {
            "user": user_metrics["people_impacted"],
            "peer_avg": peer_averages["people_impacted"],
            "percentile": min(100, (user_metrics["people_impacted"] / peer_averages["people_impacted"]) * 100)
        },
        "social_impact_score": {
            "user": user_metrics["social_impact_score"],
            "peer_avg": peer_averages["social_impact_score"],
            "percentile": min(100, (user_metrics["social_impact_score"] / peer_averages["social_impact_score"]) * 100)
        }
    }

# Initialize database on startup
# init_profile_db()
=======
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import sqlite3
from datetime import datetime

router = APIRouter()

class UserProfile(BaseModel):
    name: str
    location: str
    district: str
    state: str
    language: str
    skills: List[str]
    jobTypes: List[str]
    needMentor: bool

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            district TEXT,
            state TEXT,
            language TEXT,
            skills TEXT,
            job_types TEXT,
            need_mentor BOOLEAN,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
init_db()
@router.post("/users/profile")
async def create_profile(profile: UserProfile):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        skills = ','.join(profile.skills)
        job_types = ','.join(profile.jobTypes)
        
        cursor.execute('''
            INSERT INTO user_profiles (
                name, location, district, state, language,
                skills, job_types, need_mentor, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            profile.name,
            profile.location,
            profile.district,
            profile.state,
            profile.language,
            skills,
            job_types,
            profile.needMentor,
            datetime.now(),
            datetime.now()
        ))
        
        conn.commit()
        profile_id = cursor.lastrowid
        conn.close()
        
        return {"message": "Profile created successfully", "profile_id": profile_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/profile/{profile_id}")
async def get_profile(profile_id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        result = cursor.execute(
            'SELECT * FROM user_profiles WHERE id = ?',
            (profile_id,)
        ).fetchone()
        
        if result is None:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        profile_dict = dict(result)
        profile_dict['skills'] = profile_dict['skills'].split(',') if profile_dict['skills'] else []
        profile_dict['job_types'] = profile_dict['job_types'].split(',') if profile_dict['job_types'] else []
        
        return profile_dict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/profile")
async def get_latest_profile():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        result = cursor.execute(
            'SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1'
        ).fetchone()
        conn.close()
        if result is None:
            return {}
        profile_dict = dict(result)
        profile_dict['skills'] = profile_dict['skills'].split(',') if profile_dict['skills'] else []
        profile_dict['job_types'] = profile_dict['job_types'].split(',') if profile_dict['job_types'] else []
        return profile_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/profile/{profile_id}")
async def update_profile(profile_id: int, profile: UserProfile):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        skills = ','.join(profile.skills)
        job_types = ','.join(profile.jobTypes)
        
        cursor.execute('''
            UPDATE user_profiles 
            SET name=?, location=?, district=?, state=?, language=?,
                skills=?, job_types=?, need_mentor=?, updated_at=?
            WHERE id=?
        ''', (
            profile.name,
            profile.location,
            profile.district,
            profile.state,
            profile.language,
            skills,
            job_types,
            profile.needMentor,
            datetime.now(),
            profile_id
        ))
        
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
