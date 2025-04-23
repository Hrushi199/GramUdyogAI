# api/routes_scheme.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from core.scheme_recommender import (
    get_all_scheme_names,
    get_relevant_scheme_names,
    load_selected_schemes,
    explain_schemes,
)

router = APIRouter()

class UserRequest(BaseModel):
    occupation: str

@router.post("/recommend")
async def recommend_schemes(data: UserRequest):
    all_names = get_all_scheme_names()
    relevant_names = get_relevant_scheme_names(data.occupation, all_names)
    selected_schemes = load_selected_schemes(relevant_names)
    explanation = explain_schemes(data.occupation, selected_schemes)
    print(explanation)
    return {
        "relevant_schemes": relevant_names,
        "explanation": explanation
    }
