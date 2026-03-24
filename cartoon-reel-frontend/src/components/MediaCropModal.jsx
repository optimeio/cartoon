/**
 * MediaCropModal.jsx
 * Full-screen modal where users can position/scale their uploaded image or video
 * inside a 9:16 canvas preview frame before saving the crop settings.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const FRAME_W = 270; // display width of the 9:16 frame in the modal
const FRAME_H = 480; // display height  (9:16 = 540×960 → half)

export default function MediaCropModal({ file, mediaType, initialCrop, onConfirm, onClose }) {
  const [crop, setCrop] = useState(
    initialCrop && initialCrop.scale > 0
      ? { x: initialCrop.x, y: initialCrop.y, scale: initialCrop.scale }
      : { x: 0, y: 0, scale: 1 }
  );

  const dragRef    = useRef(null); // { startX, startY, startCropX, startCropY }
  const frameRef   = useRef(null);
  const videoRef   = useRef(null);
  const objUrl     = useRef(null);

  // Create object URL once
  useEffect(() => {
    objUrl.current = URL.createObjectURL(file);
    return () => { if (objUrl.current) URL.revokeObjectURL(objUrl.current); };
  }, [file]);

  // Auto-play video preview
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = objUrl.current;
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  /* ─── Drag handling ─────────────────────────── */
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startCropX: crop.x, startCropY: crop.y };

    const onMove = (mv) => {
      if (!dragRef.current) return;
      const dx = mv.clientX - dragRef.current.startX;
      const dy = mv.clientY - dragRef.current.startY;
      setCrop((c) => ({ ...c, x: dragRef.current.startCropX + dx, y: dragRef.current.startCropY + dy }));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [crop.x, crop.y]);

  /* ─── Touch drag ─────────────────────────────── */
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragRef.current = { startX: t.clientX, startY: t.clientY, startCropX: crop.x, startCropY: crop.y };
    }
  }, [crop.x, crop.y]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current) {
      const t = e.touches[0];
      const dx = t.clientX - dragRef.current.startX;
      const dy = t.clientY - dragRef.current.startY;
      setCrop((c) => ({ ...c, x: dragRef.current.startCropX + dx, y: dragRef.current.startCropY + dy }));
    }
  }, []);

  /* ─── Wheel zoom ─────────────────────────────── */
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setCrop((c) => ({ ...c, scale: Math.max(0.3, Math.min(4, c.scale + delta)) }));
  }, []);

  const zoomIn  = () => setCrop((c) => ({ ...c, scale: Math.min(4, c.scale + 0.15) }));
  const zoomOut = () => setCrop((c) => ({ ...c, scale: Math.max(0.3, c.scale - 0.15) }));
  const reset   = () => setCrop({ x: 0, y: 0, scale: 1 });

  const handleConfirm = () => {
    onConfirm({ x: crop.x, y: crop.y, scale: crop.scale, type: mediaType });
  };

  // Compute rendered size of media inside frame at current scale
  // We cover-fit by default at scale=1
  const mediaDims = (() => {
    if (mediaType === 'image') return { w: FRAME_W * crop.scale, h: FRAME_H * crop.scale };
    return { w: FRAME_W * crop.scale, h: FRAME_H * crop.scale };
  })();

  return (
    <AnimatePresence>
      <motion.div
        key="crop-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(6,4,20,0.92)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1rem', padding: '1rem',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: 360 }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10,
              color: '#fff', width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: '#fff', margin: 0 }}>
              Position Your {mediaType === 'video' ? 'Video' : 'Image'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              Drag to reposition · Scroll/pinch to zoom
            </p>
          </div>
          <button
            onClick={handleConfirm}
            style={{
              background: 'linear-gradient(135deg,var(--accent-purple),var(--accent-indigo))',
              border: 'none', borderRadius: 10, color: '#fff',
              padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '0.35rem', fontWeight: 700,
              fontSize: '0.875rem', boxShadow: '0 4px 16px rgba(168,85,247,0.4)',
            }}
          >
            <Check size={15} /> Done
          </button>
        </motion.div>

        {/* Canvas Frame Preview */}
        <motion.div
          ref={frameRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: FRAME_W, height: FRAME_H,
            borderRadius: 20, overflow: 'hidden',
            position: 'relative',
            border: '2px solid rgba(168,85,247,0.6)',
            boxShadow: '0 0 40px rgba(168,85,247,0.3)',
            background: '#111',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { dragRef.current = null; }}
          role="img"
          aria-label="Media crop preview — drag to reposition"
        >
          {/* The media content positioned by crop */}
          <div
            style={{
              position: 'absolute',
              left: '50%', top: '50%',
              transform: `translate(-50%, -50%) translate(${crop.x}px, ${crop.y}px) scale(${crop.scale})`,
              width: FRAME_W,
              height: FRAME_H,
              transformOrigin: 'center center',
              pointerEvents: 'none',
            }}
          >
            {mediaType === 'video' ? (
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                playsInline
                muted
                loop
              />
            ) : (
              <img
                src={objUrl.current}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                draggable={false}
              />
            )}
          </div>

          {/* Overlay guide lines */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Rule-of-thirds grid */}
            {[1/3, 2/3].map((f) => (
              <>
                <div key={`h${f}`} style={{ position: 'absolute', top: `${f*100}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.12)' }} />
                <div key={`v${f}`} style={{ position: 'absolute', left: `${f*100}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.12)' }} />
              </>
            ))}
            {/* Center crosshair */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: '50%', border: '1.5px solid rgba(168,85,247,0.7)' }} />
          </div>
        </motion.div>

        {/* Zoom controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
        >
          <button
            onClick={zoomOut}
            title="Zoom out"
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10,
              color: '#fff', width: 44, height: 44, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ZoomOut size={18} />
          </button>

          {/* Scale indicator */}
          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '0.4rem 0.9rem', color: '#fff',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem',
            minWidth: 68, textAlign: 'center',
          }}>
            {(crop.scale * 100).toFixed(0)}%
          </div>

          <button
            onClick={zoomIn}
            title="Zoom in"
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10,
              color: '#fff', width: 44, height: 44, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ZoomIn size={18} />
          </button>

          <button
            onClick={reset}
            title="Reset position & zoom"
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10,
              color: '#fff', width: 44, height: 44, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <RotateCcw size={16} />
          </button>
        </motion.div>

        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 280 }}>
          The cartoon characters and text will appear on top of your media in the final reel.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
