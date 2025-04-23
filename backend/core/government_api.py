import asyncio
# import sqlite3  # Remove sqlite3
from typing import List, Optional
from fastapi import HTTPException
from pydantic import BaseModel
import requests
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from datetime import datetime, timedelta
from urllib.parse import quote
import logging

# This code has scheme recommendations but uses an older government dataset of limited schemes, a better code has been implemented

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Remove SQLite setup for offline caching
# def init_db():
#     ...existing code...
# init_db()

# Pydantic models for input/output validation
class UserInput(BaseModel):
    state: str
    district: Optional[str] = None
    skills: List[str]
    resources: Optional[List[str]] = []

class BusinessRecommendation(BaseModel):
    business_type: str
    commodity: str
    variety: str
    estimated_profit: float
    market: str
    modal_price: float

class RecommendationResponse(BaseModel):
    business_recommendations: List[BusinessRecommendation]
    language: str = "en"

# Dummy AI models
def dummy_business_recommendation(user_input: UserInput, price_data: list) -> List[BusinessRecommendation]:
    """Simulates AI model for business recommendations based on user skills and market prices."""
    recommendations = []
    
    for record in price_data[:2]:  # Limit to 2 for simplicity
        commodity = record["commodity"].lower()
        modal_price = float(record.get("modal_price", 0) or 0)  # Handle missing or null price
        variety = record.get("variety", "Unknown")
        if "agriculture" in user_input.skills and commodity in ["wheat", "rice"]:
            recommendations.append(BusinessRecommendation(
                business_type="Agricultural Trading",
                commodity=record["commodity"],
                variety=variety,
                estimated_profit=modal_price * 0.2 / 100,  # Profit per kg (price per quintal)
                market=record["market"],
                modal_price=modal_price
            ))
        elif "manufacturing" in user_input.skills and commodity == "cotton":
            recommendations.append(BusinessRecommendation(
                business_type="Textile Manufacturing",
                commodity=record["commodity"],
                variety=variety,
                estimated_profit=modal_price * 0.15 / 100,
                market=record["market"],
                modal_price=modal_price
            ))
    
    return recommendations

# API data retrieval with caching
async def fetch_commodity_prices(state: str) -> list:
    """Fetches commodity prices from data.gov.in (no caching)."""
    # Remove all sqlite3/cache logic
    # conn = sqlite3.connect("cache.db")
    # cursor = conn.cursor()
    # one_day_ago = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
    # cursor.execute(
    #     "SELECT * FROM commodity_prices WHERE state = ? AND timestamp > ?",
    #     (state, one_day_ago)
    # )
    # cached = cursor.fetchall()
    # if cached:
    #     pass

    # Fetch from API with proper state encoding
    api_key = "GOV_API"  # Replace with your API key
    encoded_state = quote(state, safe='')
    url = f"https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key={api_key}&format=json&filters[state]={encoded_state}&limit=10"

    try:
        logger.info(f"Fetching commodity prices from URL: {url}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("status") != "ok":
            logger.error(f"API error: {data.get('message', 'Unknown error')}")
            raise HTTPException(status_code=503, detail=f"API error: {data.get('message', 'Unknown error')}")

        records = data.get("records", [])
        logger.info(f"Fetched {len(records)} commodity price records for state: {state}")
        print(f"Prices API response: {records}")

        # No caching
        return records
    except requests.RequestException as e:
        logger.error(f"Failed to fetch commodity prices: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Failed to fetch commodity prices: {str(e)}")

def build_recommendation_response(user_input: UserInput, price_data: list) -> RecommendationResponse:
    business_recs = dummy_business_recommendation(user_input, price_data)
    return RecommendationResponse(
        business_recommendations=business_recs,
        language="en"
    )
