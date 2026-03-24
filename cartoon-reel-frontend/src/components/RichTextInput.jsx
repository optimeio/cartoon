/**
 * RichTextInput.jsx
 * Three-section rich text editor:
 *   Title   — bold, highlighted, color+align+font+lang
 *   Content — main cinematic story text
 *   Conclusion — call-to-action close
 */
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

/* ── Palette ─────────────────────────────────────────── */
const COLORS = [
  { label: 'White',  value: '#FFFFFF' },
  { label: 'Gold',   value: '#FFD700' },
  { label: 'Cyan',   value: '#00E5FF' },
  { label: 'Pink',   value: '#FF6BB5' },
  { label: 'Orange', value: '#FF8C00' },
  { label: 'Lime',   value: '#AAFF00' },
  { label: 'Purple', value: '#C084FC' },
  { label: 'Red',    value: '#FF4444' },
];

/* ── Font themes ─────────────────────────────────────── */
const FONTS = [
  { id: 'modern',  label: 'Modern'  },
  { id: 'bold',    label: 'Bold'    },
  { id: 'elegant', label: 'Elegant' },
  { id: 'classic', label: 'Classic' },
];

/* ── Language options ────────────────────────────────── */
const LANGS = [
  { id: 'en', label: 'EN',   title: 'English',    hint: 'Type in English' },
  { id: 'ta', label: 'தமிழ்', title: 'Tamil',      hint: 'Type in Tamil (தமிழ்)' },
  { id: 'hi', label: 'हिंदी', title: 'Hindi',      hint: 'Type in Hindi (हिंदी)' },
];

/* ── Lang attribute mapping ──────────────────────────── */
const LANG_ATTR = { en: 'en', ta: 'ta', hi: 'hi' };

