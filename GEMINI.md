# Gemini Project: GramUdyogAI

This document outlines the structure, conventions, and important details of the GramUdyogAI project.

## Project Overview

GramUdyogAI is a platform designed to empower rural communities by providing access to information, resources, and opportunities in various sectors, including agriculture, skill development, and entrepreneurship. The platform leverages AI-powered features to offer personalized recommendations, educational content, and support to its users.

## Key Technologies

### Backend

- **Framework:** FastAPI (Python)
- **Database:** SQLite
- **Core Libraries:**
    - `uvicorn`: ASGI server
    - `sqlite3`: SQL
    - `pydantic`: Data validation
    - `python-multipart`: Form data parsing
    - `passlib` & `python-jose`: Authentication
    - `google-generativeai`: AI-powered features
    - `gTTS`: Text-to-speech
    - `SpeechRecognition`: Speech-to-text

### Frontend

- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Key Libraries:**
    - `axios`: HTTP client
    - `react-router-dom`: Routing

## Directory Structure

- `backend/`: Contains the FastAPI application, including API routes, core logic, database models, and other backend-related files.
- `frontend/`: Contains the React frontend application, including components, pages, styles, and other frontend-related files.
- `shared/`: Contains files and resources that are shared between the backend and frontend, such as constants or configuration files.
- `venv/`: Virtual environment for Python dependencies.
- `.idea/`: Project configuration files for JetBrains IDEs.

## Development Notes

- The backend and frontend are developed and run as separate services.
- The `dev-backend.bat` and `dev-backend.ps1` scripts can be used to start the backend development server.
- The `package.json` files in the root, `backend/`, and `frontend/` directories manage project dependencies.
- The `GEMINI.md` file serves as a central repository of information for the Gemini CLI agent.

## API Endpoint Analysis & Cleanup Plan

The following issues have been identified in the backend API and will be addressed.

### 1. Redundant Endpoints

-   **Project Creation:** `POST /events/{event_id}/create-project` in `routes_events.py` is redundant.
    -   **Fix:** Remove this endpoint. Use `POST /projects` from `routes_projects.py`, which already supports `event_id`.
-   **Add Team Member:** `POST /events/{event_id}/projects/{project_id}/add-member` in `routes_events.py` is redundant.
    -   **Fix:** Remove this endpoint. Use `POST /projects/{project_id}/team-members` from `routes_projects.py`.
-   **User Profile:** `GET /users/{user_id}/profile` and `PUT /users/{user_id}/profile` in `routes_users.py` are redundant.
    -   **Fix:** Remove these endpoints. Consolidate all profile operations under the routes in `routes_profile.py`.
-   **Audio Fetching:** `GET /audio/{language}/{filename}` in `routes_skills.py` is redundant.
    -   **Fix:** Remove this endpoint. The frontend can construct the path for the more generic `GET /audio/{audio_name}`.

### 2. Misplaced Endpoints

-   **User Search:** `GET /users/search` is located in `routes_projects.py`.
    -   **Fix:** Move this endpoint to `routes_users.py` to centralize user-related operations.

### 3. Inconsistent API Design

-   **Profile Routes:** Profile creation is `POST /profile`, while get/update operations are on `/users/unified-profile`.
    -   **Fix:** Standardize all profile routes under `/api/profile`.
-   **Translation Route Prefix:** The translation route has a double prefix (`/api/api/translate`).
    -   **Fix:** Correct the route definition in `translation.py` to avoid the duplicate prefix.

### 4. Database Schema & Initialization Issues

-   **Decentralized Table Creation:** `routes_notifications.py` and other files create their own tables.
    -   **Fix:** Consolidate all `CREATE TABLE` statements into `backend/init_db.py`. Remove database initialization logic from all other files.
-   **Conflicting Team Tables:** There is confusion between `team_members` and `project_team_members` tables.
    -   **Fix:** Standardize on the `project_team_members` table as defined in `init_db.py`. Remove the `team_members` table creation and usage.