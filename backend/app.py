import os
import random
import time
import requests
import json
import urllib.parse 
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv, find_dotenv
from datetime import datetime
from pymongo import MongoClient 

# --- HYBRID MODEL IMPORTS ---
import torch 
import numpy as np 
from transformers import AutoModelForSequenceClassification, AutoTokenizer, AutoConfig
from lime.lime_text import LimeTextExplainer
# ------------------------------------

from google import genai
from google.genai import types
from google.genai.errors import APIError 

# Load environment variables from the root .env file
load_dotenv(find_dotenv())

app = Flask(__name__)
# List all origins where your frontend might be running
ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",  # Common React dev server port
    "http://127.0.0.1:5001"   # The backend's own address
]

# Configure CORS to explicitly allow those origins for all resources
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}) 

# --- CONFIGURATION ---

NEWS_API_KEY_NEWSAPI = os.getenv("NEWS_API_KEY_NEWSAPI")
NEWS_API_KEY_NEWSDATA = os.getenv("NEW_API_KEY_NEWSDATA")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FACT_CHECK_API_KEY = os.getenv("FACT_CHECK_API_KEY")

ANALYSIS_DELAY_SECONDS = 3
MAX_RETRIES = 3
INITIAL_BACKOFF_SECONDS = 5

ACTIVE_NEWS_SERVICE = 'newsapi' 

NEWSAPI_ENDPOINT = "https://newsapi.org/v2/top-headlines" 
NEWSDATA_ENDPOINT = "https://newsdata.io/api/1/latest" 
FACT_CHECK_ENDPOINT = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

# DB Configuration
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")

# --- HYBRID MODEL REFERENCES ---
LOCAL_MODEL_PATH = r'C:\Users\DELL\Desktop\truthChain\backend\models\roberta_finetuned_final' 
GLOBAL_MODEL = None
GLOBAL_TOKENIZER = None

db_client = None
db = None

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

# --- Load Local Model (Fake News Classifier) ---
try:
    MODEL_WEIGHTS_FILE = 'model.safetensors' 
    MODEL_CONFIG_FILE = os.path.join(LOCAL_MODEL_PATH, 'config.json')

    if os.path.exists(os.path.join(LOCAL_MODEL_PATH, MODEL_WEIGHTS_FILE)):
        config = AutoConfig.from_pretrained(LOCAL_MODEL_PATH)
        GLOBAL_TOKENIZER = AutoTokenizer.from_pretrained(LOCAL_MODEL_PATH)
        
        GLOBAL_MODEL = AutoModelForSequenceClassification.from_pretrained(
            LOCAL_MODEL_PATH, 
            config=config,
            local_files_only=True
        )
        GLOBAL_MODEL.eval() 
        GLOBAL_MODEL.to(torch.device("cpu")) 
        print("Local RoBERTa model loaded successfully.")
    else:
        print(f"WARNING: Local model files not found at {LOCAL_MODEL_PATH}. Local prediction will use simulation.")
except Exception as e:
    print(f"FATAL ERROR loading local model: {e}. Local prediction will use simulation.")
    GLOBAL_MODEL = None 
# ---------------------------------------------

# --- Initialize MongoDB Client (As before) ---
if MONGO_URI and MONGO_DB_NAME:
    try:
        db_client = MongoClient(MONGO_URI)
        db = db_client[MONGO_DB_NAME]
        db.list_collection_names() 
        db.articles.create_index("url", unique=True)
        db.articles.create_index([("title", "text")])
        db.sources.create_index("domain", unique=True)
        print(f"MongoDB client initialized successfully. Connected to DB: {MONGO_DB_NAME}.")
    except Exception as e:
        print(f"Error initializing MongoDB client. Ensure the MongoDB server is running: {e}")
        db = None 
else:
    print("WARNING: MONGO_URI or MONGO_DB_NAME not found. Database logging is disabled.")
# ---------------------------------------------

# ----------------------------------------------------------------------
# --- HYBRID MODEL PREDICTION FUNCTIONS (UTILITIES) ---
# ----------------------------------------------------------------------

