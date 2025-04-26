
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

os.environ.pop("GROQ_API_KEY", None)
load_dotenv("./.env")
api_key=os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=api_key)

def generate_prompt_from_skills(skills_text):
    return (
        "You are a business consultant. A user has the following skills: " + skills_text +
        ". Based on these, suggest 3 practical and scalable business ideas that they can start "
        "with low to medium investment. Include details like the business type, required resources, "
        "initial steps, and why it suits their skillset."
    )

def get_business_suggestions(prompt):
    try:
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a business consultant."},
                {"role": "user", "content": prompt}
            ]
        )
        print(response.choices[0].message.content)
        return response.choices[0].message.content
    except Exception as e:
        return f"Groq error: {str(e)}"
