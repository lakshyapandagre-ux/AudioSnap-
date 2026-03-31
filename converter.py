"""
AudioSnap — Converter Module
Handles video-to-MP3 conversion using FFmpeg and yt-dlp.
"""

import os
import time
import subprocess
import shutil
import logging
import re
from typing import Tuple, Optional

logger = logging.getLogger("audiosnap.converter")


def _find_ffmpeg() -> str:
    """Locate the FFmpeg binary."""
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        return ffmpeg
    # Fallback common paths on Windows
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe",
    ]
    for p in common_paths:
        if os.path.isfile(p):
            return p
    return "ffmpeg"  # Hope it's in PATH


def _find_ytdlp() -> str:
    """Locate yt-dlp binary."""
    ytdlp = shutil.which("yt-dlp")
    if ytdlp:
        return ytdlp
    return "yt-dlp"


FFMPEG_PATH = _find_ffmpeg()
YTDLP_PATH = _find_ytdlp()


def convert_uploaded_file(
    input_path: str,
    output_path: str,
    quality: int,
    job_manager,
    job_id: str,
) -> Tuple[bool, Optional[str]]:
    """
    Convert an uploaded video file to MP3 using FFmpeg.
    Returns (success: bool, error_message: Optional[str]).
    """
    if not os.path.exists(input_path):
        return False, "Input file not found."

    try:
        job_manager.update_job(job_id, progress=20, status_text="Analyzing file...")

        # Get duration for progress tracking
        duration = _get_duration(input_path)

        job_manager.update_job(job_id, progress=30, status_text="Extracting audio...")

        # Run FFmpeg
        cmd = [
            FFMPEG_PATH,
            "-i", input_path,
            "-vn",                   # No video
            "-acodec", "libmp3lame", # MP3 codec
            "-ab", f"{quality}k",    # Bitrate
            "-ar", "44100",          # Sample rate
            "-y",                    # Overwrite
            "-progress", "pipe:1",   # Progress to stdout
            output_path,
        ]

        logger.info(f"[{job_id}] FFmpeg command: {' '.join(cmd)}")

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )

        # Track progress from FFmpeg output
        _track_ffmpeg_progress(process, duration, job_manager, job_id, base_progress=30)

        returncode = process.wait()

        if returncode != 0:
            stderr = process.stderr.read() if process.stderr else ""
            logger.error(f"[{job_id}] FFmpeg stderr: {stderr}")
            return False, f"FFmpeg conversion failed (code {returncode})."

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            return False, "Conversion produced an empty file."

        job_manager.update_job(job_id, progress=95, status_text="Finalizing...")
        return True, None

    except FileNotFoundError:
        return False, "FFmpeg not found. Please ensure FFmpeg is installed and in PATH."
    except Exception as e:
        logger.exception(f"[{job_id}] Conversion error")
        return False, str(e)


