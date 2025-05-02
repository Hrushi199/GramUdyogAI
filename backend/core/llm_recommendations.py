from groq import Groq
import os
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_course_recommendations(user: Dict, courses: List[Dict]) -> List[Dict]:
    # Create prompt with user profile and courses
    prompt = f"""
    Given a user profile and list of available CSR courses, recommend the top 3 most relevant courses.
    
    User Profile:
    {user}
    
    Available Courses:
    {courses}
    
    Return a JSON array containing the IDs of the 3 most relevant courses, ranked by relevance.
    Explain each recommendation with a reason.
    
    Format:
    {{
        "recommendations": [
            {{"course_id": 123, "reason": "This course aligns with user's interest in..."}}
        ]
    }}
    """
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    
    recommendations = response.choices[0].message.content
    
    # Return recommended courses with reasons
    return recommendations
