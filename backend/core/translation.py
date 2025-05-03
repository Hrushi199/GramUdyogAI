from groq import Groq
import os
from dotenv import load_dotenv, find_dotenv
import json
import time
os.environ.pop("GROQ_API_KEY", None)
load_dotenv(find_dotenv())
api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key)

LLAMA_MODEL = "llama-3.3-70b-versatile"

def llama_chat_completion(messages, temperature=1, max_tokens=1500):
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

def llama_translate_string(text, target_language):
    """
    Translate a single string using Groq LLM.
    Returns the translated string from a JSON object like {"translation": "..."}
    """
    prompt = (
        f"You are a translation assistant. Translate the following string to {target_language}. "
        "Return your answer as a JSON object with a single key 'translation'.\n"
        f"String to translate:\n{json.dumps(text, ensure_ascii=False)}"
    )
    messages = [{"role": "user", "content": prompt}]
    result = llama_chat_completion(messages, temperature=0.7, max_tokens=256)
    try:
        loaded = json.loads(result)
        if isinstance(loaded, dict) and "translation" in loaded:
            return loaded["translation"]
        return str(loaded)
    except Exception:
        return result if isinstance(result, str) else str(result)

def translate_json(json_data, target_language, sleep_gap=0.7):
    """
    Recursively translate all string values in a JSON object or list to the target language.
    Skips fields like 'imageUrl' and 'audioUrl'.
    - If dict: translate all string values, recurse for dict/list values.
    - If list: recurse for each item.
    - If string: translate.
    - If other: return as is.
    """
    SKIP_KEYS = {"imageUrl", "audioUrl"}

    # If input is a string, parse it
    if isinstance(json_data, str):
        try:
            json_obj = json.loads(json_data)
        except Exception:
            json_obj = json_data
    else:
        json_obj = json_data

    # If it's a dict, translate each value
    if isinstance(json_obj, dict):
        result = {}
        for k, v in json_obj.items():
            if k in SKIP_KEYS:
                result[k] = v
            elif isinstance(v, str):
                result[k] = llama_translate_string(v, target_language)
                time.sleep(sleep_gap)
            elif isinstance(v, list):
                # Translate each string in the list, recurse for dicts/lists
                new_list = []
                for item in v:
                    if isinstance(item, str):
                        new_list.append(llama_translate_string(item, target_language))
                        time.sleep(sleep_gap)
                    elif isinstance(item, (dict, list)):
                        new_list.append(translate_json(item, target_language, sleep_gap=sleep_gap))
                    else:
                        new_list.append(item)
                result[k] = new_list
            elif isinstance(v, dict):
                result[k] = translate_json(v, target_language, sleep_gap=sleep_gap)
            else:
                result[k] = v
        return result

    # If it's a list, translate each item
    if isinstance(json_obj, list):
        new_list = []
        for item in json_obj:
            if isinstance(item, str):
                new_list.append(llama_translate_string(item, target_language))
                time.sleep(sleep_gap)
            elif isinstance(item, (dict, list)):
                new_list.append(translate_json(item, target_language, sleep_gap=sleep_gap))
            else:
                new_list.append(item)
        return new_list

    # If it's a string, translate
    if isinstance(json_obj, str):
        return llama_translate_string(json_obj, target_language)

    # For other types, return as is
    return json_obj