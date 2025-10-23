import os
import random
import time
import requests
import json
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv, find_dotenv

from google import genai
from google.genai import types
from google.genai.errors import APIError 

# Load environment variables from the root .env file
load_dotenv(find_dotenv())

app = Flask(__name__)
CORS(app) 

# --- CONFIGURATION ---

NEWS_API_KEY_NEWSAPI = os.getenv("NEWS_API_KEY_NEWSAPI")
NEWS_API_KEY_NEWSDATA = os.getenv("NEW_API_KEY_NEWSDATA")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

ANALYSIS_DELAY_SECONDS = 3 # Increased delay between articles
MAX_RETRIES = 3 # Max attempts for a single analysis
INITIAL_BACKOFF_SECONDS = 5 # Initial wait for 503 error

ACTIVE_NEWS_SERVICE = 'newsapi' 

NEWSAPI_ENDPOINT = "https://newsapi.org/v2/top-headlines" 
NEWSDATA_ENDPOINT = "https://newsdata.io/api/1/latest" 

# Initialize Gemini Client
client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        print("Gemini client initialized successfully.")
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
else:
    print("WARNING: GEMINI_API_KEY not found. Real-time analysis is disabled.")


# ----------------------------------------------------------------------
# --- REAL FACT-CHECKING LOGIC using GEMINI (WITH ROBUST RETRY) ---
# ----------------------------------------------------------------------

def analyze_text_for_fake_news(text):
    """
    Uses the Gemini API with web search, implementing robust exponential backoff 
    for retries to handle 503 UNAVAILABLE errors.
    """
    if not client:
        return {
             "verdict": "mixed",
             "confidence": 0.5,
             "summary": "Error: Real-time analysis failed. Gemini API Key is missing or invalid.",
             "evidence": [],
             "txHash": "",
             "ipfsCid": ""
         }
         
    # Check for empty/short or known error text from the scraper
    if not text or len(text) < 50 or text.startswith("Error: Could not extract"):
         # Return a summary specific to the lack of content
         summary_text = "Insufficient text provided for comprehensive analysis."
         if text.startswith("Error: Could not extract"):
             summary_text = "Analysis failed: Could not scrape meaningful content from the provided URL."

         return {
            "verdict": "mixed",
            "confidence": 0.5,
            "summary": summary_text,
            "evidence": [],
            "txHash": "",
            "ipfsCid": ""
        }

    # Generate mock blockchain data outside the retry loop
    tx_hash = f"0x{random.getrandbits(256):064x}"
    ipfs_cid = f"Qm{random.getrandbits(16):x}b20399d82a17f22384a6217462a69074b1"
    
    prompt = f"""
    You are an expert, unbiased AI fact-checker. Your task is to analyze the following article text for factual accuracy by using your access to Google Search.

    Output your response STRICTLY as a single JSON object. DO NOT include any text, markdown, or commentary outside of the JSON object.

    The JSON object MUST contain the following structure:
    {{
        "verdict": "string ('true', 'false', or 'mixed')",
        "confidence": "number (float from 0.0 to 1.0)",
        "summary": "string (A brief explanation of the analysis.)",
        "evidence": [
            {{
                "id": "string",
                "source": "string (Name of the external source found via search.)",
                "link": "string (URL of the external source.)",
                "content": "string (The specific claim or fact checked from the article.)",
                "credibility": "number (Source credibility score from 0.0 to 1.0.)",
                "supportVerdict": "string ('supporting', 'contradictory', or 'neutral' relative to the article's claim.)",
                "description": "string (Detailed finding about the evidence.)"
            }},
        ],
        "txHash": "{tx_hash}",
        "ipfsCid": "{ipfs_cid}"
    }}

    Article Text to Analyze:
    ---
    {text}
    ---
    """
    
    # --- RETRY LOOP IMPLEMENTATION ---
    for attempt in range(MAX_RETRIES):
        try:
            # 2. Call the Gemini API
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[{"google_search": {}}]
                )
            )
            
            # CRITICAL CHECK: Ensure response text is not None
            if response.text is None:
                raise Exception("Gemini API returned an empty text response (None).")

            # 3. Successful path: Parse and return result
            raw_text = response.text.strip()
            
            # Clean up JSON formatting
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
                
            analysis_result = json.loads(raw_text.strip())

            # Final type coercion and validation
            analysis_result['confidence'] = float(analysis_result.get('confidence', 0.5))
            
            evidence_list = analysis_result.get('evidence', [])
            for ev in evidence_list:
                 try:
                     ev['credibility'] = float(ev.get('credibility', 0.5))
                 except ValueError:
                     ev['credibility'] = 0.5 
                     
            if 'txHash' not in analysis_result:
                analysis_result['txHash'] = tx_hash
            if 'ipfsCid' not in analysis_result:
                analysis_result['ipfsCid'] = ipfs_cid

            return analysis_result # Successful exit

        except APIError as e:
            # Handle API errors with retry logic
            if '503' in str(e) or 'overloaded' in str(e) and attempt < MAX_RETRIES - 1:
                wait_time = INITIAL_BACKOFF_SECONDS * (2 ** attempt) + random.uniform(0, 1)
                print(f"API 503 Error (Attempt {attempt + 1}/{MAX_RETRIES}). Retrying analysis in {wait_time:.2f} seconds...")
                time.sleep(wait_time)
                continue
            else:
                # Handle non-retryable errors or failure after max retries
                error_summary = f"Real-time analysis failed permanently after {attempt + 1} attempts: {e}"
                return {
                    "verdict": "mixed", "confidence": 0.3, "summary": error_summary,
                    "evidence": [], "txHash": "", "ipfsCid": ""
                }
        except json.JSONDecodeError:
            print(f"JSON Parsing Error: Model failed to return valid JSON.")
            return {
                "verdict": "mixed", "confidence": 0.4, "summary": "Analysis failed: The AI did not return a valid JSON format.",
                "evidence": [], "txHash": "", "ipfsCid": ""
            }
        except Exception as e:
            # Catch the explicit exception raised when response.text is None
            print(f"An unexpected error occurred during analysis: {e}")
            return {
                "verdict": "mixed", "confidence": 0.3, "summary": f"An unexpected error occurred during analysis: {e}",
                "evidence": [], "txHash": "", "ipfsCid": ""
            }
    
    # Fallback if loop finishes (all retries failed)
    return {
        "verdict": "mixed", "confidence": 0.3, "summary": f"Real-time analysis failed after {MAX_RETRIES} attempts due to persistent server unavailability.",
        "evidence": [], "txHash": "", "ipfsCid": ""
    }


