from groq import Groq
import os
from dotenv import load_dotenv, find_dotenv
import json
import time
# os.environ.pop("GROQ_API_KEY", None)
# load_dotenv(find_dotenv())
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
    # If text is too long, truncate it to prevent token limit issues
    if len(text) > 500:
        text = text[:500] + "..."
    
    try:
        # First attempt: JSON format
        prompt = (
            f"You are a translation assistant. Translate the following string to {target_language}. "
            "Return your answer as a JSON object with a single key 'translation'.\n"
            f"String to translate:\n{json.dumps(text, ensure_ascii=False)}"
        )
        messages = [{"role": "user", "content": prompt}]
        result = llama_chat_completion(messages, temperature=0.7, max_tokens=512)
        loaded = json.loads(result)
        if isinstance(loaded, dict) and "translation" in loaded:
            return loaded["translation"]
        return str(loaded)
    except Exception as e:
        print(f"JSON translation error: {e}")
        
        # Fallback: Simple translation without JSON format
        try:
            simple_prompt = f"Translate this text to {target_language}: {text}"
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": simple_prompt}],
                temperature=0.7,
                max_tokens=512,
            )
            return response.choices[0].message.content.strip()
        except Exception as e2:
            print(f"Simple translation error: {e2}")
            # Final fallback: return original text
            return text

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

def translate_text_safely(text, target_language, max_length=500):
    """
    Safely translate text by splitting into smaller chunks if needed
    """
    if not text or not isinstance(text, str) or len(text.strip()) == 0:
        return text
    
    # If text is short enough, translate directly
    if len(text) <= max_length:
        return llama_translate_string(text, target_language)
    
    # Split by sentences to maintain grammar
    sentences = text.split('. ')
    translated_sentences = []
    current_chunk = ""
    
    for i, sentence in enumerate(sentences):
        # Add the sentence to current chunk
        test_chunk = current_chunk + (". " if current_chunk else "") + sentence
        
        # If adding this sentence would exceed limit, translate current chunk
        if len(test_chunk) > max_length and current_chunk:
            translated_sentences.append(llama_translate_string(current_chunk, target_language))
            time.sleep(0.3)  # Small delay
            current_chunk = sentence
        else:
            current_chunk = test_chunk
    
    # Translate the remaining chunk
    if current_chunk:
        translated_sentences.append(llama_translate_string(current_chunk, target_language))
    
    return ". ".join(translated_sentences)

def translate_structured_data_safely(structured_data, target_language):
    """
    Safely translate structured data by processing each field separately to avoid token limits
    """
    if not structured_data or not isinstance(structured_data, dict):
        return structured_data
    
    result = {}
    
    for key, value in structured_data.items():
        if key in ['search_query', 'total_found']:
            # Don't translate these metadata fields
            result[key] = value
        elif isinstance(value, list):
            # Process each item in the list separately
            translated_items = []
            for item in value:
                if isinstance(item, dict):
                    # Translate each field of the item individually
                    translated_item = {}
                    for item_key, item_value in item.items():
                        if item_key in ['id', 'imageUrl', 'audioUrl', 'url', 'link']:
                            # Don't translate IDs, URLs, and links
                            translated_item[item_key] = item_value
                        elif isinstance(item_value, str) and len(item_value.strip()) > 0:
                            # Translate text fields safely
                            translated_item[item_key] = translate_text_safely(item_value, target_language)
                            time.sleep(0.3)  # Small delay to avoid rate limits
                        elif isinstance(item_value, list):
                            # Handle list fields (like eligibility criteria)
                            translated_list = []
                            for list_item in item_value:
                                if isinstance(list_item, str) and len(list_item.strip()) > 0:
                                    translated_list.append(translate_text_safely(list_item, target_language))
                                    time.sleep(0.2)
                                else:
                                    translated_list.append(list_item)
                            translated_item[item_key] = translated_list
                        else:
                            translated_item[item_key] = item_value
                    translated_items.append(translated_item)
                else:
                    translated_items.append(item)
            result[key] = translated_items
        else:
            result[key] = value
    
    return result

def generate_short_summary(items, user_info, item_type, target_language):
    """
    Generate a short summary specifically for non-English languages
    """
    if target_language == "en":
        max_words = 150
    else:
        max_words = 60  # Even shorter for other languages to avoid translation token limits
    
    # Limit the items we include in the summary
    summary_items = items[:2] if len(items) > 2 else items
    
    prompt = (
        f"You are an AI assistant. The user is looking for {item_type}. "
        f"User info: {user_info}\n"
        f"Here are {len(summary_items)} {item_type} options:\n"
    )
    
    # Add brief item info (just title and one key point)
    for i, item in enumerate(summary_items, 1):
        title = item.get('title', item.get('name', item.get('scheme_name', f'{item_type} {i}')))
        prompt += f"{i}. {title}\n"
    
    prompt += (
        f"\nWrite a brief, friendly summary (max {max_words} words) that will be spoken aloud. "
        f"Mention what you found and encourage the user to explore the options. "
        f"Keep it conversational and natural."
    )
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": f"You are a helpful assistant that provides brief summaries."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,  # Reduced token limit
            temperature=0.7
        )
        summary = response.choices[0].message.content.strip()
        
        # If target language is not English, translate the summary
        if target_language != "en":
            return translate_text_safely(summary, target_language, max_length=150)
        else:
            return summary
            
    except Exception as e:
        print(f"Summary generation error: {e}")
        fallback = f"Found {len(items)} {item_type} options that match your requirements."
        if target_language != "en":
            return translate_text_safely(fallback, target_language)
        return fallback