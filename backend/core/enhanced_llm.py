import os
from typing import List, Optional, Dict, Any
from groq import Groq
from pydantic import BaseModel
from datetime import datetime
import json

# Set up the client with error handling
groq = None
try:
    groq = Groq(api_key=os.getenv("GROQ_API_KEY"))
except Exception as e:
    print(f"Warning: Failed to initialize Groq client: {e}")

# ===== SCHEMAS FOR DIFFERENT USE CASES =====
# Event Generation Schema
class EventSectionSchema(BaseModel):
    title: str
    description: str
    key_points: List[str]
    target_audience: str
    expected_outcome: str

class EventGenerationSchema(BaseModel):
    title: str
    description: str
    event_type: str
    category: str
    location: str = ""
    state: str = ""
    start_date: str = ""
    end_date: str = ""
    max_participants: int = 100
    budget: int = 0
    prize_pool: int = 0
    skills_required: List[str]
    tags: List[str]
    marketing_highlights: List[str]
    success_metrics: List[str]
    sections: List[EventSectionSchema]

# Marketing Content Schema
class SocialMediaPostSchema(BaseModel):
    platform: str
    content: str
    hashtags: List[str]
    call_to_action: str
    target_audience: str

class MarketingContentSchema(BaseModel):
    event_title: str
    event_description: str
    social_media_posts: List[SocialMediaPostSchema]
    email_template: str
    press_release: str
    visual_content_ideas: List[str]

# User Profile Enhancement Schema
class SkillAssessmentSchema(BaseModel):
    current_skills: List[str]
    skill_levels: Dict[str, str]  # skill -> level (beginner/intermediate/advanced)
    recommended_skills: List[str]
    learning_path: List[str]
    career_opportunities: List[str]

class ProfileEnhancementSchema(BaseModel):
    user_type: str
    profile_summary: str
    key_achievements: List[str]
    impact_metrics: Dict[str, Any]
    recommendations: List[str]
    networking_suggestions: List[str]

# Project Analysis Schema
class ProjectAnalysisSchema(BaseModel):
    project_title: str
    impact_score: int
    scalability_potential: str
    market_opportunity: str
    investment_readiness: str
    team_strengths: List[str]
    improvement_areas: List[str]
    funding_recommendations: List[str]
# ===== ENHANCED LLM FUNCTIONS =====
async def generate_event_with_ai(prompt: str, event_type: str, context: str = "", language: str = "en") -> Optional[EventGenerationSchema]:
    """Generate a complete event with AI assistance"""
    try:
        if not groq:
            print("Warning: Groq client not initialized. Cannot generate event.")
            return None
        
        now_str = datetime.now().strftime('%Y-%m-%dT%H:%M')
        system_prompt = f"""
        You are an expert event planner specializing in {event_type} events.
        The user prefers to interact in the language: {language}.
        Current datetime is: {now_str}. Use this as a reference for generating start_date and end_date.
        Create a comprehensive event plan in JSON format with the following structure:
        {{
            "title": "Event Title",
            "description": "Detailed description",
            "event_type": "{event_type}",
            "category": "Category",
            "location": "Location",
            "state": "State",
            "start_date": "YYYY-MM-DDTHH:MM (24-hour, zero-padded, e.g., 2024-06-10T14:30)",
            "end_date": "YYYY-MM-DDTHH:MM (24-hour, zero-padded, e.g., 2024-06-10T18:00)",
            "max_participants": 100,
            "budget": 0,
            "prize_pool": 0,
            "skills_required": ["skill1", "skill2"],
            "tags": ["tag1", "tag2"],
            "marketing_highlights": ["highlight1", "highlight2"],
            "success_metrics": ["metric1", "metric2"],
            "sections": [
                {{
                    "title": "Section Title",
                    "description": "Section description",
                    "key_points": ["point1", "point2"],
                    "target_audience": "Target audience",
                    "expected_outcome": "Expected outcome"
                }}
            ]
        }}
        Focus on creating engaging, impactful events that drive skill development and innovation.
        Context: {context}
        All output should be in the language: {language}.
        """
            
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
            
        # Parse the JSON response
        content = response.choices[0].message.content
        if content:
            event_data = json.loads(content)
            return EventGenerationSchema(**event_data)
        else:
            print("Warning: Empty response from LLM")
            return None
        
    except Exception as e:
        print(f"Error generating event: {e}")
        return None

