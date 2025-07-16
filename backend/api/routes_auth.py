from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator
import sqlite3
from init_db import get_db
import bcrypt
import jwt
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging
import secrets
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

# Password validation patterns
PASSWORD_PATTERN = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')
PHONE_PATTERN = re.compile(r'^\+?[1-9]\d{1,14}$')

# Fix the get_db function to return dictionary rows
def get_db_connection():
    """Get database connection with row factory for dictionary access"""
    conn = sqlite3.connect('gramudyogai.db')
    conn.row_factory = sqlite3.Row  # This makes rows accessible by column name
    return conn

# Pydantic models (keep existing models)
class UserRegister(BaseModel):
    phone: str
    password: str
    confirm_password: str
    user_type: str
    name: str
    organization: Optional[str] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        if not PHONE_PATTERN.match(v):
            raise ValueError('Invalid phone number format')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if not PASSWORD_PATTERN.match(v):
            raise ValueError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character')
        return v
    
    @validator('confirm_password')
    def validate_confirm_password(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v
    
    @validator('user_type')
    def validate_user_type(cls, v):
        allowed_types = ['individual', 'company', 'ngo', 'investor']
        if v not in allowed_types:
            raise ValueError(f'User type must be one of: {", ".join(allowed_types)}')
        return v

class UserLogin(BaseModel):
    phone: str
    password: str

class PasswordReset(BaseModel):
    phone: str
    new_password: str
    confirm_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if not PASSWORD_PATTERN.match(v):
            raise ValueError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character')
        return v
    
    @validator('confirm_password')
    def validate_confirm_password(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_id: int
    user_type: str
    name: str

class UserResponse(BaseModel):
    id: int
    phone: str
    user_type: str
    name: str
    organization: Optional[str]
    created_at: str
    last_login: Optional[str]

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: int, user_type: str) -> str:
    """Create JWT token"""
    payload = {
        "user_id": user_id,
        "user_type": user_type,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_jwt_token(token)
    
    # Verify user still exists and is active
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, phone, user_type, name, organization, is_active FROM users WHERE id = ?', (payload['user_id'],))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not user['is_active']:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return {
        "id": user['id'],
        "phone": user['phone'],
        "user_type": user['user_type'],
        "name": user['name'],
        "organization": user['organization']
    }

@router.post("/auth/register", response_model=TokenResponse)
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if phone number already exists
        cursor.execute('SELECT id FROM users WHERE phone = ?', (user_data.phone,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Phone number already registered")
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Create user
        cursor.execute('''
            INSERT INTO users (phone, password_hash, user_type, name, organization, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_data.phone,
            password_hash,
            user_data.user_type,
            user_data.name,
            user_data.organization,
            datetime.utcnow().isoformat(),
            datetime.utcnow().isoformat()
        ))
        
        user_id = cursor.lastrowid
        if user_id is None:
            raise HTTPException(status_code=500, detail="Failed to create user")
            
        conn.commit()
        conn.close()
        
        # Create JWT token
        access_token = create_jwt_token(user_id, user_data.user_type)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=JWT_EXPIRY_HOURS * 3600,
            user_id=user_id,
            user_type=user_data.user_type,
            name=user_data.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/auth/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin):
    """Login user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user by phone
        cursor.execute('''
            SELECT id, password_hash, user_type, name, organization, is_active 
            FROM users WHERE phone = ?
        ''', (login_data.phone,))
        
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid phone number or password")
        
        if not user['is_active']:
            conn.close()
            raise HTTPException(status_code=401, detail="Account is deactivated")
        
        # Verify password
        if not verify_password(login_data.password, user['password_hash']):
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid phone number or password")
        
        # Update last_login timestamp (optional)
        try:
            cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (datetime.utcnow(), user['id']))
            conn.commit()
        except sqlite3.OperationalError as e:
            if "no such column: last_login" in str(e):
                logger.warning("Skipping last_login update: column not found in users table.")
            else:
                raise

        # Generate JWT token
        expiry = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
        token_payload = {
            "user_id": user['id'],
            "user_type": user['user_type'],
            "exp": expiry,
            "iat": datetime.utcnow()
        }
        access_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=JWT_EXPIRY_HOURS * 3600,
            user_id=user['id'],
            user_type=user['user_type'],
            name=user['name']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/auth/logout")
async def logout_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Logout user (invalidate token)"""
    # In a production environment, you might want to add the token to a blacklist
    # For now, we'll just return success since JWT tokens are stateless
    return {"message": "Successfully logged out"}

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, phone, user_type, name, organization, created_at, last_login 
        FROM users WHERE id = ?
    ''', (current_user['id'],))
    
    user = cursor.fetchone()
    conn.close()
    
    return UserResponse(
        id=user['id'],
        phone=user['phone'],
        user_type=user['user_type'],
        name=user['name'],
        organization=user['organization'],
        created_at=user['created_at'],
        last_login=user['last_login']
    )

@router.post("/auth/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    confirm_password: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Change user password"""
    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    if not PASSWORD_PATTERN.match(new_password):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get current password hash
    cursor.execute('SELECT password_hash FROM users WHERE id = ?', (current_user['id'],))
    user = cursor.fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(current_password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Hash new password
    new_password_hash = hash_password(new_password)
    
    # Update password
    cursor.execute('''
        UPDATE users 
        SET password_hash = ?, updated_at = ?
        WHERE id = ?
    ''', (new_password_hash, datetime.utcnow().isoformat(), current_user['id']))
    
    conn.commit()
    conn.close()
    
    return {"message": "Password changed successfully"}

@router.post("/auth/forgot-password")
async def forgot_password(phone: str):
    """Initiate password reset process"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM users WHERE phone = ?', (phone,))
    user = cursor.fetchone()
    
    if not user:
        # Don't reveal if user exists or not for security
        return {"message": "If the phone number exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    
    # Store reset token
    cursor.execute('''
        INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, ?)
    ''', (user['id'], reset_token, expires_at, datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()
    
    # In a production environment, you would send an SMS or email with the reset link.
    # For now, we just securely store the token and confirm initiation.
    return {"message": "If a user with that phone number exists, a password reset has been initiated."}

@router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset, reset_token: str):
    """Reset password using token"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Find valid reset token
    cursor.execute('''
        SELECT user_id, used, expires_at 
        FROM password_reset_tokens 
        WHERE token = ?
    ''', (reset_token,))
    
    token_record = cursor.fetchone()
    
    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    
    if token_record['used']:
        raise HTTPException(status_code=400, detail="Reset token already used")
    
    expires_at = datetime.fromisoformat(token_record['expires_at'])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Hash new password
    new_password_hash = hash_password(reset_data.new_password)
    
    # Update password
    cursor.execute('''
        UPDATE users 
        SET password_hash = ?, updated_at = ?
        WHERE id = ?
    ''', (new_password_hash, datetime.utcnow().isoformat(), token_record['user_id']))
    
    # Mark token as used
    cursor.execute('''
        UPDATE password_reset_tokens 
        SET used = 1 
        WHERE token = ?
    ''', (reset_token,))
    
    conn.commit()
    conn.close()
    
    return {"message": "Password reset successfully"}

@router.delete("/auth/delete-account")
async def delete_account(
    password: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete user account"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify password
    cursor.execute('SELECT password_hash FROM users WHERE id = ?', (current_user['id'],))
    user = cursor.fetchone()
    
    if not verify_password(password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Password is incorrect")
    
    # Soft delete (deactivate account)
    cursor.execute('''
        UPDATE users 
        SET is_active = 0, updated_at = ?
        WHERE id = ?
    ''', (datetime.utcnow().isoformat(), current_user['id']))
    
    conn.commit()
    conn.close()
    
    return {"message": "Account deleted successfully"}