def predict_proba_for_lime(texts):
    global GLOBAL_MODEL, GLOBAL_TOKENIZER
    if GLOBAL_MODEL is None: return np.array([[0.5, 0.5]] * len(texts)) 

    try:
        inputs = GLOBAL_TOKENIZER(texts, return_tensors="pt", padding=True, truncation=True, max_length=512)
        
        with torch.no_grad(): outputs = GLOBAL_MODEL(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=1).cpu().numpy()
        return probabilities
        
    except Exception as e:
        print(f"LIME Prediction Runtime Error: {e}")
        return np.array([[0.5, 0.5]] * len(texts))


def predict_local_model_confidence(title, content, source_name):
    global GLOBAL_MODEL, GLOBAL_TOKENIZER

    if GLOBAL_MODEL is None:
        input_text = f"{title} {content[:1000]} {source_name}"
        if "revolutionary scientific breakthrough" in input_text.lower(): return 0.15, "false" 
        if "official report" in input_text.lower() and "government" in input_text.lower(): return 0.85, "true"
        return 0.6, "mixed"

    try:
        input_text = title + GLOBAL_TOKENIZER.sep_token + content
        probabilities = predict_proba_for_lime([input_text])[0]
        true_confidence = float(probabilities[1])
        
        if true_confidence > 0.7: verdict = "true"
        elif true_confidence < 0.3: verdict = "false"
        else: verdict = "mixed"

        return true_confidence, verdict
    except Exception:
        return 0.5, "mixed"


def predict_ai_generation_probability(text):
    text_len = len(text.split())
    if "in conclusion" in text.lower() and text_len > 300: return 0.85
    if text_len < 100: return 0.1 
    return 0.35 

# --- CLAIM EXTRACTION & FACT CHECKING ---

def extract_primary_claim(text):
    if not client: return None
    extraction_prompt = f"Analyze the following text and extract the single, most critical factual claim that would need external verification. Return ONLY the text of the claim, nothing else. Text: {text[:500]}"
    try:
        response = client.models.generate_content(model='gemini-2.5-flash', contents=extraction_prompt)
        return response.text.strip().replace('"', '')
    except Exception: return None

