
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
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

@router.post("/prices/", response_model=RecommendationResponse)
async def get_recommendations(user_input: UserInput):
    price_data = await fetch_commodity_prices(user_input.state)
    response = build_recommendation_response(user_input, price_data)
    return JSONResponse(content=jsonable_encoder(response))