async def generate_marketing_content(event_data: Dict[str, Any]) -> Optional[MarketingContentSchema]:
    """Generate comprehensive marketing content for an event"""
    try:
        if not groq:
            print("Warning: Groq client not initialized. Cannot generate marketing content.")
            return None
            
        system_prompt = """
        You are a marketing expert specializing in event promotion.
        Create engaging marketing content for multiple platforms including social media, email, and press releases.
        Focus on driving participation and engagement.
        """
            
        user_prompt = f"""
        Create marketing content for this event:
        Title: {event_data.get('title', '')}
        Description: {event_data.get('description', '')}
        Type: {event_data.get('event_type', '')}
        Category: {event_data.get('category', '')}
        Target Participants: {event_data.get('target_participants', '')}
        """
            
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
            
        content = response.choices[0].message.content
        if content:
            marketing_data = json.loads(content)
            return MarketingContentSchema(**marketing_data)
        else:
            print("Warning: Empty response from LLM")
            return None
        
    except Exception as e:
        print(f"Error generating marketing content: {e}")
        return None
    
async def enhance_user_profile(user_data: Dict[str, Any]) -> Optional[ProfileEnhancementSchema]:
    """Enhance user profile with AI insights"""
    try:
        if not groq:
            print("Warning: Groq client not initialized. Cannot enhance profile.")
            return None
            
        system_prompt = """You are a profile enhancement assistant. When analyzing user profiles,
        always respond with valid JSON objects that match this structure:
        {
        "user_type": "string",
        "profile_summary": "string",
        "key_achievements": ["string"],
        "impact_metrics": {
            "social_impact_score": number,
            "skill_diversity": number,
            "network_strength": number
        },
        "recommendations": ["string"],
        "networking_suggestions": ["string"]
        }
        Analyze the user's profile data and provide relevant, actionable insights.
        Your response must be a JSON object only."""
            
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "json Analyze this user profile: " + json.dumps(user_data)},
            ],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
            
        content = response.choices[0].message.content
        if content:
            profile_data = json.loads(content)
            return ProfileEnhancementSchema(**profile_data)
        else:
            print("Warning: Empty response from LLM")
            return None
        
    except Exception as e:
        print(f"Error enhancing user profile: {e}")
        return None

async def analyze_project(project_data: Dict[str, Any]) -> Optional[ProjectAnalysisSchema]:
    """Analyze project for investment readiness and impact"""
    try:
        if not groq:
            print("Warning: Groq client not initialized. Cannot analyze project.")
            return None
            
        system_prompt = """
        You are an investment analyst and impact assessment expert. Be harsh and practical.
        Evaluate projects for their potential impact, scalability, and investment readiness.
        Provide actionable insights for improvement and funding recommendations.
        """
            
        user_prompt = f"""
        Analyze this project:
        Title: {project_data.get('title', '')}
        Description: {project_data.get('description', '')}
        Team: {project_data.get('team_members', [])}
        Technologies: {project_data.get('technologies', [])}
        Impact Metrics: {project_data.get('impact_metrics', {})}
        """
            
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
            
        content = response.choices[0].message.content
        if content:
            analysis_data = json.loads(content)
            return ProjectAnalysisSchema(**analysis_data)
        else:
            print("Warning: Empty response from LLM")
            return None
        
    except Exception as e:
        print(f"Error analyzing project: {e}")
        return None


