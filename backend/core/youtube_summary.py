import yt_dlp
import tempfile
import os
from groq import Groq
from pydantic import BaseModel, ValidationError
from core.audio_generation import TextToSpeech
import json
import re
from dotenv import load_dotenv, find_dotenv
# load_dotenv(find_dotenv())
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY)
tts = TextToSpeech()

class YoutubeInsight(BaseModel):
    timestamp: str
    text: str

class YoutubeSummary(BaseModel):
    youtube_url: str
    insights: list[YoutubeInsight]

def extract_youtube_transcript(youtube_url):
    import requests
    from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
    video_id = None
    # Extract video ID from URL
    match = re.search(r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})", youtube_url)
    if match:
        video_id = match.group(1)
    if not video_id:
        raise Exception("Invalid YouTube URL")
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        # transcript: list of dicts with 'text', 'start', 'duration'
        return transcript
    except (TranscriptsDisabled, NoTranscriptFound):
        raise Exception("Transcript not available for this video")

def summarize_youtube_video(youtube_url, language="en"):
    transcript = extract_youtube_transcript(youtube_url)
    print(transcript)
    print(language)
    # Join transcript into text with timestamps
    transcript_text = ""
    for entry in transcript:
        mins = int(entry['start'] // 60)
        secs = int(entry['start'] % 60)
        timestamp = f"{mins:02d}:{secs:02d}"
        transcript_text += f"[{timestamp}] {entry['text']}\n"

    # Summarize using LLM, instructing to use the correct script for the language
    prompt = (
        f"You are an assistant that summarizes YouTube videos into actionable insights with timestamps. "
        f"Given the transcript below, extract the 5-10 most important points, each with a timestamp reference. "
        f"Summarize in {language} and ensure the output text is in the correct script for that language "
        f"(e.g., Devanagari for Hindi, Tamil script for Tamil, etc.) so it can be directly used for TTS. "
        f"Respond ONLY in valid JSON using this schema:\n"
        f'{{"insights": [{{"timestamp": "mm:ss", "text": "..."}}]}}\n\n'
        f"Transcript:\n{transcript_text}"
    )
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    content = response.choices[0].message.content
    print(content)
    try:
        summary_json = json.loads(content)
        # Validate with Pydantic for safety
        insights = [YoutubeInsight(**ins) for ins in summary_json.get("insights", [])]
    except (ValidationError, Exception) as e:
        print(f"Error parsing/validating LLM output: {e}")
        insights = []

    # Generate audio for each insight
    audio_files = []
    for idx, insight in enumerate(insights):
        text = insight.text
        audio_filename = f"yt_audio_{os.urandom(6).hex()}_{idx}.wav"
        audio_path = os.path.join("audio", language, audio_filename)
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        try:
            tts.generate_audio(text=text, output_path=audio_path, language=language)
            audio_files.append({"timestamp": insight.timestamp, "text": text, "audio": audio_filename})
        except Exception as e:
            audio_files.append({"timestamp": insight.timestamp, "text": text, "audio": None, "error": str(e)})

    return {
        "youtube_url": youtube_url,
        "insights": audio_files
    }
