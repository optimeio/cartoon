/**
 * useReelGenerator.js
 * Drives the full reel generation pipeline completely in-browser:
 * 1. Shows AI loader with animated step messages
 * 2. Fast-renders all 720 frames (30s × 24fps) onto an off-screen canvas
 *    using a setInterval loop (NOT requestAnimationFrame) so it doesn't
 *    depend on the tab being visible or the frame rate matching real time.
 * 3. Captures output via MediaRecorder into a WebM blob
 * 4. Optionally mixes uploaded music via Web Audio API
 * 5. Calls finishReel() with the resulting blob URL
 */
import { useCallback, useRef } from 'react';
import { useReelStore } from '../store/useReelStore';
import { drawFrame, preloadTemplateBg } from '../engine/canvasEngine';

export const LOADING_STEPS = [
  'Understanding your idea...',
  'Preparing scenes...',
  'Rendering animation...',
  'Finalizing reel...',
];

const TOTAL_DURATION_S = 15;
const FPS              = 24;
const CANVAS_W         = 540;
const CANVAS_H         = 960;
const TOTAL_FRAMES     = TOTAL_DURATION_S * FPS; // 720

export function useReelGenerator() {
  const store    = useReelStore();
  const abortRef = useRef(false);

  const generate = useCallback(async () => {
    const { state, startLoading, setLoadingStep, finishReel, setError } = store;
    const { text, templateId, musicFile, customSprites, animationEnabled, customMedia, customMediaCrop, sections, language, charPosition } = state;

    // ── Validate input ────────────────────────────────────
    const hasContent = sections
      ? ((sections.title?.text || '').trim() || (sections.content?.text || '').trim() || (sections.conclusion?.text || '').trim())
      : (text && text.trim());
    if (!hasContent) {
      setError('Please enter some text in at least one section!');
      return;
    }

    abortRef.current = false;
    startLoading();

    const template = state.templates?.find((t) => t.id === templateId) || state.templates?.[0];

    try {
      // ── Step 0 – Understanding idea ───────────────────
      setLoadingStep(0);
      if (abortRef.current) return;

      // ── Step 1 – Preparing scenes & Assets ────────────
      setLoadingStep(1);
      if (abortRef.current) return;
      await preloadTemplateBg(template);
      if (abortRef.current) return;

      // ── Step 2 – Rendering animation ──────────────────
      setLoadingStep(2);

      // Create off-screen canvas (9:16 vertical)
      const canvas    = document.createElement('canvas');
      canvas.width    = CANVAS_W;
      canvas.height   = CANVAS_H;

      // Detect the best supported MIME type
      const mimeType = getSupportedMime();

      const API_URL = import.meta.env.VITE_API_URL || '/api';

      // ── Optional audio setup ─────────────────────────
      let audioCtx        = null;
      let audioSourceNode = null;
      let audioDest       = null;
      let uploadedMusicId = null;

      if (musicFile) {
        try {
          // Keeping at step 2 or 1 so percentage calculation doesn't break into NaN%
          const fdMusic = new FormData();
          fdMusic.append('music', musicFile);
          const resM = await fetch(`${API_URL}/upload-music`, { method: 'POST', body: fdMusic });
          if (!resM.ok) throw new Error(`Music upload failed: ${resM.statusText}`);
          const { musicFileId } = await resM.json();
          uploadedMusicId = musicFileId;

          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const arrayBuf   = await musicFile.arrayBuffer();
          const audioBuf   = await audioCtx.decodeAudioData(arrayBuf);
          audioDest        = audioCtx.createMediaStreamDestination();
          audioSourceNode  = audioCtx.createBufferSource();
          audioSourceNode.buffer = audioBuf;
          // Loop if music is shorter than reel
          audioSourceNode.loop   = audioBuf.duration < 15;
          audioSourceNode.connect(audioDest);
        } catch (audioErr) {
          console.warn('[reel] Audio setup skipped:', audioErr.message);
          if (audioCtx) { audioCtx.close(); audioCtx = null; }
        }
      }

      // ── Build MediaRecorder stream ────────────────────
      const canvasStream = canvas.captureStream(FPS);

      let recorderStream = canvasStream;
      if (audioCtx && audioDest) {
        recorderStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDest.stream.getAudioTracks(),
        ]);
      }

      const recorder = new MediaRecorder(recorderStream, {
        mimeType,
        videoBitsPerSecond: 4_000_000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      // ── Render loop ───────────────────────────────────
      // We use setInterval instead of rAF so rendering speed is not tied
      // to the tab's visibility or display refresh rate.
      // 720 frames at ~2ms per frame = ~1.5 seconds of CPU time.
      await new Promise((resolve, reject) => {
        if (abortRef.current) { reject(new Error('Aborted')); return; }

        recorder.onstop  = resolve;
        recorder.onerror = (e) => reject(e.error || new Error('MediaRecorder error'));
        recorder.start(250); // emit data every 250ms

        if (audioSourceNode) audioSourceNode.start(0);

        let frame = 0;

        const intervalId = setInterval(() => {
          if (abortRef.current) {
            clearInterval(intervalId);
            try { recorder.stop(); } catch (_) {}
            reject(new Error('Aborted'));
            return;
          }

          // Render one frame per tick
          if (frame < TOTAL_FRAMES) {
            const nowSec = frame / FPS;
            drawFrame(canvas, nowSec, template, text, customSprites, animationEnabled, customMedia, customMediaCrop, sections, language, charPosition);
            frame++;
          } else {
            // All frames rendered — stop recording
            clearInterval(intervalId);
            setTimeout(() => {
              try { recorder.stop(); } catch (_) {}
            }, 400); // small tail to flush final audio
          }
        }, 1000 / FPS); // ~41.67ms per frame interval
      });

      if (abortRef.current) return;

      // ── Step 3 – Finalizing ───────────────────────────
      setLoadingStep(3);
      if (abortRef.current) return;

      // Build blob URL
      if (chunks.length === 0) {
        throw new Error('No video data was captured — MediaRecorder produced 0 chunks.');
      }

      const blob = new Blob(chunks, { type: mimeType });
      const url  = URL.createObjectURL(blob);

      if (audioCtx) audioCtx.close();

      finishReel(url);

    } catch (err) {
      if (abortRef.current) return;
      console.error('[reel] Generation error:', err);
      setError(`Generation failed: ${err.message}. Please try again.`);
    }
  // store is stable (from context), safe to depend on reference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { generate, abort, LOADING_STEPS };
}

/* ── Helpers ──────────────────────────────────────────────── */

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getSupportedMime() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=h264',
    'video/mp4',
  ];
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch (_) { /* ignore */ }
  }
  return 'video/webm';
}
