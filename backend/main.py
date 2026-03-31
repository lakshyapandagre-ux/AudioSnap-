"""
AudioSnap — FastAPI Backend
Video-to-MP3 conversion API with YouTube, Instagram, and file upload support.
"""

import os
import uuid
import logging
import asyncio
import hashlib
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from jobs import JobManager, JobStatus
from converter import convert_uploaded_file, convert_from_url
from validators import validate_video_file, validate_youtube_url, validate_instagram_url
from cleanup import start_cleanup_scheduler

# ── Load env ──────────────────────────────────────────────
load_dotenv()

# ── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("audiosnap")

# ── Config ────────────────────────────────────────────────
TEMP_DIR = Path(__file__).parent / "temp"
TEMP_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "500"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
RATE_LIMIT = os.getenv("RATE_LIMIT", "10/minute")

# ── Rate Limiter ──────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── App ───────────────────────────────────────────────────
app = FastAPI(
    title="AudioSnap API",
    description="Convert videos to MP3 — upload files or paste YouTube/Instagram links.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Job Manager & Cache ─────────────────────────────────────
job_manager = JobManager()
url_cache = {}


# ── Lifecycle ─────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("AudioSnap API starting up...")
    logger.info(f"Temp directory: {TEMP_DIR}")
    logger.info(f"Max file size: {MAX_FILE_SIZE_MB} MB")
    logger.info(f"Rate limit: {RATE_LIMIT}")
    asyncio.create_task(start_cleanup_scheduler(TEMP_DIR, interval_minutes=10, max_age_minutes=30))
    logger.info("Cleanup scheduler started.")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("AudioSnap API shutting down...")


# ══════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "AudioSnap API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Upload Convert ───────────────────────────────────────
@app.post("/convert/upload")
@limiter.limit(RATE_LIMIT)
async def convert_upload(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: str = Form("192"),
):
    """Upload a video file and convert it to MP3."""
    logger.info(f"Upload request: {file.filename} | quality={quality}")

    # Validate file type
    validation_error = validate_video_file(file.filename, file.content_type)
    if validation_error:
        raise HTTPException(status_code=400, detail=validation_error)

    # Validate quality
    if quality not in ("128", "192", "320"):
        quality = "192"

    # Read file content and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB} MB."
        )

    # Create job
    job_id = job_manager.create_job(source_type="upload", source_name=file.filename)

    # Save uploaded file
    input_path = TEMP_DIR / f"{job_id}_input_{file.filename}"
    with open(input_path, "wb") as f:
        f.write(content)

    output_path = TEMP_DIR / f"{job_id}_output.mp3"

    # Start background conversion
    background_tasks.add_task(
        _run_upload_conversion, job_id, str(input_path), str(output_path), int(quality)
    )

    return {"job_id": job_id, "status": "processing", "message": "Conversion started."}


async def _run_upload_conversion(job_id: str, input_path: str, output_path: str, quality: int):
    """Background task for upload conversion."""
    try:
        job_manager.update_job(job_id, status=JobStatus.EXTRACTING, progress=10)
        logger.info(f"[{job_id}] Starting file conversion...")

        success, error = await asyncio.to_thread(
            convert_uploaded_file, input_path, output_path, quality, job_manager, job_id
        )

        if success:
            job_manager.update_job(
                job_id, status=JobStatus.COMPLETED, progress=100, output_file=output_path
            )
            logger.info(f"[{job_id}] Conversion completed successfully.")
        else:
            job_manager.update_job(job_id, status=JobStatus.FAILED, error=error)
            logger.error(f"[{job_id}] Conversion failed: {error}")

    except Exception as e:
        job_manager.update_job(job_id, status=JobStatus.FAILED, error=str(e))
        logger.exception(f"[{job_id}] Unexpected error during conversion.")

    finally:
        # Clean up input file
        try:
            if os.path.exists(input_path):
                os.remove(input_path)
        except OSError:
            pass


