/**
 * TemplateSelector.jsx — Filtered grid of template cards with live canvas previews
 */
import { useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReelStore } from '../store/useReelStore';
import { drawFrame } from '../engine/canvasEngine';

const TemplatePreview = memo(function TemplatePreview({ template, customSprites, animationEnabled }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const startRef  = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let running = true;
    function tick(ts) {
      if (!running) return;
      if (!startRef.current) startRef.current = ts;
      const now = ((ts - startRef.current) / 1000) % 30;
      drawFrame(canvas, now, template, '', customSprites, animationEnabled);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [template]);

  return (
    <canvas
      ref={canvasRef} width={180} height={240}
      style={{ width:'100%', height:'100%', display:'block', borderRadius:'inherit' }}
      aria-label={`${template.name} preview`}
    />
  );
});

export default function TemplateSelector({ category }) {
  const { state, setTemplate } = useReelStore();
  const safeTemp = state.templates || [];
  const filtered = safeTemp.filter((t) => t.category === category || t.categoryId === category);

  // Auto-select first template of newly selected category if current selection
  // doesn't belong to the new category
  useEffect(() => {
    const current = safeTemp.find((t) => t.id === state.templateId);
    if (!current || (current.category !== category && current.categoryId !== category)) {
      const first = filtered[0];
      if (first) setTemplate(first.id);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section aria-label="Template selector">
      <p className="section-label">Choose Template</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity:0, y:10 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-10 }}
          transition={{ duration:0.2 }}
          style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.75rem' }}
        >
          {filtered.map((tpl, i) => {
            const active = state.templateId === tpl.id;
            return (
              <motion.button
                key={tpl.id}
                id={`template-${tpl.id}`}
                className={`template-card ${active ? 'active' : ''}`}
                onClick={() => setTemplate(tpl.id)}
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.06, type:'spring', stiffness:300, damping:24 }}
                aria-pressed={active}
                aria-label={`Select ${tpl.name} template`}
              >
                <div className="inner">
                  <TemplatePreview template={tpl} customSprites={state.customSprites} animationEnabled={state.animationEnabled} />
                  {/* Label overlay */}
                  <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'0.625rem',background:'linear-gradient(transparent,rgba(0,0,0,0.78))',backdropFilter:'blur(2px)' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'0.35rem',marginBottom:'0.2rem' }}>
                      <span style={{ fontSize:'0.95rem' }}>{tpl.emoji}</span>
                      <span style={{ fontFamily:'var(--font-heading)',fontWeight:700,fontSize:'0.82rem',color:'#fff' }}>{tpl.name}</span>
                    </div>
                    <span className={`badge ${tpl.badgeClass}`} style={{ fontSize:'0.58rem' }}>{tpl.badge}</span>
                  </div>
                  {/* Check mark */}
                  {active && (
                    <motion.div
                      style={{ position:'absolute',top:'0.5rem',right:'0.5rem',width:22,height:22,borderRadius:'50%',background:'var(--accent-purple)',display:'flex',alignItems:'center',justifyContent:'center' }}
                      initial={{ scale:0 }} animate={{ scale:1 }}
                      transition={{ type:'spring', stiffness:500, damping:25 }}
                    >
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                        <path d="M1 4l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
