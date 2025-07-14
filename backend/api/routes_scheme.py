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
<<<<<<< HEAD
from core.translation import llama_translate_string as translate_text
=======
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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

@router.post("/schemes", response_model=SchemeResponse)
async def recommend_schemes(data: UserRequest):
    all_names = await get_all_scheme_names()
    relevant_names = await get_relevant_scheme_names(data.occupation, all_names)
    selected_schemes = await load_selected_schemes(relevant_names)
    explanation = await explain_schemes(data.occupation, selected_schemes)
<<<<<<< HEAD
    return {
        "relevant_schemes": relevant_names,
        "explanation": explanation
=======
    print(explanation)
    return {
        "relevant_schemes": relevant_names,
        "explanation": explanation  # Now a JSON list/object, not a string
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
    }
