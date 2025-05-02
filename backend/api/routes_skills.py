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
from core.audio_generation import TextToSpeech

class VisualSummaryRequest(BaseModel):
    topic: str
    context: str
    language: str = "en"  # Default to English
    generateAudio: bool = False  # Whether to generate all audio upfront
    audioOnDemand: bool = False  # Whether to allow on-demand audio generation

class VisualSummaryDB(BaseModel):
    id: int
    topic: str
    summary_data: dict
    created_at: str

class AudioUpdateRequest(BaseModel):
    summary_id: int
    section_index: int
    audio_url: str

router = APIRouter()

# Update IMAGE_FOLDER to use absolute path
IMAGE_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images")

# Ensure images directory exists
os.makedirs(IMAGE_FOLDER, exist_ok=True)

# Update paths
AUDIO_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audio")

# Ensure audio directory exists
os.makedirs(AUDIO_FOLDER, exist_ok=True)

@router.get("/images/{image_name}")
async def get_image(image_name: str):
    image_path = os.path.join(IMAGE_FOLDER, image_name)

    if not os.path.isfile(image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    # Here you can add logic to ensure the image is in portrait orientation
    # For example, you could check the image dimensions and return an error if it's not portrait

    return FileResponse(image_path)

@router.get("/audio/{audio_name}")
async def get_audio(audio_name: str):
    audio_path = os.path.join(AUDIO_FOLDER, audio_name)

    if not os.path.isfile(audio_path):
        raise HTTPException(status_code=404, detail="Audio not found")

    return FileResponse(audio_path, media_type="audio/wav")

@router.post("/visual-summary")
async def create_visual_summary(request: VisualSummaryRequest):
    print("\n=== New Visual Summary Request ===")
    print(f"Topic: {request.topic}")
    print(f"Language: {request.language}")
    print(f"Generate Audio: {request.generateAudio}")
    print(f"Audio On Demand: {request.audioOnDemand}")
    
    try:
        # Create tables if they don't exist
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        
        # Add translations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS summary_translations (
                summary_id INTEGER,
                language TEXT,
                translated_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (summary_id, language),
                FOREIGN KEY (summary_id) REFERENCES visual_summaries(id)
            )
        """)
        
        # Add audio files table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audio_files (
                text_hash TEXT,
                language TEXT,
                file_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (text_hash, language)
            )
        """)
        
        conn.commit()
        
        # Generate summary
        summary = generate_visual_summary_json(
            topic=request.topic,
            rag=request.context,
            language=request.language,
            generate_audio=request.generateAudio
        )
        
        print(f"\nGenerated Summary: {json.dumps(summary.model_dump(), indent=2)}")
        
        # Store main summary
        cursor.execute(
            "INSERT INTO visual_summaries (topic, summary_data) VALUES (?, ?)",
            (request.topic, summary.model_dump_json())
        )
        
        summary_id = cursor.lastrowid
        print(f"\nCreated summary with ID: {summary_id}")
        
        # Store translation if not English
        if request.language != "en":
            cursor.execute(
                "INSERT INTO summary_translations (summary_id, language, translated_data) VALUES (?, ?, ?)",
                (summary_id, request.language, json.dumps(summary.model_dump()))
            )
            print(f"Stored translation for language: {request.language}")
        
        conn.commit()
        conn.close()
        
        return {
            "id": summary_id,
            "topic": request.topic,
            "summary_data": summary.model_dump(),
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"\n!!! Error in create_visual_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-summary-audio")
async def update_summary_audio(request: AudioUpdateRequest):
    print(f"\n=== Updating Summary Audio ===")
    print(f"Summary ID: {request.summary_id}")
    print(f"Section Index: {request.section_index}")
    print(f"Audio URL: {request.audio_url}")
    
    try:
        conn = sqlite3.connect("database.db")
        cursor = conn.cursor()
        
        # Get current summary data
        cursor.execute("SELECT summary_data FROM visual_summaries WHERE id = ?", (request.summary_id,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Summary not found")
            
        summary_data = json.loads(result[0])
        print(f"\nCurrent summary data: {json.dumps(summary_data, indent=2)}")
        
        # Update audio URL for the specific section
        if 'sections' in summary_data and len(summary_data['sections']) > request.section_index:
            summary_data['sections'][request.section_index]['audioUrl'] = request.audio_url
            
            # Update the database
            cursor.execute(
                "UPDATE visual_summaries SET summary_data = ? WHERE id = ?",
                (json.dumps(summary_data), request.summary_id)
            )
            conn.commit()
            print(f"\nUpdated summary data: {json.dumps(summary_data, indent=2)}")
            
            return {"message": "Audio URL updated successfully"}
            
        raise HTTPException(status_code=400, detail="Invalid section index")
        
    except Exception as e:
        print(f"\n!!! Error in update_summary_audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/audio/{language}/{filename}")
async def get_audio(language: str, filename: str):
    """Get audio file from language-specific folder"""
    audio_path = os.path.join(AUDIO_FOLDER, language, filename)
    
    if not os.path.isfile(audio_path):
        raise HTTPException(status_code=404, detail="Audio not found")
        
    return FileResponse(audio_path, media_type="audio/wav")

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