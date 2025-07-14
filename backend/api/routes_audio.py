from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from core.audio_generation import TextToSpeech
import os
import hashlib

router = APIRouter()
tts = TextToSpeech()

class TTSRequest(BaseModel):
    text: str
    speaker: str = "male"
    language: str = "en"

# Language mapping from i18n codes to TTS codes
LANGUAGE_MAP = {
    "en": "en",  # English
    "hi": "hi",  # Hindi
    "bn": "bn",  # Bengali
    "mr": "mr",  # Marathi
    "te": "te",  # Telugu
    "ta": "ta",  # Tamil
    "gu": "gu",  # Gujarati
    "ur": "ur",  # Urdu
    "kn": "kn",  # Kannada
    "or": "or",  # Odia
    "ml": "ml",  # Malayalam
    "pa": "pa",  # Punjabi
    "as": "as",  # Assamese
}

@router.post("/generate")
async def generate_audio(request: TTSRequest):
    # TTS is sync, but endpoint is async for FastAPI concurrency
    try:
        audio_data = tts.generate_audio(
            text=request.text,
            speaker=request.speaker,
            language=request.language
        )
        if not audio_data:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        return Response(content=audio_data, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/{language}")
async def generate_localized_audio(request: TTSRequest, language: str):
    print(f"\n=== Generating Audio for Language: {language} ===")
    print(f"Text: {request.text[:100]}...")
    
    if language not in LANGUAGE_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {language}. Supported languages: {list(LANGUAGE_MAP.keys())}"
        )
    
    try:
        # Create a hash of the text for the filename
        text_hash = hashlib.md5(request.text.encode()).hexdigest()
        filename = f"{text_hash}.wav"
        output_path = os.path.join("audio", language, filename)
        print(f"Output path: {output_path}")
        
        # Generate audio
        try:
            audio_data = tts.generate_audio(
                text=request.text,
                speaker=request.speaker,
                language=LANGUAGE_MAP[language],
                output_path=output_path
            )
            
            # If generate_audio returns None, the file was saved successfully
            return JSONResponse(
                content={"filename": filename, "status": "success"},
                status_code=200
            )
            
        except Exception as e:
            print(f"TTS Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate audio: {str(e)}")
            
    except Exception as e:
        print(f"Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
