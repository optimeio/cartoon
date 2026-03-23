/**
 * LoadingScreen.jsx
 * AI simulation loader — renders animated step messages while generation runs.
 * Kicks off generate() exactly once via a module-level flag (avoids React
 * StrictMode double-invocation that would start two renders).
 */
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReelStore } from '../store/useReelStore';
import { useReelGenerator, LOADING_STEPS } from '../hooks/useReelGenerator';

const STEP_ICONS = ['🧠', '🎨', '🎬', '✨'];

export default function LoadingScreen() {
  const { state } = useReelStore();
  const { generate } = useReelGenerator();

  // Use a ref so the flag survives StrictMode's double-mount but resets
  // correctly when the component truly unmounts and remounts for a new reel.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    generate();
    // generate is stable; we intentionally run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = ((state.loadingStep + 1) / LOADING_STEPS.length) * 100;

  return (
    <div
      className="screen"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <motion.div
        className="content-area"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2rem',
          textAlign: 'center',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Spinning ring + step icon */}
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <div
            className="loader-ring"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={state.loadingStep}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}
              initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              {STEP_ICONS[state.loadingStep] ?? '✨'}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Step message */}
        <div style={{ minHeight: 64 }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={state.loadingStep}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
                color: 'var(--text-primary)',
              }}
            >
              {LOADING_STEPS[state.loadingStep]}
            </motion.p>
          </AnimatePresence>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Step {state.loadingStep + 1} of {LOADING_STEPS.length}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ width: '80%', maxWidth: 300 }}>
          <div className="progress-bar-track">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
            />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.625rem' }}>
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {LOADING_STEPS.map((_, i) => (
            <motion.div
              key={i}
              style={{
                height: 8,
                borderRadius: 999,
                background:
                  i <= state.loadingStep
                    ? 'linear-gradient(90deg,var(--accent-purple),var(--accent-indigo))'
                    : 'rgba(255,255,255,0.15)',
              }}
              animate={{ width: i === state.loadingStep ? 24 : 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            />
          ))}
        </div>

        <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', maxWidth: 260, lineHeight: 1.5 }}>
          Assembling your 30‑second cartoon reel… this takes about 30 seconds ✨
        </p>
      </motion.div>
    </div>
  );
}
