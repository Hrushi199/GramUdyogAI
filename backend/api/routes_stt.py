from fastapi import APIRouter, UploadFile, Form
from fastapi.responses import JSONResponse
from core.stt import transcribe_audio_and_extract_profile

router = APIRouter()

@router.post("/speech-to-profile")
async def speech_to_profile(audio: UploadFile, language: str = Form("en")):
    try:
        profile_data = transcribe_audio_and_extract_profile(audio.file, language)
        print(f"Extracted profile data: {profile_data}")
        return JSONResponse(content=profile_data)
    except Exception as e:
        print(f"Error processing audio file: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
