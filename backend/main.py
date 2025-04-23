from fastapi import FastAPI
from api.routes_scheme import router as scheme_router

app = FastAPI()
app.include_router(scheme_router, prefix="/schemes")
