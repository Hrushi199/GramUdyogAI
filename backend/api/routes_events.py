from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
from datetime import datetime, timedelta
import json
import logging
from core.llm_function_selector import llama_summarize_items
from core.translation import llama_translate_string as translate_text
from core.enhanced_llm import generate_event_with_ai, generate_marketing_content, generate_visual_summary_for_marketing
from core.skill_tutorial import generate_visual_summary_json
from api.routes_auth import get_current_user
from init_db import get_db
from models.team_member import TeamMember

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Models
class EventCreate(BaseModel):
    title: str
    description: str
    event_type: str
    category: str
    location: str
    state: str
    start_date: str
    end_date: str
    max_participants: int
    budget: int
    prize_pool: int
    skills_required: List[str]
    tags: List[str]
    status: str = 'draft'  # Default to draft
    marketing_highlights: Optional[List[str]] = None
    success_metrics: Optional[List[str]] = None
    sections: Optional[List[dict]] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    max_participants: Optional[int] = None
    budget: Optional[int] = None
    prize_pool: Optional[int] = None
    skills_required: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    marketing_highlights: Optional[List[str]] = None
    success_metrics: Optional[List[str]] = None
    sections: Optional[List[dict]] = None

class EventStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None

class AIGenerateRequest(BaseModel):
    prompt: str
    event_type: str
    language: Optional[str] = 'en'

class SocialMediaPost(BaseModel):
    platform: str
    content: str
    image_url: Optional[str] = None
    scheduled_at: Optional[str] = None