# ── YouTube Convert ──────────────────────────────────────
@app.post("/convert/youtube")
@limiter.limit(RATE_LIMIT)
async def convert_youtube(
    request: Request,
    background_tasks: BackgroundTasks,
    url: str = Form(...),
    quality: str = Form("192"),
):
    """Convert a YouTube video to MP3."""
    logger.info(f"YouTube request: {url} | quality={quality}")

    if "instagram.com" in url.lower():
        raise HTTPException(status_code=400, detail="Instagram support is currently unavailable")

    validation_error = validate_youtube_url(url)
    if validation_error:
        raise HTTPException(status_code=400, detail=validation_error)

    if quality not in ("128", "192", "320"):
        quality = "192"

    cache_key = hashlib.md5(f"{url}_{quality}".encode()).hexdigest()
    if cache_key in url_cache:
        cached_path = url_cache[cache_key]
        if os.path.exists(cached_path):
            logger.info(f"Cache hit for {url}: {cached_path}")
            job_id = job_manager.create_job(source_type="youtube", source_name=url)
            job_manager.update_job(
                job_id, status=JobStatus.COMPLETED, progress=100, output_file=cached_path
            )
            return {"job_id": job_id, "status": "processing", "message": "Served from cache."}
        else:
            del url_cache[cache_key]

    job_id = job_manager.create_job(source_type="youtube", source_name=url)
    output_path = TEMP_DIR / f"{job_id}_output.mp3"

    background_tasks.add_task(
        _run_url_conversion, job_id, url, str(output_path), int(quality), "youtube", cache_key
    )

    return {"job_id": job_id, "status": "processing", "message": "YouTube conversion started."}


# ── Instagram Convert ────────────────────────────────────
@app.post("/convert/instagram")
@limiter.limit(RATE_LIMIT)
async def convert_instagram(
    request: Request,
    background_tasks: BackgroundTasks,
    url: str = Form(...),
    quality: str = Form("192"),
):
    """Convert an Instagram reel to MP3."""
    logger.info(f"Instagram request: {url} | quality={quality}")
    raise HTTPException(status_code=400, detail="Instagram support is currently unavailable")


async def _run_url_conversion(
    job_id: str, url: str, output_path: str, quality: int, platform: str, cache_key: str = None
):
    """Background task for URL-based conversion (YouTube/Instagram)."""
    try:
        job_manager.update_job(job_id, status=JobStatus.DOWNLOADING, progress=5)
        logger.info(f"[{job_id}] Starting {platform} download: {url}")

        success, error = await asyncio.to_thread(
            convert_from_url, url, output_path, quality, job_manager, job_id
        )

        if success:
            job_manager.update_job(
                job_id, status=JobStatus.COMPLETED, progress=100, output_file=output_path
            )
            if cache_key:
                url_cache[cache_key] = output_path
            logger.info(f"[{job_id}] {platform} conversion completed.")
        else:
            job_manager.update_job(job_id, status=JobStatus.FAILED, error=error)
            logger.error(f"[{job_id}] {platform} conversion failed: {error}")

    except Exception as e:
        job_manager.update_job(job_id, status=JobStatus.FAILED, error=str(e))
        logger.exception(f"[{job_id}] Unexpected error during {platform} conversion.")


# ── Status ────────────────────────────────────────────────
@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get the status of a conversion job."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


# ── Download ──────────────────────────────────────────────
@app.get("/download/{job_id}")
async def download_file(job_id: str):
    """Download the converted MP3 file."""
    job = job_manager.get_job_internal(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Conversion not yet complete.")

    output_file = job.get("output_file")
    if not output_file or not os.path.exists(output_file):
        raise HTTPException(status_code=404, detail="Output file not found.")

    # Build a clean filename
    source_name = job.get("source_name", "audio")
    if job.get("source_type") in ("youtube", "instagram"):
        clean_name = "audiosnap_download.mp3"
    else:
        base = Path(source_name).stem
        clean_name = f"{base}.mp3"

    return FileResponse(
        path=output_file,
        media_type="audio/mpeg",
        filename=clean_name,
        headers={"Content-Disposition": f'attachment; filename="{clean_name}"'},
    )


# ── Error Handlers ────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error.", "status_code": 500},
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
