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
You are an AI assistant for a government and business support portal. 
Given the user's request, select which function to call and extract the arguments.

Available functions:
- recommend_job: for job recommendations (argument: user profile or skills)
- scheme_recommendation: for government scheme suggestions (argument: occupation or user profile)
- business_suggestion: for business ideas (argument: user's skill or interest)

Return a JSON object: {{"function": "...", "arguments": "..."}}

User request: "{user_text_en}"
"""
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a function selector for a government and business support portal."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
    )
    
    content = response.choices[0].message.content
    print(content)
    try:
        # Parse the response using the Pydantic model
        parsed = FunctionSelectionResponse.parse_raw(content)
        print(parsed)
        return parsed.function, parsed.arguments
    except ValidationError as e:
        print(f"Validation error: {e}")
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