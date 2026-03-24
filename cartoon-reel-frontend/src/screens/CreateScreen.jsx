/**
 * CreateScreen.jsx — Text input + Category tabs + Template selector + Music upload
 */
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Film, ChevronLeft, Zap, ZapOff, ImagePlus, Video, Crop, Trash2 } from 'lucide-react';
import { useReelStore } from '../store/useReelStore';
import { useReelGenerator } from '../hooks/useReelGenerator';
import TemplateSelector from '../components/TemplateSelector';
import MusicUpload from '../components/MusicUpload';
import MediaCropModal from '../components/MediaCropModal';
import RichTextInput from '../components/RichTextInput';
import Toast from '../components/Toast';

const container = { hidden:{}, show:{ transition:{ staggerChildren:0.07 } } };
const item = {
  hidden: { opacity:0, y:22 },
  show:   { opacity:1, y:0, transition:{ type:'spring', stiffness:300, damping:26 } },
};

/* ── Custom Media Section (image or video upload + crop) ─── */
function CustomMediaSection() {
  const { state, setCustomMedia, setCustomMediaCrop, removeCustomMedia } = useReelStore();
  const [showCrop, setShowCrop] = useState(false);
  const mediaInputRef = useRef(null);

  const hasMedia = !!state.customMedia;
  const mediaType = state.customMediaCrop?.type || null;
  const previewUrl = hasMedia ? URL.createObjectURL(state.customMedia) : null;

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) return;
    setCustomMedia(file, isVideo ? 'video' : 'image');
    // auto-open crop modal
    setShowCrop(true);
    e.target.value = '';
  };

  const cropLabel = hasMedia
    ? `${mediaType === 'video' ? '🎥' : '🖼️'} ${state.customMedia.name.slice(0, 26)}${state.customMedia.name.length > 26 ? '…' : ''}`
    : null;

  return (
    <motion.section variants={item} style={{ marginBottom:'1.5rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
        <p className="section-label" style={{ margin:0 }}>Custom Frame Media <span style={{ color:'var(--text-muted)', fontWeight:500, fontSize:'0.7rem' }}>(Optional)</span></p>
        {hasMedia && (
          <button
            id="remove-custom-media-btn"
            onClick={removeCustomMedia}
            style={{
              display:'flex', alignItems:'center', gap:'0.3rem',
              background:'rgba(255,60,60,0.12)', border:'1px solid rgba(255,60,60,0.25)',
              color:'#ff7070', borderRadius:8, padding:'0.3rem 0.6rem',
              fontSize:'0.72rem', fontWeight:700, cursor:'pointer',
            }}
          >
            <Trash2 size={12} /> Remove
          </button>
        )}
      </div>

      {!hasMedia ? (
        /* Upload prompt */
        <label
          id="custom-media-upload-label"
          htmlFor="custom-media-input"
          style={{
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:'0.6rem', height:110, borderRadius:16,
            border:'2px dashed rgba(168,85,247,0.35)',
            background:'rgba(168,85,247,0.05)',
            cursor:'pointer', transition:'all 0.22s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background='rgba(168,85,247,0.1)'; e.currentTarget.style.borderColor='rgba(168,85,247,0.6)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background='rgba(168,85,247,0.05)'; e.currentTarget.style.borderColor='rgba(168,85,247,0.35)'; }}
        >
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', color:'rgba(168,85,247,0.8)', fontSize:'0.8rem', fontWeight:600 }}>
              <ImagePlus size={20} /> Image
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.15)' }} />
            <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', color:'rgba(99,205,255,0.8)', fontSize:'0.8rem', fontWeight:600 }}>
              <Video size={20} /> Video
            </div>
          </div>
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
            Tap to upload your image or video as the reel background
          </span>
          <input
            ref={mediaInputRef}
            id="custom-media-input"
            type="file"
            accept="image/*,video/*"
            style={{ display:'none' }}
            onChange={onFileChange}
          />
        </label>
      ) : (
        /* Existing media preview card */
        <div style={{
          display:'flex', gap:'0.75rem', alignItems:'center',
          background:'rgba(255,255,255,0.04)', borderRadius:14,
          border:'1.5px solid rgba(168,85,247,0.3)', padding:'0.625rem 0.875rem',
        }}>
          {/* Thumbnail */}
          <div style={{
            width:60, height:80, borderRadius:10, overflow:'hidden',
            flexShrink:0, background:'#111', border:'1px solid rgba(255,255,255,0.1)',
          }}>
            {mediaType === 'video' ? (
              <video
                src={previewUrl}
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                muted
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={previewUrl}
                alt="custom frame"
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
              />
            )}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontWeight:700, fontSize:'0.82rem', color:'#fff', marginBottom:'0.2rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {cropLabel}
            </p>
            <p style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>
              Scale: {((state.customMediaCrop?.scale || 1) * 100).toFixed(0)}%
              &nbsp;·&nbsp;
              Pos: {Math.round(state.customMediaCrop?.x || 0)}, {Math.round(state.customMediaCrop?.y || 0)}
            </p>

            <button
              id="reposition-media-btn"
              onClick={() => setShowCrop(true)}
              style={{
                marginTop:'0.5rem', display:'inline-flex', alignItems:'center', gap:'0.35rem',
                background:'linear-gradient(135deg,var(--accent-purple),var(--accent-indigo))',
                fontSize:'0.72rem', fontWeight:700, cursor:'pointer',
              }}
            >
              <Crop size={14} /> Crop & Position
            </button>
            <button
              id="remove-media-btn"
              onClick={() => { removeCustomMedia(); setCustomMediaCrop(null); setShowCrop(false); }}
              style={{
                marginTop:'0.5rem', display:'inline-flex', alignItems:'center', gap:'0.35rem',
                background:'rgba(255,50,50,0.15)',
                border:'1px solid rgba(255,50,50,0.4)', borderRadius:8, color:'#FF6B6B', padding:'0.35rem 0.75rem',
                fontSize:'0.72rem', fontWeight:700, cursor:'pointer',
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:'0.5rem', lineHeight:1.5 }}>
        Your media plays as the reel background. Cartoon characters and text appear on top.
      </p>

      {/* Crop Modal */}
      {showCrop && state.customMedia && (
        <MediaCropModal
          file={state.customMedia}
          mediaType={mediaType}
          initialCrop={state.customMediaCrop}
          onConfirm={(crop) => { setCustomMediaCrop(crop); setShowCrop(false); }}
          onClose={() => setShowCrop(false)}
        />
      )}
    </motion.section>
  );
}

export default function CreateScreen() {
  const {
    state, setError, goHome, setCustomSprite, toggleAnimation,
    setCustomMedia, setCustomMediaCrop, removeCustomMedia,
    setSectionText, setSectionStyle, setLanguage, setCharPosition, setCharScale, setBgScale
  } = useReelStore();
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

        {/* Rich Text Input — Title / Content / Conclusion */}
        <motion.section variants={item} style={{ marginBottom:'1.25rem' }}>
          <p className="section-label">Your Content</p>
          <RichTextInput
            sections={state.sections}
            language={state.language}
            onSectionText={setSectionText}
            onSectionStyle={setSectionStyle}
            onLanguage={setLanguage}
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

        {/* Background Zoom Slider (only relevant for custom/admin templates) */}
        <motion.div variants={item} style={{ marginBottom:'1.25rem', background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'0.75rem 1rem', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
            <p style={{ fontSize:'0.75rem', fontWeight:600, color:'#fff', margin:0 }}>🖼️ Background Zoom</p>
            <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{Math.round((state.bgScale || 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.5} max={2.0} step={0.05}
            value={state.bgScale || 1}
            onChange={(e) => setBgScale(parseFloat(e.target.value))}
            style={{ width:'100%', accentColor:'var(--accent-purple)' }}
          />
          <p style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>Zoom the background template in or out to fit your reel perfectly.</p>
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
                <div key={idx} style={{ position:'relative' }}>
                  <label style={{
                    height:90, display:'flex', alignItems:'center', justifyContent:'center',
                    background:'rgba(255,255,255,0.05)', borderRadius:12,
                    border: state.customSprites[idx] ? '2px solid var(--accent-purple)' : '2px dashed rgba(255,255,255,0.2)',
                    cursor:'pointer', overflow:'hidden', position:'relative', transition:'border 0.2s',
                    width:'100%',
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
                  {state.customSprites[idx] && (
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setCustomSprite(idx, null); }}
                      title="Remove frame"
                      style={{
                        position:'absolute', top:4, right:4, zIndex:10,
                        width:20, height:20, borderRadius:'50%',
                        background:'rgba(220,30,30,0.85)', border:'none',
                        color:'#fff', fontSize:'0.6rem', fontWeight:900,
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                        lineHeight:1, boxShadow:'0 2px 6px rgba(0,0,0,0.4)',
                      }}
                    >✕</button>
                  )}
                </div>
              ))}
            </div>

            <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.5rem', lineHeight:1.5 }}>
              {state.animationEnabled
                ? '✨ Frames will animate with cinematic motion. Leave empty to animate the banner background instead.'
                : '🖼️ Static mode — uploaded frames display as a still image without motion effects.'}
            </p>

            {/* Character Position Selector */}
            <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Position the Character</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  { label: 'Bottom Left', val: { x: 0.28, y: 0.78 } },
                  { label: 'Bottom Center', val: { x: 0.5, y: 0.78 } },
                  { label: 'Bottom Right', val: { x: 0.72, y: 0.78 } },
                  { label: 'Top Left', val: { x: 0.28, y: 0.28 } },
                  { label: 'Top Right', val: { x: 0.72, y: 0.28 } },
                ].map(pos => {
                  const isActive = state.charPosition.x === pos.val.x && state.charPosition.y === pos.val.y;
                  return (
                    <button
                      key={pos.label}
                      onClick={() => setCharPosition(pos.val)}
                      style={{
                        background: isActive ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)',
                        border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem',
                        fontSize: '0.7rem', fontWeight: isActive ? 700 : 500, color: '#fff',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {pos.label}
                    </button>
                  );
                })}
              </div>

              {/* Character Height Slider (vertical size only) */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', margin: 0 }}>↕️ Character Height</p>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{Math.round((state.charScale || 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.3} max={2.5} step={0.05}
                  value={state.charScale || 1}
                  onChange={(e) => setCharScale(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
                <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Slide to make the character taller or shorter without distortion.</p>
              </div>
            </div>
          </motion.section>
        )}

        {/* ── Custom Frame Media (Image or Video) ─────────────────────── */}
        <CustomMediaSection />

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
