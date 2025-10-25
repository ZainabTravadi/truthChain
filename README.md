# 🔴 TruthChain – AI-Powered Fake News Detection System

TruthChain is a hybrid misinformation detection system that evaluates the credibility of news articles using machine learning, large language models, verified fact-check databases, and source reputation scoring. It provides a final verdict along with reasoning, evidence references, and a confidence score.

---

## 🔴 Features

* 🔴 Hybrid pipeline combining ML scoring + LLM reasoning
* 🔴 Claim extraction to identify the core statement being evaluated
* 🔴 Verification against verified fact-check databases
* 🔴 AI-generated text probability detection
* 🔴 Historical domain credibility scoring
* 🔴 Transparent confidence scoring with clear reasoning

---

## 🔴 How It Works

1. 🔴 User submits text or a URL
2. 🔴 If URL, the article text is extracted and cleaned
3. 🔴 The RoBERTa model generates baseline reliability scoring
4. 🔴 Gemini extracts the main claim from the article
5. 🔴 Claim is checked using the Google Fact Check API
6. 🔴 Gemini performs reasoning using referenced context
7. 🔴 System estimates the probability that the text is AI-generated
8. 🔴 Source credibility score is retrieved from MongoDB
9. 🔴 Final verdict + reasoning + confidence score is produced

---

## 🔴 APIs Used

| API                      | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| 🔴 NewsAPI               | Fetch and analyze news articles                                 |
| 🔴 NewsData.io API       | Additional article source aggregation                           |
| 🔴 Google Fact Check API | Cross-reference claims with verified fact-check organizations   |
| 🔴 Google Gemini API     | Claim extraction, analytical reasoning, evidence interpretation |

---

## 🔴 Tech Stack

* Frontend: VITE + React.js, TailwindCSS, Shadcn UI, Framer Motion
* Backend: Node.js + Express
* ML Model: RoBERTa (Fake News Classifier)
* Reasoning: Google Gemini
* Database: MongoDB

---

## 🔴 .env Setup

Replace each placeholder with your own private API keys.
Do **not** commit real keys.

* NEWS_API_KEY_NEWSAPI="YOUR_NEWSAPI_KEY"
* NEW_API_KEY_NEWSDATA="YOUR_NEWSDATA_KEY"
* GEMINI_API_KEY="YOUR_GEMINI_KEY"

* MONGO_URI="mongodb://localhost:27017/"
* MONGO_DB_NAME="fake_news_db"

* FACT_CHECK_API_KEY="YOUR_FACTCHECK_KEY"

---

## 🔴 Run the Project


🔴 **Installation & Setup Guide**

🔴 **1. Clone the Repository**

```bash
git clone https://github.com/ZainabTravadi/truthChain.git
cd truthChain
```

🔴 **2. Set Up MongoDB**

* Install MongoDB from [official site](https://www.mongodb.com/try/download/community) if not already installed.
* Start MongoDB service
* Ensure your `.env` file has the correct MongoDB URI:

```env
MONGO_URI="mongodb://localhost:27017/"
MONGO_DB_NAME="fake_news_db"
```

🔴 **3. Backend Setup**

```bash
cd backend
pip install -r requirements.txt
python app.py
```

* Backend runs at `http://localhost:5001` by default.

🔴 **4. Frontend Setup**

```bash
npm install
npm run dev
```

---

🔴 Optional: Verify MongoDB connection via Mongo Shell or Compass before running the backend.

---

## 🔴 Author

Built by **Zainab Travadi**
LinkedIn: [https://www.linkedin.com/in/zainab-travadi-119a83373/](https://www.linkedin.com/in/zainab-travadi-119a83373/)

---

### 🔴 Truth deserves verification. Let’s protect it together.

