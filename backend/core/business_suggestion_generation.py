from groq import Groq
import os
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError
from typing import List
import json

load_dotenv()

os.environ.pop("GROQ_API_KEY", None)
load_dotenv("./.env")
api_key=os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=api_key)

class BusinessSuggestion(BaseModel):
    idea_name: str
    business_type: str
    required_resources: List[str]
    initial_steps: List[str]
    why_it_suits: str

class BusinessSuggestionsResponse(BaseModel):
    suggestions: List[BusinessSuggestion]

def generate_prompt_from_skills(skills_text):
    return """You are a business consultant. A user has the following skills: {skills_text}. Based on these, suggest 3 practical and scalable business ideas that they can start with low to medium investment.

Return your response STRICTLY as a JSON object with this exact structure (do not use any other key names):
{
  "suggestions": [
    {
      "idea_name": "Idea 1 Name",
      "business_type": "Type",
      "required_resources": ["resource1", "resource2"],
      "initial_steps": ["step1", "step2"],
      "why_it_suits": "explanation"
    },
    {...}
  ]
}
"""

def get_business_suggestions(prompt):
    try:
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a business consultant."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        print(content)
        try:
            # Parse and validate with Pydantic
            # The LLM returns a JSON object, but we want a list under "suggestions"
            # If the LLM returns a list directly, wrap it
            parsed = json.loads(content)
            if isinstance(parsed, list):
                parsed = {"suggestions": parsed}
            validated = BusinessSuggestionsResponse(**parsed)
            return validated
        except (ValidationError, Exception) as e:
            return {"error": f"Pydantic validation error: {str(e)}", "raw": content}
    except Exception as e:
        return {"error": f"Groq error: {str(e)}"}

