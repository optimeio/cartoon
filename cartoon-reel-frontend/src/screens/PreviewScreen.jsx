/**
 * PreviewScreen.jsx
 * Vertical 9:16 reel player with play/pause/replay controls + download + regenerate.
 * Uses an HTML5 <video> for the recorded output.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Download, RefreshCw, ChevronLeft, Share2, Edit2 } from 'lucide-react';
import { useReelStore } from '../store/useReelStore';
import TEMPLATES from '../data/templates';
import Toast from '../components/Toast';

export default function PreviewScreen() {
  const { state, goCreate, goHome } = useReelStore();
  const videoRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast]       = useState({ msg: '', visible: false });

  const template = state.templates?.find((t) => t.id === state.templateId) || state.templates?.[0] || {};

  /* ── Auto-play on load ── */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !state.reelUrl) return;
    vid.src = state.reelUrl;
    vid.load();
    vid.play().then(() => setPlaying(true)).catch(() => {});
  }, [state.reelUrl, state.reelVersion]);

  /* ── Progress tracking ── */
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => setProgress(vid.currentTime / (vid.duration || 1));
    const onEnded = () => { setPlaying(false); setProgress(1); };
    vid.addEventListener('timeupdate', onTime);
    vid.addEventListener('ended', onEnded);
    return () => {
      vid.removeEventListener('timeupdate', onTime);
      vid.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setPlaying(true); }
    else { vid.pause(); setPlaying(false); }
  }, []);

  const replay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.play();
    setPlaying(true);
    setProgress(0);
  }, []);

  const [downloading, setDownloading] = useState(false);

  const download = useCallback(async () => {
    if (!state.reelUrl) return;
    setDownloading(true);
    showToast('Converting to MP4… ⏳');
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const blob    = await fetch(state.reelUrl).then((r) => r.blob());
      const fd      = new FormData();
      fd.append('video', blob, 'reel.webm');
      const res = await fetch(`${API_URL}/convert-to-mp4`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const mp4Blob = await res.blob();
      const url     = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cartoon-reel-${template.id || 'reel'}-${Date.now()}.mp4`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      showToast('MP4 Downloaded! 🎉');
    } catch (err) {
      console.warn('[download] MP4 conversion failed, falling back to WebM:', err.message);
      // Fallback: direct WebM download
      const a = document.createElement('a');
      a.href = state.reelUrl;
      a.download = `cartoon-reel-${template.id || 'reel'}-${Date.now()}.webm`;
      a.click();
      showToast('Downloaded as WebM (MP4 conversion unavailable)');
    } finally {
      setDownloading(false);
    }
  }, [state.reelUrl, template.id]);

  const share = useCallback(async () => {
    if (!state.reelUrl) return;
    if (navigator.share) {
      try {
        const blob = await fetch(state.reelUrl).then((r) => r.blob());
        const file = new File([blob], 'cartoon-reel.webm', { type: blob.type });
        await navigator.share({ files: [file], title: 'My Cartoon Reel', text: state.text });
        return;
      } catch { /* fallthrough */ }
    }
    // Fallback: copy link
    showToast('Use the Download button to save your reel 📥');
  }, [state.reelUrl, state.text]);

  function showToast(msg) {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3000);
  }

  /* ── Seek bar click ── */
  const onSeekClick = (e) => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    vid.currentTime = ratio * vid.duration;
    setProgress(ratio);
  };

  return (
    <div className="screen">
      <Toast message={toast.msg} visible={toast.visible} />

      {/* Header */}
      <motion.div
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '1rem 1.25rem',
          background: 'rgba(15,10,30,0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(10px)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <button
          className="btn-icon"
          onClick={goHome}
          aria-label="Back to create"
          style={{ width: 36, height: 36 }}
          id="back-to-create-btn"
        >
          <ChevronLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
            Your Reel is Ready! 🎬
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {template.emoji} {template.name} · 30s vertical
          </p>
        </div>
        <button
          className="btn-icon"
          onClick={share}
          aria-label="Share reel"
          id="share-reel-btn"
          style={{ width: 36, height: 36 }}
        >
          <Share2 size={16} />
        </button>
      </motion.div>

      {/* Player area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 1rem 7rem', gap: '1rem', overflowY: 'auto' }}>
        {/* Reel player */}
        <motion.div
          className="reel-player-wrap"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.1 }}
          onClick={togglePlay}
          style={{ cursor: 'pointer' }}
          aria-label="Click to play/pause"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && togglePlay()}
        >
          <video
            ref={videoRef}
            className="reel-canvas"
            playsInline
            loop={false}
            muted={!state.musicFile}
            aria-label="Generated cartoon reel"
            style={{ objectFit: 'cover' }}
          />

          {/* Play overlay */}
          {!playing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.35)',
              }}
            >
              <div style={{
                width: 70, height: 70, borderRadius: '50%',
                background: 'rgba(168,85,247,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 0 40px rgba(168,85,247,0.6)',
              }}>
                <Play size={28} color="#fff" style={{ marginLeft: 3 }} />
              </div>
            </motion.div>
          )}

          {/* Seek bar */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 4, background: 'rgba(255,255,255,0.15)', cursor: 'pointer',
            }}
            onClick={(e) => { e.stopPropagation(); onSeekClick(e); }}
            role="slider"
            aria-label="Seek"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg,var(--accent-purple),var(--accent-cyan))',
                boxShadow: '0 0 8px var(--accent-purple)',
                borderRadius: 999,
              }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </motion.div>

        {/* Controls row */}
        <motion.div
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button id="play-pause-btn" className="btn-icon" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} style={{ width: 52, height: 52 }}>
            {playing ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button id="replay-btn" className="btn-icon" onClick={replay} aria-label="Replay reel">
            <RotateCcw size={20} />
          </button>
        </motion.div>

        {/* Text preview badge */}
        {(state.sections?.title?.text || state.sections?.content?.text || state.sections?.conclusion?.text || state.text) && (
          <motion.div
            className="glass-card"
            style={{ padding: '0.75rem 1rem', maxWidth: 340, width: '100%', textAlign: 'center' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Subtitle layout</p>
            {state.sections?.title?.text && <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{state.sections.title.text}</p>}
            {state.sections?.content?.text && <p style={{ fontSize: '0.8rem', lineHeight: 1.4, margin: '0.2rem 0' }}>{state.sections.content.text.slice(0, 40)}...</p>}
            {state.sections?.conclusion?.text && <p style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>{state.sections.conclusion.text}</p>}
            {!state.sections && <p style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.4 }}>"{state.text}"</p>}
          </motion.div>
        )}
      </div>

      {/* Floating action bar */}
      <motion.div
        className="floating-bar"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 28 }}
      >
        <button
          id="regenerate-btn"
          className="btn-secondary"
          onClick={goCreate}
          aria-label="Edit reel details"
          style={{ gap: '0.4rem' }}
        >
          <Edit2 size={15} />
          Edit Reel
        </button>
        <button
          id="download-reel-btn"
          className="btn-primary"
          onClick={download}
          aria-label="Download reel as MP4"
          disabled={downloading}
          style={{ minWidth: 140, opacity: downloading ? 0.75 : 1 }}
        >
          {downloading
            ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Converting…</>
            : <><Download size={16} /> Download MP4</>
          }
        </button>
      </motion.div>
    </div>
  );
}
