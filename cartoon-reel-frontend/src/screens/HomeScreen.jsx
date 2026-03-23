/**
 * HomeScreen.jsx — Landing page with hero, features, and CTA
 */
import { motion } from 'framer-motion';
import { Sparkles, Film, Music2, Download, ChevronRight, Star } from 'lucide-react';
import { useReelStore } from '../store/useReelStore';

const FEATURES = [
  { icon: '🎭', title: 'Cartoon Templates', desc: 'Shinchan, Chota Bheem, Ben 10, Jackie Chan — choose your vibe' },
  { icon: '🌿', title: 'Nature Themes',     desc: 'Grass, Forest, Turmeric, Chilli, Sambar — beautiful Indian scenes' },
  { icon: '🎵', title: 'Add Your Music',    desc: 'Upload any MP3/WAV and sync it perfectly with your reel' },
  { icon: '⬇️', title: 'One-click Download', desc: 'Export a crisp 9:16 vertical video ready for any platform' },
];

const REVIEWS = [
  { name: 'Priya S.', text: 'Made a Chota Bheem reel for my son\'s birthday — he loved it! 🎉', stars: 5 },
  { name: 'Karthik M.', text: 'The Jackie Chan fighting animation is so smooth. Amazing product!', stars: 5 },
  { name: 'Deepa R.', text: 'Sambar & turmeric nature themes are so uniquely Indian. Love it!', stars: 5 },
];

const fadeUp = { hidden: { opacity:0, y:30 }, show: { opacity:1, y:0, transition:{ type:'spring', stiffness:280, damping:24 } } };
const stagger = { hidden:{}, show:{ transition:{ staggerChildren:0.09 } } };

