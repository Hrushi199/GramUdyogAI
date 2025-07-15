from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from core.translation import llama_translate_string as translate_text
from core.job_recommender import get_all_job_names, get_relevant_jobs, load_selected_jobs, find_best_job
from core.scheme_recommender import get_all_scheme_names, get_relevant_scheme_names, load_selected_schemes
from core.business_suggestion_generation import generate_prompt_from_skills, get_business_suggestions
from core.llm_function_selector import select_function_and_args, llama_summarize_items
from core.skill_tutorial import get_skill_tutorials
from core.ai_assistant_data import get_recent_events, get_featured_projects, get_youtube_summaries, get_user_profile_summary

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
async def ai_assistant_enhanced(req: AssistantRequest):
    """Enhanced AI assistant that returns structured data for UI rendering"""
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
    
    # 3. Call the selected function and structure the response
    try:
        if func_name == "recommend_job":
            all_job_names = await get_all_job_names()
            relevant_job_names = await get_relevant_jobs(args, all_job_names)
            
            if isinstance(relevant_job_names, dict) and "relevant_jobs" in relevant_job_names:
                relevant_jobs = await load_selected_jobs(relevant_job_names["relevant_jobs"])
                if relevant_jobs:
                    response_data.structured_data = {
                        "jobs": relevant_jobs,
                        "search_query": args,
                        "total_found": len(relevant_jobs)
                    }
                    response_data.summary = await llama_summarize_items(relevant_jobs, user_text_en, item_type="job")
                    response_data.output = f"Found {len(relevant_jobs)} relevant job opportunities for you."
                else:
                    response_data.output = "No suitable jobs found for your query."
            else:
                response_data.output = "No suitable jobs found for your query."
                
        elif func_name == "scheme_recommendation":
            all_scheme_names = await get_all_scheme_names()
            relevant_scheme_names = await get_relevant_scheme_names(args, all_scheme_names)
            relevant_schemes = await load_selected_schemes(relevant_scheme_names)
            
            if relevant_schemes:
                response_data.structured_data = {
                    "schemes": relevant_schemes,
                    "search_query": args,
                    "total_found": len(relevant_schemes)
                }
                response_data.summary = await llama_summarize_items(relevant_schemes, user_text_en, item_type="scheme")
                response_data.output = f"Found {len(relevant_schemes)} government schemes that match your requirements."
            else:
                response_data.output = "No suitable schemes found for your query."
                
        elif func_name == "business_suggestion":
            prompt = generate_prompt_from_skills(args)
            suggestions = await get_business_suggestions(prompt)
            
            if hasattr(suggestions, "suggestions") and suggestions.suggestions:
                suggestions_data = [s.dict() for s in suggestions.suggestions]
                response_data.structured_data = {
                    "suggestions": suggestions_data,
                    "skills_input": args,
                    "total_found": len(suggestions_data)
                }
                response_data.summary = await llama_summarize_items(suggestions_data, user_text_en, item_type="business suggestion")
                response_data.output = f"Generated {len(suggestions_data)} business suggestions based on your skills."
            else:
                response_data.output = "No business suggestions could be generated for your skills."
                
        elif func_name == "course_recommendation":
            try:
                course_data = generate_structured_recommendations(args, {})
                if course_data and "courses" in course_data:
                    response_data.structured_data = {
                        "courses": course_data["courses"],
                        "search_query": args,
                        "total_found": len(course_data["courses"])
                    }
                    response_data.summary = f"Found courses to help you learn {args}"
                    response_data.output = f"Found {len(course_data['courses'])} courses for {args}."
                else:
                    response_data.output = f"No courses found for {args}."
            except Exception as e:
                print(f"Course recommendation error: {e}")
                response_data.output = f"Unable to fetch courses for {args} at the moment."
                
        elif func_name == "skill_tutorial":
            try:
                tutorial_data = await get_skill_tutorials(args)
                if tutorial_data:
                    response_data.structured_data = {
                        "tutorials": tutorial_data,
                        "skill": args,
                        "total_found": len(tutorial_data) if isinstance(tutorial_data, list) else 1
                    }
                    response_data.summary = f"Found tutorials to help you learn {args}"
                    response_data.output = f"Found skill building resources for {args}."
                else:
                    response_data.output = f"No tutorials found for {args}."
            except:
                response_data.output = f"Unable to fetch tutorials for {args} at the moment."
                
        elif func_name == "event_management":
            try:
                events_data = await get_recent_events(args)
                if events_data:
                    response_data.structured_data = {
                        "events": events_data,
                        "search_query": args,
                        "total_found": len(events_data)
                    }
                    response_data.summary = f"Found upcoming events related to {args}"
                    response_data.output = f"Found {len(events_data)} upcoming events for you."
                else:
                    response_data.output = f"No upcoming events found for {args}."
            except Exception as e:
                print(f"Event management error: {e}")
                response_data.output = f"Unable to fetch events for {args} at the moment."
                
        elif func_name == "project_showcase":
            try:
                projects_data = await get_featured_projects(args)
                if projects_data:
                    response_data.structured_data = {
                        "projects": projects_data,
                        "search_query": args,
                        "total_found": len(projects_data)
                    }
                    response_data.summary = f"Found featured projects related to {args}"
                    response_data.output = f"Found {len(projects_data)} featured projects for you."
                else:
                    response_data.output = f"No projects found for {args}."
            except Exception as e:
                print(f"Project showcase error: {e}")
                response_data.output = f"Unable to fetch projects for {args} at the moment."
                
        elif func_name == "youtube_summary":
            try:
                summaries_data = await get_youtube_summaries(args)
                if summaries_data:
                    response_data.structured_data = {
                        "summaries": summaries_data,
                        "search_query": args,
                        "total_found": len(summaries_data)
                    }
                    response_data.summary = f"Found video summaries related to {args}"
                    response_data.output = f"Found {len(summaries_data)} video summaries for you."
                else:
                    response_data.output = f"No video summaries found for {args}."
            except Exception as e:
                print(f"YouTube summary error: {e}")
                response_data.output = f"Unable to fetch video summaries for {args} at the moment."
                
        elif func_name == "profile_management":
            try:
                profile_data = await get_user_profile_summary()
                if profile_data:
                    response_data.structured_data = {
                        "profile": profile_data,
                        "search_query": args
                    }
                    response_data.summary = f"Here's your profile overview"
                    response_data.output = f"Here's your current profile information and achievements."
                else:
                    response_data.output = f"Unable to load profile information."
            except Exception as e:
                print(f"Profile management error: {e}")
                response_data.output = f"Unable to fetch profile information at the moment."
                
        else:
            response_data.output = "Sorry, I couldn't understand your request. I can help you with jobs, government schemes, business suggestions, courses, skill tutorials, events, projects, video summaries, and profile information."
            response_data.feature_type = "general"

    except Exception as e:
        print(f"Error processing request: {e}")
        response_data.output = "Sorry, I encountered an error while processing your request. Please try again."
        response_data.feature_type = "error"

    # 4. Translate output back to user's language if needed
    if req.lang != "en":
        response_data.output = translate_text(response_data.output, req.lang)
        if response_data.summary:
            response_data.summary = translate_text(response_data.summary, req.lang)

    return response_data.dict()

# Keep the original endpoint for backward compatibility
@router.post("/ai-assistant")
async def ai_assistant(req: AssistantRequest):
    """Original AI assistant endpoint"""
    enhanced_response = await ai_assistant_enhanced(req)
    return {"output": enhanced_response["output"]}