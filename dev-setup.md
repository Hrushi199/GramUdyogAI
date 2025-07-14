# 🚀 Development Setup with Hot Reload

## FastAPI Backend with Hot Reload

### Option 1: Using the Development Script (Recommended)
```bash
cd backend
python dev_server.py
```

### Option 2: Direct Uvicorn Command
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Option 3: Using Python Module
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Development
```bash
cd frontend
npm run dev
```

## Full Stack Development (Two Terminals)

### Terminal 1 - Backend
```bash
cd backend
python dev_server.py
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Hot Reload Features

### Backend Hot Reload
- ✅ **Automatic restart** when Python files change
- ✅ **Watches entire backend directory**
- ✅ **Excludes database files** from reload triggers
- ✅ **Colored logs** for better debugging
- ✅ **Access logs** enabled

### Frontend Hot Reload
- ✅ **Vite HMR** (Hot Module Replacement)
- ✅ **Instant updates** without page refresh
- ✅ **State preservation** during development

## Development URLs

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173 (Vite default)

## Environment Variables

The development server automatically sets:
- `ENVIRONMENT=development`
- `DEBUG=true`

## Troubleshooting

### If hot reload isn't working:
1. Check file permissions
2. Ensure you're in the correct directory
3. Try restarting the development server
4. Check for syntax errors in your code

### If port is already in use:
```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

## Database Updates

When making schema changes, run:
```bash
cd backend
python update_events_schema.py
```

## Production vs Development

- **Development**: Uses hot reload, debug mode, detailed logs
- **Production**: Use `python main.py` for production deployment 