export default function HomeScreen() {
  const { goCreate } = useReelStore();

  return (
    <div className="screen" style={{ overflowY:'auto' }}>
      <div style={{ maxWidth:520, margin:'0 auto', width:'100%', padding:'0 1.25rem 6rem' }}>

        {/* ── Navbar ── */}
        <motion.nav
          initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 0' }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <div style={{ width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,var(--accent-purple),var(--accent-indigo))',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Film size={16} color="#fff" />
            </div>
            <span style={{ fontFamily:'var(--font-heading)',fontWeight:900,fontSize:'1.15rem' }}>
              Cartoon<span className="gradient-text">Reel</span>
            </span>
          </div>
          <span className="badge badge-purple">MVP v1.0</span>
        </motion.nav>

        {/* ── Hero ── */}
        <motion.section
          variants={stagger} initial="hidden" animate="show"
          style={{ textAlign:'center', paddingTop:'2rem', paddingBottom:'2.5rem' }}
        >
          <motion.div variants={fadeUp} style={{ marginBottom:'1rem' }}>
            <span className="badge badge-cyan" style={{ fontSize:'0.72rem' }}>
              <Sparkles size={10} /> AI-Powered Animation
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} style={{
            fontFamily:'var(--font-heading)',fontWeight:900,
            fontSize:'clamp(2rem,8vw,2.8rem)',lineHeight:1.15,letterSpacing:'-0.03em',
            marginBottom:'1rem',
          }}>
            Create Stunning<br />
            <span className="gradient-text">Cartoon Reels</span><br />
            in Seconds ✨
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize:'1rem',color:'var(--text-muted)',lineHeight:1.65,marginBottom:'2rem',maxWidth:380,margin:'0 auto 2rem' }}>
            Pick Shinchan, Chota Bheem, Ben 10, or Jackie Chan. Add text, upload music, and download a 30-second 9:16 vertical cartoon reel instantly.
          </motion.p>

          <motion.button
            variants={fadeUp}
            id="home-cta-btn"
            className="btn-primary glow-pulse"
            onClick={goCreate}
            style={{ fontSize:'1.05rem', minWidth:220, minHeight:56 }}
            whileTap={{ scale:0.96 }}
          >
            <Sparkles size={20} />
            Create Your Reel Free
            <ChevronRight size={18} />
          </motion.button>

          <motion.p variants={fadeUp} style={{ fontSize:'0.72rem',color:'var(--text-muted)',marginTop:'0.875rem' }}>
            No sign-up needed · Works on mobile
          </motion.p>
        </motion.section>

        {/* ── Preview cards ── */}
        <motion.section
          variants={stagger} initial="hidden" animate="show"
          style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.75rem', marginBottom:'2.5rem' }}
        >
          {[
            { emoji:'😄', name:'Shinchan',    label:'Happy Roaming', col:'#FF6B35' },
            { emoji:'💪', name:'Chota Bheem', label:'Friendship',    col:'#FFC107' },
            { emoji:'⚡', name:'Ben 10',       label:'Alien Power',   col:'#00D4FF' },
            { emoji:'🥋', name:'Jackie Chan',  label:'Fighting',      col:'#FF6F00' },
          ].map((c,i) => (
            <motion.div
              key={c.name} variants={fadeUp}
              className="glass-card"
              style={{ padding:'1.25rem 1rem', textAlign:'center', cursor:'pointer', position:'relative', overflow:'hidden' }}
              onClick={goCreate}
              whileHover={{ scale:1.03 }}
              whileTap={{ scale:0.97 }}
            >
              <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{c.emoji}</div>
              <p style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.2rem' }}>{c.name}</p>
              <p style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{c.label}</p>
              <div style={{ position:'absolute',top:0,left:0,width:'100%',height:3,background:`linear-gradient(90deg,${c.col},transparent)` }} />
            </motion.div>
          ))}
        </motion.section>

        {/* ── Features ── */}
        <motion.section
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once:true, amount:0.2 }}
          style={{ marginBottom:'2.5rem' }}
        >
          <motion.h2 variants={fadeUp} style={{ fontFamily:'var(--font-heading)',fontWeight:800,fontSize:'1.5rem',textAlign:'center',marginBottom:'1.25rem' }}>
            Everything You Need 🎬
          </motion.h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="glass-card"
                style={{ display:'flex',alignItems:'flex-start',gap:'1rem',padding:'1rem 1.125rem' }}
              >
                <span style={{ fontSize:'1.5rem', flexShrink:0 }}>{f.icon}</span>
                <div>
                  <p style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.2rem' }}>{f.title}</p>
                  <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.5 }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Nature preview ── */}
        <motion.section
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once:true, amount:0.2 }}
          style={{ marginBottom:'2.5rem' }}
        >
          <motion.h2 variants={fadeUp} style={{ fontFamily:'var(--font-heading)',fontWeight:800,fontSize:'1.4rem',textAlign:'center',marginBottom:'1.25rem' }}>
            Indian Nature Themes 🌿
          </motion.h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.625rem' }}>
            {[
              ['🌾','Grass'],['🌲','Forest'],['🟡','Turmeric'],
              ['🌶️','Chilli'],['🍲','Sambar'],['✨','More Soon'],
            ].map(([e,n]) => (
              <motion.div key={n} variants={fadeUp} className="glass-card"
                style={{ padding:'0.875rem 0.5rem',textAlign:'center',cursor:'pointer' }}
                onClick={goCreate} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              >
                <div style={{ fontSize:'1.75rem', marginBottom:'0.3rem' }}>{e}</div>
                <p style={{ fontSize:'0.7rem', fontWeight:600 }}>{n}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Reviews ── */}
        <motion.section
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once:true, amount:0.2 }}
          style={{ marginBottom:'2.5rem' }}
        >
          <motion.h2 variants={fadeUp} style={{ fontFamily:'var(--font-heading)',fontWeight:800,fontSize:'1.4rem',textAlign:'center',marginBottom:'1.25rem' }}>
            Loved by Creators ❤️
          </motion.h2>
          {REVIEWS.map((r) => (
            <motion.div key={r.name} variants={fadeUp} className="glass-card"
              style={{ padding:'1rem 1.125rem', marginBottom:'0.625rem' }}
            >
              <div style={{ display:'flex',gap:'0.25rem',marginBottom:'0.4rem' }}>
                {Array.from({ length:r.stars }).map((_,i) => <Star key={i} size={13} fill="#FFD700" color="#FFD700" />)}
              </div>
              <p style={{ fontSize:'0.85rem', lineHeight:1.5, marginBottom:'0.4rem' }}>"{r.text}"</p>
              <p style={{ fontSize:'0.72rem', color:'var(--accent-purple)', fontWeight:700 }}>— {r.name}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', padding:'1.5rem', background:'rgba(168,85,247,0.08)', borderRadius:'1.25rem', border:'1px solid rgba(168,85,247,0.2)' }}
        >
          <p style={{ fontFamily:'var(--font-heading)',fontWeight:800,fontSize:'1.3rem',marginBottom:'0.75rem' }}>
            Ready to go viral? 🚀
          </p>
          <button id="home-bottom-cta" className="btn-primary" onClick={goCreate} style={{ minWidth:200 }}>
            <Sparkles size={16} /> Make My Reel Now
          </button>
        </motion.div>
      </div>
    </div>
  );
}
