from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
import json
import sqlite3
from pydantic import BaseModel
from init_db import get_db  # Use canonical get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Pydantic models
class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str  # 'team_invite', 'event_update', 'project_update', 'general'
    related_id: Optional[int] = None  # ID of related event/project
    related_type: Optional[str] = None  # 'event', 'project', 'user'
    event_id: Optional[int] = None  # Direct reference to event
    project_id: Optional[int] = None  # Direct reference to project
    metadata: Optional[dict] = None

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    is_read: Optional[bool] = None
    metadata: Optional[dict] = None

class TeamInviteCreate(BaseModel):
    inviter_id: int
    invitee_id: int
    project_id: int
    role: str
    skills: List[str]
    message: Optional[str] = None

class TeamInviteResponse(BaseModel):
    invite_id: int
    action: str  # 'accept' or 'reject'
    message: Optional[str] = None

# Helper function to create notification
def create_notification(
    db,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    related_id: Optional[int] = None,
    related_type: Optional[str] = None,
    event_id: Optional[int] = None,
    project_id: Optional[int] = None,
    metadata: Optional[dict] = None
):
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO notifications (user_id, title, message, notification_type, related_id, related_type, event_id, project_id, metadata, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, title, message, notification_type, related_id, related_type, event_id, project_id, json.dumps(metadata) if metadata else None, datetime.utcnow(), False))
    db.commit()
    return cursor.lastrowid

# CRUD Operations
@router.get("/", response_model=List[dict])
def get_notifications(
    user_id: int,
    unread_only: bool = False,
    notification_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db = Depends(get_db)
):
    """Get notifications for a user with filtering options"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        query = "SELECT * FROM notifications WHERE user_id = ?"
        params: list = [user_id]
        
        if unread_only:
            query += " AND is_read = 0"
        
        if notification_type:
            query += " AND notification_type = ?"
            params.append(notification_type)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        notifications = cursor.fetchall()
        
        return [
            {
                "id": n["id"],
                "title": n["title"],
                "message": n["message"],
                "notification_type": n["notification_type"],
                "related_id": n["related_id"],
                "related_type": n["related_type"],
                "event_id": n["event_id"],
                "project_id": n["project_id"],
                "metadata": json.loads(n["metadata"]) if n["metadata"] else None,
                "is_read": bool(n["is_read"]),
                "created_at": n["created_at"],
                "updated_at": n["updated_at"]
            }
            for n in notifications
        ]
    finally:
        conn.close()

@router.get("/{notification_id}", response_model=dict)
def get_notification(notification_id: int, db = Depends(get_db)):
    """Get a specific notification by ID"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,))
        notification = cursor.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {
            "id": notification["id"],
            "user_id": notification["user_id"],
            "title": notification["title"],
            "message": notification["message"],
            "notification_type": notification["notification_type"],
            "related_id": notification["related_id"],
            "related_type": notification["related_type"],
            "event_id": notification["event_id"],
            "project_id": notification["project_id"],
            "metadata": json.loads(notification["metadata"]) if notification["metadata"] else None,
            "is_read": bool(notification["is_read"]),
            "created_at": notification["created_at"],
            "updated_at": notification["updated_at"]
        }
    finally:
        conn.close()

@router.post("/", response_model=dict)
def create_notification_endpoint(notification: NotificationCreate, db = Depends(get_db)):
    """Create a new notification"""
    # Verify user exists
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE id = ?", (notification.user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        notification_id = create_notification(
            db=conn,
            user_id=notification.user_id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.notification_type,
            related_id=notification.related_id,
            related_type=notification.related_type,
            event_id=notification.event_id,
            project_id=notification.project_id,
            metadata=notification.metadata
        )
        
        # Get the created notification
        cursor.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,))
        new_notification = cursor.fetchone()
        
        return {
            "id": new_notification["id"],
            "user_id": new_notification["user_id"],
            "title": new_notification["title"],
            "message": new_notification["message"],
            "notification_type": new_notification["notification_type"],
            "related_id": new_notification["related_id"],
            "related_type": new_notification["related_type"],
            "event_id": new_notification["event_id"],
            "project_id": new_notification["project_id"],
            "metadata": json.loads(new_notification["metadata"]) if new_notification["metadata"] else None,
            "is_read": bool(new_notification["is_read"]),
            "created_at": new_notification["created_at"],
            "updated_at": new_notification["updated_at"]
        }
    finally:
        conn.close()

