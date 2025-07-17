import os, sys
from init_db import init_database, seed_db, load_all_skill_india_data, migrate_database_schema
import logging

# Set up logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)



from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

init_database()
migrate_database_schema()  # Migrate existing schema
# seed_db()

# Load Skill India data on startup
try:
    load_all_skill_india_data()
except Exception as e:
    logging.error(f"Failed to load Skill India data: {e}")
    # Continue startup even if data loading fails

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routes_skills import router as skills_router
from api.routes_business import router as business_router
# from api.routes_government import router as government_router  # Commented out as the module does not exist
from api.routes_scheme import router as scheme_router
from api.routes_jobs import router as jobs_router
from api.routes_courses import router as courses_router
from api.translation import router as translation_router
from api.routes_profile import router as profile_router
from api.routes_audio import router as audio_router
from api.routes_stt import router as stt_router
from api.routes_youtube_summary import router as youtube_summary_router
from api.routes_dashboard import router as dashboard_router
from api.routes_ai_assistant import router as ai_assistant_router
# --- ADD THIS IMPORT ---
from api.routes_course_suggestion import router as course_suggestion_router
from api.routes_events import router as events_router
from api.routes_projects import router as projects_router
from api.routes_auth import router as auth_router
from api.routes_users import router as users_router
from api.routes_notifications import router as notifications_router


app = FastAPI(title="GramUdyogAI API")

# Mount static files directories
app.mount("/images", StaticFiles(directory="images"), name="images")
app.mount("/audio", StaticFiles(directory="audio"), name="audio")


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with proper prefixes
app.include_router(skills_router, prefix="/api", tags=["skills"])
app.include_router(business_router,tags=["business"])
# app.include_router(government_router, prefix="/api", tags=["government"])  # Commented out as the module does not exist
app.include_router(scheme_router, tags=["schemes"])
app.include_router(jobs_router, prefix="/api", tags=["jobs"])
app.include_router(courses_router, prefix="/api", tags=["courses"])
app.include_router(translation_router, tags=["translation"])
app.include_router(profile_router, prefix="/api", tags=["profile"])
app.include_router(audio_router, prefix="/api", tags=["audio"])
app.include_router(stt_router, prefix="/api", tags=["stt"])
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])
app.include_router(youtube_summary_router, prefix="/api/youtube-summary", tags=["youtube-summary"])
app.include_router(ai_assistant_router, prefix="/api", tags=["ai-assistant"])
app.include_router(course_suggestion_router, prefix="/api")
app.include_router(events_router, prefix="/api", tags=["events"])
app.include_router(projects_router, prefix="/api", tags=["projects"])
app.include_router(auth_router, prefix="/api", tags=["authentication"])
app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(notifications_router, prefix="/api", tags=["notifications"])
if __name__ == "__main__":
    import uvicorn
    import os
    # init_database()
    # seed_db()
    print('Initiliazed DB')
    # Check if we're in development mode
    is_dev = os.getenv("ENVIRONMENT") == "development" or os.getenv("DEBUG") == "true"
    
    if is_dev:
        print("🚀 Starting FastAPI in development mode...")
        print("📚 API docs: http://localhost:8000/docs")
        print("🔄 Hot reload: Use 'python dev_server.py' for hot reload")
        print("-" * 50)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=is_dev,  # Enable reload in development
        log_level="info" if is_dev else "warning"
    )