# ----------------------------------------------------------------------
# --- UTILITY: WEB SCRAPING (Resilient to empty pages) ---
# ----------------------------------------------------------------------

def extract_article_text_from_url(url):
    """
    Fetches a URL and extracts the main article text. Returns an error message 
    string if extraction fails, ensuring the calling function always receives 
    a string, not None.
    """
    try:
        headers = {'User-Agent': 'FakeNewsDetector/1.0'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status() 

        soup = BeautifulSoup(response.content, 'html.parser')
        article_content = soup.find('article') or soup.find(id='content') or soup.body
        
        target = article_content if article_content else soup
        text_elements = target.find_all('p')
        article_text = ' '.join([elem.get_text() for elem in text_elements if elem.get_text().strip()])
        article_text = ' '.join(article_text.split())[:15000]

        # CRITICAL RESILIENCE FIX: Return error message string if text is empty
        if not article_text:
            return "Error: Could not extract meaningful text from the URL.", True # True means fetching was technically successful
        
        return article_text, True

    except requests.RequestException as e:
        return f"Error fetching URL: {e}. Check if the link is correct or the site blocks scraping.", False
    except Exception as e:
        return f"An unexpected error occurred during scraping: {e}", False


# ----------------------------------------------------------------------
# --- API ENDPOINTS ---
# ----------------------------------------------------------------------

@app.route('/api/analyze', methods=['POST'])
def analyze_input():
    """ENDPOINT 1: Analyzes user-pasted text or URL using Gemini."""
    data = request.get_json()
    input_value = data.get('input_value', '').strip()
    input_type = data.get('input_type') 

    if not input_value:
        return jsonify({"error": "No text or URL provided."}), 400

    article_text = input_value

    if input_type == 'url':
        article_text, success = extract_article_text_from_url(input_value)
        # Note: If not success, article_text contains the error message, but we proceed 
        # to analyze_text_for_fake_news to give a structured JSON error response.
    
    elif input_type != 'text':
        return jsonify({"error": "Invalid input_type. Must be 'text' or 'url'."}), 400

    # analyze_text_for_fake_news handles cases where article_text is short or an error message
    analysis_result = analyze_text_for_fake_news(article_text)
    
    return jsonify(analysis_result)


@app.route('/api/daily-news', methods=['GET'])
def get_daily_news():
    """ENDPOINT 2: Fetches and analyzes fresh headlines using Gemini."""

    if ACTIVE_NEWS_SERVICE == 'newsapi':
        api_url = NEWSAPI_ENDPOINT
        api_key = NEWS_API_KEY_NEWSAPI
        params = {
            'country': 'us',
            'category': 'general',
            'pageSize': 5,
            'apiKey': api_key
        }
        content_key = 'content'
    elif ACTIVE_NEWS_SERVICE == 'newsdata':
        api_url = NEWSDATA_ENDPOINT
        api_key = NEWS_API_KEY_NEWSDATA
        params = {
            'country': 'us',
            'language': 'en',
            'size': 5,
            'apikey': api_key
        }
        content_key = 'content' 
    else:
        return jsonify({"error": "Invalid ACTIVE_NEWS_SERVICE configuration."}), 500
    
    if not api_key:
        return jsonify({"error": f"API Key for {ACTIVE_NEWS_SERVICE} is missing. Check your .env file."}), 500

    try:
        response = requests.get(api_url, params=params, timeout=10)
        response.raise_for_status() 
        news_data = response.json()
        
        articles_list = news_data.get('articles', []) if ACTIVE_NEWS_SERVICE == 'newsapi' else news_data.get('results', [])
        
        processed_articles = []
        
        for article in articles_list:
            title = article.get('title', 'No Title')
            url = article.get('url', '#')
            content = article.get(content_key) or article.get('description') or title
            
            # --- CRITICAL FIX: Implement rate limiting between articles ---
            if processed_articles:
                print(f"Pausing for {ANALYSIS_DELAY_SECONDS} seconds between headlines...")
                time.sleep(ANALYSIS_DELAY_SECONDS) 
            # --------------------------------------------------------------------------
            
            analysis = analyze_text_for_fake_news(content)
            
            if ACTIVE_NEWS_SERVICE == 'newsapi':
                source_name = article.get('source', {}).get('name', 'N/A')
            else:
                source_name = article.get('source_id', 'N/A')

            processed_articles.append({
                "title": title,
                "url": url,
                "source": source_name,
                "verdict": analysis['verdict'],
                "confidence": analysis['confidence'],
                "summary": analysis['summary']
            })

        return jsonify(processed_articles)

    except requests.RequestException as e:
        return jsonify({"error": f"Failed to connect to News API ({ACTIVE_NEWS_SERVICE}): {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred during news processing: {e}"}), 500


if __name__ == '__main__':
    print("Starting Flask server with Gemini Real-Time Fact-Checking...")
    app.run(debug=True, host='127.0.0.1', port=5000)