def convert_from_url(
    url: str,
    output_path: str,
    quality: int,
    job_manager,
    job_id: str,
) -> Tuple[bool, Optional[str]]:
    """
    Download video using yt-dlp, then convert to MP3 using FFmpeg explicitly.
    Returns (success: bool, error_message: Optional[str]).
    """
    downloaded_file = None
    try:
        start_time = time.time()
        job_manager.update_job(job_id, progress=10, status_text="Downloading video...")

        # 1. Download video with yt-dlp
        dl_prefix = output_path.replace("_output.mp3", "_raw")
        
        cmd = [
            YTDLP_PATH,
            "-f", "bestaudio[ext=m4a]/bestaudio/best",
            "--no-playlist",
            "--no-mtime",
            "--output", f"{dl_prefix}.%(ext)s",
            "--newline",
            "--no-warnings",
            url,
        ]

        logger.info(f"[{job_id}] yt-dlp command: {' '.join(cmd)}")

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )

        _track_ytdlp_progress(process, job_manager, job_id)

        try:
            returncode = process.wait(timeout=30)
        except subprocess.TimeoutExpired:
            process.kill()
            return False, "Download timed out (exceeded limit)."

        if returncode != 0:
            stderr = process.stderr.read() if process.stderr else ""
            logger.error(f"[{job_id}] yt-dlp stderr: {stderr}")

            if "is not a valid URL" in stderr or "Unsupported URL" in stderr:
                return False, "Invalid or unsupported URL."
            if "Private video" in stderr:
                return False, "This video is private."
            if "Video unavailable" in stderr:
                return False, "This video is unavailable."
            if "HTTP Error 429" in stderr:
                return False, "Rate limited by the platform. Please try again later."

            return False, f"Download failed (code {returncode}). The URL may be invalid or the video unavailable."

        # 2. Dynamically detect downloaded file name
        directory = os.path.dirname(output_path)
        base_prefix = os.path.basename(dl_prefix)
        
        for fname in os.listdir(directory):
            if fname.startswith(base_prefix) and not fname.endswith(".part") and not fname.endswith(".ytdl"):
                full_path = os.path.join(directory, fname)
                if os.path.getsize(full_path) > 0:
                    downloaded_file = full_path
                    break
        
        if not downloaded_file:
            logger.error(f"[{job_id}] Download completed, but output file not found with prefix {dl_prefix}")
            return False, "Download completed but output file was not found."

        dl_time = time.time() - start_time
        logger.info(f"[{job_id}] Downloaded file path: {downloaded_file}. Time: {dl_time:.2f}s")

        # 3. Direct Audio Extraction check
        ext = os.path.splitext(downloaded_file)[1].lower()
        if ext in [".m4a", ".webm", ".opus", ".mp3"]:
            logger.info(f"[{job_id}] Direct extraction: renaming {ext} to .mp3 to skip ffmpeg. Time elapsed: {dl_time:.2f}s")
            if os.path.exists(output_path):
                os.remove(output_path)
            shutil.move(downloaded_file, output_path)
            downloaded_file = None  # prevent auto-cleanup deletion
            job_manager.update_job(job_id, progress=95, status_text="Finalizing...")
            return True, None

        # 4. Convert that file to MP3 using ffmpeg (Fallback)
        job_manager.update_job(job_id, progress=50, status_text="Extracting audio...")
        
        ffmpeg_start = time.time()
        duration = _get_duration(downloaded_file)
        
        ffmpeg_cmd = [
            FFMPEG_PATH,
            "-i", downloaded_file,
            "-vn",                   # No video
            "-acodec", "libmp3lame", # MP3 codec
            "-ab", f"{quality}k",    # Bitrate
            "-ar", "44100",          # Sample rate
            "-threads", "0",         # Auto multiple CPU threads
            "-y",                    # Overwrite
            "-progress", "pipe:1",   # Progress to stdout
            output_path,
        ]

        logger.info(f"[{job_id}] FFmpeg command: {' '.join(ffmpeg_cmd)}")
        
        process_ffmpeg = subprocess.Popen(
            ffmpeg_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        
        _track_ffmpeg_progress(process_ffmpeg, duration, job_manager, job_id, base_progress=50)
        
        try:
            returncode_ffmpeg = process_ffmpeg.wait(timeout=30)
        except subprocess.TimeoutExpired:
            process_ffmpeg.kill()
            return False, "Conversion timed out (exceeded limit)."
        
        if returncode_ffmpeg != 0:
            stderr_ffmpeg = process_ffmpeg.stderr.read() if process_ffmpeg.stderr else ""
            logger.error(f"[{job_id}] FFmpeg stderr: {stderr_ffmpeg}")
            return False, f"FFmpeg conversion failed (code {returncode_ffmpeg})."
            
        ff_time = time.time() - ffmpeg_start
        logger.info(f"[{job_id}] Converted file path: {output_path}. Time: {ff_time:.2f}s. Total: {dl_time + ff_time:.2f}s")

        # 4. Ensure output file path exists before returning
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            logger.error(f"[{job_id}] Output file {output_path} does not exist or is empty.")
            return False, "Conversion produced an empty file or file not found."

        job_manager.update_job(job_id, progress=95, status_text="Finalizing...")
        return True, None

    except FileNotFoundError:
        return False, "yt-dlp or FFmpeg not found. Please ensure both are installed."
    except Exception as e:
        logger.exception(f"[{job_id}] URL conversion error")
        return False, str(e)
    finally:
        # Clean up the downloaded raw video file
        try:
            if downloaded_file and os.path.exists(downloaded_file):
                os.remove(downloaded_file)
        except OSError:
            pass


def _quality_to_ytdlp(quality: int) -> str:
    """Map bitrate to yt-dlp audio quality (0=best, 9=worst)."""
    mapping = {320: "0", 192: "2", 128: "5"}
    return mapping.get(quality, "2")


def _get_duration(file_path: str) -> float:
    """Get video duration in seconds using FFmpeg."""
    try:
        cmd = [
            FFMPEG_PATH, "-i", file_path,
            "-hide_banner", "-f", "null", "-"
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30
        )
        # Parse duration from stderr
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+)\.(\d+)", result.stderr)
        if match:
            h, m, s, ms = match.groups()
            return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 100
    except Exception:
        pass
    return 0


def _track_ffmpeg_progress(process, duration: float, job_manager, job_id: str, base_progress: int = 30):
    """Parse FFmpeg progress output and update job progress."""
    max_progress = 90
    for line in iter(process.stdout.readline, ""):
        line = line.strip()
        if line.startswith("out_time_ms="):
            try:
                time_ms = int(line.split("=")[1])
                time_s = time_ms / 1_000_000
                if duration > 0:
                    pct = min(time_s / duration, 1.0)
                    progress = int(base_progress + pct * (max_progress - base_progress))
                    job_manager.update_job(job_id, progress=progress)
            except (ValueError, ZeroDivisionError):
                pass
        elif line.startswith("progress=end"):
            job_manager.update_job(job_id, progress=max_progress)
            break


def _track_ytdlp_progress(process, job_manager, job_id: str):
    """Parse yt-dlp output for progress updates."""
    for line in iter(process.stdout.readline, ""):
        line = line.strip()
        if not line:
            continue

        # Parse download percentage
        match = re.search(r"(\d+\.?\d*)%", line)
        if match:
            try:
                pct = float(match.group(1))
                # Map download progress (0-100%) to job progress (10-70%)
                progress = int(10 + pct * 0.6)
                job_manager.update_job(job_id, progress=progress, status_text="Downloading...")
            except ValueError:
                pass

        if "[ExtractAudio]" in line:
            job_manager.update_job(job_id, progress=75, status_text="Extracting audio...")

        if "Deleting original file" in line or "has already been downloaded" in line:
            job_manager.update_job(job_id, progress=85, status_text="Finishing up...")


