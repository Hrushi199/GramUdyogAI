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
    if not youtube_client:
        print("YouTube API client not initialized. Falling back to search URL.")
        section_keywords = section_content.lower().replace(" ", "+")[:50]
        return f"https://www.youtube.com/results?search_query={section_keywords}+{topic.replace(' ', '+')}"

    # Extract a general skill from the topic (e.g., "farming" from "Growing bajra in farm, India, Madhya Pradesh")
    skill = topic.lower().split(" in ")[0].split()[-1]  # Simplistic extraction, e.g., "farming"
    
    # Get tutorials for the skill
    tutorials = get_skill_tutorials(skill)
    
    # Select the most relevant tutorial based on section content
    for tutorial in tutorials:
        if (
            any(word in tutorial["title"].lower() for word in section_content.lower().split()) or
            any(word in tutorial["description"].lower() for word in section_content.lower().split())
        ):
            if tutorial["url"].startswith("https://www.youtube.com/watch?v="):
                print(f"Selected YouTube video URL: {tutorial['url']}")
                return tutorial["url"]

    # If no relevant tutorial is found, generate a specific search query with LLM
    prompt = f"""
    You are an educational assistant tasked with generating a concise search query for YouTube videos.
    For the topic "{topic}" and section content "{section_content}", provide a search query string (max 50 characters) that captures the key concepts for finding an educational or tutorial video.
    Return your response as a JSON object: {{"query": "<your search query here>"}}.
    Example: {{"query": "soil preparation bajra farming madhya pradesh"}}
    """
    try:
        messages = [{"role": "user", "content": prompt}]
        result = llama_chat_completion(messages, temperature=0.7, max_tokens=128)
        url_json = json.loads(result)
        search_query = url_json.get("query", f"{section_content.lower()[:50]} {topic.lower()}".replace(" ", "+"))
    except Exception as e:
        print(f"Error generating search query with LLM: {e}")
        search_query = f"{section_content.lower()[:50]} {topic.lower()}".replace(" ", "+")

    # Use YouTube Data API to search for a more specific video
    try:
        request = youtube_client.search().list(
            part="id,snippet",
            q=search_query,
            type="video",
            maxResults=1,  # Get the top result
            videoEmbeddable="true",  # Ensure videos can be embedded
            videoSyndicated="true",  # Ensure videos are accessible
            order="relevance",  # Prioritize relevance
            safeSearch="moderate"
        )
        response = request.execute()

        # Extract the video ID from the top result
        if response.get("items") and len(response["items"]) > 0:
            video_id = response["items"][0]["id"]["videoId"]
            return f"https://www.youtube.com/watch?v={video_id}"
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
    try:
        if target_language == "en":
            return text
        response = requests.post(
            "http://localhost:8000/translate",  # Replace with actual translation endpoint
            json={"text": text, "target_language": target_language}
        )
        return response.json()["translated_text"]
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
        "each representing a key event or era. For each section, include:\n"
        "- A 'title' (short, descriptive heading),\n"
        "- A 'text' field (2-3 sentences summarizing the event/era),\n"
        "- Placeholder fields for 'imageUrl' and 'audioUrl' (set as empty strings for now).\n"
        f"{rag}\n"
        "Ensure the content is engaging, concise, and suitable for an immersive, story-like presentation with visuals and audio narration.\n"
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
        print(f"\n--- Processing Section {idx + 1} ---")
        
        # Assign YouTube video URL using YouTube Data API
        print("Assigning YouTube Video URL...")
        youtube_url =  generate_youtube_url(topic, section.text)
        print(f"YouTube URL: {youtube_url}")
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