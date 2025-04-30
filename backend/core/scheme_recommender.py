import json
import glob
import os
from typing import List, Dict
from groq import Groq
from dotenv import load_dotenv, find_dotenv
from pydantic import BaseModel

# Load environment variables from the .env file
os.environ.pop("GROQ_API_KEY", None)
load_dotenv("./.env")
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

SCHEME_DIR = "schemes"

def get_all_scheme_names() -> List[str]:
    scheme_names = []
    for file in glob.glob(f"{SCHEME_DIR}/*.json"):
        try:
            with open(file, "r") as f:
                data = json.load(f)
                scheme_names.append(data["scheme_name"])
        except:
            continue
    return scheme_names

def get_relevant_scheme_names(occupation: str, scheme_names: List[str]) -> List[str]:
    prompt = (
        f"You are helping a user who works as a '{occupation}'.\n\n"
        f"Below is a list of government scheme names:\n"
        f"{json.dumps(scheme_names, indent=2)}\n\n"
        f"From this list, STRICTLY select only 3 schemes that are most relevant and potentially beneficial for someone "
        f"with this occupation. Consider how each scheme might provide financial support, resources, training, "
        f"opportunities, or other helpful benefits to this profession.\n\n"
        f"Important instructions:\n"
        f"- ONLY select schemes from the provided list.\n"
        f"- DO NOT suggest new schemes or modify scheme names.\n"
        f"- The names in your response MUST match exactly how they appear in the original list (case-sensitive, no typos, no changes).\n"
        f"- Return only the names of only the 3 relevant schemes strictly as a JSON list.\n"
        f"- The JSON list should strictly follow the same format as that of the lists given to you above."
    )
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "system",
                "content": "You are a smart assistant that selects relevant government schemes based on a user's occupation. Respond only with a JSON list of scheme names from the provided list, without any modifications."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except:
        return []

def load_selected_schemes(selected_names: List[str]) -> List[Dict]:
    schemes = []
    for file in glob.glob(f"{SCHEME_DIR}/*.json"):
        try:
            with open(file, "r") as f:
                data = json.load(f)
                if data["scheme_name"] in selected_names:
                    schemes.append(data)
        except:
            continue
    return schemes

class SchemeExplanation(BaseModel):
    name: str
    goal: str
    benefit: str
    eligibility: str
    application_process: str
    special_features: str
    full_json: dict = {}  # Additional field to store full JSON

class SchemeResponse(BaseModel):
    schemes: List[SchemeExplanation]

def explain_schemes(occupation: str, selected_schemes: List[Dict]) -> List[Dict]:
    prompt = (
        f"Parse and explain these government schemes for a {occupation}.\n\n"
        f"Input schemes: {json.dumps(selected_schemes, indent=2)}\n\n"
        f"Return a JSON object following this schema:\n"
        f"{json.dumps(SchemeResponse.model_json_schema(), indent=2)}\n\n"
        "Rules:\n"
        "1. Response MUST be valid JSON matching the schema exactly.\n"
        "2. MUST have a 'schemes' array.\n"
        "3. Each scheme MUST have ALL required fields.\n"
        "4. Use simple language.\n"
        "5. Convert scheme_name to 'name' field.\n"
        "Respond in JSON format."
    )

    print(f'Input schemes: {selected_schemes}')

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a JSON API that explains government schemes."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
    )

    result = response.choices[0].message.content
    print(f'Raw LLM response: {result}')

    try:
        # Validate and parse LLM JSON response
        parsed = SchemeResponse.model_validate_json(result)

        # Attach original full JSON into each scheme
        for scheme in parsed.schemes:
            for original_scheme in selected_schemes:
                if original_scheme["scheme_name"] == scheme.name:
                    scheme.full_json = original_scheme
                    break
        
        # FIX: Return list of dictionaries instead of Pydantic models
        return [scheme.model_dump() for scheme in parsed.schemes]
    except Exception as e:
        print(f"Error parsing/validating JSON: {e}")
        print(f"Raw response: {result}")
        return []
