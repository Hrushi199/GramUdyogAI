from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.youtube_summary import summarize_youtube_video

router = APIRouter()

class YoutubeSummaryRequest(BaseModel):
    youtube_url: str
    language: str = "en"

@router.post("/youtube-audio-summary")
async def youtube_audio_summary(request: YoutubeSummaryRequest):
    try:
        result = summarize_youtube_video(request.youtube_url, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
