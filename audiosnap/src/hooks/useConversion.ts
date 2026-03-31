/**
 * AudioSnap — useConversion Hook
 * Manages the full conversion lifecycle: submit → poll → complete/fail.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  checkHealth,
  convertFile,
  convertYouTube,
  convertInstagram,
  pollStatus as fetchStatus,
  triggerDownload,
  type JobStatus,
} from '../services/api';

export type ConversionPhase =
  | 'idle'
  | 'uploading'
  | 'downloading'
  | 'extracting'
  | 'converting'
  | 'finalizing'
  | 'completed'
  | 'failed';

export interface ConversionState {
  phase: ConversionPhase;
  progress: number;
  statusText: string;
  error: string | null;
  jobId: string | null;
  backendOnline: boolean;
}

const POLL_INTERVAL = 1500;
const MAX_POLL_FAILURES = 8;

export function useConversion() {
  const [state, setState] = useState<ConversionState>({
    phase: 'idle',
    progress: 0,
    statusText: '',
    error: null,
    jobId: null,
    backendOnline: false,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);

  /* ── Stop polling ────────────────────────── */
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    failCountRef.current = 0;
  }, []);

  /* ── Health check on mount ───────────────── */
  useEffect(() => {
    checkHealth().then((online) =>
      setState((s) => ({ ...s, backendOnline: online })),
    );
  }, []);

  /* ── Cleanup on unmount ──────────────────── */
  useEffect(() => () => stopPolling(), [stopPolling]);

  /* ── Start polling a job ─────────────────── */
  const startPolling = useCallback(
    (jobId: string) => {
      stopPolling();

      pollRef.current = setInterval(async () => {
        try {
          const job: JobStatus = await fetchStatus(jobId);
          failCountRef.current = 0;

          const progress = job.progress || 0;
          const text = job.status_text || '';

          switch (job.status) {
            case 'queued':
            case 'downloading':
              setState((s) => ({
                ...s,
                phase: 'downloading',
                progress,
                statusText: text || 'Downloading…',
              }));
              break;

            case 'extracting':
              setState((s) => ({
                ...s,
                phase: progress > 55 ? 'converting' : 'extracting',
                progress,
                statusText: text || 'Extracting audio…',
              }));
              break;

            case 'converting':
              setState((s) => ({
                ...s,
                phase: 'converting',
                progress,
                statusText: text || 'Converting…',
              }));
              break;

            case 'completed':
              stopPolling();
              setState((s) => ({
                ...s,
                phase: 'finalizing',
                progress: 100,
                statusText: 'Finalizing…',
              }));
              // Brief finalizing moment → then completed
              setTimeout(() => {
                setState((s) => ({
                  ...s,
                  phase: 'completed',
                  statusText: 'Ready to download!',
                }));
                // Auto-download
                setTimeout(() => triggerDownload(jobId), 800);
              }, 700);
              break;

            case 'failed':
              stopPolling();
              setState((s) => ({
                ...s,
                phase: 'failed',
                progress: 0,
                statusText: '',
                error: job.error || 'Conversion failed.',
              }));
              break;
          }
        } catch (err) {
          failCountRef.current++;
          if (failCountRef.current >= MAX_POLL_FAILURES) {
            stopPolling();
            setState((s) => ({
              ...s,
              phase: 'failed',
              progress: 0,
              error: 'Lost connection to server. Please try again.',
            }));
          }
        }
      }, POLL_INTERVAL);
    },
    [stopPolling],
  );

  /* ── Submit: file upload ─────────────────── */
  const submitFile = useCallback(
    async (file: File, quality: string) => {
      setState((s) => ({
        ...s,
        phase: 'uploading',
        progress: 0,
        statusText: 'Uploading file…',
        error: null,
        jobId: null,
      }));

      try {
        const online = await checkHealth();
        if (!online) throw new Error('Backend server is offline.');
        setState((s) => ({ ...s, backendOnline: true }));

        const data = await convertFile(file, quality);
        setState((s) => ({
          ...s,
          jobId: data.job_id,
          statusText: 'Extracting audio…',
          phase: 'extracting',
        }));
        startPolling(data.job_id);
      } catch (err: any) {
        setState((s) => ({
          ...s,
          phase: 'failed',
          error: err.message || 'Upload failed.',
        }));
      }
    },
    [startPolling],
  );

  /* ── Submit: YouTube ─────────────────────── */
  const submitYouTube = useCallback(
    async (url: string, quality: string) => {
      setState((s) => ({
        ...s,
        phase: 'downloading',
        progress: 0,
        statusText: 'Connecting to YouTube…',
        error: null,
        jobId: null,
      }));

      try {
        const online = await checkHealth();
        if (!online) throw new Error('Backend server is offline.');
        setState((s) => ({ ...s, backendOnline: true }));

        const data = await convertYouTube(url, quality);
        setState((s) => ({
          ...s,
          jobId: data.job_id,
          statusText: 'Downloading from YouTube…',
        }));
        startPolling(data.job_id);
      } catch (err: any) {
        setState((s) => ({
          ...s,
          phase: 'failed',
          error: err.message || 'YouTube conversion failed.',
        }));
      }
    },
    [startPolling],
  );

  /* ── Submit: Instagram ───────────────────── */
  const submitInstagram = useCallback(
    async (url: string, quality: string) => {
      setState((s) => ({
        ...s,
        phase: 'downloading',
        progress: 0,
        statusText: 'Connecting to Instagram…',
        error: null,
        jobId: null,
      }));

      try {
        const online = await checkHealth();
        if (!online) throw new Error('Backend server is offline.');
        setState((s) => ({ ...s, backendOnline: true }));

        const data = await convertInstagram(url, quality);
        setState((s) => ({
          ...s,
          jobId: data.job_id,
          statusText: 'Downloading from Instagram…',
        }));
        startPolling(data.job_id);
      } catch (err: any) {
        setState((s) => ({
          ...s,
          phase: 'failed',
          error: err.message || 'Instagram conversion failed.',
        }));
      }
    },
    [startPolling],
  );

  /* ── Reset to idle ───────────────────────── */
  const reset = useCallback(() => {
    stopPolling();
    setState((s) => ({
      ...s,
      phase: 'idle',
      progress: 0,
      statusText: '',
      error: null,
      jobId: null,
    }));
  }, [stopPolling]);

  return {
    ...state,
    submitFile,
    submitYouTube,
    submitInstagram,
    reset,
  };
}
