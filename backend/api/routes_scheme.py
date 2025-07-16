# api/routes_scheme.py
import sqlite3
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from core.business_suggestion_generation import *
from core.scheme_recommender import (
    get_all_scheme_names,
    get_relevant_scheme_names,
    load_selected_schemes,
    explain_schemes,
)
from core.translation import llama_translate_string as translate_text
#from core.government_api import router as government_router

from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import os
import logging
from init_db import get_db
logger = logging.getLogger(__name__)
router = APIRouter()

class UserRequest(BaseModel):
    occupation: str

class Recommendation(BaseModel):
    skills: str
    
class SchemeExplanation(BaseModel):
    name: str
    goal: str
    benefit: str
    eligibility: str
    application_process: str
    special_features: str
    full_json: dict = {}

class SchemeResponse(BaseModel):
    relevant_schemes: List[str]
    explanation: List[SchemeExplanation]

@router.post("/schemes", response_model=SchemeResponse)
async def recommend_schemes(data: UserRequest):
    all_names = await get_all_scheme_names()
    relevant_names = await get_relevant_scheme_names(data.occupation, all_names)
    selected_schemes = await load_selected_schemes(relevant_names)
    explanation = await explain_schemes(data.occupation, selected_schemes)
    return {
        "relevant_schemes": relevant_names,
        "explanation": explanation
    }

@router.get("/schemes/search")
async def search_schemes(query: str, limit: int = 10):
    """Search schemes by name, description, or target group (for AI assistant and frontend helpers). Fully implemented."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "SELECT * FROM schemes WHERE name LIKE ? OR description LIKE ? OR target_group LIKE ? ORDER BY created_at DESC LIMIT ?"
        like_query = f"%{query}%"
        cursor.execute(sql, (like_query, like_query, like_query, limit))
        schemes_data = cursor.fetchall()
        schemes = []
        for row in schemes_data:
            scheme = {
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "target_group": row["target_group"],
                "benefits": row["benefits"],
                "eligibility": row["eligibility"],
                "application_process": row["application_process"],
                "documents_required": row["documents_required"],
                "contact_info": row["contact_info"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            }
            schemes.append(scheme)
        conn.close()
        return schemes
    except Exception as e:
        logger.error(f"Error searching schemes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
