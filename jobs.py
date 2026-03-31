"""
AudioSnap — Job Manager
In-memory job tracking with status, progress, and metadata.
"""

import uuid
import threading
from datetime import datetime
from typing import Optional, Dict, Any


class JobStatus:
    """Job status constants."""
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    EXTRACTING = "extracting"
    CONVERTING = "converting"
    COMPLETED = "completed"
    FAILED = "failed"


class JobManager:
    """Thread-safe in-memory job manager."""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_job(self, source_type: str = "upload", source_name: str = "") -> str:
        """Create a new job and return its ID."""
        job_id = uuid.uuid4().hex[:16]
        with self._lock:
            self._jobs[job_id] = {
                "job_id": job_id,
                "status": JobStatus.QUEUED,
                "progress": 0,
                "status_text": "Queued...",
                "source_type": source_type,
                "source_name": source_name,
                "output_file": None,
                "error": None,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
        return job_id

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job info by ID. Returns None if not found."""
        with self._lock:
            job = self._jobs.get(job_id)
            if job:
                # Return a copy without the output_file path (security)
                safe_copy = dict(job)
                if safe_copy.get("output_file"):
                    safe_copy["has_output"] = True
                else:
                    safe_copy["has_output"] = False
                # Don't expose internal file path
                safe_copy.pop("output_file", None)
                return safe_copy
            return None

    def get_job_internal(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get full job info including output_file path (internal use)."""
        with self._lock:
            return self._jobs.get(job_id)

    def update_job(
        self,
        job_id: str,
        status: Optional[str] = None,
        progress: Optional[int] = None,
        status_text: Optional[str] = None,
        output_file: Optional[str] = None,
        error: Optional[str] = None,
    ):
        """Update job fields."""
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return

            if status is not None:
                job["status"] = status
            if progress is not None:
                job["progress"] = min(max(progress, 0), 100)
            if status_text is not None:
                job["status_text"] = status_text
            if output_file is not None:
                job["output_file"] = output_file
            if error is not None:
                job["error"] = error
                job["status_text"] = f"Error: {error}"

            job["updated_at"] = datetime.utcnow().isoformat()

    def remove_job(self, job_id: str):
        """Remove a job from tracking."""
        with self._lock:
            self._jobs.pop(job_id, None)

    def get_all_jobs(self) -> Dict[str, Dict[str, Any]]:
        """Get all jobs (internal use for cleanup)."""
        with self._lock:
            return dict(self._jobs)
