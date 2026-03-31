"""
AudioSnap — Cleanup Module
Periodically removes old temporary files to prevent disk bloat.
"""

import os
import asyncio
import logging
import time
from pathlib import Path

logger = logging.getLogger("audiosnap.cleanup")


async def start_cleanup_scheduler(
    temp_dir: Path,
    interval_minutes: int = 10,
    max_age_minutes: int = 30,
):
    """
    Run a periodic cleanup task that deletes temp files older than max_age_minutes.
    This runs as an asyncio background task.
    """
    logger.info(
        f"Cleanup scheduler initialized: "
        f"interval={interval_minutes}min, max_age={max_age_minutes}min"
    )

    while True:
        await asyncio.sleep(interval_minutes * 60)

        try:
            cleaned = cleanup_temp_files(temp_dir, max_age_minutes)
            if cleaned > 0:
                logger.info(f"Cleanup: removed {cleaned} old file(s) from {temp_dir}")
            else:
                logger.debug("Cleanup: no old files to remove.")
        except Exception:
            logger.exception("Error during cleanup cycle")


def cleanup_temp_files(temp_dir: Path, max_age_minutes: int = 30) -> int:
    """
    Delete files in temp_dir older than max_age_minutes.
    Returns the number of files removed.
    """
    if not temp_dir.exists():
        return 0

    now = time.time()
    max_age_seconds = max_age_minutes * 60
    removed = 0

    for entry in temp_dir.iterdir():
        if entry.name == ".gitkeep":
            continue

        if entry.is_file():
            try:
                file_age = now - entry.stat().st_mtime
                if file_age > max_age_seconds:
                    entry.unlink()
                    removed += 1
                    logger.debug(f"Removed old temp file: {entry.name}")
            except OSError as e:
                logger.warning(f"Failed to remove {entry.name}: {e}")

    return removed
