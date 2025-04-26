from typing import List
from pydantic import BaseModel
import json
from groq import Groq
import os
from dotenv import load_dotenv
import pathlib
import time
import re
import requests
import base64
from huggingface_hub import InferenceClient
from PIL import Image
from time import sleep
# Load environment variables from the .env file
os.environ.pop("GROQ_API_KEY", None)
load_dotenv("../.env")
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key)

LLAMA_MODEL = "llama-3.3-70b-versatile"

# Pydantic models for schema-driven JSON
class VisualSummarySection(BaseModel):
    title: str
    text: str
    imageUrl: str = ""
    audioUrl: str = ""

class VisualSummary(BaseModel):
    type: str
    title: str
    sections: List[VisualSummarySection]

def llama_chat_completion(messages, temperature=1, max_tokens=1024):
    # Ensure at least one message contains "json"
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

def generate_image_prompt(section_content):
    """Use Llama to generate a tailored image prompt"""
    prompt = f"""
    Create a detailed and creative prompt for an image generation model to produce an illustration that complements 
    the following textbook section content: "{section_content}". 
    The prompt should:
    - Encourage a vivid, artistic, or symbolic depiction (e.g., capturing mood, themes, or key moments),
    - Avoid any text or numbers in the image,
    - Be specific enough to inspire a unique visual that enhances the narrative,
    - Be concise (1-2 sentences).
    Return your response as a JSON object: {{"prompt": "<your prompt here>"}}.
    """
    try:
        messages = [{"role": "user", "content": prompt}]
        result = llama_chat_completion(messages, temperature=1, max_tokens=128)
        prompt_json = json.loads(result)
        return prompt_json.get("prompt", "").strip()
    except Exception as e:
        print(f"Error generating image prompt: {e}")
        return f"Create a vivid illustration capturing the mood and themes of '{section_content}' without replicating the text."

def generate_image(section_content):
    # Llama does not generate images; return a placeholder or empty string
    print(f"Simulating image generation for section content: {section_content}")
    # Optionally, generate an image prompt for future use
    image_prompt = generate_image_prompt(section_content)
    print(f"Generated image prompt: {image_prompt}")
    # Return None or a placeholder path
    return None

def generate_image_hidream(prompt, image_path, hf_api_key):
    """Generate image using HuggingFace HiDream model via fal-ai provider and save to image_path."""
    try:
        client = InferenceClient(
            provider="fal-ai",
            api_key=hf_api_key,
        )
        image = client.text_to_image(
            prompt,
            model="HiDream-ai/HiDream-I1-Fast",
            # Portrait ratio for YouTube Shorts (9:16)
            width=576,
            height=1024,
        )
        image.save(image_path)
        return True
    except Exception as e:
        print(f"Error generating image from HiDream: {e}")
        return False

def upload_to_cloudinary(image_path):
    # Cloudinary removed; function is now a stub
    return None

def slugify(text):
    # Simple slugify: lowercase, replace spaces with _, remove non-alphanum
    return re.sub(r'[^a-zA-Z0-9_]', '', text.lower().replace(' ', '_'))

def generate_visual_summary_json(topic, rag) -> VisualSummary:
    print('Received:', topic, rag)
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
        summary = VisualSummary.model_validate_json(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Error validating JSON: {e}")
        summary = VisualSummary(type="summary", title=f"Error generating visual summary for {topic}", sections=[])
    print("Generated visual summary:", summary)

    # Ensure images directory exists
    images_dir = pathlib.Path("images")
    images_dir.mkdir(exist_ok=True)

    # Unique tag for this visual summary
    timestamp = int(time.time())
    topic_slug = slugify(topic)
    unique_tag = f"{topic_slug}_{timestamp}"

    hf_api_key = os.getenv("HF_API_KEY")

    # For each section, generate image and set imageUrl
    for idx, section in enumerate(summary.sections):
        image_filename = f"{unique_tag}_section_{idx+1}.png"
        image_path = images_dir / image_filename
        # Generate image prompt for this section
        image_prompt = generate_image_prompt(section.text)
        # Generate image using HiDream
        if hf_api_key:
            success = generate_image_hidream(image_prompt, image_path, hf_api_key)
            sleep(5)
            if not success:
                # If image generation fails, create an empty placeholder
                with open(image_path, "wb") as f:
                    f.write(b"")
        else:
            # If no API key, create an empty placeholder
            with open(image_path, "wb") as f:
                f.write(b"")
        section.imageUrl = f"{image_filename}"
        section.audioUrl = ""  # Ensure audioUrl is blank

    with open('visual_summary.json', 'w') as f:
        f.write(summary.model_dump_json(indent=4))
    return summary

if __name__ == "__main__":
    generate_visual_summary_json(
        "Growing bajra in farm , india, madhya pradesh",
        """How to grow bajra in farm?"""
    )