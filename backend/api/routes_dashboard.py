from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from core.skill_tutorial import generate_visual_summary_json
from core.llm_recommendations import get_course_recommendations
from core.job_recommender import get_all_job_names, get_relevant_jobs, load_selected_jobs, find_best_job
from core.business_suggestion_generation import generate_prompt_from_skills, get_business_suggestions
from core.scheme_recommender import get_all_scheme_names, get_relevant_scheme_names, load_selected_schemes, explain_schemes
import sqlite3
import json
from datetime import datetime
from groq import Groq
import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
router = APIRouter()

# Language mapping (from routes_stt)
LANGUAGE_MAP = {
    "bengali": "bn",
    "marathi": "mr",
    "maltese": "mt",
    "spanish": "es",
    "macedonian": "mk",
    "galician": "gl",
    "turkmen": "tk",
    "norwegian nynorsk": "nn",
    "chinese": "zh",
    "lithuanian": "lt",
    "persian": "fa",
    "azerbaijani": "az",
    "kannada": "kn",
    "icelandic": "is",
    "albanian": "sq",
    "yoruba": "yo",
    "german": "de",
    "swedish": "sv",
    "shona": "sn",
    "lao": "lo",
    "assamese": "as",
    "korean": "ko",
    "catalan": "ca",
    "ukrainian": "uk",
    "swahili": "sw",
    "sinhala": "si",
    "tajik": "tg",
    "gujarati": "gu",
    "yiddish": "yi",
    "russian": "ru",
    "french": "fr",
    "polish": "pl",
    "thai": "th",
    "maori": "mi",
    "bosnian": "bs",
    "afrikaans": "af",
    "occitan": "oc",
    "greek": "el",
    "hungarian": "hu",
    "latin": "la",
    "slovak": "sk",
    "estonian": "et",
    "sanskrit": "sa",
    "burmese": "my",
    "hawaiian": "haw",
    "hebrew": "he",
    "uzbek": "uz",
    "hausa": "ha",
    "javanese": "jv",
    "arabic": "ar",
    "italian": "it",
    "danish": "da",
    "basque": "eu",
    "punjabi": "pa",
    "somali": "so",
    "amharic": "am",
    "pashto": "ps",
    "english": "en",
    "czech": "cs",
    "bulgarian": "bg",
    "faroese": "fo",
    "tibetan": "bo",
    "cantonese": "yue",
    "japanese": "ja",
    "portuguese": "pt",
    "romanian": "ro",
    "urdu": "ur",
    "croatian": "hr",
    "kazakh": "kk",
    "haitian creole": "ht",
    "tatar": "tt",
    "hindi": "hi",
    "serbian": "sr",
    "indonesian": "id",
    "norwegian": "no",
    "malayalam": "ml",
    "breton": "br",
    "armenian": "hy",
    "luxembourgish": "lb",
    "lingala": "ln",
    "vietnamese": "vi",
    "malay": "ms",
    "welsh": "cy",
    "latvian": "lv",
    "nepali": "ne",
    "mongolian": "mn",
    "khmer": "km",
    "georgian": "ka",
    "dutch": "nl",
    "tagalog": "tl",
    "malagasy": "mg",
    "tamil": "ta",
    "slovenian": "sl",
    "belarusian": "be",
    "sindhi": "sd",
    "bashkir": "ba",
    "sundanese": "su",
    "turkish": "tr",
    "finnish": "fi",
    "telugu": "te",
}

def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_latest_profile_id():
    conn = get_db()
    cursor = conn.cursor()
    result = cursor.execute(
        'SELECT id FROM user_profiles ORDER BY created_at DESC LIMIT 1'
    ).fetchone()
    conn.close()
    return result["id"] if result else None

def get_dashboard_cache(profile_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "CREATE TABLE IF NOT EXISTS dashboard_cache (profile_id INTEGER PRIMARY KEY, dashboard_json TEXT, created_at TIMESTAMP)"
    )
    result = cursor.execute(
        "SELECT dashboard_json FROM dashboard_cache WHERE profile_id = ?", (profile_id,)
    ).fetchone()
    conn.close()
    return json.loads(result["dashboard_json"]) if result else None

def set_dashboard_cache(profile_id, dashboard_json):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO dashboard_cache (profile_id, dashboard_json, created_at) VALUES (?, ?, ?)",
        (profile_id, json.dumps(dashboard_json), datetime.now())
    )
    conn.commit()
    conn.close()

# Use Groq LLM for all extraction
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY)

async def extract_dashboard_fields_with_llm(profile: dict, language_code: str):
    prompt = f"""
Given the following user profile (as a JSON object), extract the following fields for a personalized dashboard:
- For visual summary: suggest a topic and context that would be most relevant for a visual learning summary for this user.
- For jobs: suggest a job search query or keywords that best match the user's interests and background.
- For CSR courses: suggest a course search query or keywords that best match the user's interests and background.
- For business suggestions: suggest a business idea prompt or keywords that best match the user's interests and background.
- For schemes: suggest an occupation string for government scheme matching.

Respond in this JSON format:
{{
  "visual_summary": {{"topic": "...", "context": "..."}},
  "jobs": {{"query": "..."}}, 
  "csr_courses": {{"query": "..."}}, 
  "business_suggestions": {{"prompt": "..."}}, 
  "schemes": {{"occupation": "..."}}
}}

User profile:
{json.dumps(profile, ensure_ascii=False)}
Language code: {language_code}
"""
    # --- FIX: Remove await, use sync call ---
    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except Exception:
        return {}

