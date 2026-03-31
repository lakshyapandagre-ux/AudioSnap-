/**
 * AudioSnap — API Service
 * All backend communication in one place.
 */

const API_BASE = 'http://127.0.0.1:8000';

/* ── Types ─────────────────────────────────── */

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface ConvertResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'downloading' | 'extracting' | 'converting' | 'completed' | 'failed';
  progress: number;
  status_text: string;
  source_type: string;
  source_name: string;
  has_output: boolean;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Health Check ──────────────────────────── */

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data: HealthResponse = await res.json();
    if (data.status === 'healthy') {
      console.log(`%c[AudioSnap] Backend online — v${data.version}`, 'color:#4ade80');
      return true;
    }
    return false;
  } catch {
    console.warn('[AudioSnap] Backend unreachable');
    return false;
  }
}

/* ── Convert File (Upload) ─────────────────── */

export async function convertFile(file: File, quality: string): Promise<ConvertResponse> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('quality', quality);

  const res = await fetch(`${API_BASE}/convert/upload`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `Upload failed (${res.status})`);
  }

  return res.json();
}

/* ── Convert YouTube ───────────────────────── */

export async function convertYouTube(url: string, quality: string): Promise<ConvertResponse> {
  const fd = new FormData();
  fd.append('url', url);
  fd.append('quality', quality);

  const res = await fetch(`${API_BASE}/convert/youtube`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `YouTube request failed (${res.status})`);
  }

  return res.json();
}

/* ── Convert Instagram ─────────────────────── */

export async function convertInstagram(url: string, quality: string): Promise<ConvertResponse> {
  const fd = new FormData();
  fd.append('url', url);
  fd.append('quality', quality);

  const res = await fetch(`${API_BASE}/convert/instagram`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `Instagram request failed (${res.status})`);
  }

  return res.json();
}

/* ── Poll Status ───────────────────────────── */

export async function pollStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${API_BASE}/status/${jobId}`, {
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Status check failed (${res.status})`);
  }

  return res.json();
}

/* ── Download URL Builder ──────────────────── */

export function getDownloadUrl(jobId: string): string {
  return `${API_BASE}/download/${jobId}`;
}

/* ── Trigger Browser Download ──────────────── */

export function triggerDownload(jobId: string): void {
  const a = document.createElement('a');
  a.href = getDownloadUrl(jobId);
  a.download = 'audiosnap_download.mp3';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 200);
}
