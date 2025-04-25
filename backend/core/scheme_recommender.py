import json
import glob
import os
from typing import List, Dict, Tuple
from groq import Groq
from dotenv import load_dotenv, find_dotenv

# Load environment variables from the .env file
load_dotenv("./.env")
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

SCHEME_DIR = "schemes"

def get_all_scheme_names() -> List[str]:
    """
    Retrieves all scheme names from the scheme directory.
    """
    scheme_names = []
    scheme_files = glob.glob(f"{SCHEME_DIR}/*.json")
    print(f"Found {len(scheme_files)} scheme files: {scheme_files}")
    
    for file in scheme_files:
        try:
            with open(file, "r") as f:
                data = json.load(f)
                scheme_names.append(data["scheme_name"])
                print(f"Added scheme: {data['scheme_name']}")
        except Exception as e:
            print(f"Error loading {file}: {e}")
            continue
    
    print(f"Total schemes found: {len(scheme_names)}")
    return scheme_names


def get_relevant_scheme_names(occupation: str, scheme_names: List[str]) -> List[str]:
    """
    Retrieves relevant scheme names for the user's occupation.
    The result will be a list of scheme names in JSON format.
    """
    # Create a cleaner list of scheme names for better processing
    clean_names = [name.strip() for name in scheme_names]
    
    prompt = (
        f"A user has the occupation: '{occupation}'. "
        f"From this list of government schemes: {json.dumps(clean_names)}, "
        f"select only the 4 most relevant ones for a {occupation}. Return ONLY a JSON array of scheme names."
    )
    
    print(f"Sending prompt to Groq: {prompt[:100]}...")  # Print part of the prompt for debugging
    
    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a smart assistant that selects relevant schemes based on the user's job."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2  # Lower temperature for more consistent output
        )
        
        content = response.choices[0].message.content
        print(f"Raw response from Groq: {content}")
        
        # Try to extract JSON if it's embedded in text
        import re
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            content = json_match.group(0)
        
        selected_schemes = json.loads(content)
        print(f"Successfully parsed schemes: {selected_schemes}")
        return selected_schemes[:4]  # Ensure limit of 4 schemes
    except Exception as e:
        print(f"Error getting relevant schemes: {e}")
        # Fall back to selecting occupation-related schemes manually
        keywords = []
        
        # Add occupation-specific keywords
        if occupation.lower() == "farmer":
            keywords = ["farm", "agri", "crop", "rural", "kisan", "soil", "seed"]
        elif occupation.lower() in ["student", "teacher", "professor"]:
            keywords = ["education", "school", "college", "scholarship", "learning", "student", "academic"]
        elif occupation.lower() in ["doctor", "nurse", "healthcare worker"]:
            keywords = ["health", "medical", "hospital", "healthcare", "doctor", "clinic", "patient"]
        else:
            # Generic keywords
            keywords = [occupation.lower()]
        
        manual_schemes = [
            name for name in scheme_names 
            if any(keyword in name.lower() for keyword in keywords)
        ]
        
        if not manual_schemes:
            # If no specific matches, return some general schemes
            manual_schemes = [name for name in scheme_names if "yojana" in name.lower() or "scheme" in name.lower()][:4]
        
        print(f"Falling back to manually selected schemes: {manual_schemes[:4]}")
        return manual_schemes[:4]  # Return up to 4 relevant schemes


def load_selected_schemes(selected_names: List[str]) -> List[Dict]:
    """
    Loads the full details of the selected schemes from JSON files.
    """
    schemes = []
    for file in glob.glob(f"{SCHEME_DIR}/*.json"):
        try:
            with open(file, "r") as f:
                data = json.load(f)
                if data["scheme_name"] in selected_names:
                    schemes.append({
                        "scheme_name": data["scheme_name"],
                        "location": data.get("location", "National"),
                        "tags": data.get("tags", []),
                        "description": data.get("description", "No description available"),
                        "key_features": data.get("key_features", []),
                        "benefits": data.get("benefits", []),
                        "eligibility": data.get("eligibility", []),
                        "application_process": data.get("application_process", "Contact your local government office"),
                        "required_documents": data.get("required_documents", []),
                        "special_notes": data.get("special_notes", "")
                    })
        except Exception as e:
            print(f"Error loading scheme details from {file}: {e}")
            continue
    
    print(f"Loaded {len(schemes)} scheme details")
    return schemes


