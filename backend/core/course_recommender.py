# backend/core/course_recommender.py

import os
import sqlite3
import json
from typing import List, Dict, Any
from functools import lru_cache

import numpy as np
import faiss
import requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer

# --- 1. CONFIGURATION ---
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_ROOT, "gramudyogai.db")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
VECTOR_DIM = 384
HTTP_TIMEOUT = 15

# --- 2. EFFICIENT IN-MEMORY FAISS INDEX MANAGEMENT ---
def build_faiss_index_in_memory():
    """Builds the FAISS index directly in memory from the database."""
    print("Building FAISS index in memory from gramudyogai.db...")
    if not os.path.exists(DB_PATH):
        print(f"FATAL ERROR: Database not found at {DB_PATH}. Cannot build index.")
        return None

    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            # Updated to use the new courses table
            courses = conn.execute("SELECT id, name, description FROM courses").fetchall()
            if not courses:
                print("Warning: 'courses' table is empty. Search will not find any local courses.")
                return faiss.IndexIDMap(faiss.IndexFlatIP(VECTOR_DIM))
            
            print(f"Generating embeddings for {len(courses)} courses...")
            course_texts = [f"Course: {c['name']}. Description: {c['description'] or c['name']}" for c in courses]
            embeddings = embedding_model.encode(course_texts, normalize_embeddings=True, show_progress_bar=True)

            index = faiss.IndexIDMap(faiss.IndexFlatIP(VECTOR_DIM))
            ids = np.array([c['id'] for c in courses], dtype=np.int64)
            embeddings_np = np.array(embeddings, dtype="float32")
            if embeddings_np.shape[0] != ids.shape[0]:
                print(f"Error: Number of embeddings ({embeddings_np.shape[0]}) does not match number of ids ({ids.shape[0]}).")
                return None
            index.add_with_ids(embeddings_np, ids)

            print(f"In-memory FAISS index built successfully with {index.ntotal} courses.")
            return index
    except Exception as e:
        print(f"Database error during index build: {e}")
        return None

faiss_index = build_faiss_index_in_memory()

# --- 3. ADVANCED MULTI-QUERY RETRIEVAL ---
def generate_search_queries(user_query: str) -> List[str]:
    """Uses an LLM to generate multiple diverse search queries from the user's initial query."""
    if not GROQ_API_KEY:
        return [user_query] # Fallback to the original query if no key

    prompt = f"""
    You are an expert search query generator. A user has entered the following query: "{user_query}".
    Your task is to generate 3 diverse, high-quality search queries that capture different facets of the user's intent.
    The queries should be phrased as statements describing a relevant course.

    Example:
    User Query: "Tailoring"
    Generated Queries:
    [
        "A vocational training course on sewing, dressmaking, and garment construction.",
        "A business course on how to start and manage a successful home-based tailoring enterprise.",
        "An advanced fashion design course covering pattern making and modern tailoring techniques."
    ]

    Now, generate the queries for the user query "{user_query}".
    Respond ONLY with a valid JSON array of strings. Do not include any other text.
    """
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5,
                "response_format": {"type": "json_object"}
            }
        )
        response.raise_for_status()
        # The response should be a JSON object containing a key like "queries" or similar
        generated_json = json.loads(response.json()['choices'][0]['message']['content'])
        # Extract the list of queries, assuming the key is 'Generated Queries' or similar
        queries = generated_json.get("Generated Queries", [user_query])
        return [user_query] + queries # Include the original query for good measure
    except Exception as e:
        print(f"LLM query generation failed: {e}")
        return [user_query] # Fallback to original query on error


def retrieve_platform_courses(query: str, db: sqlite3.Connection, top_k: int = 5) -> List[Dict]:
    """Retrieves relevant courses from the local database using the multi-query strategy."""
    if not faiss_index or faiss_index.ntotal == 0: return []
    
    # Generate multiple queries to get a wider, more relevant set of results
    search_queries = generate_search_queries(query)
    print(f"Generated search queries: {search_queries}")
    
    all_retrieved_ids = set()

    for q in search_queries:
        try:
            query_embedding = embedding_model.encode(q, normalize_embeddings=True).astype("float32").reshape(1, -1)
            _, ids = faiss_index.search(query_embedding, top_k)
            for id in ids[0]:
                if id != -1:
                    all_retrieved_ids.add(int(id))
        except Exception as e:
            print(f"Error during FAISS search for query '{q}': {e}")
            continue

    if not all_retrieved_ids: return []
    
    placeholders = ",".join("?" for _ in all_retrieved_ids)
    rows = db.execute(f"SELECT title, content_url as url FROM csr_courses WHERE id IN ({placeholders})", list(all_retrieved_ids)).fetchall()
    return [dict(row) for row in rows]

# --- 4. WEB SCRAPING & LLM GENERATION (Unchanged) ---
@lru_cache(maxsize=32)
def scrape_website(url: str, parser: callable) -> List[Dict]:
    try:
        response = requests.get(url, timeout=HTTP_TIMEOUT, headers={"User-Agent": "GramUdyogAI/1.0"})
        response.raise_for_status()
        return parser(response.text)
    except requests.RequestException as e:
        print(f"Web scraping failed for {url}: {e}")
        return []

def parse_swayam(html: str) -> List[Dict]:
    soup = BeautifulSoup(html, "html.parser")
    return [{"title": el.get_text(strip=True), "url": f"https://swayam.gov.in{el.find_parent('a')['href']}"} for el in soup.select("h3.course-title")[:3]]

def retrieve_live_courses(query: str, count: int) -> List[Dict]:
    if count <= 0: return []
    url = f"https://swayam.gov.in/explorer?searchText={query}"
    live_courses = scrape_website(url, parse_swayam)
    return live_courses[:count]

def generate_structured_recommendations(user_query: str, context: Dict) -> Dict[str, Any]:
    if not GROQ_API_KEY:
        return {"error": "LLM service is not configured."}

    prompt = f"""
    Analyze the user's query and the provided course context. Your task is to act as a recommendation engine.
    User Query: "{user_query}"
    Course Context: {json.dumps(context, indent=2)}
    Based on the context, generate a JSON object that strictly follows this schema:
    {{
      "introduction": "string (A short, friendly, and encouraging introductory sentence for the user about their query.)",
      "recommendations": [
        {{
          "course_title": "string",
          "reason": "string (A concise explanation of why this course is a great fit for the user's query.)",
          "type": "string ('Platform Course' or 'Live Course')",
          "url": "string (The exact URL for this course from the context)"
        }}
      ]
    }}
    Select up to 3 of the most relevant courses from the context to create the recommendations array.
    Your entire response MUST be only the valid JSON object. Do not include any other text, markdown formatting, or explanations.
    """
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }
        )
        response.raise_for_status()
        return json.loads(response.json()['choices'][0]['message']['content'])
    except (requests.RequestException, json.JSONDecodeError, KeyError) as e:
        print(f"Error in recommendation generation: {e}")
        return {"error": "Could not generate AI recommendations at this time."}
