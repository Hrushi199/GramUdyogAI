from typing import List
from pydantic import BaseModel
import json
from groq import Groq
import os
from dotenv import load_dotenv, find_dotenv
import pathlib
import time
import re
from core.audio_generation import TextToSpeech
from core.translation import translate_text_safely
import requests
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import asyncio

# Load environment variables from the .env file
os.environ.pop("GROQ_API_KEY", None)
os.environ.pop("YOUTUBE_API_KEY", None)
load_dotenv(find_dotenv())
groq_api_key = os.getenv("GROQ_API_KEY")
youtube_api_key = os.getenv("YOUTUBE_API_KEY")

# Initialize Groq client
client = None
if groq_api_key:
    try:
        client = Groq(api_key=groq_api_key)
    except Exception as e:
        print(f"Warning: Failed to initialize Groq client: {e}")
else:
    print("Warning: GROQ_API_KEY not set. LLM features will be disabled.")

# Initialize YouTube Data API v3 client
youtube_client = None
if youtube_api_key:
    try:
        youtube_client = build('youtube', 'v3', developerKey=youtube_api_key)
    except Exception as e:
        print(f"Warning: Failed to initialize YouTube API client: {e}")
else:
    print("Warning: YOUTUBE_API_KEY not set. Video fetching will fall back to search URLs.")

LLAMA_MODEL = "llama-3.3-70b-versatile"

# Pydantic models for schema-driven JSON
class VisualSummarySection(BaseModel):
    title: str
    text: str
    imageUrl: str = ""  # Will store YouTube video URL or fallback search URL
    audioUrl: str = ""

class VisualSummary(BaseModel):
    type: str
    title: str
    sections: List[VisualSummarySection]

def llama_chat_completion(messages, temperature=1, max_tokens=1024):
    if not client:
        raise ValueError("Groq client not initialized. Please set GROQ_API_KEY environment variable.")
    
    if not any("json" in m["content"].lower() for m in messages):
        messages = [{"role": "system", "content": "Please reply in valid JSON format."}] + messages
    response = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content

def get_skill_tutorials(skill: str) -> List[dict]:
    """
    Get tutorials for a specific skill using YouTube Data API v3
    """
    if not youtube_client:
        print("YouTube API client not initialized. Returning fallback search URL.")
        return [
            {
                "title": f"Learn {skill.title()}",
                "description": f"Online tutorials and resources for learning {skill}",
                "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial",
                "level": "beginner"
            }
        ]

    try:
        # Query YouTube Data API for videos
        request = youtube_client.search().list(
            part="id,snippet",
            q=f"{skill} tutorial",
            type="video",
            maxResults=5,  # Fetch up to 5 videos to choose from
            videoEmbeddable="true",  # Ensure videos can be embedded
            videoSyndicated="true",  # Ensure videos are accessible
            order="relevance",  # Prioritize relevance
            safeSearch="moderate"
        )
        response = request.execute()

        tutorials = []
        for item in response.get("items", []):
            video_id = item["id"]["videoId"]
            title = item["snippet"]["title"]
            description = item["snippet"]["description"]
            # Assign a level based on title/description (simplified heuristic)
            level = "beginner" if "beginner" in (title.lower() + description.lower()) else "intermediate"
            tutorials.append({
                "title": title[:100],  # Truncate for brevity
                "description": description[:200],  # Truncate for brevity
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "level": level
            })

        if not tutorials:
            print(f"No videos found for skill: {skill}. Returning fallback search URL.")
            return [
                {
                    "title": f"Learn {skill.title()}",
                    "description": f"Online tutorials and resources for learning {skill}",
                    "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial",
                    "level": "beginner"
                }
            ]
        
        return tutorials
    except HttpError as e:
        print(f"YouTube API error: {e}")
        return [
            {
                "title": f"Learn {skill.title()}",
                "description": f"Online tutorials and resources for learning {skill}",
                "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial",
                "level": "beginner"
            }
        ]
    except Exception as e:
        print(f"Error fetching tutorials for skill {skill}: {e}")
        return [
            {
                "title": f"Learn {skill.title()}",
                "description": f"Online tutorials and resources for learning {skill}",
                "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial",
                "level": "beginner"
            }
        ]

