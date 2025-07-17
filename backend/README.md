# GramUdyogAI Backend

A FastAPI-based backend for the GramUdyogAI platform, providing AI-powered services for skill development, business suggestions, and hackathon management.

## Features

- **AI-Powered Services**: LLM integration with Groq for various AI features
- **Audio Generation**: Text-to-speech capabilities using E2E Networks
- **Event Management**: Hackathon and event creation with AI assistance
- **Project Showcase**: Public project management and display
- **User Profiles**: Unified profile system for different user types
- **Multi-language Support**: Translation and localization features

## Quick Start

### 1. Environment Setup

Run the setup script to configure your environment:

```bash
cd backend
python setup_env.py
```

This will:
- Check for required dependencies
- Create a `.env` file with placeholder values
- Guide you through API key configuration

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure API Keys

Edit the `.env` file and add your actual API keys:

```env
# Required for LLM features
GROQ_API_KEY=your_actual_groq_api_key

# Required for audio generation
E2E_TIR_ACCESS_TOKEN=your_actual_e2e_token

# Optional: Additional E2E Networks configuration
E2E_TIR_API_KEY=your_e2e_api_key
E2E_TIR_PROJECT_ID=your_project_id
E2E_TIR_TEAM_ID=your_team_id
```

### 4. Run the Server

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | API key for Groq LLM services |
| `E2E_TIR_ACCESS_TOKEN` | Yes | Access token for E2E Networks audio generation |
| `E2E_TIR_API_KEY` | No | Additional E2E Networks API key |
| `E2E_TIR_PROJECT_ID` | No | E2E Networks project ID |
| `E2E_TIR_TEAM_ID` | No | E2E Networks team ID |
| `DATABASE_URL` | No | Database connection string (defaults to SQLite) |
| `HOST` | No | Server host (defaults to 0.0.0.0) |
| `PORT` | No | Server port (defaults to 8000) |
| `DEBUG` | No | Debug mode (defaults to True) |

## API Endpoints

### Core Services
- `GET /api/skills` - Get skill recommendations
- `POST /api/business-suggestions` - Generate business suggestions
- `GET /api/schemes` - Get government schemes
- `POST /api/jobs` - Job recommendations

### Event Management
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `POST /api/events/generate-with-ai` - Generate event with AI
- `POST /api/events/{id}/generate-social-posts` - Generate social media posts

### Project Management
- `GET /api/projects` - List public projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details

### User Profiles
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/unified-profile` - Create unified profile

### AI Services
- `POST /api/ai-assistant` - AI chat assistant
- `POST /api/youtube-summary` - YouTube video summarization
- `POST /translate` - Text translation

## Development

### Project Structure

```
backend/
├── api/                    # API route handlers
│   ├── routes_*.py        # Route modules
│   └── translation.py     # Translation utilities
├── core/                  # Core business logic
│   ├── audio_generation.py
│   ├── enhanced_llm.py
│   ├── skill_tutorial.py
│   └── ...
├── models/                # Data models
├── schemes/               # Government scheme data
├── audio/                 # Generated audio files
├── images/                # Generated images
├── main.py               # FastAPI application entry point
├── requirements.txt      # Python dependencies
├── setup_env.py         # Environment setup script
└── .env                 # Environment variables (create this)
```

### Adding New Features

1. Create route handlers in `api/routes_*.py`
2. Add business logic in `core/` modules
3. Update `main.py` to include new routers
4. Add environment variables if needed
5. Update this README

## Troubleshooting

### Common Issues

1. **Missing API Keys**: The application will run with limited functionality if API keys are missing
2. **Import Errors**: Ensure all dependencies are installed with `pip install -r requirements.txt`
3. **Port Already in Use**: Change the port in `.env` or kill the process using port 8000

### Error Messages

- `E2E_TIR_ACCESS_TOKEN environment variable not set`: Audio generation will be disabled
- `GROQ_API_KEY not set`: LLM features will be disabled
- `Module not found`: Install missing dependencies

## License

This project is part of the GramUdyogAI platform.
