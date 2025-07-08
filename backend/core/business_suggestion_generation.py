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

class DetailedStep(BaseModel):
    step_number: int
    title: str
    description: str
    estimated_time: str
    estimated_cost: str
    youtube_links: List[str]
    shopping_links: List[str]
    required_documents: List[str]
    document_process: List[str]
    tips: List[str]

class BusinessSuggestion(BaseModel):
    idea_name: str
    business_type: str
    required_resources: List[str]
    initial_steps: List[str]
    why_it_suits: str
    detailed_guide: List[DetailedStep]
    total_estimated_cost: str
    total_time_to_start: str
    difficulty_level: str
    profit_potential: str

class BusinessSuggestionsResponse(BaseModel):
    suggestions: List[BusinessSuggestion]

def generate_prompt_from_skills(skills_text):
    return f"""You are a business consultant specializing in low-cost, small-scale businesses in India. GENERATE 3 specific business ideas based on this skill: {skills_text}

Each business idea must be:
- Low investment (under ₹5,000 total startup cost)
- Suitable for beginners
- Focused on local/regional markets in India
- Practical and actionable

For each business idea, provide:
1. Name and type
2. Required resources (affordable items)
3. Initial steps  
4. Why it suits the skill
5. Detailed implementation guide with step-by-step instructions

For the detailed guide, provide 4-6 comprehensive steps with:
- Step title and description
- Time estimate (e.g., "1-2 weeks")
- Cost estimate in Indian Rupees (e.g., "₹500-1000")
- 2-3 REAL YouTube video titles (search-friendly titles that would actually exist)
- 2-3 REAL shopping links (actual Indian e-commerce sites like Amazon.in, Flipkart, local suppliers)
- Required documents for small business in India
- Document process steps specific to India
- Practical tips and warnings for Indian market

Remember to Generate 3 business ideas based on the skill provided.

Use only Indian Rupees (₹) for all costs. Keep total startup cost under ₹5,000.

Return ONLY valid JSON in this exact format:
{{
  "suggestions": [
    {{
      "idea_name": "Business Name",
      "business_type": "service-based/product-based/home-based",
      "required_resources": ["item 1 (₹200)", "item 2 (₹300)"],
      "initial_steps": ["step 1", "step 2", "step 3"],
      "why_it_suits": "explanation",
      "detailed_guide": [
        {{
          "step_number": 1,
          "title": "Business Registration & Setup",
          "description": "Set up your small business legally with minimal paperwork",
          "estimated_time": "3-5 days",
          "estimated_cost": "₹500-800",
          "youtube_links": ["How to Start Small Business in India 2024", "GST Registration for Small Business", "Udyam Registration Process"],
          "shopping_links": ["https://www.amazon.in/s?k=ProductName", "https://www.flipkart.com/search?q=ProductName", "Local wholesale market"],
          "required_documents": ["Aadhaar Card", "PAN Card", "Bank Account", "Address Proof"],
          "document_process": ["Visit Udyam portal", "Fill basic details", "Upload Aadhaar", "Get registration number"],
          "tips": ["Start as sole proprietorship", "Keep all receipts", "Use digital payment methods"]
        }}
      ],
      "total_estimated_cost": "cost",
      "total_time_to_start": "time",
      "difficulty_level": "level",
      "profit_potential": "profit amount"
    }}
  ]
}}"""

async def get_business_suggestions(prompt):
    try:
        print(f"Sending prompt to Groq API (length: {len(prompt)} chars)")
        
        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a business consultant. Respond only with valid JSON format. Do not include any text outside of the JSON structure."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        print(f"Received response from Groq (length: {len(content)} chars)")
        print(f"Raw response: {content[:500]}...")  # Print first 500 chars
        
        try:
            # Clean the response to extract JSON
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            parsed = json.loads(content)
            if isinstance(parsed, list):
                parsed = {"suggestions": parsed}
            validated = BusinessSuggestionsResponse(**parsed)
            return validated
        except (ValidationError, json.JSONDecodeError) as e:
            print(f"Validation/JSON error: {str(e)}")
            return {"error": f"Response parsing error: {str(e)}", "raw": content}
    except Exception as e:
        print(f"Groq API error: {str(e)}")
        return {"error": f"API error: {str(e)}"}