def generate_youtube_url(topic: str, section_content: str) -> str:
    """Fetch a direct YouTube video URL using YouTube Data API v3"""
    print(f"Generating YouTube URL for topic: '{topic}', section: '{section_content[:50]}...'")
    
    if not youtube_client:
        print("YouTube API client not initialized. Falling back to search URL.")
        section_keywords = section_content.lower().replace(" ", "+")[:50]
        return f"https://www.youtube.com/results?search_query={section_keywords}+{topic.replace(' ', '+')}"

    # Use LLM to generate a specific search query for this section
    prompt = f"""
    You are an expert at creating YouTube search queries for educational content.
    
    Topic: "{topic}"
    Section Content: "{section_content}"
    
    Create a specific, focused YouTube search query (max 50 characters) that will find the most relevant educational video for this particular section. The query should:
    1. Include key terms from the section content
    2. Be specific to the subtopic discussed in this section
    3. Include relevant technical terms or location-specific terms if mentioned
    4. Focus on practical, tutorial, or educational content
    
    Return your response as a JSON object: {{"query": "<your search query here>"}}
    
    Examples:
    - For "soil preparation for bajra farming": {{"query": "bajra soil preparation farming techniques"}}
    - For "pest control in cotton farming": {{"query": "cotton pest control methods organic"}}
    - For "irrigation methods for wheat": {{"query": "wheat irrigation drip sprinkler methods"}}
    """
    
    try:
        messages = [{"role": "user", "content": prompt}]
        result = llama_chat_completion(messages, temperature=0.3, max_tokens=128)
        url_json = json.loads(result)
        search_query = url_json.get("query", "").strip()
        print(f"LLM generated search query: '{search_query}'")
        
        # Validate the query
        if not search_query or len(search_query) < 5:
            raise ValueError("Generated query too short or empty")
            
    except Exception as e:
        print(f"Error generating search query with LLM: {e}")
        # Fallback: create a more intelligent query manually
        section_words = section_content.lower().split()
        topic_words = topic.lower().split()
        
        # Extract key terms (remove common words)
        stop_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'a', 'an'}
        key_terms = [word for word in section_words[:5] if word not in stop_words and len(word) > 2]
        topic_terms = [word for word in topic_words[:3] if word not in stop_words and len(word) > 2]
        
        # Combine terms with priority to section-specific terms
        search_query = " ".join(key_terms[:3] + topic_terms[:2])[:50]
        print(f"Fallback search query: '{search_query}'")

    # Use YouTube Data API to search for a specific video
    try:
        print(f"Searching YouTube with query: '{search_query}'")
        request = youtube_client.search().list(
            part="id,snippet",
            q=search_query,
            type="video",
            maxResults=3,  # Get top 3 results to choose from
            videoEmbeddable="true",
            videoSyndicated="true",
            order="relevance",
            safeSearch="moderate",
            videoDuration="medium",  # Prefer medium duration videos (4-20 minutes)
            relevanceLanguage="en"  # Prefer English content
        )
        response = request.execute()

        # Filter and select the best video
        if response.get("items"):
            for item in response["items"]:
                video_id = item["id"]["videoId"]
                title = item["snippet"]["title"].lower()
                description = item["snippet"]["description"].lower()
                
                # Check if video is relevant to the section content
                section_keywords = [word.lower() for word in section_content.split() if len(word) > 3][:5]
                relevance_score = sum(1 for keyword in section_keywords if keyword in title or keyword in description)
                
                # Also check for educational indicators
                educational_indicators = ['tutorial', 'how to', 'guide', 'tips', 'method', 'technique', 'learn', 'farming', 'agriculture']
                has_educational_content = any(indicator in title or indicator in description for indicator in educational_indicators)
                
                if relevance_score > 0 or has_educational_content:
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    print(f"Selected relevant video: {item['snippet']['title'][:50]}... (Score: {relevance_score})")
                    return video_url
            
            # If no highly relevant video found, use the first result
            video_id = response["items"][0]["id"]["videoId"]
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            print(f"Using first result: {response['items'][0]['snippet']['title'][:50]}...")
            return video_url
        else:
            print("No videos found for query. Falling back to search URL.")
            return f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}"
            
    except HttpError as e:
        print(f"YouTube API error: {e}")
        return f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}"
    except Exception as e:
        print(f"Error fetching YouTube video: {e}")
        return f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}"

def slugify(text):
    return re.sub(r'[^a-zA-Z0-9_]', '', text.lower().replace(' ', '_'))

tts = TextToSpeech()

def translate_text(text: str, target_language: str) -> str:
    """
    Translate text using the translation module's safe translation function
    """
    try:
        if target_language == "en":
            return text
        
        # Use the safe translation function from translation.py
        return translate_text_safely(text, target_language, max_length=700)
        
    except Exception as e:
        print(f"Translation failed: {e}")
        return text