async def generate_visual_summary_for_marketing(event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Generate visual summary for event marketing"""
    try:
        if not groq:
            print("Warning: Groq client not initialized. Cannot generate visual summary.")
            return None
            
        system_prompt = """
        You are a visual content strategist specializing in event marketing.
        Create engaging visual content ideas and marketing materials for events.
        Focus on creating compelling visuals that drive engagement and participation.
        """
            
        user_prompt = f"""
        Create visual marketing content for this event:
        Title: {event_data.get('title', '')}
        Description: {event_data.get('description', '')}
        Type: {event_data.get('event_type', '')}
        Category: {event_data.get('category', '')}
        Target Participants: {event_data.get('target_participants', '')}
        """
            
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.8,
            max_tokens=1024
        )
            
        content = response.choices[0].message.content
        if content:
            return {
                "visual_content": content,
                "generated_at": datetime.now().isoformat(),
                "event_id": event_data.get('id'),
                "marketing_ideas": [
                    "Social media graphics",
                    "Event banner design",
                    "Infographic creation",
                    "Video teaser content"
                ]
            }
        else:
            print("Warning: Empty response from LLM")
            return None
        
    except Exception as e:
        print(f"Error generating visual summary: {e}")
        return None

async def voice_update_profile(transcription: str, current_profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update profile fields based on voice transcription"""
    try:
        if not groq:
            print("Warning: Groq client not initialized. Cannot update profile.")
            return None
            
        system_prompt = (
            "You are a profile update assistant. When given a voice transcription and current profile, your job is to update the profile fields based ONLY on what is clearly mentioned in the transcription.\n\n"
            "Rules:\n"
            "- ONLY return fields that are clearly mentioned in the transcription.\n"
            "- Do NOT return fields that are not mentioned.\n"
            "- NEVER overwrite the entire profile. Only return a partial object with changed fields.\n"
            "- For skills, only add or remove as clearly stated in the transcription. If not clear, leave unchanged (do not return the field).\n"
            "- If a field should be removed, return it with null.\n"
            "- Your response must be a valid JSON object with only the changed fields.\n\n"
            "Example:\n"
            "Current Profile: {\"name\": \"Alice\", \"skills\": [\"Python\", \"Design\"]}\n"
            "Voice Transcription: \"Add JavaScript to my skills and change my name to Alicia\"\n"
            "Response: {\"name\": \"Alicia\", \"skills\": [\"Python\", \"Design\", \"JavaScript\"]}\n\n"
            "Always follow this pattern.\n\n"
            "JSON schema for updates:\n"
            "{\n  \"name\": \"string or null\",\n  \"location\": \"string or null\",\n  \"state\": \"string or null\",\n  \"skills\": [\"string\"],\n  \"experience\": \"string or null\",\n  \"goals\": \"string or null\",\n  \"organization\": \"string or null\"\n}\n\n"
            "Your response must be a JSON object only."
        )
            
        user_prompt = f"""
        Current Profile: {json.dumps(current_profile, indent=2)}
        Voice Transcription: "{transcription}"
        
        Update the profile based on the voice input. Only change fields that are clearly mentioned.
        """
            
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
            
        content = response.choices[0].message.content
        if content:
            profile_updates = json.loads(content)
            # Filter out null values and return only the updates
            return {k: v for k, v in profile_updates.items() if v is not None}
        else:
            print("Warning: Empty response from LLM")
            return None
        
    except Exception as e:
        print(f"Error updating profile with voice: {e}")
        return None

# ===== UTILITY FUNCTIONS =====
def format_currency(amount: int) -> str:
    """Format amount as Indian currency"""
    return f"₹{amount:,}"

def calculate_impact_score(metrics: Dict[str, Any]) -> int:
    """Calculate impact score based on various metrics"""
    try:
        score = 0
            
        # Participants impact
        participants = metrics.get('participants_target', 0)
        if participants > 1000:
            score += 30
        elif participants > 500:
            score += 20
        elif participants > 100:
            score += 10
            
        # Skills developed
        skills = metrics.get('skills_developed', 0)
        if skills > 20:
            score += 25
        elif skills > 10:
            score += 15
        elif skills > 5:
            score += 10
            
        # Projects created
        projects = metrics.get('projects_created', 0)
        if projects > 50:
            score += 25
        elif projects > 20:
            score += 15
        elif projects > 5:
            score += 10
            
        # Employment generated
        employment = metrics.get('employment_generated', 0)
        if employment > 100:
            score += 20
        elif employment > 50:
            score += 15
        elif employment > 10:
            score += 10
            
        return min(score, 100)  # Cap at 100
        
    except Exception as e:
        print(f"Error calculating impact score: {e}")
        return 0
def generate_user_type_specific_content(user_type: str, content: str) -> str:
    """Generate content specific to user type"""
    try:
        if not groq:
            return content
            
        system_prompt = f"""
        You are a content specialist for {user_type} users.
        Adapt the given content to be more relevant and engaging for this specific user type.
        Maintain the core message while making it more personalized.
        """
            
        response = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content},
            ],
            temperature=0.7,
            max_tokens=1024
        )
            
        adapted_content = response.choices[0].message.content
        return adapted_content if adapted_content else content
        
    except Exception as e:
        print(f"Error generating user-specific content: {e}")
        return content
