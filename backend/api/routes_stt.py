from fastapi import APIRouter, UploadFile, Form
from fastapi.responses import JSONResponse
from core.stt import transcribe_audio_and_extract_profile, normalize_language
import tempfile
import os
from groq import Groq

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@router.post("/speech-to-profile")
async def speech_to_profile(audio: UploadFile, language: str = Form("en")):
    try:
        profile_data = transcribe_audio_and_extract_profile(audio.file, language)
        print(f"Extracted profile data: {profile_data}")
        return JSONResponse(content=profile_data)
    except Exception as e:
        print(f"Error processing audio file: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

import shutil

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile, language: str = Form("en")):
    """Simple audio transcription endpoint for general use"""
    try:
        # Ensure file pointer is at the start
        audio.file.seek(0)
        # Save uploaded file to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            shutil.copyfileobj(audio.file, tmp)
            tmp_path = tmp.name
        
        # Normalize language code
        language_code = normalize_language(language)
        
        # Transcribe using Groq Whisper
        with open(tmp_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                file=(tmp_path, f.read()),
                model="whisper-large-v3",
                language=language_code,
                response_format="json",
                temperature=0.5
            )
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        return JSONResponse(content={"text": transcription.text})
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