def check_google_fact_check(claim):
    if not claim or not FACT_CHECK_API_KEY: return "API_KEY_MISSING", 0.0
    params = {"query": claim, "key": FACT_CHECK_API_KEY, "languageCode": "en", "pageSize": 5}
    try:
        response = requests.get(FACT_CHECK_ENDPOINT, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        claims = data.get('claims', [])
        if not claims: return "NO_EXTERNAL_MATCH", 0.0
        false_count = 0
        true_count = 0
        for fact_claim in claims:
            rating = fact_claim.get('claimReview', [{}])[0].get('textualRating', '').lower()
            if 'false' in rating or 'lie' in rating or 'misleading' in rating: false_count += 1
            if 'true' in rating or 'correct' in rating or 'accurate' in rating: true_count += 1
        
        if false_count > true_count: return "CONTRADICTORY", 0.95
        if true_count > false_count: return "SUPPORTING", 0.95
        return "MIXED_EXTERNAL", 0.0
    except Exception: return "API_ERROR", 0.0

def get_external_domain_reputation(domain):
    try:
        parsed_uri = urllib.parse.urlparse(domain)
        clean_domain = parsed_uri.netloc or domain.split('/')[0]
    except: clean_domain = domain

    if not clean_domain or clean_domain in ['user-input-text', 'localhost', '#']: return 0.5, "LOCAL_OR_USER_INPUT"
    low_rep_keywords = ['blog', 'viral', 'news-update', 'free-info', 'spam-site']
    if any(kw in clean_domain.lower() for kw in low_rep_keywords): return 0.3, "LOW_REPUTATION_HEURISTIC"
    if "foxnews.com" in clean_domain or "cnn.com" in clean_domain or "nytimes.com" in clean_domain: return 0.75, "MAJOR_NEWS_BIAS_NOTED"
        
    return 0.9, "HIGH_REPUTATION_DEFAULT"

def analyze_text_for_fake_news(text, external_rep_score=0.5, external_rep_tag="N/A", fact_check_result=None, fact_check_confidence=0.0):
    if not client: return {"verdict": "mixed", "confidence": 0.5, "summary": "Error: Real-time analysis failed. Gemini API Key is missing or invalid.", "evidence": [], "txHash": "", "ipfsCid": ""}
    if not text or len(text) < 50 or text.startswith("Error: Could not extract"):
         summary_text = "Insufficient text provided for comprehensive analysis."
         if text.startswith("Error: Could not extract"): summary_text = "Analysis failed: Could not scrape meaningful content from the provided URL."
         return {"verdict": "mixed", "confidence": 0.5, "summary": summary_text, "evidence": [], "txHash": "", "ipfsCid": ""}

    if fact_check_confidence > 0.9:
        summary_text = f"External Fact Check API provided a definitive result: Claim is {fact_check_result.replace('ING', '')}. Further AI analysis was skipped. Verdict based on verified external sources."
        verdict_type = "false" if fact_check_result == "CONTRADICTORY" else "true"
        return {"verdict": verdict_type, "confidence": fact_check_confidence, "summary": summary_text, "evidence": [{"source": "Google Fact Check API", "link": FACT_CHECK_ENDPOINT, "content": "Primary Claim Check", "credibility": 1.0, "supportVerdict": fact_check_result, "description": "Verdict concluded by external fact-checker database."}], "txHash": f"0x{random.getrandbits(256):064x}", "ipfsCid": f"Qm{random.getrandbits(16):x}b20399d82a17f22384a6217462a69074b1"}
    
    tx_hash = f"0x{random.getrandbits(256):064x}"
    ipfs_cid = f"Qm{random.getrandbits(16):x}b20399d82a17f22384a6217462a69074b1"
    
    reputation_context = f"""
    EXTERNAL SOURCE REPUTATION: {external_rep_score:.2f} (Tag: {external_rep_tag}). PRIOR FACT CHECK RESULT: {fact_check_confidence} confidence.
    Use ALL this information, along with your live Google Search results, to inform the overall 'confidence' level and the final verdict.
    """
    
    prompt = f"""You are an expert, unbiased AI fact-checker. Your task is to analyze the following article text for factual accuracy by using your access to Google Search. {reputation_context} Output your response STRICTLY as a single JSON object. [...] Article Text to Analyze: --- {text} ---"""
    
    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(model='gemini-2.5-pro', contents=prompt, config=types.GenerateContentConfig(tools=[{"google_search": {}}]))
            if response.text is None: raise Exception("Gemini API returned an empty text response (None).")

            raw_text = response.text.strip()
            if raw_text.startswith("```json"): raw_text = raw_text[7:]
            if raw_text.endswith("```"): raw_text = raw_text[:-3]
                
            analysis_result = json.loads(raw_text.strip())
            analysis_result['confidence'] = float(analysis_result.get('confidence', 0.5))
            
            evidence_list = analysis_result.get('evidence', [])
            for ev in evidence_list:
                 try: ev['credibility'] = float(ev.get('credibility', 0.5))
                 except ValueError: ev['credibility'] = 0.5 
                     
            if 'txHash' not in analysis_result: analysis_result['txHash'] = tx_hash
            if 'ipfsCid' not in analysis_result: analysis_result['ipfsCid'] = ipfs_cid

            return analysis_result

        except APIError as e:
            if '503' in str(e) or 'overloaded' in str(e) and attempt < MAX_RETRIES - 1:
                wait_time = INITIAL_BACKOFF_SECONDS * (2 ** attempt) + random.uniform(0, 1)
                print(f"API 503 Error (Attempt {attempt + 1}/{MAX_RETRIES}). Retrying analysis in {wait_time:.2f} seconds...")
                time.sleep(wait_time)
                continue
            else:
                error_summary = f"Real-time analysis failed permanently after {attempt + 1} attempts: {e}"
                return {"verdict": "mixed", "confidence": 0.3, "summary": error_summary, "evidence": [], "txHash": "", "ipfsCid": ""}
        except json.JSONDecodeError:
            return {"verdict": "mixed", "confidence": 0.4, "summary": "Analysis failed: The AI did not return a valid JSON format.", "evidence": [], "txHash": "", "ipfsCid": ""}
        except Exception as e:
            return {"verdict": "mixed", "confidence": 0.3, "summary": f"An unexpected error occurred during analysis: {e}", "evidence": [], "txHash": "", "ipfsCid": ""}
    
    return {"verdict": "mixed", "confidence": 0.3, "summary": f"Real-time analysis failed after {MAX_RETRIES} attempts due to persistent server unavailability.", "evidence": [], "txHash": "", "ipfsCid": ""}


# ----------------------------------------------------------------------
# --- DATABASE PERSISTENCE FUNCTIONS & UTILITIES ---
# ----------------------------------------------------------------------

def save_article_analysis(url, title, content, source_name, analysis_result):
    if db is None: return
    article_doc = {
        "url": url, "title": title, "full_content": content, "source_name": source_name,
        "timestamp": datetime.utcnow(), "verdict": analysis_result.get('verdict'),
        "confidence": analysis_result.get('confidence'), "txHash": analysis_result.get('txHash'),
        "ipfsCid": analysis_result.get('ipfsCid'), "gemini_summary": analysis_result.get('summary'),
        "evidence": analysis_result.get('evidence', [])
    }
    try: db.articles.update_one({"url": url}, {"$set": article_doc}, upsert=True)
    except Exception: pass

def save_or_update_source(source_url, verdict, confidence):
    if db is None: return
    try:
        parsed_uri = urllib.parse.urlparse(source_url)
        clean_domain = parsed_uri.netloc or source_url.split('/')[0]
        if not clean_domain or clean_domain in ['user-input-text', '#']: return
    except: return

    if verdict == 'true': impact = confidence * 0.05 
    elif verdict == 'false': impact = -confidence * 0.05 
    else: impact = 0.0 
        
    try:
        source_doc = db.sources.find_one({"domain": clean_domain})
        if source_doc:
            current_score = source_doc.get('credibility_score', 0.5)
            new_score = max(0.0, min(1.0, current_score + impact))
            db.sources.update_one({"domain": clean_domain}, {"$set": {"credibility_score": new_score, "last_updated": datetime.utcnow()}})
        else:
            db.sources.insert_one({
                "domain": clean_domain, "credibility_score": 0.5 + impact, "category": "unclassified", 
                "first_seen": datetime.utcnow(), "last_updated": datetime.utcnow()
            })
    except Exception: pass

def get_verification_analytics():
    if db is None: 
        return {"error": "Database is not initialized. Cannot run analytics."}

    # 1. TOTAL METRICS CALCULATION (Count, Avg Confidence, Last Update)
    total_metrics_pipeline = [
        {
            "$group": {
                "_id": None,
                "total_articles_analyzed": {"$sum": 1},
                "overall_avg_confidence": {"$avg": "$confidence"},
                "last_update": {"$max": "$timestamp"}
            }
        },
        {"$project": {"_id": 0}} # Remove the _id: null field
    ]
    
    total_metrics_result = list(db.articles.aggregate(total_metrics_pipeline))
    
    # Handle case where collection is empty
    if not total_metrics_result:
        metrics = {
            "total_articles_analyzed": 0,
            "overall_avg_confidence": 0.5,
            "last_update": datetime.utcnow().isoformat()
        }
    else:
        metrics = total_metrics_result[0]
        # Convert datetime object to ISO string
        metrics['last_update'] = metrics.get('last_update', datetime.utcnow()).isoformat()

    # Get total unique sources from the separate 'sources' collection
    metrics['total_unique_sources'] = db.sources.count_documents({})


    # 2. VERDICT DISTRIBUTION CALCULATION
    verdict_distribution_pipeline = [
        {"$group": {"_id": "$verdict", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    verdicts_raw = list(db.articles.aggregate(verdict_distribution_pipeline))
    total_count = metrics['total_articles_analyzed']
    
    verdict_distribution_list = []
    
    # Initialize all required verdict types (True, False, Mixed) to ensure they show up
    # This prevents the frontend crash if one category is missing
    verdict_map = {item['_id']: item['count'] for item in verdicts_raw}
    
    for verdict_type in ['true', 'false', 'mixed']:
        count = verdict_map.get(verdict_type, 0)
        percentage = (count / total_count * 100) if total_count > 0 else 0
        verdict_distribution_list.append({
            "verdict": verdict_type,
            "count": count,
            "percentage": round(percentage, 2)
        })

    # 3. TOP ANALYZED SOURCES CALCULATION
    top_sources_pipeline = [
        {"$group": {"_id": "$source_name", "total_analyses": {"$sum": 1}}},
        {"$sort": {"total_analyses": -1}},
        {"$limit": 5} # Limit to top 5
    ]
    
    top_analyzed_sources_list = list(db.articles.aggregate(top_sources_pipeline))
    # Note: the output structure already matches the interface: [{'_id': 'source', 'total_analyses': 5}]


    # 4. CONSTRUCT FINAL RESPONSE
    return {
        "success": True,
        "total_metrics": metrics,
        "verdict_distribution": verdict_distribution_list,
        "top_analyzed_sources": top_analyzed_sources_list
    }

def extract_article_text_from_url(url):
    """Fetches a URL and extracts the main article text using content density heuristics."""
    try:
        headers = {'User-Agent': 'FakeNewsDetector/1.0'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status() 

        soup = BeautifulSoup(response.content, 'html.parser')
        article_tag = soup.find('article') or soup.find(itemprop="articleBody") or soup.find(id='content')

        if article_tag:
            text_elements = article_tag.find_all('p')
            article_text = ' '.join([elem.get_text() for elem in text_elements if elem.get_text().strip()])
        else:
            max_len = 0
            best_element = None
            search_containers = soup.find_all(['main', 'div', 'body'], limit=100) 

            for container in search_containers:
                current_text = container.get_text()
                text_len = len(current_text.split())
                
                if text_len > max_len:
                    max_len = text_len
                    best_element = container

            if best_element:
                text_elements = best_element.find_all('p')
                article_text = ' '.join([elem.get_text() for elem in text_elements if elem.get_text().strip()])
            else:
                article_text = ""
        
        article_text = ' '.join(article_text.split())[:15000]

        if not article_text or len(article_text) < 50:
            return "Error: Could not extract sufficient meaningful text from the URL.", True
        
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
    """ENDPOINT 1: Runs the full hybrid analysis (Local Model + Gemini Pipeline + AI Detection)."""
    data = request.get_json()
    input_value = data.get('input_value', '').strip()
    input_type = data.get('input_type') 
    
    if not input_value: return jsonify({"error": "No text or URL provided."}), 400

    # --- Prepare content & variables ---
    article_url = input_value 
    article_title = f"User Input - {input_value[:50]}..."
    source_name = "User Submitted"
    article_text = input_value

    if input_type == 'url':
        article_text, success = extract_article_text_from_url(input_value)
        if not success or article_text.startswith("Error:"): return jsonify({"error": article_text}), 500
        try:
             source_name = urllib.parse.urlparse(input_value).netloc
             article_title = article_text[:100].strip().replace('\n', ' ') + "..."
        except Exception: pass
        external_rep_score, external_rep_tag = get_external_domain_reputation(input_value)
    
    elif input_type == 'text':
        article_text = input_value
        external_rep_score, external_rep_tag = 0.5, "RAW_TEXT_INPUT"
    
    else: return jsonify({"error": "Invalid input_type. Must be 'text' or 'url'."}), 400

    # --- CORE HYBRID PIPELINE EXECUTION ---
    
    # 1. Local Classifier and AI Detector
    bert_confidence, bert_verdict = predict_local_model_confidence(article_title, article_text, source_name)
    ai_probability = predict_ai_generation_probability(article_text)
    ai_detected = ai_probability > 0.7 
    
    # 2. Gemini Pipeline Pre-Checks
    primary_claim = extract_primary_claim(article_text)
    fact_check_result, fact_check_confidence = check_google_fact_check(primary_claim)

    # 3. Run Gemini Analysis (passes ALL context)
    gemini_analysis = analyze_text_for_fake_news(
        article_text, 
        external_rep_score=external_rep_score, 
        external_rep_tag=external_rep_tag,
        fact_check_result=fact_check_result,
        fact_check_confidence=fact_check_confidence
    )
    
    gemini_confidence = gemini_analysis.get('confidence', 0.5)
    
    # 4. Fusion and Penalty Calculation
     # 4. Fusion and Penalty Calculation (FIXED LOGIC)
    fused_confidence_raw = (float(bert_confidence) * 0.6) + (float(gemini_confidence) * 0.4)
    final_confidence_adjusted = fused_confidence_raw * (1.0 - float(ai_probability))
    
    # 5. Determining the Final Categorical Verdict (Prioritizing Factual Reasoning)
    
    # Get Gemini's reasoning verdict (should be one of 'true', 'false', 'mixed')
    gemini_reasoning_verdict = gemini_analysis.get('verdict', 'mixed')
    
    if gemini_reasoning_verdict == 'false' and gemini_analysis.get('confidence', 0.5) > 0.6:
        # If Gemini's search and fact-check strongly concludes 'False', use that verdict
        final_verdict = 'false'
        # Optional: Reinforce confidence if the structural model was unreliable
        final_confidence_adjusted = max(0.5, final_confidence_adjusted)
        
    elif gemini_reasoning_verdict == 'true' and gemini_analysis.get('confidence', 0.5) > 0.6:
        final_verdict = 'true'
    
    elif final_confidence_adjusted < 0.3:
        final_verdict = "false"
    elif final_confidence_adjusted > 0.7:
        final_verdict = "true"
    else:
        # Default fallback, indicating ambiguity from conflicting models
        final_verdict = "mixed"

    # --- 5. Prepare Fused Result for DB and Return ---
    gemini_summary_text = gemini_analysis.get('summary', 'Gemini analysis summary not available.')

    fused_analysis_result = {
        **gemini_analysis, 
        "verdict": final_verdict,
        "confidence": float(final_confidence_adjusted),
        "summary": f"FUSED: {final_verdict.upper()} (Conf. adjusted from {fused_confidence_raw:.2f} due to AI Prob: {float(ai_probability):.2f}). Gemini Summary: {gemini_summary_text}",
    }

    save_article_analysis(url=article_url, title=article_title, content=article_text, 
                          source_name=source_name, analysis_result=fused_analysis_result)
    save_or_update_source(article_url, final_verdict, final_confidence_adjusted)

    return jsonify({
        "status": "FUSED_ANALYSIS_COMPLETE",
        "final_verdict": final_verdict,
        "final_confidence": round(float(final_confidence_adjusted), 4),
        "fused_components": {
            "ai_synthesis_detected": ai_detected,
            "ai_probability": round(float(ai_probability), 4),
            "local_model": {"verdict": bert_verdict, "confidence": round(float(bert_confidence), 4)},
            "gemini_pipeline": {"verdict": gemini_analysis.get('verdict', 'mixed'), "confidence": round(float(gemini_confidence), 4), "summary": gemini_summary_text}
        }
    })


@app.route('/api/daily-news', methods=['GET'])
def get_daily_news():
    """ENDPOINT 2: Fetches and analyzes fresh headlines using the full pipeline."""

    if ACTIVE_NEWS_SERVICE == 'newsapi':
        api_url = NEWSAPI_ENDPOINT
        api_key = NEWS_API_KEY_NEWSAPI
        params = {'country': 'us', 'category': 'general', 'pageSize': 5, 'apiKey': api_key}
        content_key = 'content'
    elif ACTIVE_NEWS_SERVICE == 'newsdata':
        api_url = NEWSDATA_ENDPOINT
        api_key = NEWS_API_KEY_NEWSDATA
        params = {'country': 'us', 'language': 'en', 'size': 5, 'apikey': api_key}
        content_key = 'content' 
    else: return jsonify({"error": "Invalid ACTIVE_NEWS_SERVICE configuration."}), 500
    
    if not api_key: return jsonify({"error": f"API Key for {ACTIVE_NEWS_SERVICE} is missing. Check your .env file."}), 500

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
            
            if processed_articles:
                print(f"Pausing for {ANALYSIS_DELAY_SECONDS} seconds between headlines...")
                time.sleep(ANALYSIS_DELAY_SECONDS) 
            
            # --- Multi-Source Pipeline Execution ---
            external_rep_score, external_rep_tag = get_external_domain_reputation(url)
            
            # 1. Local Classifier and AI Detector
            bert_confidence, bert_verdict = predict_local_model_confidence(title, content, url)
            ai_probability = predict_ai_generation_probability(content)
            ai_detected = ai_probability > 0.7 
            
            # 2. Gemini Pipeline Pre-Checks
            primary_claim = extract_primary_claim(content)
            fact_check_result, fact_check_confidence = check_google_fact_check(primary_claim)
            
            # 3. Run Gemini Analysis
            gemini_analysis = analyze_text_for_fake_news(
                content,
                external_rep_score=external_rep_score,
                external_rep_tag=external_rep_tag,
                fact_check_result=fact_check_result,
                fact_check_confidence=fact_check_confidence
            )
            
            gemini_confidence = gemini_analysis.get('confidence', 0.5)
            
            # 4. Fusion and Penalty Calculation
            fused_confidence_raw = (float(bert_confidence) * 0.6) + (float(gemini_confidence) * 0.4)
            final_confidence_adjusted = fused_confidence_raw * (1.0 - float(ai_probability))

            if final_confidence_adjusted < 0.3: final_verdict = "false"
            elif final_confidence_adjusted > 0.7: final_verdict = "true"
            else: final_verdict = "mixed"

            # 5. Save and Append
            fused_analysis_result = {
                **gemini_analysis, 'verdict': final_verdict, 'confidence': final_confidence_adjusted,
                'summary': f"FUSED: {final_verdict.upper()} (AI Penalty: {ai_probability:.2f}). Gemini Summary: {gemini_analysis.get('summary', 'N/A')}",
            }

            if ACTIVE_NEWS_SERVICE == 'newsapi': source_name = article.get('source', {}).get('name', 'N/A')
            else: source_name = article.get('source_id', 'N/A')

            save_article_analysis(url=url, title=title, content=content, source_name=source_name, analysis_result=fused_analysis_result)
            save_or_update_source(source_url=url, verdict=final_verdict, confidence=final_confidence_adjusted)

            processed_articles.append({
                "title": title, "url": url, "source": source_name, "verdict": final_verdict,
                "confidence": float(final_confidence_adjusted), "summary": fused_analysis_result['summary']
            })

        return jsonify(processed_articles)

    except requests.RequestException as e:
        return jsonify({"error": f"Failed to connect to News API ({ACTIVE_NEWS_SERVICE}): {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred during news processing: {e}"}), 500


@app.route('/api/history/query', methods=['GET'])
def query_history():
    """ENDPOINT 3: Queries the database for past analyses."""
    if db is None: return jsonify({"error": "Database is not initialized. Cannot query history."}), 500
    query_term = request.args.get('term', '').strip()
    if not query_term: return jsonify({"error": "A search 'term' parameter is required."}), 400

    try:
        results = db.articles.find({"$text": {"$search": query_term}}, {"score": {"$meta": "textScore"}}).sort([('score', {'$meta': 'textScore'})]).limit(10)
        history = []
        for doc in results:
            doc['_id'] = str(doc['_id'])
            history.append({
                "id": doc['_id'], "timestamp": doc['timestamp'].isoformat(), "title": doc['title'],
                "url": doc['url'], "verdict": doc['verdict'], "confidence": float(doc['confidence']), 
                "source_name": doc['source_name'], "summary": doc['gemini_summary']
            })
        return jsonify({"query": query_term, "count": len(history), "results": history})
    except Exception as e:
        return jsonify({"error": f"An error occurred while querying the database: {e}"}), 500


@app.route('/api/source/<domain>', methods=['GET'])
def get_source_credibility(domain):
    """ENDPOINT 4: Queries the 'sources' collection for aggregated credibility."""
    if db is None: return jsonify({"error": "Database is not initialized."}), 500
    if not domain: return jsonify({"error": "Domain parameter is missing."}), 400

    try:
        parsed_uri = urllib.parse.urlparse(domain)
        clean_domain = parsed_uri.netloc or domain
        
        source_doc = db.sources.find_one({"domain": clean_domain})
        
        if source_doc:
            source_doc['_id'] = str(source_doc['_id'])
            recent_articles = list(db.articles.find({"source_name": {"$regex": clean_domain, "$options": "i"}}).sort([('timestamp', -1)]).limit(5))
            
            article_history = []
            for article in recent_articles:
                article_history.append({
                    "title": article.get('title', 'N/A'), "verdict": article.get('verdict', 'mixed'),
                    "confidence": float(article.get('confidence', 0.5)), 
                    "timestamp": article.get('timestamp').isoformat() if article.get('timestamp') else 'N/A'
                })
                
            return jsonify({
                "domain": source_doc['domain'], "credibility_score": float(source_doc['credibility_score']), 
                "category": source_doc.get('category', 'unclassified'),
                "last_updated": source_doc.get('last_updated').isoformat() if source_doc.get('last_updated') else 'N/A',
                "recent_analysis": article_history
            })
        else:
            return jsonify({
                "domain": clean_domain, "credibility_score": 0.5,
                "message": "Source not found in database. Credibility is neutral (0.5).", "recent_analysis": []
            }), 404
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@app.route('/api/analytics/summary', methods=['GET'])
def analytics_summary():
    """ENDPOINT 5: Returns aggregated statistics for the entire database history."""
    analytics = get_verification_analytics()
    if analytics.get("error"): return jsonify(analytics), 500
    return jsonify(analytics), 200

@app.route('/api/explain', methods=['POST'])
def explain_analysis():
    """
    ENDPOINT 6: Calculates LIME explanation for the local BERT/RoBERTa model.
    """
    data = request.get_json()
    input_value = data.get('input_value', '').strip()
    input_type = data.get('input_type')
    
    if not input_value:
        return jsonify({"error": "No text or URL provided."}), 400
    
    if GLOBAL_MODEL is None:
        return jsonify({"error": "Local Model required for LIME is not loaded."}), 503

    # --- 1. Get Text (Reuse content extraction logic) ---
    article_text = input_value
    if input_type == 'url':
        article_text, success = extract_article_text_from_url(input_value)
        if not success or article_text.startswith("Error:"):
            return jsonify({"error": article_text}), 500
            
    # LIME Explainer Setup (Explain the prediction for the 'Real' class, which is index 1)
    explainer = LimeTextExplainer(class_names=['Fake', 'Real'])
    
    # 2. Generate Explanation
    try:
        explanation = explainer.explain_instance(
            article_text[:2000], 
            classifier_fn=predict_proba_for_lime, 
            num_samples=300, 
            num_features=10, 
            labels=(0, 1) 
        )
        
        # 3. Format Output for Frontend (weights)
        explanation_data = explanation.as_list(label=1) 
        
        formatted_weights = [{"word": word, "weight": round(weight, 5)} for word, weight in explanation_data]
        
        return jsonify({
            "status": "EXPLANATION_GENERATED",
            "weights": formatted_weights,
            "text_summary": article_text[:500] + "...",
        })
        
    except Exception as e:
        return jsonify({"error": f"LIME failed to generate explanation: {e}"}), 500


if __name__ == '__main__':
    print("Starting Flask server with Gemini Real-Time Fact-Checking and MongoDB initialization...")
    # NOTE: use_reloader=False is set to prevent the Windows socket crash
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5001)