def update_event_status_automatically():
    """Automatically update event status based on dates"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        current_date = datetime.now().date()
        
        # Update events that should be ongoing
        cursor.execute('''
            UPDATE events 
            SET status = 'ongoing', updated_at = ?
            WHERE status = 'active' 
            AND date(start_date) <= ? 
            AND date(end_date) >= ?
        ''', (datetime.now().isoformat(), current_date.isoformat(), current_date.isoformat()))
        
        # Update events that should be completed
        cursor.execute('''
            UPDATE events 
            SET status = 'completed', updated_at = ?
            WHERE status IN ('active', 'ongoing') 
            AND date(end_date) < ?
        ''', (datetime.now().isoformat(), current_date.isoformat()))
        
        # Update events that should be active (future events)
        cursor.execute('''
            UPDATE events 
            SET status = 'active', updated_at = ?
            WHERE status = 'draft' 
            AND date(start_date) > ?
        ''', (datetime.now().isoformat(), current_date.isoformat()))
        
        conn.commit()
        conn.close()
        logger.info("Event statuses updated automatically")
        
    except Exception as e:
        logger.error(f"Error updating event statuses: {e}")



# Update event statuses on startup
update_event_status_automatically()

def get_user_name_by_id(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row['name'] if row else 'Unknown'

@router.get("/events")
async def get_events(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
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
                "id": row['id'],
                "title": row['title'],
                "description": row['description'],
                "event_type": row['event_type'],
                "category": row['category'],
                "location": row['location'],
                "state": row['state'],
                "start_date": row['start_date'],
                "end_date": row['end_date'],
                "max_participants": row['max_participants'],
                "current_participants": row['current_participants'],
                "budget": row['budget'],
                "prize_pool": row['prize_pool'],
                "organizer": {
                    "id": row['organizer_id'],
                    "type": row['organizer_type'],
                    "name": get_user_name_by_id(row['organizer_id'])
                },
                "skills_required": safe_json_loads(row['skills_required'], []),
                "tags": safe_json_loads(row['tags'], []),
                "status": row['status'],
                "impact_metrics": safe_json_loads(row['impact_metrics'], {
                    "participants_target": 0,
                    "skills_developed": 0,
                    "projects_created": 0,
                    "employment_generated": 0
                }),
                "marketing_highlights": safe_json_loads(row['marketing_highlights'], []),
                "success_metrics": safe_json_loads(row['success_metrics'], []),
                "sections": safe_json_loads(row['sections'], []),
                "social_media_posts": [],
                "created_at": row['created_at'],
                "updated_at": row['updated_at']
            }
            
            # Fetch social media posts for this event
            cursor.execute("SELECT * FROM social_media_posts WHERE event_id = ?", (event["id"],))
            posts_data = cursor.fetchall()
            event["social_media_posts"] = [
                {
                    "id": post['id'],
                    "platform": post['platform'],
                    "content": post['content'],
                    "image_url": post['image_url'],
                    "scheduled_at": post['scheduled_at'],
                    "status": post['status']
                }
                for post in posts_data
            ]
            
            events.append(event)
        
        conn.close()
        return events
        
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events")
async def create_event(event: EventCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Create a new event"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Validate dates
        if not event.start_date or not event.end_date:
            raise HTTPException(status_code=400, detail="Start date and end date are required")
        
        try:
            # Handle date-only strings from the frontend
            start_date = datetime.fromisoformat(event.start_date)
            end_date = datetime.fromisoformat(event.end_date)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}. Expected YYYY-MM-DD.")
        
        if start_date >= end_date:
            raise HTTPException(status_code=400, detail="End date must be after start date")
        
        # Auto-determine initial status based on dates
        current_date = datetime.now().date()
        initial_status = event.status
        
        if initial_status == 'draft':
            if start_date.date() > current_date:
                initial_status = 'active'  # Future event becomes active
            elif start_date.date() <= current_date <= end_date.date():
                initial_status = 'ongoing'  # Current event becomes ongoing
            else:
                initial_status = 'completed'  # Past event becomes completed
        
        # Securely get organizer details from the JWT token
        organizer_id = current_user['id']
        organizer_type = current_user['user_type']
        created_by = current_user['id']
        
        cursor.execute('''
            INSERT INTO events (
                title, description, event_type, category, location, state,
                start_date, end_date, max_participants, current_participants, budget, prize_pool,
                organizer_id, organizer_type, created_by, skills_required, tags, status,
                impact_metrics, marketing_highlights, success_metrics, sections, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            event.title, event.description, event.event_type, event.category,
            event.location, event.state, event.start_date, event.end_date,
            event.max_participants, 0,  # current_participants default
            event.budget, event.prize_pool,
            organizer_id, organizer_type, created_by, json.dumps(event.skills_required),
            json.dumps(event.tags), initial_status, json.dumps({
                "participants_target": 0,
                "skills_developed": 0,
                "projects_created": 0,
                "employment_generated": 0
            }),
            json.dumps(event.marketing_highlights) if event.marketing_highlights is not None else json.dumps([]),
            json.dumps(event.success_metrics) if event.success_metrics is not None else json.dumps([]),
            json.dumps(event.sections) if event.sections is not None else json.dumps([]),
            datetime.now().isoformat(), datetime.now().isoformat()
        ))
        
        event_id = cursor.lastrowid
        if event_id is None:
            raise HTTPException(status_code=500, detail="Failed to create event")
        
        # Log status change
        cursor.execute('''
            INSERT INTO event_status_history (
                event_id, old_status, new_status, changed_by, reason, changed_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            event_id, None, initial_status, created_by, 'Event created', datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        # Return the created event
        return await get_event_by_id(event_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events/{event_id}")
async def get_event_by_id(event_id: int):
    """Get a specific event by ID"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        
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
                "id": row['id'],
                "title": row['title'],
                "description": row['description'],
                "event_type": row['event_type'],
                "category": row['category'],
                "location": row['location'],
                "state": row['state'],
                "start_date": row['start_date'],
                "end_date": row['end_date'],
                "max_participants": row['max_participants'],
                "current_participants": row['current_participants'],
                "budget": row['budget'],
                "prize_pool": row['prize_pool'],
                "organizer": {
                    "id": row['organizer_id'],
                    "type": row['organizer_type'],
                    "name": get_user_name_by_id(row['organizer_id'])
                },
                "skills_required": safe_json_loads(row['skills_required'], []),
                "tags": safe_json_loads(row['tags'], []),
                "status": row['status'],
                "impact_metrics": safe_json_loads(row['impact_metrics'], {
                    "participants_target": 0,
                    "skills_developed": 0,
                    "projects_created": 0,
                    "employment_generated": 0
                }),
                "marketing_highlights": safe_json_loads(row['marketing_highlights'], []),
                "success_metrics": safe_json_loads(row['success_metrics'], []),
                "sections": safe_json_loads(row['sections'], []),
                "social_media_posts": [],
                "created_at": row['created_at'],
                "updated_at": row['updated_at']
            }
        
        # Fetch social media posts
        cursor.execute("SELECT * FROM social_media_posts WHERE event_id = ?", (event_id,))
        posts_data = cursor.fetchall()
        event["social_media_posts"] = [
            {
                "id": post['id'],
                "platform": post['platform'],
                "content": post['content'],
                "image_url": post['image_url'],
                "scheduled_at": post['scheduled_at'],
                "status": post['status']
            }
            for post in posts_data
        ]
        
        conn.close()
        return event
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/generate-with-ai")
async def generate_event_with_ai_endpoint(request: AIGenerateRequest):
    """Generate event details using enhanced AI"""
    try:
        # Use the enhanced LLM to generate comprehensive event content
        generated_event = await generate_event_with_ai(
            prompt=request.prompt,
            event_type=request.event_type,
            context="Focus on creating engaging, impactful events that drive skill development and innovation.",
            language=request.language or 'en'
        )
        if not generated_event:
            raise HTTPException(status_code=500, detail="Failed to generate event with AI")

        # Fill all required fields for event creation
        now = datetime.now().isoformat(timespec='minutes')
        event_data = {
            "title": generated_event.title,
            "description": generated_event.description,
            "event_type": request.event_type or "hackathon",
            "category": getattr(generated_event, "category", "General"),
            "location": "",
            "state": "",
            "start_date": now,
            "end_date": now,
            "max_participants": 100,
            "budget": 0,
            "prize_pool": 0,
            "skills_required": generated_event.skills_required or [],
            "tags": generated_event.tags or [],
            "status": "draft",
            "marketing_highlights": generated_event.marketing_highlights or [],
            "success_metrics": generated_event.success_metrics or [],
            "sections": [
                {
                    "title": section.title,
                    "description": section.description,
                    "key_points": section.key_points,
                    "target_audience": section.target_audience,
                    "expected_outcome": section.expected_outcome
                }
                for section in getattr(generated_event, "sections", [])
            ],
        }
        return event_data
    except Exception as e:
        logger.error(f"Error generating event with AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/generate-social-posts")
