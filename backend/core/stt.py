import os
from groq import Groq
import tempfile
import json
from dotenv import load_dotenv, find_dotenv
# load_dotenv(find_dotenv())
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SUPPORTED_LANG_CODES = {
    "bengali": "bn",
    "marathi": "mr",
    "maltese": "mt",
    "spanish": "es",
    "macedonian": "mk",
    "galician": "gl",
    "turkmen": "tk",
    "norwegian nynorsk": "nn",
    "chinese": "zh",
    "lithuanian": "lt",
    "persian": "fa",
    "azerbaijani": "az",
    "kannada": "kn",
    "icelandic": "is",
    "albanian": "sq",
    "yoruba": "yo",
    "german": "de",
    "swedish": "sv",
    "shona": "sn",
    "lao": "lo",
    "assamese": "as",
    "korean": "ko",
    "catalan": "ca",
    "ukrainian": "uk",
    "swahili": "sw",
    "sinhala": "si",
    "tajik": "tg",
    "gujarati": "gu",
    "yiddish": "yi",
    "russian": "ru",
    "french": "fr",
    "polish": "pl",
    "thai": "th",
    "maori": "mi",
    "bosnian": "bs",
    "afrikaans": "af",
    "occitan": "oc",
    "greek": "el",
    "hungarian": "hu",
    "latin": "la",
    "slovak": "sk",
    "estonian": "et",
    "sanskrit": "sa",
    "burmese": "my",
    "hawaiian": "haw",
    "hebrew": "he",
    "uzbek": "uz",
    "hausa": "ha",
    "javanese": "jv",
    "arabic": "ar",
    "italian": "it",
    "danish": "da",
    "basque": "eu",
    "punjabi": "pa",
    "somali": "so",
    "amharic": "am",
    "pashto": "ps",
    "english": "en",
    "czech": "cs",
    "bulgarian": "bg",
    "faroese": "fo",
    "tibetan": "bo",
    "cantonese": "yue",
    "japanese": "ja",
    "portuguese": "pt",
    "romanian": "ro",
    "urdu": "ur",
    "croatian": "hr",
    "kazakh": "kk",
    "haitian creole": "ht",
    "tatar": "tt",
    "hindi": "hi",
    "serbian": "sr",
    "indonesian": "id",
    "norwegian": "no",
    "malayalam": "ml",
    "breton": "br",
    "armenian": "hy",
    "luxembourgish": "lb",
    "lingala": "ln",
    "vietnamese": "vi",
    "malay": "ms",
    "welsh": "cy",
    "latvian": "lv",
    "nepali": "ne",
    "mongolian": "mn",
    "khmer": "km",
    "georgian": "ka",
    "dutch": "nl",
    "tagalog": "tl",
    "malagasy": "mg",
    "tamil": "ta",
    "slovenian": "sl",
    "belarusian": "be",
    "sindhi": "sd",
    "bashkir": "ba",
    "sundanese": "su",
    "turkish": "tr",
    "finnish": "fi",
    "telugu": "te",
}

def normalize_language(lang: str) -> str:
    if not lang:
        return "en"
    lang = lang.strip().lower()
    # Direct code
    if lang in SUPPORTED_LANG_CODES.values():
        return lang
    # Direct name
    if lang in SUPPORTED_LANG_CODES:
        return SUPPORTED_LANG_CODES[lang]
    # Try to match by partial name
    for k, v in SUPPORTED_LANG_CODES.items():
        if lang in k:
            return v
    # Use LLM to guess closest supported language code
    prompt = (
        f"Given the user input language '{lang}', map it to one of these supported codes: {list(SUPPORTED_LANG_CODES.values())}. "
        f"Return only the best matching code as a string."
    )
    llm_response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that maps language names to supported language codes."},
            {"role": "user", "content": prompt}
        ]
    )
    code = llm_response.choices[0].message.content.strip().replace('"', '').replace("'", "")
    if code in SUPPORTED_LANG_CODES.values():
        return code
    return "en"

def transcribe_audio_and_extract_profile(audio_file, language="en"):
    # Save uploaded file to a temp file
    print('Received audio file for transcription')
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(audio_file.read())
        tmp_path = tmp.name
    print('Transcribing audio file:', tmp_path)
    # Transcribe using Groq Whisper
    print('Language code received: ', language)
    language_code = normalize_language(language)
    print('Mapped language code:', language_code)
    with open(tmp_path, "rb") as f:
        transcription = client.audio.transcriptions.create(
            file=(tmp_path, f.read()),
            model="whisper-large-v3",
            language=language_code,
            response_format="json",
            temperature=0.5
        )
    text = transcription.text
    print('Transcription result:', text)

    # Available options for mapping
    INDIAN_STATES = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
        "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
        "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
        "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
        "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ]
    LANGUAGES = [
        "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Urdu", "Kannada", 
        "Odia", "Malayalam", "Punjabi", "Assamese", "English", "Other"
    ]
    COMMON_SKILLS = [
        "Weaving", "Tailoring", "Embroidery", "Pottery", "Wood Carving", "Carpentry",
        "Farming", "Cooking", "Jewelry Making", "Teaching", "Computer Skills", "Other"
    ]
    JOB_TYPE_OPTIONS = [
        "Remote", "On-site", "Hybrid", "Part-time", "Full-time", "Contract", 
        "Self-employment", "Village-based", "District-based", "State-based", "Other"
    ]

    extract_prompt = (
        f"Extract the following fields from the user's spoken profile (transcript below):\n"
        f"- name\n- state\n- district\n"
        f"- skills (as a list, only from this list: {COMMON_SKILLS})\n"
        f"- customSkills (as a list, only if not in the above skills list)\n"
        f"- jobTypes (as a list, only from this list: {JOB_TYPE_OPTIONS})\n"
        f"- customJobTypes (as a list, only if not in the above jobTypes list)\n"
        f"- needMentor (true/false)\n"
        f"For 'state', only use one of these: {INDIAN_STATES}\n"
        f"For 'skills', only use from the provided skills list. Any other skills should go in 'customSkills'.\n"
        f"For 'jobTypes', only use from the provided job types list. Any other job types should go in 'customJobTypes'.\n"
        f"For 'language', only use from this list: {LANGUAGES}\n"
        f"Transcript:\n{text}\n"
        f"Return a JSON object with these fields in English. If a field is not mentioned, leave it empty or as an empty list."
    )
    llm_response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an assistant that extracts structured user profile information into english from a transcript and outputs valid JSON."},
            {"role": "user", "content": extract_prompt}
        ],
        response_format={"type": "json_object"}
    )
    try:
        profile_data = json.loads(llm_response.choices[0].message.content)
        print('Extracted profile data:', profile_data)
    except Exception as e:
        profile_data = {}
        print('Error parsing JSON:', e)
    # Clean up temp file
    os.remove(tmp_path)
    return profile_data
