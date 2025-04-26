# api/routes_scheme.py

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
#from core.government_api import router as government_router

from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import os
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

@router.post('/suggest-business')
def suggest_business(data: Recommendation):
    skills_text = data.skills
    prompt = generate_prompt_from_skills(skills_text)
    suggestions = get_business_suggestions(prompt)
    return {"suggestions": suggestions}

