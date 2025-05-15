from groq import Groq
import os
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