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

def select_function_and_args(user_text_en: str):
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

IMPORTANT: For the arguments field, provide a simple string description, not a JSON object.
Examples:
- For business_suggestion: "farming, agriculture, organic produce"
- For recommend_job: "software developer, remote work"
- For scheme_recommendation: "farmer, small business, agriculture"

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
    
    content = response.choices[0].message.content
    print(content)
    try:
        # Parse the response JSON
        import json
        response_data = json.loads(content)
        
        function_name = response_data.get("function", "")
        arguments = response_data.get("arguments", "")
        
        # If arguments is a dict/object, convert to string
        if isinstance(arguments, dict):
            # Extract meaningful values from the dict
            if function_name == "business_suggestion":
                # For business suggestions, combine interests and resources
                interests = arguments.get("user_interests", "")
                resources = arguments.get("available_resources", [])
                skill_level = arguments.get("skill_level", "")
                if isinstance(resources, list):
                    resources_str = ", ".join(resources)
                else:
                    resources_str = str(resources)
                arguments = f"interests: {interests}, resources: {resources_str}, skill_level: {skill_level}"
            else:
                # For other functions, convert dict values to string
                arguments = ", ".join([f"{k}: {v}" for k, v in arguments.items() if v])
        
        print(f"Parsed function: {function_name}, arguments: {arguments}")
        return function_name, arguments
    except (json.JSONDecodeError, ValidationError) as e:
        print(f"Parsing error: {e}")
        
        # Fallback: try the original Pydantic parsing
        try:
            parsed = FunctionSelectionResponse.parse_raw(content)
            print(parsed)
            return parsed.function, parsed.arguments
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
    return response.choices[0].message.content.strip()