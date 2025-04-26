from fastapi import FastAPI
from api.routes_scheme import router as scheme_router
from fastapi.middleware.cors import CORSMiddleware
from api.routes_jobs import router as jobs_router

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend's URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scheme_router)
app.include_router(jobs_router,prefix="/api")