@router.put("/{notification_id}", response_model=dict)
def update_notification(notification_id: int, notification_update: NotificationUpdate, db = Depends(get_db)):
    """Update a notification (mark as read, update content, etc.)"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,))
        notification = cursor.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Build update query dynamically
        update_fields = []
        params = []
        
        if notification_update.title is not None:
            update_fields.append("title = ?")
            params.append(notification_update.title)
        if notification_update.message is not None:
            update_fields.append("message = ?")
            params.append(notification_update.message)
        if notification_update.is_read is not None:
            update_fields.append("is_read = ?")
            params.append(1 if notification_update.is_read else 0)
        if notification_update.metadata is not None:
            update_fields.append("metadata = ?")
            params.append(json.dumps(notification_update.metadata))
        
        update_fields.append("updated_at = ?")
        params.append(datetime.utcnow())
        params.append(notification_id)
        
        query = f"UPDATE notifications SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()
        
        # Get updated notification
        cursor.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,))
        updated_notification = cursor.fetchone()
        
        return {
            "id": updated_notification["id"],
            "user_id": updated_notification["user_id"],
            "title": updated_notification["title"],
            "message": updated_notification["message"],
            "notification_type": updated_notification["notification_type"],
            "related_id": updated_notification["related_id"],
            "related_type": updated_notification["related_type"],
            "event_id": updated_notification["event_id"],
            "project_id": updated_notification["project_id"],
            "metadata": json.loads(updated_notification["metadata"]) if updated_notification["metadata"] else None,
            "is_read": bool(updated_notification["is_read"]),
            "created_at": updated_notification["created_at"],
            "updated_at": updated_notification["updated_at"]
        }
    finally:
        conn.close()

@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db = Depends(get_db)):
    """Delete a notification"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM notifications WHERE id = ?", (notification_id,))
        notification = cursor.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        cursor.execute("DELETE FROM notifications WHERE id = ?", (notification_id,))
        conn.commit()
        return {"message": "Notification deleted successfully"}
    finally:
        conn.close()

@router.put("/{notification_id}/read")
def mark_as_read(notification_id: int, db = Depends(get_db)):
    """Mark a notification as read"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM notifications WHERE id = ?", (notification_id,))
        notification = cursor.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        cursor.execute("UPDATE notifications SET is_read = 1, updated_at = ? WHERE id = ?", (datetime.utcnow(), notification_id))
        conn.commit()
        
        return {"message": "Notification marked as read"}
    finally:
        conn.close()

@router.put("/user/{user_id}/read-all")
def mark_all_as_read(user_id: int, db = Depends(get_db)):
    """Mark all notifications as read for a user"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", (user_id,))
        count = cursor.fetchone()[0]
        
        cursor.execute("UPDATE notifications SET is_read = 1, updated_at = ? WHERE user_id = ? AND is_read = 0", (datetime.utcnow(), user_id))
        conn.commit()
        
        return {"message": f"Marked {count} notifications as read"}
    finally:
        conn.close()

