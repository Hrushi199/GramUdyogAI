# backend/api/routes_course_suggestion.py

import os
import sqlite3
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel

from core.course_recommender import (
    retrieve_platform_courses,
    retrieve_live_courses,
    generate_structured_recommendations
)
from core.translation import llama_translate_string as translate_text

# --- 1. SETUP & MODELS ---
router = APIRouter()
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_ROOT, "gramudyogai.db")

class SuggestRequest(BaseModel):
    query: str

class RecommendationItem(BaseModel):
    course_title: str
    reason: str
    type: str
    url: str

class SuggestResponse(BaseModel):
    introduction: str
    recommendations: List[RecommendationItem]

# --- 2. DATABASE DEPENDENCY ---
def get_db_connection():
    if not os.path.exists(DB_PATH):
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database not found.")
    conn = None
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        yield conn
    finally:
        if conn: conn.close()

# --- 3. API ENDPOINT ---
@router.post("/suggest-courses-with-platform", response_model=SuggestResponse, tags=["Course Suggestions"])
def suggest_courses_endpoint(req: SuggestRequest, db: sqlite3.Connection = Depends(get_db_connection)):
    try:
        search_term = req.query
        print(f"\n--- New Request: Searching for '{search_term}' ---")
        
        platform_courses = retrieve_platform_courses(search_term, db, top_k=3)
        print(f"Found {len(platform_courses)} platform courses.")
        
        needed_count = 3 - len(platform_courses)
        live_courses = []
        if needed_count > 0:
            live_courses = retrieve_live_courses(search_term, count=needed_count)
            print(f"Found {len(live_courses)} live courses to supplement.")

        context_for_llm = {
            "platform_courses": [{"type": "Platform Course", **course} for course in platform_courses],
            "live_courses": [{"type": "Live Course", **course} for course in live_courses]
        }

        if not platform_courses and not live_courses:
            print("--- No courses found from any source. ---")
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"No courses found for '{search_term}'. Please try a different skill.")

        print(f"Sending {len(platform_courses) + len(live_courses)} total courses to AI for recommendation...")
        ai_response_data = generate_structured_recommendations(search_term, context_for_llm)

        if "error" in ai_response_data:
             raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, ai_response_data["error"])

        print("--- Request successful. Sending response. ---")
        return ai_response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"--- UNEXPECTED 500 ERROR: {e} ---")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"An unexpected internal server error occurred: {e}")