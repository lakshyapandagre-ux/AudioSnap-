# AudioSnap — Backend API

FastAPI-powered video-to-MP3 conversion service.

## Features

- **File Upload** → Convert uploaded video files to MP3
- **YouTube URL** → Download and convert YouTube videos to MP3
- **Instagram URL** → Download and convert Instagram reels to MP3
- **Job Tracking** → Real-time progress updates via polling
- **Rate Limiting** → Per-IP rate limits via slowapi
- **Auto Cleanup** → Temp files removed every 10 minutes

## Prerequisites

- **Python 3.10+**
- **FFmpeg** — Must be installed and available in system PATH
- **yt-dlp** — Installed via requirements.txt

### Installing FFmpeg

**Windows:**
```bash
winget install ffmpeg
```
Or download from https://ffmpeg.org/download.html and add to PATH.

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

## Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the server
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| GET    | `/health`            | Health check             |
| POST   | `/convert/upload`    | Upload video → MP3       |
| POST   | `/convert/youtube`   | YouTube URL → MP3        |
| POST   | `/convert/instagram` | Instagram URL → MP3      |
| GET    | `/status/{job_id}`   | Get conversion status    |
| GET    | `/download/{job_id}` | Download converted MP3   |

## Environment Variables

| Variable              | Default               | Description                  |
|-----------------------|-----------------------|------------------------------|
| `MAX_FILE_SIZE_MB`    | `500`                 | Maximum upload size (MB)     |
| `RATE_LIMIT`          | `10/minute`           | Rate limit per IP            |
| `FRONTEND_URL`        | `http://localhost:5500` | Frontend URL for CORS      |
| `RAILWAY_PUBLIC_DOMAIN` | (empty)             | Railway domain for CORS      |
| `PORT`                | `8000`                | Server port                  |

## Project Structure

```
backend/
├── main.py           # FastAPI app, routes, middleware
├── converter.py      # FFmpeg + yt-dlp conversion logic
├── jobs.py           # Job manager (in-memory)
├── cleanup.py        # Temp file cleanup scheduler
├── validators.py     # Input validation
├── requirements.txt  # Python dependencies
├── .env              # Environment variables
├── .env.example      # Env template
├── Procfile          # Railway/Heroku deployment
├── README.md         # This file
└── temp/             # Temporary file storage
    └── .gitkeep
```

## Deployment (Railway)

1. Push code to GitHub
2. Connect repo to Railway
3. Set root directory to `backend/`
4. Add environment variables in Railway dashboard
5. Railway auto-detects Procfile and deploys

## License

MIT
