# Snap Your Shelf - Backend API

FastAPI backend for the Snap Your Shelf digital movie collection organizer.

## Setup

1. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

4. Set your MongoDB Atlas URI in `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/snap_your_shelf?retryWrites=true&w=majority
```

## Running the Server

Development mode:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/healthz

## Project Structure

```
backend/
├── app/
│   ├── core/           # Core configuration and database
│   ├── models/         # Pydantic models
│   ├── routers/        # API route handlers
│   └── services/       # Business logic
├── main.py             # FastAPI application entry point
├── requirements.txt    # Python dependencies
└── .env               # Environment variables
```

## Environment Variables

- `APP_ENV`: Environment (development/production)
- `PORT`: Server port (default: 8000)
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiration time in seconds
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)

## Development

This is Sprint 0 - basic setup with health check and CORS configuration.
Future sprints will add authentication, collections, movies, and AI vision processing.