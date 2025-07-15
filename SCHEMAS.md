# Project Data Schemas Reference

This document provides a comprehensive overview of all major data schemas used in the GramUdyogAI project, covering both backend (Pydantic/DB) and frontend (TypeScript) models. Use this as the single source of truth for API, database, and UI development.

---

## 1. Project

### TypeScript Interface (`frontend/src/lib/api.ts`)
```ts
export interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  event_id: number;
  event_name: string;
  event_type: string;
  team_members: TeamMember[];
  technologies: string[];
  impact_metrics: {
    users_reached: number;
    revenue_generated: number;
    jobs_created: number;
    social_impact: number;
  };
  funding_status: 'seeking' | 'funded' | 'self_funded';
  funding_amount: number;
  funding_goal: number;
  location: string;
  state: string;
  created_by: number;
  created_at: string;
  completed_at?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  media: {
    images: string[];
    videos: string[];
    documents: string[];
  };
  testimonials: Testimonial[];
  awards: Award[];
  tags: string[];
}
```

---

## 2. Event

### TypeScript Interface (`frontend/src/lib/api.ts`)
```ts
export interface Event {
  id: number;
  title: string;
  description: string;
  event_type: 'hackathon' | 'workshop' | 'competition' | 'training' | 'meetup';
  category: string;
  location: string;
  state: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  current_participants: number;
  budget: number;
  prize_pool: number;
  organizer: {
    id: number;
    name: string;
    type: 'company' | 'ngo' | 'individual';
    logo?: string;
  };
  created_by: number;
  skills_required: string[];
  tags: string[];
  status: 'draft' | 'active' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  impact_metrics: {
    participants_target: number;
    skills_developed: number;
    projects_created: number;
    employment_generated: number;
  };
  marketing_highlights?: string[];
  success_metrics?: string[];
  sections?: { title: string; description: string; key_points?: string[]; target_audience?: string; expected_outcome?: string }[];
  social_media_posts: SocialMediaPost[];
  created_at: string;
  updated_at: string;
}
```

---

## 3. User & UserProfile

### TypeScript Interface (`frontend/src/lib/api.ts`)
```ts
export interface User {
  id: number;
  phone: string;
  user_type: 'individual' | 'company' | 'ngo' | 'investor';
  name: string;
  organization?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

export interface UserProfile {
  user_id?: number;
  name: string;
  user_type: 'individual' | 'company' | 'ngo' | 'investor';
  organization?: string | null;
  location?: string;
  state?: string;
  skills: string[];
  experience?: string;
  goals?: string;
  impact_metrics: {
    participants_target: number;
    skills_developed: number;
    projects_created: number;
    employment_generated: number;
    revenue_generated: number;
    events_hosted?: number;
    events_participated?: number;
    people_impacted?: number;
    jobs_created?: number;
    social_impact_score?: number;
    sustainability_score?: number;
  };
  achievements: Achievement[];
  recent_activities: Activity[];
  recommendations: Recommendation[];
  networking_suggestions: string[];
  notifications_settings?: any;
  created_at: string;
  updated_at: string;
}
```

### UserProfileForm (React Form, `UserProfile.tsx`)
```ts
interface UserProfileForm {
  name: string;
  organization?: string | null;
  location: string;
  district: string;
  state: string;
  language: string;
  customLanguage: string;
  skills: string[];
  jobTypes: string[];
  customJobTypes: string[];
  needMentor: boolean;
  userType: 'individual' | 'company' | 'ngo' | 'investor';
  experience?: string;
  goals?: string;
}
```

**Notes:**
- The form now matches the API schema for all required fields.
- `userType` is strictly typed to match the backend.
- `organization`, `experience`, and `goals` are present in both.
- `location` and `district` are separated in the form; only `location` is sent to the API.
- All skills are merged before submission.

---

## 4. Voice Profile Update

### Backend Function (`backend/core/enhanced_llm.py`)
```python
async def voice_update_profile(transcription: str, current_profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update profile fields based on voice transcription"""
```

