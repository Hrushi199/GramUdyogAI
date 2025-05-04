# GramUdyogAI (Empower Up)🚀

## Your Rural Business Companion

### Introduction

Starting a business in rural areas comes with unique challenges: limited access to information, language barriers, lack of awareness about government schemes, and difficulty accessing educational content.

GramUdyogAI is designed to empower rural entrepreneurs by providing AI-driven business suggestions, multilingual support, and accessible resources to bridge the urban-rural opportunity gap.

### Key Features

1. **AI Business Suggestions** 💡  
   Enter your skills and resources, and our AI generates personalized business recommendations tailored to rural markets and your capabilities.

2. **Government Schemes Database** 🏛️  
   Access a comprehensive database of government programs, subsidies, and support initiatives specifically designed for rural entrepreneurs.

3. **YouTube Audio Summary** 🎧  
   Convert any YouTube video into concise audio summaries in your local language, making educational content accessible regardless of literacy levels.

4. **Networking Opportunities** 👥  
   Connect with like-minded professionals through our job board where you can post and find relevant opportunities in your region.

5. **Multilingual Support** 🌐  
   Break language barriers with our platform that supports multiple regional languages, making entrepreneurship accessible to all.

6. **Responsive Design** 📱  
   Access all features seamlessly across devices, ensuring usability even on basic smartphones with limited connectivity.

### Deployment Architecture

- **Frontend**: Deployed on Vercel for global availability and edge caching
- **Backend**: Hosted on Railway with containerized services for scalability
- **AI Processing**: Leveraging cloud AI services with optimized request handling

### Instructions to Run the Code Locally

```bash
# Step 1: Clone the repository
git clone https://github.com/Hrushi199/GramUdyogAI.git

# Step 2: Navigate to the project directory
cd GramUdyogAI

# Step 3: Move to the backend directory
cd backend

# Step 4: Create and configure your .env file with necessary API keys
# Include OPENAI_API_KEY, GROQ_API_KEY, etc.

# Step 5: Install backend dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Step 6: Run the backend server
uvicorn main:app --reload

# Step 7: Navigate to the frontend directory
cd ../frontend

# Step 8: Install frontend dependencies
npm install

# Step 9: Create .env file with VITE_API_BASE_URL pointing to your backend

# Step 10: Start the frontend server
npm run dev

# Step 11: Open the frontend URL (e.g., http://localhost:5173) in your browser 
```
---

## 🚧 Addressing Deployment Challenges

| Challenge     | Solution                                                                                      |
|---------------|-----------------------------------------------------------------------------------------------|
| **Connectivity** | Progressive Web App (PWA) features with offline access and low-data usage design             |
| **Cost**         | Serverless architecture using Vercel and Railway to scale automatically and reduce overhead |
| **Scalability**  | Microservices architecture allows independent scaling of AI, translation, and core services |
| **Accessibility**| Support for text-to-speech and regional languages, optimized for low-bandwidth environments |

---

## 🧱 Technology Stack

- **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [Python](https://www.python.org/), [FastAPI](https://fastapi.tiangolo.com/)
- **AI/ML**: [OpenAI](https://openai.com/), [Groq](https://groq.com/)
- **Internationalization**: [i18next](https://www.i18next.com/)
- **Deployment**:
  - Frontend: [Vercel](https://vercel.com)
  - Backend: [Railway](https://railway.app)

---

## 🌍 Impact

**GramUdyogAI** empowers rural communities by:

- Bridging the urban-rural digital divide
- Enabling informed business decisions through AI-driven insights
- Making educational content accessible via audio summaries
- Offering multilingual support to reach non-English-speaking users
- Simplifying access to government schemes and financial support
- Creating a connected ecosystem for rural entrepreneurship

Together, we envision **sustainable livelihoods** and **inclusive growth** powered by **AI and accessibility**.
