# GramUdyogAI Database Schema Documentation

## Overview

This document explains the database schema for GramUdyogAI, particularly focusing on the user management system and the fixes applied to resolve inconsistent table references.

## User Management Tables

### 1. **`users`** (Main Authentication Table)
**Location**: `setup_auth.py`, `routes_auth.py`

**Purpose**: Core authentication and user management
- Stores basic user information for login/authentication
- Contains user credentials and account status
- Primary source of truth for user existence

**Key Fields**:
```sql
- id (PRIMARY KEY)
- phone (UNIQUE, NOT NULL)
- password_hash (NOT NULL)
- user_type (NOT NULL) - 'individual', 'company', 'ngo', 'investor'
- name (NOT NULL)
- organization
- is_active (BOOLEAN)
- is_verified (BOOLEAN)
- created_at, updated_at
```

**Used by**: 
- Authentication system (login/logout)
- Password management
- Account verification
- User session management

### 2. **`unified_profiles`** (Enhanced Profile Table)
**Location**: `init_db.py`, `routes_profile.py`

**Purpose**: Comprehensive user profiles with detailed information
- Stores extended user profile data
- Contains skills, achievements, impact metrics
- Links to main user account via `user_id`

**Key Fields**:
```sql
- id (PRIMARY KEY)
- user_id (UNIQUE, FOREIGN KEY -> users.id)
- name (NOT NULL)
- organization, location, state
- skills (JSON array)
- experience, goals
- achievements (JSON array)
- impact_metrics (JSON object)
- recent_activities (JSON array)
- recommendations (JSON array)
- networking_suggestions (JSON array)
- user_type (NOT NULL)
- created_at, updated_at
```

**Used by**:
- Profile management system
- Skills and achievements tracking
- Impact metrics and analytics
- User recommendations

## Related Tables

### 3. **`event_participants`**
- Links users to events they participate in
- **Foreign Key**: `user_id` → `users.id`

### 4. **`course_enrollments`**
- Links users to courses they're enrolled in
- **Foreign Key**: `user_id` → `users.id`

### 5. **`project_team_members`**
- Links users to projects they're part of
- **Foreign Key**: `user_id` → `users.id`

### 6. **`achievements`**
- Stores user achievements
- **Foreign Key**: `profile_id` → `unified_profiles.id`

### 7. **`profile_activities`**
- Stores user activities and milestones
- **Foreign Key**: `profile_id` → `unified_profiles.id`

## Issues Fixed

### Problem 1: Non-existent `user_profiles` Table
**Issue**: Multiple tables referenced `user_profiles(id)` but this table was never created (only commented out in code).

**Impact**:
- Foreign key constraint violations
- Database initialization errors
- Inconsistent user references across endpoints

**Solution**: 
- Removed all references to `user_profiles`
- Updated all foreign keys to reference `users(id)` instead

### Problem 2: Inconsistent User Table Checks
**Issue**: Different endpoints checked different tables for user existence:
- `/users/{user_id}/events` checked `users` table
- Course enrollments checked `user_profiles` (non-existent)
- Profile routes used `unified_profiles`

**Solution**:
- Standardized all user existence checks to use `users` table
- Updated all foreign key references to point to `users(id)`

### Problem 3: Schema Inconsistency
**Issue**: Different initialization scripts created conflicting schemas.

**Solution**:
- Consolidated schema creation in `init_db.py`
- Created `fix_database_schema.py` to repair existing databases
- Ensured all foreign key references are consistent

## Database Relationships

```
users (1) ←→ (1) unified_profiles
  ↓
  ├── event_participants (1:N)
  ├── course_enrollments (1:N)
  ├── project_team_members (1:N)
  └── user_passwords (1:1)

unified_profiles (1) ←→ (N) achievements
unified_profiles (1) ←→ (N) profile_activities
```

## Usage Guidelines

### For Authentication
- Always use `users` table for login/authentication
- Check user existence in `users` table
- Use `users.id` as the primary user identifier

### For Profile Data
- Store basic profile info in `unified_profiles`
- Link via `user_id` to `users.id`
- Use `unified_profiles` for skills, achievements, etc.

### For Relationships
- All user relationships (events, courses, projects) reference `users.id`
- Profile-specific data (achievements, activities) reference `unified_profiles.id`

## Migration Notes

If you have an existing database with the old schema:

1. **Backup your database**:
   ```bash
   cp gramudyogai.db gramudyogai.db.backup
   ```

2. **Run the fix script**:
   ```bash
   python fix_database_schema.py
   ```

3. **Verify the fix**:
   ```bash
   python check_db.py
   ```

## API Endpoints

### User Management
- `POST /api/auth/register` - Create user in `users` table
- `POST /api/auth/login` - Authenticate against `users` table
- `GET /api/users/unified-profile` - Get profile from `unified_profiles`

### User-Specific Data
- `GET /api/users/{user_id}/events` - Get user's events
- `GET /api/users/{user_id}/projects` - Get user's projects
- `POST /api/courses/{course_id}/enroll` - Enroll user in course

## Best Practices

1. **Always check user existence in `users` table first**
2. **Use `users.id` as the primary user identifier**
3. **Store extended profile data in `unified_profiles`**
4. **Maintain referential integrity with proper foreign keys**
5. **Use transactions for operations affecting multiple tables**

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Error**
   - Ensure user exists in `users` table before creating related records
   - Check that `user_id` values are valid

2. **Profile Not Found**
   - Check if `unified_profiles` record exists for the user
   - Create default profile if missing

3. **Database Schema Errors**
   - Run `fix_database_schema.py` to repair schema
   - Check foreign key references are correct

### Verification Commands

```bash
# Check database schema
python check_db.py

# Fix schema issues
python fix_database_schema.py

# Initialize demo users
python init_demo_users.py
``` 