### LLM Response Schema
```json
{
  "name": "string or null",
  "location": "string or null", 
  "state": "string or null",
  "skills": ["string"],
  "experience": "string or null",
  "goals": "string or null",
  "organization": "string or null"
}
```

### API Endpoint (`backend/api/routes_stt.py`)
```python
@router.post("/voice-update-profile")
async def voice_update_profile_endpoint(request: Request):
    """
    Accepts JSON: { "transcription": str, "current_profile": dict }
    Returns: Updated profile fields as JSON
    """
```

### Frontend Request Format
```ts
// POST /api/voice-update-profile
{
  "transcription": "I am John Doe from Mumbai, I have skills in web development and Python",
  "current_profile": {
    "name": "Current Name",
    "location": "Current Location",
    "skills": ["existing_skill"],
    // ... other profile fields
  }
}
```

### Frontend Response Handling
```ts
// Response contains only the fields that should be updated
{
  "name": "John Doe",
  "location": "Mumbai", 
  "skills": ["web development", "Python"]
}
```

**Notes:**
- Only fields mentioned in the voice transcription are returned
- Null values are filtered out (unchanged fields are not included)
- Skills are merged with existing ones
- Conservative approach - only updates clearly stated information
- Used for the main voice button in UnifiedProfile.tsx

---

## 4. Notification

### TypeScript Interface (`frontend/src/lib/api.ts`)
```ts
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  related_id?: number;
  related_type?: string;
  event_id?: number;
  project_id?: number;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}
```

---

## 5. TeamMember, Testimonial, Award

### TypeScript Interface (`frontend/src/lib/api.ts`)
```ts
export interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  role: string;
  skills: string[];
  joined_at: string;
  project_id?: number;
  event_id?: number;
  project_title?: string;
}

export interface Testimonial {
  id: number;
  user_name: string;
  content: string;
  rating: number;
  created_at: string;
}

export interface Award {
  id: number;
  title: string;
  description: string;
  date: string;
  organization: string;
}
```

---

## 6. CSRCourse

