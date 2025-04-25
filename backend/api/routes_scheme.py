# api/routes_scheme.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from core.scheme_recommender import (
    get_all_scheme_names,
    get_relevant_scheme_names,
    load_selected_schemes,
    explain_schemes,
)
from core.government_api import (
    UserInput,
    RecommendationResponse,
    fetch_commodity_prices,
    build_recommendation_response,
)
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import os
router = APIRouter()

class UserRequest(BaseModel):
    occupation: str

@router.post("/schemes")
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

@router.post("/prices/", response_model=RecommendationResponse)
async def get_recommendations(user_input: UserInput):
    price_data = await fetch_commodity_prices(user_input.state)
    response = build_recommendation_response(user_input, price_data)
    return JSONResponse(content=jsonable_encoder(response))


IMAGE_FOLDER = "/images"

@router.get("/images/{image_name}")
async def get_image(image_name: str):
    image_path = os.path.join(IMAGE_FOLDER, image_name)

    if not os.path.isfile(image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    # Here you can add logic to ensure the image is in portrait orientation
    # For example, you could check the image dimensions and return an error if it's not portrait

    return FileResponse(image_path)
