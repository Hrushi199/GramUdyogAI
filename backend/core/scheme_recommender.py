import json
import glob
import os
from typing import List, Dict
from groq import Groq
from dotenv import load_dotenv,find_dotenv
# Load environment variables from the .env file
os.environ.pop("GROQ_API_KEY", None)
load_dotenv("./.env")
api_key=os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

SCHEME_DIR = "schemes"

def get_all_scheme_names() -> List[str]:
    scheme_names = []
    for file in glob.glob(f"{SCHEME_DIR}/*.json"):
        try:
            with open(file, "r") as f:
                data = json.load(f)
                scheme_names.append(data["name"])
        except:
            continue
    return scheme_names

def get_relevant_scheme_names(occupation: str, scheme_names: List[str]) -> List[str]:
    prompt = (
        f"A user has the occupation: '{occupation}'. "
        f"From this list of government schemes: {scheme_names}, "
        f"select only the most relevant ones. Return only the names as a JSON list."
    )
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a smart assistant that selects relevant schemes based on user's job."},
            {"role": "user", "content": prompt}
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
                if data["name"] in selected_names:
                    schemes.append(data)
        except:
            continue
    return schemes

def explain_schemes(occupation: str, selected_schemes: List[Dict]) -> str:
    prompt = (
        f"Explain the following government schemes in simple terms to someone who is a '{occupation}':\n\n"
        f"{json.dumps(selected_schemes, indent=2)}"
    )
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are an expert government scheme explainer. Keep it clear and friendly."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content