### TypeScript Interface (`frontend/src/lib/api.ts`)
```ts
export interface CSRCourse {
  id: number;
  company_id: number;
  title: string;
  description: string;
  skills: string[];
  duration: string;
  language: string;
  certification: boolean;
  max_seats: number;
  start_date: string;
  status: 'active' | 'inactive' | 'completed';
  content_url?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 7. VisualSummary

### TypeScript Interface (`frontend/src/lib/api.ts`)
```ts
export interface VisualSummary {
  id: number;
  topic: string;
  summary_data: Record<string, unknown>;
  created_at: string;
}
```

---

## 8. Other Supporting Types

- **SocialMediaPost**
- **Job, JobCreate, JobUpdate**
- **Activity, Achievement, Recommendation, NetworkingSuggestion**

Refer to `frontend/src/lib/api.ts` for full details and field-level documentation.

---

## Backend (Pydantic/DB) Schemas

- Backend schemas closely mirror the frontend TypeScript interfaces, with Pydantic models for validation and SQLite tables for persistence.
- For each entity, ensure the field names, types, and nullability match between backend and frontend.
- For advanced validation, refer to the Pydantic models in `backend/api/routes_*.py` and `backend/models/`.

---

## **How to Use This Document**
- Use these schemas as the reference for all API requests, responses, and database migrations.
- When updating a schema, update this document and the corresponding TypeScript and Pydantic models.
- For new features, extend these interfaces and document changes here. 

---

# Backend (SQLite) Database Schemas

Below are the backend database schemas as defined in `backend/init_db.py`. All fields, types, and notes on JSON/text fields are included for reference.

## users
```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL,
    name TEXT NOT NULL,
    organization TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login TEXT DEFAULT NULL
)
```

## events
```sql
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    budget INTEGER DEFAULT 0,
    prize_pool INTEGER DEFAULT 0,
    organizer_id INTEGER NOT NULL,
    organizer_name TEXT NOT NULL,
    organizer_type TEXT NOT NULL,
    organizer_logo TEXT,
    created_by INTEGER NOT NULL,
    skills_required TEXT NOT NULL, -- JSON array
    tags TEXT NOT NULL,           -- JSON array
    status TEXT DEFAULT 'draft',
    impact_metrics TEXT DEFAULT '{"participants_target": 0, "skills_developed": 0, "projects_created": 0, "employment_generated": 0}', -- JSON object
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users (id)
)
```

## event_participants
```sql
CREATE TABLE IF NOT EXISTS event_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'registered',
    joined_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
)
```

## event_status_history
```sql
CREATE TABLE IF NOT EXISTS event_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER NOT NULL,
    reason TEXT,
    changed_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events (id),
    FOREIGN KEY (changed_by) REFERENCES users (id)
)
```

## projects
```sql
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    team_members TEXT NOT NULL, -- JSON array
    technologies TEXT DEFAULT '[]', -- JSON array
    impact_metrics TEXT DEFAULT '{"users_reached": 0, "revenue_generated": 0}', -- JSON object
    funding_status TEXT DEFAULT 'seeking',
    funding_amount INTEGER DEFAULT 0,
    funding_goal INTEGER DEFAULT 0,
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT DEFAULT 'active',
    media TEXT DEFAULT '{"images": [], "videos": []}', -- JSON object
    testimonials TEXT DEFAULT '[]', -- JSON array
    awards TEXT DEFAULT '[]', -- JSON array
    tags TEXT DEFAULT '[]', -- JSON array
    FOREIGN KEY (event_id) REFERENCES events (id)
)
```

## project_team_members
```sql
CREATE TABLE IF NOT EXISTS project_team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    event_id INTEGER,  -- Added event_id
    role TEXT NOT NULL,
    skills TEXT NOT NULL, -- JSON array
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
)
```

## unified_profiles
```sql
CREATE TABLE IF NOT EXISTS unified_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    organization TEXT,
    location TEXT,
    state TEXT,
    skills TEXT, -- JSON array
    experience TEXT,
    goals TEXT,
    user_type TEXT NOT NULL,
    notifications_settings TEXT, -- JSON object
    impact_metrics TEXT, -- JSON object
    achievements TEXT, -- JSON array
    recent_activities TEXT, -- JSON array
    recommendations TEXT, -- JSON array
    networking_suggestions TEXT, -- JSON array
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
```

## profile_activities
```sql
CREATE TABLE IF NOT EXISTS profile_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
)
```

## social_media_posts
```sql
CREATE TABLE IF NOT EXISTS social_media_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    scheduled_at TEXT,
    status TEXT DEFAULT 'draft',
    created_at TEXT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events (id)
)
```

## notifications
```sql
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    related_id INTEGER,
    related_type TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)
```

## visual_summaries
```sql
CREATE TABLE IF NOT EXISTS visual_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    summary_data TEXT NOT NULL, -- JSON object
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## summary_translations
```sql
CREATE TABLE IF NOT EXISTS summary_translations (
    summary_id INTEGER,
    language TEXT,
    translated_data TEXT, -- JSON object
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (summary_id, language),
    FOREIGN KEY (summary_id) REFERENCES visual_summaries(id)
)
```

## audio_files
```sql
CREATE TABLE IF NOT EXISTS audio_files (
    text_hash TEXT,
    language TEXT,
    file_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (text_hash, language)
)
```

## job_postings
```sql
CREATE TABLE IF NOT EXISTS job_postings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    company_contact TEXT NOT NULL,
    pay TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)
```

---

**Notes:**
- Fields marked as `-- JSON array` or `-- JSON object` are stored as JSON-encoded strings.
- Foreign keys are used for referential integrity.
- Timestamps are stored as TEXT or TIMESTAMP.
- For full backend logic, see Pydantic models in `backend/api/routes_*.py` and `backend/models/`. 