@router.post("/dashboard-recommendations")
async def dashboard_recommendations(request: Request):
    body = await request.json()
    force_refresh = body.get("force_refresh", False)
    profile = body if "skills" in body else None

    # If not profile in POST, try to get latest from DB
    if not profile:
        conn = get_db()
        cursor = conn.cursor()
        result = cursor.execute(
            'SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 1'
        ).fetchone()
        conn.close()
        if not result:
            return JSONResponse(content={"error": "No user profile found"}, status_code=400)
        profile = dict(result)
        profile['skills'] = profile['skills'].split(',') if profile['skills'] else []
        profile['jobTypes'] = profile['job_types'].split(',') if profile.get('job_types') else []

    # Normalize language code
    language = profile.get("language", "en")
    language_code = LANGUAGE_MAP.get(language.strip().lower(), "en")

    # Get latest profile id for caching
    profile_id = get_latest_profile_id()
    if not profile_id:
        return JSONResponse(content={"error": "No user profile found"}, status_code=400)

    # Try cache unless force_refresh
    if not force_refresh:
        cached = get_dashboard_cache(profile_id)
        if cached:
            print('Returning cached dashboard', cached)
            return JSONResponse(content=cached)

    # Use LLM to extract all relevant fields for dashboard
    try:
        llm_fields = await extract_dashboard_fields_with_llm(profile, language_code)
    except Exception as e:
        return JSONResponse(content={
            "visual_summary": {"error": f"LLM extraction failed: {str(e)}"},
            "csr_courses": [],
            "jobs": [],
            "business_suggestions": [],
            "schemes": [],
        })

    results = {
        "visual_summary": None,
        "csr_courses": [],
        "jobs": [],
        "business_suggestions": [],
        "schemes": [],
    }

    # # Visual Summary (SkillBuilder)
    # try:
    #     vs = llm_fields.get("visual_summary", {})
    #     # FIX: Remove await from generate_visual_summary_json (it's sync)
    #     summary = generate_visual_summary_json(
    #         topic=vs.get("topic", ""),
    #         rag=vs.get("context", ""),
    #         language=language_code
    #     )
    #     results["visual_summary"] = summary.model_dump() if hasattr(summary, "model_dump") else summary
    # except Exception as e:
    #     results["visual_summary"] = {"error": str(e)}
    results["visual_summary"] = {  "error": "Visual summary generation is disabled."}

    # CSR Courses (use LLM query)
    try:
        csr_query = llm_fields.get("csr_courses", {}).get("query", "")
        # If you have a course search, use it here. For now, just leave as empty or implement as needed.
        results["csr_courses"] = []
    except Exception:
        results["csr_courses"] = []

    # Jobs (use LLM query)
    try:
        job_query = llm_fields.get("jobs", {}).get("query", "")
        print('Job query:', job_query)
        all_job_names = await get_all_job_names()
        print('All job names:', all_job_names)
        relevant_job_names = await get_relevant_jobs(job_query, all_job_names)
        relevant_jobs = await load_selected_jobs(relevant_job_names.get('relevant_jobs', []) if isinstance(relevant_job_names, dict) else relevant_job_names)
        best_job = await find_best_job(job_query, relevant_jobs)
        if best_job:
            results["jobs"] = [best_job]
        print('Best job found:', best_job)
    except Exception:
        results["jobs"] = []

    # Business Suggestions (use LLM prompt)
    try:
        bs_prompt = llm_fields.get("business_suggestions", {}).get("prompt", "")
        prompt = generate_prompt_from_skills(bs_prompt)
        suggestions = await get_business_suggestions(prompt)
        if hasattr(suggestions, "suggestions"):
            results["business_suggestions"] = [s.model_dump() for s in suggestions.suggestions]
        elif isinstance(suggestions, dict) and "suggestions" in suggestions:
            results["business_suggestions"] = suggestions["suggestions"]
        print('Business suggestions:', results["business_suggestions"])
    except Exception:
        results["business_suggestions"] = []

    # Schemes (use LLM occupation)
    try:
        occupation = llm_fields.get("schemes", {}).get("occupation", "")
        all_names = await get_all_scheme_names()
        relevant_names = await get_relevant_scheme_names(occupation, all_names)
        selected_schemes = await load_selected_schemes(relevant_names)
        explanation = await explain_schemes(occupation, selected_schemes)
        results["schemes"] = explanation
        print('Schemes:', results["schemes"])
    except Exception:
        results["schemes"] = []

    # Cache the dashboard for this profile
    set_dashboard_cache(profile_id, results)
    print('Cached dashboard for profile ID:', profile_id)
    print('Dashboard results:', results)
    return JSONResponse(content=results)
