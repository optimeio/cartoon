/**
 * MusicUpload.jsx
 * Drag-and-drop / click-to-upload music file picker.
 * Reads audio duration and stores it in the store.
 */
import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Upload, X, CheckCircle2 } from 'lucide-react';
import { useReelStore } from '../store/useReelStore';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicUpload() {
  const { state, setMusic, removeMusic } = useReelStore();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback((file) => {
    if (!file) return;
    const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'];
    if (!allowed.some((t) => file.type.startsWith('audio')) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
      setError('Please upload an MP3, WAV, OGG, or AAC file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File must be under 20 MB.');
      return;
    }
    setError('');
    // Read duration via HTMLAudioElement
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setMusic({ file, name: file.name, duration: audio.duration });
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      setMusic({ file, name: file.name, duration: null });
      URL.revokeObjectURL(url);
    };
  }, [setMusic]);

  const onFileChange = (e) => processFile(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  return (
    <section aria-label="Music upload">
      <p className="section-label">Upload Music</p>

      <AnimatePresence mode="wait">
        {state.musicFile ? (
          /* ── Music loaded view ── */
          <motion.div
            key="loaded"
            className="glass-card"
            style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,var(--accent-purple),var(--accent-indigo))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Music size={20} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {state.musicName}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                {state.musicDuration ? formatDuration(state.musicDuration) : '—'} · Ready
              </p>
            </div>
            <CheckCircle2 size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <button
              className="btn-icon"
              onClick={removeMusic}
              aria-label="Remove music"
              style={{ width: 36, height: 36, background: 'rgba(239,68,68,0.15)' }}
            >
              <X size={16} color="#ef4444" />
            </button>
          </motion.div>
        ) : (
          /* ── Drop zone ── */
          <motion.div
            key="dropzone"
            className={`music-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="button"
            tabIndex={0}
            aria-label="Upload music file"
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(168,85,247,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Upload size={20} color="var(--accent-purple)" />
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Drop music here or <span style={{ color: 'var(--accent-purple)' }}>browse</span>
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                MP3, WAV, OGG, AAC · Max 20 MB
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a"
              onChange={onFileChange}
              style={{ display: 'none' }}
              aria-hidden="true"
              id="music-file-input"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.5rem', paddingLeft: '0.25rem' }}
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </section>
  );
}
