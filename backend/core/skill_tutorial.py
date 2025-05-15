from typing import List
from pydantic import BaseModel
import json
from groq import Groq
import os
from dotenv import load_dotenv, find_dotenv
import pathlib
import time
import re
import requests
import base64
from PIL import Image
from time import sleep
from e2enetworks.cloud import tir
from core.audio_generation import TextToSpeech

# import torch
# import torchvision.transforms as transforms
# Load environment variables from the .env file
os.environ.pop("GROQ_API_KEY", None)
load_dotenv(find_dotenv())
api_key = os.getenv("GROQ_API_KEY")
e2e_token = os.getenv("E2E_TIR_ACCESS_TOKEN")
e2e_api_key = os.getenv("E2E_TIR_API_KEY")
e2e_project_id = os.getenv("E2E_TIR_PROJECT_ID")
e2e_team_id = os.getenv("E2E_TIR_TEAM_ID")

# Initialize e2e networks
if all([e2e_token, e2e_api_key, e2e_project_id, e2e_team_id]):
    tir.init()
    e2e_client = tir.ModelAPIClient()

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

# def display_images(tensor_image_data_list, image_path):
#     '''convert PyTorch Tensors to PIL Image'''
#     for tensor_data in tensor_image_data_list:
#         print(tensor_data)
#         tensor_image = torch.tensor(tensor_data.get("data"))  # initialise the tensor
#         pil_img = transforms.ToPILImage()(tensor_image)  # convert to PIL Image
#         # pil_img.show()
#         # to save the generated_images, uncomment the line below
#         pil_img.save(image_path)

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
    - Be concise (tags seperated by commas, danbooru style)
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

def generate_image_e2e(prompt, image_path):
    """Generate image using e2e networks API directly"""
    try:
        auth_token = e2e_token
        project_id = e2e_project_id
        
        url = f"https://infer.e2enetworks.net/project/p-{project_id}/v1/stable-diffusion-2-1/infer"
        
        payload = {
            "inputs": [
                {
                    "name": "prompt",
                    "shape": [1,1],
                    "datatype": "BYTES",
                    "data": [prompt]
                },
                {
                    "name": "height",
                    "shape": [1,1],
                    "datatype": "UINT16",
                    "data": [1024]  # Portrait for YouTube shorts
                },
                {
                    "name": "width",
                    "shape": [1,1],
                    "datatype": "UINT16", 
                    "data": [576]
                },
                {
                    "name": "num_inference_steps",
                    "shape": [1,1],
                    "datatype": "UINT16",
                    "data": [50]
                },
                {
                    "name": "guidance_scale",
                    "shape": [1,1],
                    "datatype": "FP32",
                    "data": [7.5]
                },
                {
                    "name": "guidance_rescale",
                    "shape": [1,1],
                    "datatype": "FP32",
                    "data": [0.7]
                }
            ]
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {auth_token}'
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            # Parse the JSON response
            response_data = response.json()
            
            # Extract base64 image data
            if 'outputs' in response_data and len(response_data['outputs']) > 0:
                image_data = response_data['outputs'][0]['data'][0]
                # Decode base64 and save image
                image_bytes = base64.b64decode(image_data)
                with open(image_path, 'wb') as f:
                    f.write(image_bytes)
                return True
            else:
                print("No image data in response")
                return False
        else:
            print(f"Error response: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"Error generating image from E2E: {e}")
        return False

def upload_to_cloudinary(image_path):
    # Cloudinary removed; function is now a stub
    return None

def slugify(text):
    # Simple slugify: lowercase, replace spaces with _, remove non-alphanum
    return re.sub(r'[^a-zA-Z0-9_]', '', text.lower().replace(' ', '_'))

tts = TextToSpeech()

def translate_text(text: str, target_language: str) -> str:
    """Translate text to target language"""
    try:
        # Use your translation API here
        # For now, we'll use a mock implementation
        if target_language == "en":
            return text
        response = requests.post(
            "http://127.0.0.1:8000/translate",  # Replace with your actual translation endpoint
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
    
    # First generate summary in English
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
        summary = VisualSummary.model_validate_json(chat_completion.choices[0].message.content)
        print(f"Initial Summary: {json.dumps(summary.model_dump(), indent=2)}")
        
        # If language is not English, translate the content
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
    
    # Create directories
    images_dir = pathlib.Path("images")
    audio_dir = pathlib.Path("audio")
    images_dir.mkdir(exist_ok=True)
    audio_dir.mkdir(exist_ok=True)
    print("Directories created/verified")

    # Process each section
    print("\n=== Processing Sections ===")
    for idx, section in enumerate(summary.sections):
        print(f"\n--- Processing Section {idx + 1} ---")
        
        # Generate image
        print("Generating Image...")
        image_filename = f"{unique_tag}_section_{idx+1}.png"
        image_path = images_dir / image_filename
        image_prompt = generate_image_prompt(section.text)
        print(f"Image Prompt: {image_prompt}")
        print(f"Image Path: {image_path}")
        
        success = generate_image_e2e(image_prompt, image_path)
        print(f"Image Generation {'Successful' if success else 'Failed'}")
        sleep(5)
        
        section.imageUrl = f"{image_filename}"
        print(f"Image URL set: {section.imageUrl}")

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
                    language=language  # Use the requested language
                )
                section.audioUrl = f"{audio_filename}"
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
        "Growing bajra in farm , india, madhya pradesh",
        """How to grow bajra in farm?"""
    )