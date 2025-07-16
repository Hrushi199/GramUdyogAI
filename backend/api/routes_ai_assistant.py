from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from core.translation import llama_translate_string as translate_text
from core.job_recommender import get_all_job_names, get_relevant_jobs, load_selected_jobs, find_best_job
from core.scheme_recommender import get_all_scheme_names, get_relevant_scheme_names, load_selected_schemes
from core.business_suggestion_generation import generate_prompt_from_skills, get_business_suggestions
from core.llm_function_selector import select_function_and_args, llama_summarize_items
from core.ai_assistant_data import get_recent_events, get_featured_projects, get_youtube_summaries, get_user_profile_summary, UserInfo, YoutubeSummaryRequest
import re

# Import course functions - handle gracefully if not available
try:
    from core.course_recommender import generate_structured_recommendations
except ImportError:
    def generate_structured_recommendations(query: str, context: dict = None):
        return {"courses": [], "error": "Course recommendation not available"}

router = APIRouter()

class AssistantRequest(BaseModel):
    text: str
    lang: str

class AssistantResponse(BaseModel):
    output: str
    feature_type: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None

@router.post("/ai-assistant-enhanced")
async def ai_assistant_enhanced(req: AssistantRequest, request: Request = None):
    """Supercharged AI assistant: supports all major features, robust chaining, real data, and helper lookups."""
    print("Received enhanced request:", req.dict())
    
    # 1. Translate input to English if needed
    if req.lang != "en":
        user_text_en = translate_text(req.text, "en")
        print("Translated text to English:", user_text_en)
    else:
        user_text_en = req.text
        print("Text is already in English:", user_text_en)

    # 2. Use Llama to select function and arguments
    func_name, args = select_function_and_args(user_text_en)
    print("Selected function:", func_name)
    print("Arguments for function:", args)

    response_data = AssistantResponse(output="", feature_type=func_name)

    # 3. Robust function handling and chaining
    try:
        # --- EVENTS ---
        if func_name == "event_management":
            event_id = None
            if isinstance(args, str) and args:
                event_name_match = re.search(r'event ([\w\s\-]+)', args, re.IGNORECASE)
            else:
                event_name_match = None
            if event_name_match:
                event_name = event_name_match.group(1).strip()
                events = await request.app.router.routes[0].endpoint.__globals__['search_events'](event_name, 1)
                if events:
                    event_id = events[0]['id']
            if event_id:
                from core.ai_assistant_data import get_event_by_id
                event = await get_event_by_id(event_id)
                if event:
                    response_data.structured_data = {"event": event}
                    response_data.output = f"Here are the details for event '{event['title']}'."
                else:
                    response_data.output = "Event not found."
            else:
                from core.ai_assistant_data import get_events
                events = await get_events(limit=10)
                response_data.structured_data = {"events": events}
                response_data.output = f"Here are some upcoming events."

        # --- PROJECTS ---
        elif func_name == "project_showcase":
            event_id = None
            if isinstance(args, str) and args:
                event_name_match = re.search(r'event ([\w\s\-]+)', args, re.IGNORECASE)
            else:
                event_name_match = None
            if event_name_match:
                event_name = event_name_match.group(1).strip()
                events = await request.app.router.routes[0].endpoint.__globals__['search_events'](event_name, 1)
                if events:
                    event_id = events[0]['id']
            if isinstance(args, str) and args:
                project_name_match = re.search(r'project ([\w\s\-]+)', args, re.IGNORECASE)
            else:
                project_name_match = None
            if project_name_match:
                project_name = project_name_match.group(1).strip()
                from core.ai_assistant_data import search_projects
                projects = await search_projects(project_name, 5)
                response_data.structured_data = {"projects": projects}
                response_data.output = f"Here are projects matching '{project_name}'."
            elif event_id:
                from core.ai_assistant_data import get_projects
                projects = await get_projects(event_id=event_id, limit=10)
                response_data.structured_data = {"projects": projects}
                response_data.output = f"Here are projects for the event."
            else:
                from core.ai_assistant_data import get_projects
                projects = await get_projects(limit=10)
                response_data.structured_data = {"projects": projects}
                response_data.output = f"Here are some public projects."

        # --- USERS/PROFILES ---
        elif func_name in ["profile_management", "dashboard_view"]:
            if isinstance(args, str) and args:
                user_name_match = re.search(r'user ([\w\s\-]+)', args, re.IGNORECASE)
            else:
                user_name_match = None
            if user_name_match:
                user_name = user_name_match.group(1).strip()
                from core.ai_assistant_data import search_users
                users = await search_users(user_name, 1)
                if users:
                    user_id = users[0]['id']
                    from core.ai_assistant_data import _get_unified_profile_by_user_id
                    profile = await _get_unified_profile_by_user_id(user_id)
                    response_data.structured_data = {"profile": profile}
                    response_data.output = f"Here is the profile for {user_name}."
                else:
                    response_data.output = f"No user found with name '{user_name}'."
            else:
                from core.ai_assistant_data import get_profile
                profile = await get_profile()
                response_data.structured_data = {"profile": profile}
                response_data.output = f"Here is your profile."

        # --- JOBS ---
        elif func_name == "recommend_job":
            # Use the smart job recommendation API for better results
            from core.ai_assistant_data import smart_recommend_job
            from pydantic import BaseModel
            
            class UserInfo(BaseModel):
                user_info: str
            
            if args:
                # If args is already a UserInfo, use as-is; if string, wrap; if dict, construct
                if isinstance(args, UserInfo):
                    user_info = args
                elif isinstance(args, dict):
                    user_info = UserInfo(**args)
                else:
                    user_info = UserInfo(user_info=args)
                
                # Get smart recommendations with rich data
                job_result = await smart_recommend_job(user_info)
                
                # Transform the response to include all jobs for the frontend
                jobs_list = []
                if job_result.get("best_job"):
                    jobs_list.append(job_result["best_job"])
                if job_result.get("alternative_jobs"):
                    jobs_list.extend(job_result["alternative_jobs"])
                
                response_data.structured_data = {"jobs": jobs_list}
                response_data.output = f"Here are some recommended jobs based on your query."
            else:
                # Fallback to simple job listing
                from core.ai_assistant_data import get_jobs
                jobs = await get_jobs()
                response_data.structured_data = {"jobs": jobs}
                response_data.output = f"Here are some available jobs."

        # --- SCHEMES ---
        elif func_name == "scheme_recommendation":
            scheme_name_match = re.search(r'scheme ([\w\s\-]+)', args, re.IGNORECASE) if isinstance(args, str) and args else None
            if scheme_name_match:
                scheme_name = scheme_name_match.group(1).strip()
                from core.ai_assistant_data import search_schemes
                schemes = await search_schemes(scheme_name, 5)
                response_data.structured_data = {"schemes": schemes}
                response_data.output = f"Here are schemes matching '{scheme_name}'."
            else:
                # Use advanced scheme recommender logic
                from core.scheme_recommender import get_all_scheme_names, get_relevant_scheme_names, load_selected_schemes, explain_schemes
                occupation = args if isinstance(args, str) and args else "entrepreneur"
                all_names = await get_all_scheme_names()
                relevant_names = await get_relevant_scheme_names(occupation, all_names)
                selected_schemes = await load_selected_schemes(relevant_names)
                explained = await explain_schemes(occupation, selected_schemes)
                response_data.structured_data = {"schemes": explained}
                response_data.output = f"Here are some government schemes for {occupation}."

        # --- BUSINESS SUGGESTIONS ---
        elif func_name == "business_suggestion":
            from core.business_suggestion_generation import generate_prompt_from_skills, get_business_suggestions
            prompt = generate_prompt_from_skills(args)
            suggestions = await get_business_suggestions(prompt)
            suggestions_data = [s.dict() for s in suggestions.suggestions] if hasattr(suggestions, "suggestions") else []
            response_data.structured_data = {"suggestions": suggestions_data}
            response_data.output = f"Here are some business suggestions."

        # --- COURSES & SKILLS ---
        elif func_name == "course_recommendation":
            from core.ai_assistant_data import recommend_courses
            course_data = await recommend_courses(args)
            response_data.structured_data = {"courses": course_data.get("courses", [])}
            response_data.output = f"Here are some recommended courses."
        elif func_name == "skill_tutorial":
            from core.skill_tutorial import get_skill_tutorials
            tutorials = await get_skill_tutorials(args)
            response_data.structured_data = {"tutorials": tutorials}
            response_data.output = f"Here are some skill tutorials."

        # --- YOUTUBE SUMMARY ---
        elif func_name == "youtube_summary":
            from core.ai_assistant_data import youtube_audio_summary, YoutubeSummaryRequest
            yt_link_match = re.search(r'(https?://[\w\./\-\?&=]+)', args) if isinstance(args, str) and args else None
            if yt_link_match:
                yt_url = yt_link_match.group(1)
                if isinstance(args, YoutubeSummaryRequest):
                    req_obj = args
                elif isinstance(args, dict):
                    req_obj = YoutubeSummaryRequest(**args)
                else:
                    req_obj = YoutubeSummaryRequest(youtube_url=yt_url, language=req.lang)
                summary = await youtube_audio_summary(req_obj)
                response_data.structured_data = {"youtube_summary": summary}
                response_data.output = f"Here is the summary for the YouTube video."
            else:
                search_query = args.replace(' ', '+') if isinstance(args, str) and args else ''
                yt_search_url = f"https://www.youtube.com/results?search_query={search_query}"
                response_data.structured_data = {"youtube_search_url": yt_search_url}
                response_data.output = f"Here are some YouTube videos for your topic."

        # --- CSR ---
        # elif func_name == "csr_dashboard":
        #     from api.routes_csr_dashboard import get_companies, get_company_metrics
        #     companies = await get_companies()
        #     response_data.structured_data = {"companies": companies}
        #     response_data.output = f"Here are some CSR companies."
        # elif func_name == "csr_course":
        #     from api.routes_csr import get_courses
        #     courses = await get_courses()
        #     response_data.structured_data = {"csr_courses": courses}
        #     response_data.output = f"Here are some CSR courses."

        # --- PRODUCT RECOMMENDATION ---
        elif func_name == "product_recommendation":
            # Use LLM to generate one or more product search queries from args
            product_terms = [t.strip() for t in args.split(',') if t.strip()]
            if product_terms:
                product_links = [
                    {
                        "product_term": term,
                        "product_search_url": f"https://mkp.gem.gov.in/search?q={term.replace(' ', '+')}"
                    }
                    for term in product_terms
                ]
                response_data.structured_data = {"product_links": product_links}
                if len(product_links) == 1:
                    response_data.output = f"Here is a government marketplace result for '{product_links[0]['product_term']}'."
                else:
                    response_data.output = f"Here are government marketplace results for: {', '.join([l['product_term'] for l in product_links])}."
            else:
                response_data.output = "Please specify a product to search for."

        # --- VISUAL SUMMARY ---
        elif func_name == "visual_summary":
            # Use the real visual summary API endpoint
            import httpx
            async with httpx.AsyncClient() as client:
                vs_req = {"topic": args if isinstance(args, str) else (args.get("topic") if isinstance(args, dict) else ""),
                          "context": args.get("context") if isinstance(args, dict) and "context" in args else "",
                          "language": req.lang or "en"}
                vs_response = await client.post(f"http://localhost:8000/api/visual-summary", json=vs_req)
                if vs_response.status_code == 200:
                    summary = vs_response.json()
                    response_data.structured_data = {"visual_summary": summary}
                    response_data.output = f"Here is a visual summary for your topic."
                else:
                    response_data.structured_data = {"visual_summary": {"error": "Failed to generate visual summary."}}
                    response_data.output = "Sorry, could not generate a visual summary."

        # --- AUDIO (STT) ---
        # elif func_name == "audio_transcription":
        #     # Only if user uploads audio or requests transcription
        #     if request and hasattr(request, 'files') and 'audio' in request.files:
        #         audio_file = request.files['audio']
        #         from core.stt import transcribe_audio
        #         transcription = await transcribe_audio(audio_file, req.lang)
        #         response_data.structured_data = {"transcription": transcription}
        #         response_data.output = f"Here is the transcription of your audio."
        #     else:
        #         response_data.output = "Please upload an audio file to transcribe."

        # --- DEFAULT ---
        else:
            response_data.output = "Sorry, I couldn't understand your request. I can help you with events, projects, users, jobs, schemes, business, courses, skills, YouTube, CSR, and visual summaries."
            response_data.feature_type = "general"

    except Exception as e:
        print(f"Error processing request: {e}")
        response_data.output = "Sorry, I encountered an error while processing your request. Please try again."
        response_data.feature_type = "error"

    # 4. Translate output back to user's language if needed
    if req.lang != "en":
        try:
            from core.translation import translate_structured_data_safely, generate_short_summary, translate_text_safely
            if response_data.structured_data:
                response_data.structured_data = translate_structured_data_safely(response_data.structured_data, req.lang)
                response_data.output = translate_text_safely(response_data.output, req.lang)
            elif response_data.summary:
                response_data.summary = translate_text_safely(response_data.summary, req.lang)
            response_data.output = translate_text_safely(response_data.output, req.lang)
        except Exception as e:
            print(f"Translation error: {e}")
            import traceback
            traceback.print_exc()
            pass

    return response_data.dict()

# Keep the original endpoint for backward compatibility
@router.post("/ai-assistant")
async def ai_assistant(req: AssistantRequest):
    """Original AI assistant endpoint"""
    enhanced_response = await ai_assistant_enhanced(req)
    return {"output": enhanced_response["output"]}