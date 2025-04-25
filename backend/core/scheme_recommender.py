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
        f"- Return only the names of only the 3 relevant schemes strictly as a json list\n"
        f"- The JSON list should strictly follow the same format as that of the lists give to you above"
    )
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a smart assistant that selects relevant government schemes based on a user's occupation. Respond only with a JSON list of scheme names from the provided list, without any modifications."},
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
                if data["scheme_name"] in selected_names:
                    schemes.append(data)
        except:
            continue
    return schemes

def explain_schemes(occupation: str, selected_schemes: List[Dict]) -> str:
    # Define a structured example JSON format
    example_json_format = json.dumps([
        {
            "name": "Scheme Name",
            "goal": "Main purpose of the scheme",
            "benefit": "How it helps someone with this occupation",
            "eligibility": "Short eligibility criteria",
            "application_process": "Simple explanation of how to apply",
            "special_features": "Any extra benefits or useful highlights"
        }
    ], indent=2)

    # Example output format for clarity in instructions
    example_output_format = (
        "Name: Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)\n"
        "Goal: To provide income support to small and marginal farmers by disbursing direct annual financial assistance.\n"
        "Benefit: You receive ₹6,000 per year in three equal installments of ₹2,000, helping cover expenses like seeds, fertilizers, equipment or labor.\n"
        "Eligibility: Resident farmers who own cultivable land up to 2 hectares, whose names appear in land records, with a linked Aadhaar and bank account.\n"
        "Application process:\n"
        "• Gather your Aadhaar card, bank passbook and land-holding documents.\n"
        "• Visit your nearest Common Service Centre (CSC) or log in to pmkisan.gov.in.\n"
        "• Complete and submit the PM-KISAN application form with the required documents.\n"
        "• Track your application status on the portal; once approved, installments will be credited via Direct Benefit Transfer.\n"
        "Special features:\n"
        "• No application fee and no middlemen—entirely paperless if you apply online.\n"
        "• Funds are deposited directly into your bank account in three instalments.\n"
        "• Covers over 8 crore farmer families across India."
    )

    # Final prompt construction
    prompt = (
        f"You are an expert assistant who explains government schemes in a clear, simple, and practical way.\n\n"
        f"The user works as a '{occupation}'. Based on this, you are given a list of government schemes in JSON format:\n\n"
        f"{json.dumps(selected_schemes, indent=2)}\n\n"
        f"Please return explanations for all the schemes provided.\n"
        f"Your output should strictly follow the structure shown below for each scheme:\n\n"
        f"{example_json_format}\n\n"
        f"And your output format (human-readable text) should strictly follow this style and use the date from the JSON:\n\n"
        f"{example_output_format}\n\n"
        f"Important Instructions:\n"
        f"- Do NOT wrap your output in JSON.\n"
        f"- Return all the schemes from the list, no need to filter.\n"
        f"- Use the same order as in the input.\n"
        f"- Please leave a SINGLE BLANK LINE after each section like Name, Goal, Benefit, etc.\n"
        f"- Do NOT use asterisks or any Markdown symbols.\n"
        f"- Make the explanations friendly and easy to follow without jargon.\n"
    )

    print(f'This is selected schemes: {selected_schemes}')

    # Make the model call
    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {
                "role": "system",
                "content": "You are an expert in explaining government schemes. Your job is to make them clear and accessible to everyone based on their job profile."
            },
            {"role": "user", "content": prompt}
        ]
    )

    # Clean and return output
    result = response.choices[0].message.content
    cleaned_result = result.replace('*', '')  # precaution
    return cleaned_result