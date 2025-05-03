from groq import Groq
import os
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError
from typing import List
import json

# load_dotenv()

# os.environ.pop("GROQ_API_KEY", None)
# load_dotenv("./.env")
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
    return f"""
you are a business consultant helping users launch businesses based on their existing skills. 
The user has the following skill: {skills_text}. suggest 3 specific, scalable, and low-to-medium investment 
business ideas that are directly and practically built around this skill.

guidelines:
- do not suggest generic business models unless they are clearly and directly tailored to the given skill
- suggestions must be skill-specific, relevant, and executable
- each idea must be creative but realistic and use the user's core skill as the main driver

Return your response STRICTLY as a JSON object in the following format:

{{
  "suggestions": [
    {{
      "idea_name": "Name of the idea",
      "business_type": "type of business (e.g. service-based, product-based, online store)",
      "required_resources": [
        "list tools, equipment, or services needed (be specific)"
      ],
      "initial_steps": [
        "step 1: what the user needs to do first",
        "step 2: next logical action",
        "step 3: any low-cost setup or outreach required"
      ],
      "why_it_suits": "short explanation of why this idea is a strong fit for the skill"
    }},
    {{
      "idea_name": "another relevant idea",
      ...
    }},
    {{
      "idea_name": "third unique idea",
      ...
    }}
  ]
}}
"""

async def get_business_suggestions(prompt):
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
            parsed = json.loads(content)
            if isinstance(parsed, list):
                parsed = {"suggestions": parsed}
            validated = BusinessSuggestionsResponse(**parsed)
            return validated
        except (ValidationError, Exception) as e:
            return {"error": f"Pydantic validation error: {str(e)}", "raw": content}
    except Exception as e:
        return {"error": f"Groq error: {str(e)}"}

