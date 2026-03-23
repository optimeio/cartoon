/**
 * CreateScreen.jsx — Text input + Category tabs + Template selector + Music upload
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Film, ChevronLeft, Zap, ZapOff } from 'lucide-react';
import { useReelStore } from '../store/useReelStore';
import { useReelGenerator } from '../hooks/useReelGenerator';
import TemplateSelector from '../components/TemplateSelector';
import MusicUpload from '../components/MusicUpload';
import Toast from '../components/Toast';

const container = { hidden:{}, show:{ transition:{ staggerChildren:0.07 } } };
const item = {
  hidden: { opacity:0, y:22 },
  show:   { opacity:1, y:0, transition:{ type:'spring', stiffness:300, damping:26 } },
};

export default function CreateScreen() {
  const { state, setText, setError, goHome, setCustomSprite, toggleAnimation } = useReelStore();
  const { generate } = useReelGenerator();
  const [category, setCategory] = useState('cartoon');
  const [toastMsg, setToastMsg]   = useState('');
  const [toastVisible, setToastVis] = useState(false);

  useEffect(() => {
    if (state.error) {
      setToastMsg(state.error);
      setToastVis(true);
      const t = setTimeout(() => { setToastVis(false); setError(null); }, 3200);
      return () => clearTimeout(t);
    }
  }, [state.error, setError]);

  const activeTemplate = state.templates?.find(x => x.id === state.templateId);

  return (
    <div className="screen">
      <Toast message={toastMsg} visible={toastVisible} />

      <motion.div className="content-area" variants={container} initial="hidden" animate="show">

        {/* Header */}
        <motion.header variants={item} style={{ marginBottom:'1.5rem', paddingTop:'0.75rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button className="btn-icon" onClick={goHome} aria-label="Back to home" style={{ width:36, height:36, flexShrink:0 }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem' }}>
              <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,var(--accent-purple),var(--accent-indigo))',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Film size={14} color="#fff" />
              </div>
              <span style={{ fontFamily:'var(--font-heading)',fontWeight:900,fontSize:'1.05rem' }}>
                Cartoon<span className="gradient-text">Reel</span>
              </span>
            </div>
            <h1 style={{ fontFamily:'var(--font-heading)',fontWeight:900,fontSize:'clamp(1.3rem,5vw,1.7rem)',lineHeight:1.2,letterSpacing:'-0.025em' }}>
              Create Your <span className="gradient-text-pink">Reel</span>
            </h1>
          </div>
        </motion.header>

        {/* Your Text */}
        <motion.section variants={item} style={{ marginBottom:'1.25rem' }}>
          <p className="section-label">Your Text</p>
          <textarea
            id="reel-text-input"
            className="input-glass"
            rows={4}
            placeholder="Enter any amount of text — it will unfold as a cinematic story in your video…"
            value={state.text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Reel text"
          />
        </motion.section>

        {/* Category Tabs */}
        {state.categories?.length > 0 && (
          <motion.section variants={item} style={{ marginBottom:'1.25rem', overflowX:'auto', display:'flex', gap:'0.625rem', paddingBottom:'0.5rem' }}>
            {state.categories.map((cat) => (
              <button
                key={cat.id}
                id={`cat-${cat.id}`}
                onClick={() => setCategory(cat.id)}
                style={{
                  flexShrink: 0, padding:'0.625rem 1rem',
                  borderRadius:999, border:'none', cursor:'pointer',
                  fontFamily:'var(--font-body)', fontWeight:700, fontSize:'0.875rem',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.375rem',
                  background: category === cat.id
                    ? 'linear-gradient(135deg,var(--accent-purple),var(--accent-indigo))'
                    : 'rgba(255,255,255,0.07)',
                  color: '#fff',
                  boxShadow: category === cat.id ? '0 4px 16px rgba(168,85,247,0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                aria-pressed={category === cat.id}
              >
                <span>{cat.emoji}</span> {cat.label}
              </button>
            ))}
          </motion.section>
        )}

        {/* Template Selector filtered by category */}
        <motion.div variants={item} style={{ marginBottom:'1.25rem' }}>
          <TemplateSelector category={category} />
        </motion.div>

        {/* Custom Character Upload + Animation Toggle */}
        {activeTemplate && (
          <motion.section variants={item} style={{ marginBottom:'1.25rem' }}>

            {/* Section header row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
              <p className="section-label" style={{ margin:0 }}>Upload Character Frames (Optional)</p>
              {/* Animation Toggle */}
              <button
                onClick={toggleAnimation}
                title={state.animationEnabled ? 'Click to disable animation' : 'Click to enable animation'}
                style={{
                  display:'flex', alignItems:'center', gap:'0.4rem',
                  background: state.animationEnabled
                    ? 'linear-gradient(135deg,var(--accent-purple),var(--accent-indigo))'
                    : 'rgba(255,255,255,0.08)',
                  color:'#fff', border:'none', padding:'0.35rem 0.75rem',
                  borderRadius:999, fontSize:'0.75rem', cursor:'pointer', transition:'all 0.25s',
                  fontWeight:700,
                }}
              >
                {state.animationEnabled
                  ? <><Zap size={13}/> Animation ON</>
                  : <><ZapOff size={13}/> Animation OFF</>
                }
              </button>
            </div>

            {/* 3 frame slots */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem' }}>
              {[0, 1, 2].map(idx => (
                <label key={idx} style={{
                  height:90, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(255,255,255,0.05)', borderRadius:12,
                  border: state.customSprites[idx] ? '2px solid var(--accent-purple)' : '2px dashed rgba(255,255,255,0.2)',
                  cursor:'pointer', overflow:'hidden', position:'relative', transition:'border 0.2s'
                }}>
                  {state.customSprites[idx] ? (
                    <img
                      src={URL.createObjectURL(state.customSprites[idx])}
                      style={{ width:'100%', height:'100%', objectFit:'contain' }}
                      alt={`frame-${idx+1}`}
                    />
                  ) : (
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'1.2rem', opacity:0.4 }}>➕</div>
                      <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Frame {idx+1}</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display:'none' }}
                    onChange={e => e.target.files[0] && setCustomSprite(idx, e.target.files[0])}
                  />
                </label>
              ))}
            </div>

            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.5rem', lineHeight:1.5 }}>
              {state.animationEnabled
                ? '✨ Frames will animate with cinematic motion. Leave empty to animate the banner background instead.'
                : '🖼️ Static mode — uploaded frames display as a still image without motion effects.'}
            </p>
          </motion.section>
        )}

        {/* Music Upload */}
        <motion.div variants={item} style={{ marginBottom:'5rem' }}>
          <MusicUpload />
        </motion.div>
      </motion.div>

      {/* Floating Generate Button */}
      <motion.div
        className="floating-bar"
        initial={{ opacity:0, y:40 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay:0.4, type:'spring', stiffness:300, damping:28 }}
      >
        {state.musicFile && (
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.3rem' }}>
            🎵 <span style={{ maxWidth:90, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{state.musicName}</span>
          </span>
        )}
        <motion.button
          id="generate-reel-btn"
          className="btn-primary glow-pulse"
          onClick={generate}
          style={{ minWidth:180 }}
          whileTap={{ scale:0.96 }}
        >
          <Sparkles size={18} /> Generate Reel
        </motion.button>
      </motion.div>
    </div>
  );
}
