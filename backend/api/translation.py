from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from core.translation import translate_json

router = APIRouter()

<<<<<<< HEAD
@router.post("/translate")
=======
@router.post("/api/translate")
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
async def translate_endpoint(request: Request):
    data = await request.json()
    json_data = data.get("json")
    target_language = data.get("target_language", "en")
    if not json_data or not target_language:
        return JSONResponse({"error": "Missing json or target_language"}, status_code=400)
    translated = translate_json(json_data, target_language)
    print(translated)
    return JSONResponse(content=translated)
