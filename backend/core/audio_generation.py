import io
import json
import requests
import os
import pathlib
import hashlib
from typing import Optional
import numpy as np
from scipy.io.wavfile import write as scipy_wav_write
from dotenv import load_dotenv, find_dotenv

# Load environment variables
load_dotenv(find_dotenv())

class TextToSpeech:
    def __init__(self):
        self.url = "https://infer.e2enetworks.net/project/p-5485/v1/indic_tts/infer"
        self.default_sampling_rate = 22050
        self.token = os.getenv("E2E_TIR_ACCESS_TOKEN")
        
        if not self.token:
            raise ValueError("E2E_TIR_ACCESS_TOKEN environment variable not set")
        
        # Ensure base audio directory exists
        self.base_audio_dir = pathlib.Path("audio")
        self.base_audio_dir.mkdir(exist_ok=True)

    def get_audio_path(self, text_hash: str, language: str) -> str:
        """Get path for audio file, creating language subfolder if needed"""
        audio_dir = self.base_audio_dir / language
        audio_dir.mkdir(parents=True, exist_ok=True)
        return str(audio_dir / f"{text_hash}.wav")
        
    def audio_exists(self, text_hash: str, language: str) -> bool:
        """Check if audio file already exists"""
        audio_path = self.get_audio_path(text_hash, language)
        return os.path.exists(audio_path)

    def _create_payload(self, text: str, speaker: str = "male", language: str = "en") -> dict:
        return {
            "inputs": [
                {
                    "name": "INPUT_TEXT",
                    "shape": [1],
                    "datatype": "BYTES",
                    "data": [text]
                },
                {
                    "name": "INPUT_SPEAKER_ID",
                    "shape": [1],
                    "datatype": "BYTES",
                    "data": [speaker]
                },
                {
                    "name": "INPUT_LANGUAGE_ID",
                    "shape": [1],
                    "datatype": "BYTES",
                    "data": [language]
                }
            ]
        }

    def _get_headers(self) -> dict:
        return {
            'authorization': f'Bearer {self.token}',
            'content-type': 'application/json'
        }

    def generate_audio(self, text: str, output_path: Optional[str] = None, 
                      speaker: str = "male", language: str = "en") -> Optional[bytes]:
        """Generate audio from text and optionally save to file"""
        print(f"\n=== Generating Audio ===")
        print(f"Text: {text[:100]}...")
        print(f"Language: {language}")
        print(f"Speaker: {speaker}")
        print(f"Output path: {output_path}")
        
        try:
            # Create hash and setup paths
            text_hash = hashlib.md5(text.encode()).hexdigest()
            print(f"Generated hash: {text_hash}")
            
            if not output_path:
                output_path = self.get_audio_path(text_hash, language)
                print(f"Using default output path: {output_path}")
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
            # Check if audio already exists
            if os.path.exists(output_path):
                print(f"Audio already exists at {output_path}")
                with open(output_path, 'rb') as f:
                    return None  # File exists, no need to return bytes
            
            # Generate audio
            payload = json.dumps(self._create_payload(text, speaker, language))
            print("\nSending request to TTS API...")
            response = requests.post(self.url, headers=self._get_headers(), data=payload)
            
            if response.status_code != 200:
                error_msg = f"API request failed with status {response.status_code}: {response.text}"
                print(error_msg)
                raise Exception(error_msg)

            print("Processing API response...")
            audio_arr = json.loads(response.text)["outputs"][0]["data"]
            raw_audio = np.array(audio_arr, dtype=np.float32)
            
            # Save to file
            print(f"Saving audio to {output_path}")
            scipy_wav_write(output_path, self.default_sampling_rate, raw_audio)
            return None  # File saved successfully

        except Exception as e:
            print(f"Error generating audio: {str(e)}")
            raise  # Re-raise the exception to be handled by the route

# Usage example
if __name__ == "__main__":
    tts = TextToSpeech()
    tts.generate_audio(
        "The model will produce a response according to the parameters configured.",
        "audio.wav"
    )