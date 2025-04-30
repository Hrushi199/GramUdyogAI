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
from core.skill_tutorial import generate_visual_summary_json
import sqlite3
from datetime import datetime
import json

class VisualSummaryRequest(BaseModel):
    topic: str
    context: str

class VisualSummaryDB(BaseModel):
    id: int
    topic: str
    summary_data: dict
    created_at: str
router = APIRouter()

# Update IMAGE_FOLDER to use absolute path
IMAGE_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images")

# Ensure images directory exists
os.makedirs(IMAGE_FOLDER, exist_ok=True)

@router.get("/images/{image_name}")
async def get_image(image_name: str):
    image_path = os.path.join(IMAGE_FOLDER, image_name)

    if not os.path.isfile(image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    # Here you can add logic to ensure the image is in portrait orientation
    # For example, you could check the image dimensions and return an error if it's not portrait

    return FileResponse(image_path)

@router.post("/visual-summary")
async def create_visual_summary(request: VisualSummaryRequest):
    try:
        summary = generate_visual_summary_json(request.topic, request.context)
        
        # Store in database
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        
        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS visual_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                summary_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute(
            "INSERT INTO visual_summaries (topic, summary_data) VALUES (?, ?)",
            (request.topic, summary.model_dump_json())
        )
        
        summary_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {"id": summary_id, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/visual-summary/{summary_id}")
async def get_visual_summary(summary_id: int):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM visual_summaries WHERE id = ?",
        (summary_id,)
    )
    
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="Summary not found")
        
    return VisualSummaryDB(
        id=result[0],
        topic=result[1],
        summary_data=json.loads(result[2]),
        created_at=result[3]
    )

@router.get("/visual-summaries")
async def list_visual_summaries():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM visual_summaries ORDER BY created_at DESC")
    results = cursor.fetchall()
    conn.close()
    
    return [
        VisualSummaryDB(
            id=row[0],
            topic=row[1],
            summary_data=json.loads(row[2]),
            created_at=row[3]
        ) for row in results
    ]