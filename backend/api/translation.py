from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from core.translation import translate_json

router = APIRouter()

@router.post("/api/translate")
async def translate_endpoint(request: Request):
    data = await request.json()
    json_data = data.get("json")
    target_language = data.get("target_language", "en")
    if not json_data or not target_language:
        return JSONResponse({"error": "Missing json or target_language"}, status_code=400)
    translated = translate_json(json_data, target_language)
    print(translated)
    return JSONResponse(content=translated)
