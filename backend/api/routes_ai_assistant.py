from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.translation import llama_translate_string as translate_text
from core.job_recommender import get_all_job_names, get_relevant_jobs, load_selected_jobs, find_best_job
from core.scheme_recommender import get_all_scheme_names, get_relevant_scheme_names, load_selected_schemes
from core.business_suggestion_generation import generate_prompt_from_skills, get_business_suggestions
from core.llm_function_selector import select_function_and_args, llama_summarize_items

router = APIRouter()

class AssistantRequest(BaseModel):
    text: str
    lang: str

@router.post("/ai-assistant")
async def ai_assistant(req: AssistantRequest):
    # 1. Translate input to English if needed
    print("Received request:", req.dict())
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

    # 3. Call the selected function
    if func_name == "recommend_job":
        all_job_names = await get_all_job_names()
        print("All job names:", all_job_names)
        relevant_job_names = await get_relevant_jobs(args, all_job_names)
        print("Relevant job names response:", relevant_job_names)
        if isinstance(relevant_job_names, dict) and "relevant_jobs" in relevant_job_names:
            relevant_jobs = await load_selected_jobs(relevant_job_names["relevant_jobs"])
            print("Loaded relevant jobs:", relevant_jobs)
            if relevant_jobs:
                # Summarize all job details
                output = await llama_summarize_items(relevant_jobs, user_text_en, item_type="job")
            else:
                output = "No suitable job found."
        else:
            print("Error: 'relevant_jobs' key missing or invalid format in response.")
            output = "No suitable job found."
    elif func_name == "scheme_recommendation":
        all_scheme_names = await get_all_scheme_names()
        print("All scheme names:", all_scheme_names)
        relevant_scheme_names = await get_relevant_scheme_names(args, all_scheme_names)
        print("Relevant scheme names:", relevant_scheme_names)
        relevant_schemes = await load_selected_schemes(relevant_scheme_names)
        print("Loaded relevant schemes:", relevant_schemes)
        if relevant_schemes:
            # Summarize all scheme details
            output = await llama_summarize_items(relevant_schemes, user_text_en, item_type="scheme")
        else:
            output = "No suitable scheme found."
    elif func_name == "business_suggestion":
        prompt = generate_prompt_from_skills(args)
        print("Generated prompt for business suggestions:", prompt)
        suggestions = await get_business_suggestions(prompt)
        print("Business suggestions:", suggestions)
        if hasattr(suggestions, "suggestions"):
            # Summarize all business suggestion details
            output = await llama_summarize_items([s.dict() for s in suggestions.suggestions], user_text_en, item_type="business suggestion")
        else:
            output = "No suggestion found."
    else:
        print("Unknown function name:", func_name)
        output = "Sorry, I couldn't understand your request."

    # 4. Translate output back to user's language if needed
    print("Output before translation:", output)
    if req.lang != "en":
        result_translated = translate_text(output, req.lang)
        print("Translated output to user's language:", result_translated)
    else:
        result_translated = output
        print("Output is already in English:", result_translated)

    return {"output": result_translated}