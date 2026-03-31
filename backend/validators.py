"""
AudioSnap — Validators
Input validation for file uploads and URLs.
"""

import re
from typing import Optional

# Allowed video MIME types
ALLOWED_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
    "video/mpeg",
    "video/ogg",
    "video/3gpp",
    "video/x-flv",
    "video/x-ms-wmv",
    "application/octet-stream",  # Some browsers send this for video files
}

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    ".mp4", ".mov", ".avi", ".webm", ".mkv", ".mpeg",
    ".mpg", ".ogg", ".3gp", ".flv", ".wmv", ".m4v",
}


def validate_video_file(filename: Optional[str], content_type: Optional[str]) -> Optional[str]:
    """
    Validate an uploaded video file.
    Returns an error message string if invalid, or None if valid.
    """
    if not filename:
        return "No filename provided."

    # Check extension
    ext = _get_extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        return f"Unsupported file format '{ext}'. Accepted: MP4, MOV, AVI, WEBM, MKV."

    # Check MIME type (if available)
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        # Be lenient — some browsers miscategorize video files
        if not content_type.startswith("video/"):
            return f"Invalid file type '{content_type}'. Please upload a video file."

    return None


def validate_youtube_url(url: str) -> Optional[str]:
    """
    Validate a YouTube URL.
    Returns an error message string if invalid, or None if valid.
    """
    if not url or not url.strip():
        return "Please provide a YouTube URL."

    url = url.strip()

    # Check basic URL format
    if not _is_valid_url(url):
        return "Invalid URL format."

    # YouTube URL patterns
    youtube_patterns = [
        r"(?:https?://)?(?:www\.)?youtube\.com/watch\?v=[\w-]{11}",
        r"(?:https?://)?youtu\.be/[\w-]{11}",
        r"(?:https?://)?(?:www\.)?youtube\.com/embed/[\w-]{11}",
        r"(?:https?://)?(?:www\.)?youtube\.com/shorts/[\w-]{11}",
        r"(?:https?://)?(?:m\.)?youtube\.com/watch\?v=[\w-]{11}",
        r"(?:https?://)?(?:www\.)?youtube\.com/v/[\w-]{11}",
    ]

    for pattern in youtube_patterns:
        if re.search(pattern, url):
            return None

    return "Invalid YouTube URL. Please paste a valid YouTube video link."


def validate_instagram_url(url: str) -> Optional[str]:
    """
    Validate an Instagram URL (reels, posts, tv).
    Returns an error message string if invalid, or None if valid.
    """
    if not url or not url.strip():
        return "Please provide an Instagram URL."

    url = url.strip()

    if not _is_valid_url(url):
        return "Invalid URL format."

    instagram_patterns = [
        r"(?:https?://)?(?:www\.)?instagram\.com/reel/[\w-]+",
        r"(?:https?://)?(?:www\.)?instagram\.com/reels/[\w-]+",
        r"(?:https?://)?(?:www\.)?instagram\.com/p/[\w-]+",
        r"(?:https?://)?(?:www\.)?instagram\.com/tv/[\w-]+",
    ]

    for pattern in instagram_patterns:
        if re.search(pattern, url):
            return None

    return "Invalid Instagram URL. Please paste a valid Instagram reel or post link."


def _get_extension(filename: str) -> str:
    """Extract and normalize file extension."""
    if "." in filename:
        return "." + filename.rsplit(".", 1)[-1].lower()
    return ""


def _is_valid_url(url: str) -> bool:
    """Basic URL format validation."""
    url_pattern = re.compile(
        r"^https?://"
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
        r"localhost|"
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
        r"(?::\d+)?"
        r"(?:/?|[/?]\S+)$",
        re.IGNORECASE,
    )
    return bool(url_pattern.match(url))
