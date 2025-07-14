#!/usr/bin/env python3
"""
Development server with hot reload for FastAPI
Run this script for development with automatic reload on file changes
"""

import uvicorn
import os
from pathlib import Path

def run_dev_server():
    """Run the FastAPI development server with hot reload"""
    
    # Get the backend directory
    backend_dir = Path(__file__).parent
    
    # Set environment variables for development
    os.environ["ENVIRONMENT"] = "development"
    os.environ["DEBUG"] = "true"
    
    print("🚀 Starting FastAPI development server with hot reload...")
    print(f"📁 Watching directory: {backend_dir}")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("🔄 Hot reload enabled - changes will restart server automatically")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 60)
    
    # Run uvicorn with hot reload
    uvicorn.run(
        "main:app",  # Import the app from main.py
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable hot reload
        reload_dirs=[str(backend_dir)],  # Watch the backend directory
        reload_excludes=["*.pyc", "__pycache__", "*.db", "*.sqlite"],  # Exclude these from reload
        log_level="info",
        access_log=True,
        use_colors=True
    )

if __name__ == "__main__":
    run_dev_server() 