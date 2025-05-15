import os
from dotenv import load_dotenv
# load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes_skills import router as skills_router
from api.routes_business import router as business_router
# from api.routes_government import router as government_router  # Commented out as the module does not exist
from api.routes_scheme import router as scheme_router
from api.routes_jobs import router as jobs_router
from api.translation import router as translation_router
from api.routes_profile import router as profile_router
from api.routes_audio import router as audio_router
from api.routes_csr import router as csr_router
from api.routes_stt import router as stt_router
from api.routes_youtube_summary import router as youtube_summary_router
from api.routes_dashboard import router as dashboard_router
from api.routes_ai_assistant import router as ai_assistant_router
app = FastAPI(title="GramUdyogAI API")

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
app.include_router(translation_router, tags=["translation"])
app.include_router(profile_router, prefix="/api", tags=["profile"])
app.include_router(audio_router, prefix="/api", tags=["audio"])
app.include_router(csr_router, prefix="/api/csr", tags=["csr"])
app.include_router(stt_router, prefix="/api", tags=["stt"])
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])
app.include_router(youtube_summary_router, prefix="/api/youtube-summary", tags=["youtube-summary"])
app.include_router(ai_assistant_router, prefix="/api", tags=["ai-assistant"])
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
