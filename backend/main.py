from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes_skills import router as skills_router
from api.routes_business import router as business_router
from api.routes_government import router as government_router
from api.routes_scheme import router as scheme_router
from api.routes_jobs import router as jobs_router
from api.routes_business import router as business_router

app = FastAPI(title="GramUdyogAI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with proper prefixes
app.include_router(skills_router, prefix="/api", tags=["skills"])
app.include_router(business_router, prefix="/api", tags=["business"])
app.include_router(government_router, prefix="/api", tags=["government"])
app.include_router(scheme_router, prefix="/", tags=["schemes"])
app.include_router(jobs_router, prefix="/api", tags=["jobs"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