async def generate_social_media_posts(event_id: int):
    """Generate social media posts for an event"""
    try:
        # Get event details
        event = await get_event_by_id(event_id)
        
        # Generate posts for different platforms
        posts = []
        
        # Twitter post
        twitter_content = f"🚀 Exciting {event['event_type']} event: {event['title']}\n\n"
        twitter_content += f"📍 {event['location']}, {event['state']}\n"
        twitter_content += f"📅 {event['start_date']}\n"
        twitter_content += f"💰 Prize Pool: ₹{event['prize_pool']:,}\n\n"
        twitter_content += f"Join us for an amazing experience! #Hackathon #Innovation #Tech"
        
        posts.append({
            "id": len(posts) + 1,
            "platform": "twitter",
            "content": twitter_content,
            "status": "draft"
        })
        
        # LinkedIn post
        linkedin_content = f"We're excited to announce our upcoming {event['event_type']} event!\n\n"
        linkedin_content += f"🎯 {event['title']}\n"
        linkedin_content += f"📝 {event['description'][:200]}...\n\n"
        linkedin_content += f"📍 Location: {event['location']}, {event['state']}\n"
        linkedin_content += f"📅 Date: {event['start_date']}\n"
        linkedin_content += f"👥 Max Participants: {event['max_participants']}\n"
        linkedin_content += f"💰 Prize Pool: ₹{event['prize_pool']:,}\n\n"
        linkedin_content += f"Don't miss this opportunity to showcase your skills and network with industry professionals!\n\n"
        linkedin_content += f"#Innovation #Technology #Networking #CareerGrowth"
        
        posts.append({
            "id": len(posts) + 1,
            "platform": "linkedin",
            "content": linkedin_content,
            "status": "draft"
        })
        
        # Facebook post
        facebook_content = f"🎉 Join us for an incredible {event['event_type']} experience!\n\n"
        facebook_content += f"📢 {event['title']}\n\n"
        facebook_content += f"🎯 What to expect:\n"
        facebook_content += f"• Hands-on workshops\n"
        facebook_content += f"• Expert mentorship\n"
        facebook_content += f"• Networking opportunities\n"
        facebook_content += f"• Amazing prizes worth ₹{event['prize_pool']:,}\n\n"
        facebook_content += f"📍 {event['location']}, {event['state']}\n"
        facebook_content += f"📅 {event['start_date']}\n\n"
        facebook_content += f"Register now and be part of something amazing! 🌟"
        
        posts.append({
            "id": len(posts) + 1,
            "platform": "facebook",
            "content": facebook_content,
            "status": "draft"
        })
        
        # Instagram post
        instagram_content = f"🚀 {event['title']}\n\n"
        instagram_content += f"Join us for an epic {event['event_type']} experience! 🎯\n\n"
        instagram_content += f"📍 {event['location']}, {event['state']}\n"
        instagram_content += f"📅 {event['start_date']}\n"
        instagram_content += f"💰 Prize Pool: ₹{event['prize_pool']:,}\n\n"
        instagram_content += f"Don't miss out on this amazing opportunity! 💪\n\n"
        instagram_content += f"#Innovation #Tech #Hackathon #Networking #Opportunity"
        
        posts.append({
            "id": len(posts) + 1,
            "platform": "instagram",
            "content": instagram_content,
            "status": "draft"
        })
        
        # Save posts to database
        conn = get_db()
        cursor = conn.cursor()
        
        for post in posts:
            cursor.execute('''
                INSERT INTO social_media_posts (
                    event_id, platform, content, status, created_at
                ) VALUES (?, ?, ?, ?, ?)
            ''', (
                event_id, post["platform"], post["content"], 
                post["status"], datetime.now().isoformat()
            ))
        
        conn.commit()
        conn.close()
        
        return posts
        
    except Exception as e:
        logger.error(f"Error generating social media posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class PublishSocialPostRequest(BaseModel):
    post_id: int
    platform: str

@router.post("/events/{event_id}/publish-social-post")
async def publish_social_media_post(event_id: int, request: PublishSocialPostRequest):
    """Publish a social media post (simulated)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Update post status to published
        cursor.execute('''
            UPDATE social_media_posts 
            SET status = 'published', updated_at = ? 
            WHERE id = ? AND event_id = ?
        ''', (datetime.now().isoformat(), request.post_id, event_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        
        conn.commit()
        conn.close()
        
        return {"message": f"Post published to {request.platform}", "status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing social media post: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/events/{event_id}")
async def update_event(event_id: int, event_update: EventUpdate):
    """Update an event"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if event_update.title is not None:
            update_fields.append("title = ?")
            params.append(event_update.title)
        
        if event_update.description is not None:
            update_fields.append("description = ?")
            params.append(event_update.description)
        
        if event_update.event_type is not None:
            update_fields.append("event_type = ?")
            params.append(event_update.event_type)
        
        if event_update.category is not None:
            update_fields.append("category = ?")
            params.append(event_update.category)
        
        if event_update.location is not None:
            update_fields.append("location = ?")
            params.append(event_update.location)
        
        if event_update.state is not None:
            update_fields.append("state = ?")
            params.append(event_update.state)
        
        if event_update.start_date is not None:
            update_fields.append("start_date = ?")
            params.append(event_update.start_date)
        
        if event_update.end_date is not None:
            update_fields.append("end_date = ?")
            params.append(event_update.end_date)
        
        if event_update.max_participants is not None:
            update_fields.append("max_participants = ?")
            params.append(event_update.max_participants)
        
        if event_update.budget is not None:
            update_fields.append("budget = ?")
            params.append(event_update.budget)
        
        if event_update.prize_pool is not None:
            update_fields.append("prize_pool = ?")
            params.append(event_update.prize_pool)
        
        if event_update.skills_required is not None:
            update_fields.append("skills_required = ?")
            params.append(json.dumps(event_update.skills_required))
        
        if event_update.tags is not None:
            update_fields.append("tags = ?")
            params.append(json.dumps(event_update.tags))
        
        if event_update.status is not None:
            update_fields.append("status = ?")
            params.append(event_update.status)
        
        if event_update.marketing_highlights is not None:
            update_fields.append("marketing_highlights = ?")
            params.append(json.dumps(event_update.marketing_highlights))
        if event_update.success_metrics is not None:
            update_fields.append("success_metrics = ?")
            params.append(json.dumps(event_update.success_metrics))
        if event_update.sections is not None:
            update_fields.append("sections = ?")
            params.append(json.dumps(event_update.sections))
        
        if update_fields:
            update_fields.append("updated_at = ?")
            params.append(datetime.now().isoformat())
            params.append(event_id)
            
            query = f"UPDATE events SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, params)
            
            conn.commit()
            conn.close()
            
            return await get_event_by_id(event_id)
        else:
            conn.close()
            return await get_event_by_id(event_id)
            
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/events/{event_id}")
async def delete_event(event_id: int):
    """Delete an event"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Delete related records first
        cursor.execute("DELETE FROM social_media_posts WHERE event_id = ?", (event_id,))
        cursor.execute("DELETE FROM event_participants WHERE event_id = ?", (event_id,))
        
        # Delete the event
        cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        conn.commit()
        conn.close()
        
        return {"message": "Event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/events/{event_id}/status")
async def update_event_status(event_id: int, status_update: EventStatusUpdate, changed_by: int = Query(1)):
    """Update event status manually (for event organizers)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if event exists and get current status
        cursor.execute("SELECT status, created_by FROM events WHERE id = ?", (event_id,))
        event_data = cursor.fetchone()
        
        if not event_data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        current_status = event_data['status']
        event_creator = event_data['created_by']
        
        # Only event creator can change status
        if event_creator != changed_by:
            raise HTTPException(status_code=403, detail="Only event creator can change status")
        
        # Validate status transition
        valid_transitions = {
            'draft': ['active', 'cancelled'],
            'active': ['ongoing', 'cancelled', 'postponed'],
            'ongoing': ['completed', 'cancelled'],
            'completed': [],  # No further transitions
            'cancelled': [],  # No further transitions
            'postponed': ['active', 'cancelled']
        }
        
        if status_update.status not in valid_transitions.get(current_status, []):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition from '{current_status}' to '{status_update.status}'"
            )
        
        # Update event status
        cursor.execute('''
            UPDATE events 
            SET status = ?, updated_at = ?
            WHERE id = ?
        ''', (status_update.status, datetime.now().isoformat(), event_id))
        
        # Log status change
        cursor.execute('''
            INSERT INTO event_status_history (
                event_id, old_status, new_status, changed_by, reason, changed_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            event_id, current_status, status_update.status, changed_by, 
            status_update.reason or 'Manual status update', datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return {"message": f"Event status updated to {status_update.status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events/{event_id}/status-history")
async def get_event_status_history(event_id: int):
    """Get event status change history"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if event exists
        cursor.execute("SELECT id FROM events WHERE id = ?", (event_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")
        
        cursor.execute('''
            SELECT esh.old_status, esh.new_status, esh.reason, esh.changed_at,
                   u.name as changed_by_name
            FROM event_status_history esh
            LEFT JOIN users u ON esh.changed_by = u.id
            WHERE esh.event_id = ?
            ORDER BY esh.changed_at DESC
        ''', (event_id,))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "old_status": row['old_status'],
                "new_status": row['new_status'],
                "reason": row['reason'],
                "changed_at": row['changed_at'],
                "changed_by_name": row['changed_by_name'] or "System"
            })
        
        conn.close()
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching event status history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/update-statuses")
async def update_all_event_statuses():
    """Manually trigger status update for all events (admin function)"""
    try:
        update_event_status_automatically()
        return {"message": "Event statuses updated successfully"}
    except Exception as e:
        logger.error(f"Error updating event statuses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/join")
async def join_event(event_id: int, user_id: int):
    """Join an event as a participant"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if event exists and has space
        cursor.execute('''
            SELECT e.max_participants, e.current_participants, e.status
            FROM events e WHERE e.id = ?
        ''', (event_id,))
        event_data = cursor.fetchone()
        
        if not event_data:
            raise HTTPException(status_code=404, detail="Event not found")
        
        max_participants = event_data['max_participants']
        current_participants = event_data['current_participants']
        status = event_data['status']
        
        if status != 'active':
            raise HTTPException(status_code=400, detail="Event is not accepting participants")
        
        if current_participants >= max_participants:
            raise HTTPException(status_code=400, detail="Event is full")
        
        # Check if user is already a participant
        cursor.execute('''
            SELECT id FROM event_participants 
            WHERE event_id = ? AND user_id = ?
        ''', (event_id, user_id))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User is already a participant")
        
        # Add user as participant
        cursor.execute('''
            INSERT INTO event_participants (event_id, user_id, status, joined_at)
            VALUES (?, ?, 'registered', ?)
        ''', (event_id, user_id, datetime.now().isoformat()))
        
        # Update current participants count
        cursor.execute('''
            UPDATE events 
            SET current_participants = current_participants + 1
            WHERE id = ?
        ''', (event_id,))
        
        conn.commit()
        conn.close()
        
        return {"message": "Successfully joined event", "status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/leave")
async def leave_event(event_id: int, user_id: int):
    """Leave an event"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user is a participant
        cursor.execute('''
            SELECT id FROM event_participants 
            WHERE event_id = ? AND user_id = ?
        ''', (event_id, user_id))
        
        if not cursor.fetchone():
            raise HTTPException(status_code=400, detail="User is not a participant")
        
        # Remove user from participants
        cursor.execute('''
            DELETE FROM event_participants 
            WHERE event_id = ? AND user_id = ?
        ''', (event_id, user_id))
        
        # Update current participants count
        cursor.execute('''
            UPDATE events 
            SET current_participants = current_participants - 1
            WHERE id = ?
        ''', (event_id,))
        
        conn.commit()
        conn.close()
        
        return {"message": "Successfully left event", "status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/events/{event_id}/team-members', response_model=List[TeamMember])
async def get_team_members(event_id: int):
    """Fetch team members for a specific event by event ID."""
    async def fetch_team_members_by_event_id(event_id: int):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM project_team_members WHERE event_id = ?", (event_id,))
        rows = cursor.fetchall()
        conn.close()
        return [TeamMember(**dict(row)) for row in rows]
    team_members = await fetch_team_members_by_event_id(event_id)
    return team_members

@router.get("/users/{user_id}/events")
async def get_user_events(user_id: int):
    """Get events for a specific user (either as organizer or participant)"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
        
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
        
        # Get events where user is the organizer
        cursor.execute('''
            SELECT e.*, 'organizer' as user_role
            FROM events e
            WHERE e.created_by = ?
        ''', (user_id,))
        organized_events = cursor.fetchall()
        
        # Get events where user is a participant
        cursor.execute('''
            SELECT e.*, ep.status as user_role
            FROM events e
            JOIN event_participants ep ON e.id = ep.event_id
            WHERE ep.user_id = ?
        ''', (user_id,))
        participated_events = cursor.fetchall()
        
        # Combine and deduplicate events
        all_events = organized_events + participated_events
        seen_event_ids = set()
        unique_events = []
        
        for row in all_events:
            if row['id'] not in seen_event_ids:
                seen_event_ids.add(row['id'])
                unique_events.append(row)
        
        # Sort by creation date
        unique_events.sort(key=lambda x: x['created_at'], reverse=True)
        
        events = []
        for row in unique_events:
            event = {
                "id": row['id'],
                "title": row['title'],
                "description": row['description'],
                "event_type": row['event_type'],
                "category": row['category'],
                "location": row['location'],
                "state": row['state'],
                "start_date": row['start_date'],
                "end_date": row['end_date'],
                "max_participants": row['max_participants'],
                "current_participants": row['current_participants'],
                "budget": row['budget'],
                "prize_pool": row['prize_pool'],
                "organizer": {
                    "id": row['organizer_id'],
                    "type": row['organizer_type'],
                    "name": get_user_name_by_id(row['organizer_id'])
                },
                "skills_required": safe_json_loads(row['skills_required'], []),
                "tags": safe_json_loads(row['tags'], []),
                "status": row['status'],
                "impact_metrics": safe_json_loads(row['impact_metrics'], {
                    "participants_target": 0,
                    "skills_developed": 0,
                    "projects_created": 0,
                    "employment_generated": 0
                }),
                "marketing_highlights": safe_json_loads(row['marketing_highlights'], []),
                "success_metrics": safe_json_loads(row['success_metrics'], []),
                "sections": safe_json_loads(row['sections'], []),
                "social_media_posts": [],
                "created_at": row['created_at'],
                "updated_at": row['updated_at']
            }
            
            # Fetch social media posts for this event
            cursor.execute("SELECT * FROM social_media_posts WHERE event_id = ?", (event["id"],))
            posts_data = cursor.fetchall()
            event["social_media_posts"] = [
                {
                    "id": post['id'],
                    "platform": post['platform'],
                    "content": post['content'],
                    "image_url": post['image_url'],
                    "scheduled_at": post['scheduled_at'],
                    "status": post['status']
                }
                for post in posts_data
            ]
            
            events.append(event)
        
        conn.close()
        return events
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/{event_id}/generate-visual-summary")
async def generate_visual_summary_for_event(event_id: int):
    """Generate visual summary for event marketing"""
    try:
        # Get event details
        event = await get_event_by_id(event_id)
        
        # Generate visual summary using the enhanced LLM
        visual_summary_data = await generate_visual_summary_for_marketing(event)
        
        if not visual_summary_data:
            raise HTTPException(status_code=500, detail="Failed to generate visual summary")
        
        # Create visual summary using existing infrastructure
        visual_summary = generate_visual_summary_json(
            topic=event["title"],
            rag=f"Event Type: {event['event_type']}\nCategory: {event['category']}\nDescription: {event['description']}",
            language="en",
            generate_audio=True
        )
        
        # Save to database (you can create a separate table for event visual summaries)
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO visual_summaries (
                topic, summary_data, created_at, event_id
            ) VALUES (?, ?, ?, ?)
        ''', (
            event["title"],
            json.dumps(visual_summary.model_dump()),
            datetime.now().isoformat(),
            event_id
        ))
        
        summary_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "summary_id": summary_id,
            "visual_summary": visual_summary.model_dump(),
            "marketing_content": visual_summary_data
        }
        
    except Exception as e:
        logger.error(f"Error generating visual summary: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 

@router.get("/events/search")
async def search_events(query: str, limit: int = 10):
    """Search events by name or keyword (title or description). Fully implemented for AI assistant and frontend helpers."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "SELECT * FROM events WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT ?"
        like_query = f"%{query}%"
        cursor.execute(sql, (like_query, like_query, limit))
        events_data = cursor.fetchall()
        
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
        
        events = []
        for row in events_data:
            event = {
                "id": row['id'],
                "title": row['title'],
                "description": row['description'],
                "event_type": row['event_type'],
                "category": row['category'],
                "location": row['location'],
                "state": row['state'],
                "start_date": row['start_date'],
                "end_date": row['end_date'],
                "max_participants": row['max_participants'],
                "current_participants": row['current_participants'],
                "budget": row['budget'],
                "prize_pool": row['prize_pool'],
                "organizer": {
                    "id": row['organizer_id'],
                    "type": row['organizer_type'],
                    "name": get_user_name_by_id(row['organizer_id'])
                },
                "skills_required": safe_json_loads(row['skills_required'], []),
                "tags": safe_json_loads(row['tags'], []),
                "status": row['status'],
                "impact_metrics": safe_json_loads(row['impact_metrics'], {
                    "participants_target": 0,
                    "skills_developed": 0,
                    "projects_created": 0,
                    "employment_generated": 0
                }),
                "marketing_highlights": safe_json_loads(row['marketing_highlights'], []),
                "success_metrics": safe_json_loads(row['success_metrics'], []),
                "sections": safe_json_loads(row['sections'], []),
                "social_media_posts": [],
                "created_at": row['created_at'],
                "updated_at": row['updated_at']
            }
            events.append(event)
        conn.close()
        return events
    except Exception as e:
        logger.error(f"Error searching events: {e}")
        raise HTTPException(status_code=500, detail=str(e))