def explain_schemes(occupation: str, selected_schemes: List[Dict]) -> str:
    """
    Generates a simple, easy-to-understand explanation of selected government schemes,
    specifically tailored for the user's occupation.
    """
    # Make sure we have schemes to explain
    if not selected_schemes:
        return "No relevant schemes were found for your occupation. Please try a different occupation or contact support."
    
    # Limit to 4 schemes
    selected_schemes = selected_schemes[:4]
    
    # Format the schemes in a simpler way for the LLM
    simplified_schemes = []
    for scheme in selected_schemes:
        simplified = {
            "name": scheme["scheme_name"],
            "description": scheme.get("description", "No description available"),
            "eligibility": scheme.get("eligibility", ["Information not available"]),
            "benefits": scheme.get("benefits", ["Information not available"]),
            "application": scheme.get("application_process", "Contact your local government office")
        }
        simplified_schemes.append(simplified)
    
    prompt = (
        f"Please explain the following government schemes in simple language for a {occupation}. "
        f"Focus on practical benefits and how to apply. "
        f"IMPORTANT FORMATTING INSTRUCTIONS: "
        f"1. Do NOT use asterisks (**) or any markdown formatting. "
        f"2. Present information in a clean, numbered format. "
        f"3. For each scheme, create sections with numbers (1., 2., etc.) followed by clear headings. " 
        f"4. Use short, simple sentences. "
        
        f"For each scheme, cover: "
        f"- What is the scheme about? "
        f"- How it can help a {occupation}? "
        f"- Who can apply? "
        f"- How to apply? "
        
        f"Here are the schemes (limit your response to only these {len(simplified_schemes)} schemes): "
        f"{json.dumps(simplified_schemes, indent=2)}"
    )
    
    print(f"Sending explanation prompt to Groq.")
    
    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful assistant explaining government schemes in simple, clear language. Avoid using asterisks or markdown formatting. Present information in a clean, numbered format with clear headings."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7  # A bit higher for natural language explanation
        )
        
        response_text = response.choices[0].message.content
        cleaned_text = response_text.replace("*", "")
        return cleaned_text

    except Exception as e:
        print(f"Error generating explanation: {e}")
        # Create a basic explanation if the LLM fails
        basic_explanation = f"GOVERNMENT SCHEMES FOR {occupation.upper()}\n\n"
        
        for i, scheme in enumerate(selected_schemes, 1):
            basic_explanation += f"{i}. {scheme['scheme_name']}\n"
            basic_explanation += f"   What it is: {scheme.get('description', 'No description available')}\n"
            
            if isinstance(scheme.get('benefits', []), list) and scheme.get('benefits', []):
                basic_explanation += "   Benefits: " + ", ".join(scheme.get('benefits', ["Information not available"]))[:200] + "\n"
            else:
                basic_explanation += f"   Benefits: {scheme.get('benefits', 'Information not available')}\n"
            
            if isinstance(scheme.get('eligibility', []), list) and scheme.get('eligibility', []):
                basic_explanation += "   Eligibility: " + ", ".join(scheme.get('eligibility', ["Information not available"]))[:200] + "\n"
            else:
                basic_explanation += f"   Eligibility: {scheme.get('eligibility', 'Information not available')}\n"
            
            basic_explanation += f"   How to apply: {scheme.get('application_process', 'Contact your local government office')}\n\n"
        
        return basic_explanation


def get_schemes_for_occupation(occupation: str) -> Tuple[List[Dict], str]:
    """
    Main function to process occupation and return scheme information.
    """
    try:
        # Get all scheme names
        all_scheme_names = get_all_scheme_names()
        
        if not all_scheme_names:
            return [], "No schemes were found in the database."
        
        # Get relevant scheme names for the occupation
        relevant_scheme_names = get_relevant_scheme_names(occupation, all_scheme_names)
        
        if not relevant_scheme_names:
            return [], f"No relevant schemes were found for {occupation}."
        
        # Load detailed information for selected schemes
        selected_schemes = load_selected_schemes(relevant_scheme_names)
        
        if not selected_schemes:
            return [], f"Could not load details for the selected schemes."
        
        # Generate explanation for the selected schemes
        explanation = explain_schemes(occupation, selected_schemes)
        
        return selected_schemes, explanation
    
    except Exception as e:
        print(f"Error in get_schemes_for_occupation: {e}")
        return [], f"An error occurred while processing your request: {str(e)}"