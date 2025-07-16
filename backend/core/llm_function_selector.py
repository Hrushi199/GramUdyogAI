import os
import json
from groq import Groq
from pydantic import BaseModel, ValidationError

# Define the Pydantic model
class FunctionSelectionResponse(BaseModel):
    function: str
    arguments: str

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

"""
llm_function_selector.py: Selects which backend function to call and what arguments to use, based on user natural language input.
This module does NOT execute the function itself (e.g., course recommender), it only selects which function and arguments to use.
"""

def select_function_and_args(user_text_en: str):
    """
    Given a user request in English, use the LLM to select the best function and extract arguments.
    Returns (function_name, arguments) or (None, None) on error.
    """
    prompt = f"""
You are an AI assistant for a government and business support portal called GramUdyogAI. 
Given the user's request, select which function to call and extract the arguments.

Available functions:
- recommend_job: for job recommendations (argument: user profile, skills, or job preferences)
- scheme_recommendation: for government scheme suggestions (argument: occupation, business type, or user profile)  
- business_suggestion: for business ideas (argument: user's skills, interests, or resources)
- course_recommendation: for educational course suggestions (argument: subject, skill, or learning goal)
- skill_tutorial: for skill-building tutorials (argument: specific skill to learn)
- event_management: for event information and management (argument: event type, location, or date preferences)
- project_showcase: for project showcasing and collaboration (argument: project type, industry, or investment needs)
- youtube_summary: for video summaries and educational content (argument: topic or video preferences)
- profile_management: for user profile and dashboard information (argument: user profile section or data type)
- product_recommendation: for government marketplace product links (argument: product search terms, comma-separated, suitable for GeM search)
- visual_summary: for generating visual summaries (argument: topic, context, language)

Guidelines:
- Use "recommend_job" for: job search, employment, career opportunities, work
- Use "scheme_recommendation" for: government programs, subsidies, financial aid, schemes
- Use "business_suggestion" for: business ideas, entrepreneurship, starting a business
- Use "course_recommendation" for: learning, education, courses, training programs
- Use "skill_tutorial" for: skill development, tutorials, learning specific skills
- Use "event_management" for: events, workshops, seminars, networking, conferences
- Use "project_showcase" for: projects, collaboration, investment, showcasing work
- Use "youtube_summary" for: video summaries, educational videos, content analysis
- Use "profile_management" for: profile info, dashboard, personal data, user settings
- Use "product_recommendation" for: product links, government marketplace, GeM, buying products, equipment, tools, machinery, etc.
- Use "visual_summary" for: visual summaries, image generation, content visualization.

IMPORTANT: For the arguments field, provide a simple string description, not a JSON object.
- For product_recommendation, extract only generic, marketplace-friendly product search terms (not natural language). Output a comma-separated list of product keywords suitable for GeM search. Example: 'pumps, solar panel, tractor'.
- For visual_summary, provide a topic, context, and language (e.g., "Make a visual summary on organic farming in Hindi").

Return a JSON object: {{"function": "...", "arguments": "..."}}

User request: "{user_text_en}"
"""
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a function selector for a government and business support portal. You help users find jobs, government schemes, business ideas, courses, and skill tutorials."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content if response and response.choices and response.choices[0].message.content else None
    print(content)
    if not content:
        print("LLM did not return any content.")
        return None, None
    try:
        response_data = json.loads(content)
        function_name = response_data.get("function", "")
        arguments = response_data.get("arguments", "")
        # Special handling for visual_summary: extract topic, context, language if possible
        if function_name == "visual_summary":
            # Heuristic: try to extract topic, context, and language from the arguments string
            import re
            topic = ""
            context = ""
            language = "en"
            # Try to extract language (Hindi, etc.)
            lang_match = re.search(r"in ([A-Za-z]+)", arguments, re.IGNORECASE)
            if lang_match:
                lang_word = lang_match.group(1).lower()
                lang_map = {"hindi": "hi", "english": "en", "marathi": "mr", "bengali": "bn", "tamil": "ta", "telugu": "te", "gujarati": "gu", "punjabi": "pa", "kannada": "kn", "malayalam": "ml", "odia": "or", "assamese": "as", "urdu": "ur"}
                language = lang_map.get(lang_word, lang_word)
                arguments = re.sub(r"in [A-Za-z]+", "", arguments, flags=re.IGNORECASE).strip()
            # Try to split topic/context by 'on', 'about', or 'regarding'
            topic_match = re.search(r"(?:on|about|regarding) ([^,]+)", arguments, re.IGNORECASE)
            if topic_match:
                topic = topic_match.group(1).strip()
            else:
                topic = arguments.strip()
            # Try to extract context after a comma or 'for'
            context_match = re.search(r",(.*)$", arguments)
            if context_match:
                context = context_match.group(1).strip()
            else:
                context_for = re.search(r"for (.+)$", arguments)
                if context_for:
                    context = context_for.group(1).strip()
            arguments = {"topic": topic, "context": context, "language": language}
        # If arguments is a dict/object, convert to string for other functions
        elif isinstance(arguments, dict):
            if function_name == "business_suggestion":
                interests = arguments.get("user_interests", "")
                resources = arguments.get("available_resources", [])
                skill_level = arguments.get("skill_level", "")
                if isinstance(resources, list):
                    resources_str = ", ".join(resources)
                else:
                    resources_str = str(resources)
                arguments = f"interests: {interests}, resources: {resources_str}, skill_level: {skill_level}"
            else:
                arguments = ", ".join([f"{k}: {v}" for k, v in arguments.items() if v])
        print(f"Parsed function: {function_name}, arguments: {arguments}")
        return function_name, arguments
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"Parsing error: {e}")
        # Fallback: try the original Pydantic parsing
        try:
            if content:
                parsed = FunctionSelectionResponse.parse_raw(content)
                print(parsed)
                return parsed.function, parsed.arguments
            else:
                return None, None
        except ValidationError as e2:
            print(f"Validation error: {e2}")
            return None, None

async def llama_summarize_items(items, user_info, item_type="job"):
    """
    Use Llama to turn a list of dicts into a friendly, natural language summary for the user.
    """
    prompt = (
        f"You are an AI assistant. The user is looking for a {item_type}. "
        f"Here is the user's info: {user_info}\n"
        f"Here are some {item_type} options as JSON:\n{json.dumps(items, indent=2)}\n\n"
        f"Write a friendly, conversational script (max 150 words) that will be spoken aloud to the user. "
        f"Structure your response as follows:\n"
        f"-Greet the user and briefly mention what you found.\n"
        f"-For each {item_type}, mention its title/name and summarize its most important details (such as company, location, pay for jobs; benefits, eligibility for schemes; idea, steps for business suggestions).\n"
        f"-End with an encouraging or helpful closing line.\n"
        f"Do not invent any data. If the list is empty, say you couldn't find any suitable {item_type}s. "
        f"Keep your language clear, natural, and easy to understand. Your response will be spoken aloud, so avoid long sentences and keep it concise."
    )
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": f"You are a helpful assistant that summarizes {item_type} options for users."},
            {"role": "user", "content": prompt}
        ]
    )
    content = response.choices[0].message.content if response and response.choices and response.choices[0].message.content else None
    if content:
        return content.strip()
    else:
        return "Sorry, I couldn't generate a summary for these items."