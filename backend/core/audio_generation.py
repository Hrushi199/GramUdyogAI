from transformers import AutoModel
import numpy as np
import soundfile as sf
import os
from dotenv import load_dotenv, find_dotenv
# Option 1: Set your token here or via environment variable
os.environ.pop("HF_API_KEY", None)
load_dotenv(find_dotenv())
HF_TOKEN = os.getenv("HF_API_KEY")
print(f"Using HF_TOKEN:, {HF_TOKEN}")
# Load IndicF5 from Hugging Face
repo_id = "ai4bharat/IndicF5"
from huggingface_hub import login
login(token = HF_TOKEN)

model = AutoModel.from_pretrained(repo_id, trust_remote_code=True)
# Example usage: Generate speech
def generate_speech(text, ref_audio_path, ref_text, output_path):
    audio = model(
        text,
        ref_audio_path=ref_audio_path,
        ref_text=ref_text,
    )
    # Normalize and save output
    if audio.dtype == np.int16:
        audio = audio.astype(np.float32) / 32768.0
    sf.write(output_path, np.array(audio, dtype=np.float32), samplerate=24000)
    print(f"Audio saved successfully to {output_path}.")

if __name__ == "__main__":
    generate_speech(
        "नमस्ते! संगीत की तरह जीवन भी खूबसूरत होता है, बस इसे सही ताल में जीना आना चाहिए.",
        "../audio_example/PAN_F_HAPPY_00001.wav",
        "ਭਹੰਪੀ ਵਿੱਚ ਸਮਾਰਕਾਂ ਦੇ ਭਵਨ ਨਿਰਮਾਣ ਕਲਾ ਦੇ ਵੇਰਵੇ ਗੁੰਝਲਦਾਰ ਅਤੇ ਹੈਰਾਨ ਕਰਨ ਵਾਲੇ ਹਨ, ਜੋ ਮੈਨੂੰ ਖੁਸ਼ ਕਰਦੇ  ਹਨ।",
        "namaste.wav"
    )