/* ── Section config ──────────────────────────────────── */
const SECTIONS_CONFIG = [
  {
    key:         'title',
    label:       'Title',
    icon:        '🎯',
    placeholder: 'Bold headline — e.g. Amazing Offer Today!',
    rows:        2,
    badge:       'BOLD · HIGHLIGHTED',
    badgeStyle:  { background: 'rgba(255,215,0,0.18)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.35)' },
    wrapStyle:   { background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.14)' },
    hint:        'Appears at the top throughout the reel — keep it short & punchy.',
  },
  {
    key:         'content',
    label:       'Content',
    icon:        '📝',
    placeholder: 'Your main message — this cycles as cinematic story segments across the reel…',
    rows:        4,
    badge:       'CINEMATIC SEGMENTS',
    badgeStyle:  { background: 'rgba(99,205,255,0.15)', color: '#63CDFF', border: '1px solid rgba(99,205,255,0.3)' },
    wrapStyle:   { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' },
    hint:        'Long text is split into bite-sized segments shown one by one.',
  },
  {
    key:         'conclusion',
    label:       'Conclusion',
    icon:        '✨',
    placeholder: 'Call to action — e.g. Visit us today for the best deals!',
    rows:        2,
    badge:       'CALL TO ACTION',
    badgeStyle:  { background: 'rgba(192,132,252,0.18)', color: '#C084FC', border: '1px solid rgba(192,132,252,0.35)' },
    wrapStyle:   { background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.14)' },
    hint:        'Appears at the end of the reel with a glowing effect.',
  },
];

/* ── Single section editor ───────────────────────────── */
function SectionEditor({ config, style, language, onTextChange, onStyleChange }) {
  const { key, label, icon, placeholder, rows, badge, badgeStyle, hint } = config;
  const lang = LANG_ATTR[language] || 'en';

  const fontFamily = style.font === 'elegant' || style.font === 'classic'
    ? 'Georgia, serif'
    : "'Outfit', sans-serif";

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.82rem', color: '#fff', letterSpacing: '0.02em' }}>
          {label}
        </span>
        <span style={{ ...badgeStyle, borderRadius: 5, padding: '0.1rem 0.45rem', fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.05em' }}>
          {badge}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        id={`section-${key}-input`}
        lang={lang}
        inputMode="text"
        rows={rows}
        className="input-glass"
        placeholder={placeholder}
        value={style.text}
        onChange={e => onTextChange(e.target.value)}
        aria-label={`${label} text`}
        spellCheck={language === 'en'}
        style={{
          marginBottom: '0.6rem',
          fontSize: '0.92rem',
          resize: 'vertical',
          fontWeight: key === 'title' || style.font === 'bold' ? 700 : 400,
          color: style.color || '#fff',
          fontStyle: style.font === 'elegant' ? 'italic' : 'normal',
          letterSpacing: style.font === 'elegant' ? '0.02em' : '0',
          fontFamily,
          lineHeight: 1.6,
        }}
      />

      {/* Controls */}
      <div
        style={{
          display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center',
          padding: '0.5rem 0.625rem',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Color swatches ── */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => onStyleChange('color', c.value)}
              style={{
                width: 18, height: 18, borderRadius: '50%',
                background: c.value,
                border: style.color === c.value ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', padding: 0, flexShrink: 0,
                boxShadow: style.color === c.value ? `0 0 8px ${c.value}99` : 'none',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
          ))}
          {/* Custom color picker */}
          <label
            title="Custom color"
            style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2px dashed rgba(255,255,255,0.35)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>+</span>
            <input
              type="color"
              value={style.color || '#FFFFFF'}
              onChange={e => onStyleChange('color', e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1, top: 0, left: 0 }}
            />
          </label>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        {/* ── Alignment ── */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[
            { id: 'left',   icon: <AlignLeft size={12} /> },
            { id: 'center', icon: <AlignCenter size={12} /> },
            { id: 'right',  icon: <AlignRight size={12} /> },
          ].map(a => (
            <button
              key={a.id}
              type="button"
              title={`Align ${a.id}`}
              onClick={() => onStyleChange('align', a.id)}
              style={{
                width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: style.align === a.id ? 'var(--accent-purple)' : 'rgba(255,255,255,0.07)',
                color: '#fff', transition: 'background 0.18s',
              }}
            >
              {a.icon}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        {/* ── Font theme ── */}
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {FONTS.map(f => (
            <button
              key={`${key}-font-${f.id}`}
              type="button"
              onClick={() => onStyleChange('font', f.id)}
              style={{
                padding: '0.2rem 0.5rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '0.62rem', fontWeight: style.font === f.id ? 800 : 500,
                background: style.font === f.id ? 'rgba(168,85,247,0.22)' : 'rgba(255,255,255,0.05)',
                color: style.font === f.id ? '#C084FC' : 'var(--text-muted)',
                border: `1px solid ${style.font === f.id ? 'rgba(168,85,247,0.4)' : 'transparent'}`,
                transition: 'all 0.18s',
                fontStyle: f.id === 'elegant' ? 'italic' : 'normal',
                fontFamily: f.id === 'elegant' || f.id === 'classic' ? 'Georgia, serif' : "'Outfit', sans-serif",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hint */}
      <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.5 }}>
        {hint}
      </p>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────── */
export default function RichTextInput({ sections, language, onSectionText, onSectionStyle, onLanguage }) {
  return (
    <div>
      {/* Language selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          🌐 Typing Language:
        </span>
        {LANGS.map(l => (
          <button
            key={l.id}
            id={`lang-btn-${l.id}`}
            title={l.hint}
            onClick={() => onLanguage(l.id)}
            style={{
              padding: '0.28rem 0.72rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 700,
              background: language === l.id
                ? 'linear-gradient(135deg,var(--accent-purple),var(--accent-indigo))'
                : 'rgba(255,255,255,0.08)',
              color: '#fff',
              boxShadow: language === l.id ? '0 2px 12px rgba(168,85,247,0.4)' : 'none',
              transition: 'all 0.2s',
              fontFamily: l.id === 'en' ? 'var(--font-body)' : 'inherit',
            }}
          >
            {l.label}
          </button>
        ))}
        {language !== 'en' && (
          <span style={{ fontSize: '0.62rem', color: '#C084FC', fontWeight: 600 }}>
            ✓ Use your device's {LANGS.find(l => l.id === language)?.title} keyboard
          </span>
        )}
      </div>

      {/* Three sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {SECTIONS_CONFIG.map(cfg => (
          <div
            key={cfg.key}
            style={{
              ...cfg.wrapStyle,
              borderRadius: 14,
              padding: '0.875rem',
              transition: 'box-shadow 0.2s',
            }}
          >
            <SectionEditor
              config={cfg}
              style={sections[cfg.key]}
              language={language}
              onTextChange={val => onSectionText(cfg.key, val)}
              onStyleChange={(prop, val) => onSectionStyle(cfg.key, prop, val)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