# Team Invite System
@router.post("/team-invite", response_model=dict)
def send_team_invite(invite: TeamInviteCreate, db = Depends(get_db)):
    """Send a team invite and create notification"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        
        # Verify all users and project exist
        cursor.execute("SELECT id, name FROM users WHERE id = ?", (invite.inviter_id,))
        inviter = cursor.fetchone()
        cursor.execute("SELECT id, name FROM users WHERE id = ?", (invite.invitee_id,))
        invitee = cursor.fetchone()
        cursor.execute("SELECT id, title FROM projects WHERE id = ?", (invite.project_id,))
        project = cursor.fetchone()
        
        if not inviter or not invitee or not project:
            raise HTTPException(status_code=404, detail="User or project not found")
        
        # Check if invite already exists
        cursor.execute("""
            SELECT id FROM notifications 
            WHERE user_id = ? AND notification_type = 'team_invite' 
            AND related_id = ? AND is_read = 0
        """, (invite.invitee_id, invite.project_id))
        existing_invite = cursor.fetchone()
        
        if existing_invite:
            raise HTTPException(status_code=400, detail="Team invite already sent")
        
        # Create notification for team invite
        metadata = {
            "inviter_id": invite.inviter_id,
            "inviter_name": inviter["name"],
            "project_id": invite.project_id,
            "project_title": project["title"],
            "role": invite.role,
            "skills": invite.skills,
            "message": invite.message,
            "status": "pending"
        }
        
        notification_id = create_notification(
            db=conn,
            user_id=invite.invitee_id,
            title=f"Team Invite: {project['title']}",
            message=f"{inviter['name']} invited you to join their team for '{project['title']}' as {invite.role}",
            notification_type="team_invite",
            related_id=invite.project_id,
            related_type="project",
            project_id=invite.project_id,
            metadata=metadata
        )
        
        # Get the created notification
        cursor.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,))
        notification = cursor.fetchone()
        
        return {
            "id": notification["id"],
            "message": "Team invite sent successfully",
            "notification": {
                "id": notification["id"],
                "title": notification["title"],
                "message": notification["message"],
                "metadata": metadata
            }
        }
    finally:
        conn.close()

@router.post("/team-invite/{invite_id}/respond", response_model=dict)
def respond_to_team_invite(invite_id: int, response: TeamInviteResponse, db = Depends(get_db)):
    """Accept or reject a team invite"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM notifications 
            WHERE id = ? AND notification_type = 'team_invite' AND is_read = 0
        """, (invite_id,))
        notification = cursor.fetchone()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Team invite not found")
        
        metadata = json.loads(notification["metadata"]) if notification["metadata"] else {}
        
        if response.action == "accept":
            # Add user to team
            cursor.execute("""
                INSERT INTO project_team_members (project_id, user_id, role, skills, joined_at, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (metadata["project_id"], notification["user_id"], metadata["role"], 
                  json.dumps(metadata["skills"]), datetime.utcnow(), "active"))
            
            # Update notification
            metadata["status"] = "accepted"
            cursor.execute("""
                UPDATE notifications 
                SET metadata = ?, is_read = 1, updated_at = ? 
                WHERE id = ?
            """, (json.dumps(metadata), datetime.utcnow(), invite_id))
            
            # Create notification for inviter
            create_notification(
                db=conn,
                user_id=metadata["inviter_id"],
                title=f"Team Invite Accepted",
                message=f"Your team invite for '{metadata['project_title']}' has been accepted!",
                notification_type="team_invite_response",
                related_id=metadata["project_id"],
                related_type="project",
                project_id=metadata["project_id"],
                metadata={"status": "accepted", "invitee_id": notification["user_id"]}
            )
            
            conn.commit()
            return {"message": "Team invite accepted successfully"}
        
        elif response.action == "reject":
            # Update notification
            metadata["status"] = "rejected"
            cursor.execute("""
                UPDATE notifications 
                SET metadata = ?, is_read = 1, updated_at = ? 
                WHERE id = ?
            """, (json.dumps(metadata), datetime.utcnow(), invite_id))
            
            # Create notification for inviter
            create_notification(
                db=conn,
                user_id=metadata["inviter_id"],
                title=f"Team Invite Declined",
                message=f"Your team invite for '{metadata['project_title']}' has been declined.",
                notification_type="team_invite_response",
                related_id=metadata["project_id"],
                related_type="project",
                project_id=metadata["project_id"],
                metadata={"status": "rejected", "invitee_id": notification["user_id"]}
            )
            
            conn.commit()
            return {"message": "Team invite rejected successfully"}
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'accept' or 'reject'")
    finally:
        conn.close()

@router.get("/unread-count/{user_id}")
def get_unread_count(user_id: int, db = Depends(get_db)):
    """Get count of unread notifications for a user"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", (user_id,))
        count = cursor.fetchone()[0]
        
        return {"unread_count": count}
    finally:
        conn.close()

@router.get("/types/{user_id}")
def get_notification_types(user_id: int, db = Depends(get_db)):
    """Get notification types and counts for a user"""
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT notification_type, is_read FROM notifications WHERE user_id = ?", (user_id,))
        notifications = cursor.fetchall()
        
        type_counts = {}
        for notification in notifications:
            notification_type = notification["notification_type"]
            is_read = bool(notification["is_read"])
            
            if notification_type not in type_counts:
                type_counts[notification_type] = {"total": 0, "unread": 0}
            
            type_counts[notification_type]["total"] += 1
            if not is_read:
                type_counts[notification_type]["unread"] += 1
        
        return type_counts 
    finally:
        conn.close() 