def generate_visual_summary_json(topic: str, rag: str, language: str = "en", generate_audio: bool = False) -> VisualSummary:
    print(f"\n=== Starting Visual Summary Generation ===")
    print(f"Topic: {topic}")
    print(f"Language: {language}")
    print(f"Generate Audio: {generate_audio}")
    
    # Generate summary in English
    schema = json.dumps(VisualSummary.model_json_schema(), indent=2)
    prompt = (
        "You are an educational assistant that outputs visual summaries in JSON.\n"
        f"The JSON object must use the schema: {schema}\n"
        f"Generate a Visual Summary for the topic '{topic}'. The summary should be divided into 3-5 sections, "
        "each representing a distinct aspect, step, or component of the topic. For each section, include:\n"
        "- A 'title' (short, specific heading that captures the unique aspect),\n"
        "- A 'text' field (2-3 sentences that are specific to this particular aspect, avoid generic content),\n"
        "- Placeholder fields for 'imageUrl' and 'audioUrl' (set as empty strings for now).\n\n"
        "IMPORTANT: Make each section focus on a DIFFERENT aspect of the topic. For example:\n"
        "- If topic is about farming: cover soil preparation, seed selection, irrigation, pest control, harvesting\n"
        "- If topic is about cooking: cover ingredients, preparation, cooking technique, seasoning, presentation\n"
        "- If topic is about business: cover planning, funding, marketing, operations, growth\n\n"
        "Each section should have distinct, specific content that would require different YouTube videos to explain.\n"
        f"Context information: {rag}\n\n"
        "Ensure the content is engaging, specific, and suitable for finding relevant educational videos.\n"
        "Respond in JSON format."
    )
    
    print("\n--- Generating Initial Summary ---")
    if not client:
        raise ValueError("Groq client not initialized. Please set GROQ_API_KEY environment variable.")
    
    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": prompt},
        ],
        model=LLAMA_MODEL,
        temperature=0.7,
        stream=False,
        response_format={"type": "json_object"},
    )
    
    try:
        print("\n--- Validating Summary JSON ---")
        content = chat_completion.choices[0].message.content
        if content:
            summary = VisualSummary.model_validate_json(content)
        else:
            raise ValueError("Empty response from LLM")
        print(f"Initial Summary: {json.dumps(summary.model_dump(), indent=2)}")
        
        if language != "en":
            print(f"\n--- Translating Content to {language} ---")
            summary.title = translate_text(summary.title, language)
            print(f"Translated Title: {summary.title}")
            for idx, section in enumerate(summary.sections):
                print(f"\nTranslating Section {idx + 1}")
                section.title = translate_text(section.title, language)
                section.text = translate_text(section.text, language)
                print(f"Section {idx + 1} Title: {section.title}")
                print(f"Section {idx + 1} Text: {section.text}")
    except Exception as e:
        print(f"\n!!! Error in Summary Generation/Translation: {e}")
        summary = VisualSummary(type="summary", title=f"Error generating summary for {topic}", sections=[])

    print("\n--- Setting up Asset Generation ---")
    timestamp = int(time.time())
    topic_slug = slugify(topic)
    unique_tag = f"{topic_slug}_{timestamp}"
    print(f"Generated Tag: {unique_tag}")
    
    # Create audio directory if needed
    audio_dir = pathlib.Path("audio")
    audio_dir.mkdir(exist_ok=True)
    print("Audio directory created/verified")

    # Process each section
    print("\n=== Processing Sections ===")
    for idx, section in enumerate(summary.sections):
        print(f"\n--- Processing Section {idx + 1}: '{section.title}' ---")
        
        # Assign YouTube video URL using YouTube Data API
        print("Assigning YouTube Video URL...")
        
        # Create a more specific topic for this section by combining main topic with section title
        section_specific_topic = f"{topic} {section.title}"
        print(f"Section-specific topic: '{section_specific_topic}'")
        
        # Add some delay between API calls to avoid rate limiting
        if idx > 0:
            time.sleep(1)
        
        youtube_url = generate_youtube_url(section_specific_topic, section.text)
        print(f"YouTube URL for section {idx + 1}: {youtube_url}")
        section.imageUrl = youtube_url  # Store in imageUrl for compatibility

        # Generate audio if requested
        if generate_audio:
            print("\nGenerating Audio...")
            audio_filename = f"{unique_tag}_section_{idx+1}.wav"
            audio_path = audio_dir / audio_filename
            try:
                tts.generate_audio(
                    text=section.text,
                    output_path=str(audio_path),
                    speaker="male",
                    language=language
                )
                section.audioUrl = f"/audio/{audio_filename}"
                print(f"Audio Generation Successful")
                print(f"Audio URL set: {section.audioUrl}")
            except Exception as e:
                print(f"!!! Error generating audio: {e}")
                section.audioUrl = ""
        else:
            print("Skipping Audio Generation")
            section.audioUrl = ""

    print("\n=== Summary Generation Complete ===")
    print(f"Final Summary: {json.dumps(summary.model_dump(), indent=2)}")
    return summary

if __name__ == "__main__":
    generate_visual_summary_json(
        "Growing bajra in farm, India, Madhya Pradesh",
        """How to grow bajra in farm?"""
    )