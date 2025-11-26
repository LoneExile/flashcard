# Flashcard App Commands

# Default: show available commands
default:
    @just --list

# Run both frontend and backend concurrently
dev:
    @just backend & just frontend

# Run frontend (Vite dev server)
frontend:
    npm run dev

# Run backend (FastAPI server)
backend:
    cd server && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Install all dependencies
install:
    npm install
    pip install fastapi uvicorn edge-tts sqlalchemy

# Build frontend for production
build:
    npm run build

# Run linting
lint:
    npm run lint

# Preview production build
preview:
    npm run preview
