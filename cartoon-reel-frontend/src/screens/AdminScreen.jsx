/**
 * AdminScreen.jsx — Standalone Admin Dashboard (accessed via /admin URL)
 * Completely separate from the customer-facing app.
 * Auth: shreenithya111@gmail.com / 4739Nith
 */
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, UploadCloud, LogOut, Edit3, Check, X, RefreshCw } from 'lucide-react';

/* ── Styles injected directly (no shared CSS) ──────────── */
const ADMIN_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; }
  .admin-root { min-height: 100vh; display: flex; flex-direction: column; }
  .admin-topbar {
    background: #111118; border-bottom: 1px solid #1e1e2e;
    padding: 0 2rem; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
  }
  .admin-logo { font-size: 1.1rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 0.6rem; }
  .admin-logo span { color: #7c3aed; }
  .admin-badge { background: #7c3aed22; color: #a78bfa; border: 1px solid #7c3aed44; border-radius: 4px; padding: 2px 8px; font-size: 0.72rem; font-weight: 700; }
  .admin-body { display: flex; flex: 1; }
  .admin-sidebar {
    width: 220px; background: #0e0e18; border-right: 1px solid #1e1e2e;
    padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.4rem;
    min-height: calc(100vh - 60px);
  }
  .sidebar-label { font-size: 0.65rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.5rem 0.6rem; }
  .sidebar-item {
    padding: 0.6rem 0.8rem; border-radius: 8px; cursor: pointer; font-size: 0.875rem;
    transition: all 0.15s; display: flex; align-items: center; gap: 0.6rem; color: #9ca3af;
    border: none; background: transparent; width: 100%; text-align: left;
  }
  .sidebar-item:hover { background: #1e1e2e; color: #e2e8f0; }
  .sidebar-item.active { background: #7c3aed22; color: #a78bfa; font-weight: 600; }
  .admin-content { flex: 1; padding: 2rem; overflow-y: auto; }
  .admin-section-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 0.4rem; color: #f1f5f9; }
  .admin-section-sub { font-size: 0.85rem; color: #6b7280; margin-bottom: 1.5rem; }
  .admin-card {
    background: #111118; border: 1px solid #1e1e2e; border-radius: 12px;
    padding: 1.25rem; margin-bottom: 1rem;
  }
  .admin-grid-2 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .admin-input {
    background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 8px;
    color: #e2e8f0; padding: 0.6rem 0.9rem; font-size: 0.875rem; width: 100%;
    outline: none; transition: border 0.15s;
  }
  .admin-input:focus { border-color: #7c3aed; }
  .admin-select {
    background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 8px;
    color: #e2e8f0; padding: 0.6rem 0.9rem; font-size: 0.875rem; width: 100%;
    outline: none;
  }
  .btn-primary { background: #7c3aed; color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.2rem; font-size: 0.875rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: background 0.15s; }
  .btn-primary:hover { background: #6d28d9; }
  .btn-danger { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.9rem; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; }
  .btn-ghost { background: #1e1e2e; border: 1px solid #2d2d3e; color: #e2e8f0; border-radius: 8px; padding: 0.5rem 0.9rem; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; transition: background 0.15s; }
  .btn-ghost:hover { background: #2d2d3e; }
  .field-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-bottom: 0.4rem; display: block; }
  .field-group { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
  .upload-zone {
    border: 2px dashed #2d2d3e; border-radius: 10px; padding: 1.5rem;
    text-align: center; cursor: pointer; transition: border 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: #6b7280;
  }
  .upload-zone:hover { border-color: #7c3aed; color: #a78bfa; }
  .bg-preview { width: 100%; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #1e1e2e; }
  .tpl-row {
    background: #0e0e18; border: 1px solid #1e1e2e; border-radius: 10px;
    padding: 1rem; display: grid; grid-template-columns: 130px 1fr auto; gap: 1rem; align-items: center;
    margin-bottom: 0.75rem;
  }
  .toast-bar {
    position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
    background: #111118; border: 1px solid #1e1e2e; color: #e2e8f0;
    padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.875rem; z-index: 9999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a0f; }
  .login-box { background: #111118; border: 1px solid #1e1e2e; border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 400px; }
  .login-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.4rem; }
  .login-sub { color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem; }
  .divider { border-color: #1e1e2e; margin: 1rem 0; }
  .stat-chip { background: #1e1e2e; border-radius: 6px; padding: 0.3rem 0.7rem; font-size: 0.75rem; color: #a78bfa; font-weight: 700; margin-left: auto; }
`;

const API = import.meta.env.VITE_API_URL || '/api';

export default function AdminScreen() {
  const [auth, setAuth]   = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [tab, setTab]     = useState('categories');
  const [toast, setToast] = useState('');
  const [cats, setCats]   = useState([]);
  const [tpls, setTpls]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null); // id of template being edited

  // Inject admin styles
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = ADMIN_STYLES;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // Load DB when authenticated
  useEffect(() => {
    if (!auth) return;
    fetch(`${API}/db`)
      .then(r => r.json())
      .then(d => { setCats(d.categories || []); setTpls(d.templates || []); })
      .catch(() => showToast('❌ Failed to load data'));
  }, [auth]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const login = (e) => {
    e.preventDefault();
    if (email.trim() === 'shreenithya111@gmail.com' && pass === '4739Nith') {
      setAuth(true);
    } else {
      showToast('❌ Invalid credentials');
    }
  };

  const saveAll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: cats, templates: tpls }),
      });
      if (!res.ok) throw new Error();
      showToast('✅ Published! Customers will see your changes now.');
    } catch {
      showToast('❌ Failed to save. Check server connection.');
    }
    setLoading(false);
  };

  const uploadBg = async (file, tplIdx) => {
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch(`${API}/upload-image`, { method: 'POST', body: fd });
      const d   = await res.json();
      if (d.url) {
        setTpls(prev => { const n = [...prev]; n[tplIdx] = { ...n[tplIdx], bg: d.url }; return n; });
        showToast('✅ Background uploaded!');
      }
    } catch { showToast('❌ Upload failed'); }
  };

  // Category helpers
  const addCat = () => setCats(p => [...p, { id: `cat_${Date.now()}`, label: 'New Category', emoji: '✨' }]);
  const updCat = (i, f, v) => setCats(p => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; });
  const delCat = (i) => {
    const id = cats[i].id;
    setCats(p => p.filter((_, j) => j !== i));
    setTpls(p => p.filter(t => t.categoryId !== id));
  };

  // Template helpers
  const addTpl = () => {
    const newId = `tpl_${Date.now()}`;
    setTpls(p => [...p, {
      id: newId,
      categoryId: cats[0]?.id || 'cartoon',
      name: 'New Template', emoji: '⭐', bg: '', isCustom: true,
      scenes: Array(5).fill({ type: 'generic', duration: 3 }),
    }]);
    setEditingTpl(newId); // auto-open edit panel for the new template
  };
  const updTpl = (i, f, v) => setTpls(p => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; });
  const delTpl = (i) => setTpls(p => p.filter((_, j) => j !== i));

  /* ─ Login Page ─────────────────────────────────────────── */
  if (!auth) {
    return (
      <div className="login-wrap">
        {toast && <div className="toast-bar">{toast}</div>}
        <div className="login-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎬</div>
            <div>
              <div className="login-title">Admin Portal</div>
              <div className="login-sub">CartoonReel Management</div>
            </div>
          </div>
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <input type="email" className="admin-input" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="field-group">
              <label className="field-label">Password</label>
              <input type="password" className="admin-input" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.75rem' }}>
              Sign in to Dashboard
            </button>
          </form>
          <p style={{ fontSize: '0.75rem', color: '#4b5563', textAlign: 'center' }}>
            This portal is restricted to authorized administrators only.
          </p>
          <button onClick={() => window.location.assign('#/')} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            ← Back to Customer App
          </button>
        </div>
      </div>
    );
  }

  /* ─ Dashboard ──────────────────────────────────────────── */
  return (
    <div className="admin-root">
      {toast && <div className="toast-bar">{toast}</div>}

      {/* Top Bar */}
      <div className="admin-topbar">
        <div className="admin-logo">
          🎬 <span>Cartoon</span>Reel <span className="admin-badge">Admin</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={saveAll} className="btn-primary" disabled={loading}>
            {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            {loading ? 'Saving…' : 'Publish Changes'}
          </button>
          <button onClick={() => { setAuth(false); window.location.assign('#/'); }} className="btn-ghost">
            <LogOut size={14} /> Exit
          </button>
        </div>
      </div>

      <div className="admin-body">
        {/* Sidebar */}
        <div className="admin-sidebar">
          <span className="sidebar-label">Content</span>
          <button className={`sidebar-item ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>
            🗂️ Categories <span className="stat-chip">{cats.length}</span>
          </button>
          <button className={`sidebar-item ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>
            🎨 Templates <span className="stat-chip">{tpls.length}</span>
          </button>
          <span className="sidebar-label" style={{ marginTop: '1rem' }}>Info</span>
          <button className={`sidebar-item ${tab === 'preview' ? 'active' : ''}`} onClick={() => window.open('/', '_blank')}>
            👁️ View Live Site ↗
          </button>
        </div>

        {/* Main Content */}
        <div className="admin-content">

          {/* ── CATEGORIES TAB ─────────────────────────────── */}
          {tab === 'categories' && (
            <div>
              <div className="admin-section-title">Categories</div>
              <div className="admin-section-sub">Manage content categories visible to customers on the creation page.</div>

              <div style={{ marginBottom: '1rem' }}>
                <button className="btn-primary" onClick={addCat}><Plus size={16} /> Add Category</button>
              </div>

              {cats.length === 0 && (
                <div className="admin-card" style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>
                  No categories yet. Click "Add Category" to start.
                </div>
              )}

              <div className="admin-grid-2">
                {cats.map((cat, i) => (
                  <div key={i} className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa' }}>Category #{i + 1}</span>
                      <button className="btn-danger" onClick={() => delCat(i)} style={{ padding: '4px 8px', borderRadius: 6 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Emoji</label>
                      <input className="admin-input" value={cat.emoji} onChange={e => updCat(i, 'emoji', e.target.value)} placeholder="e.g. 🎬" style={{ width: 80 }} />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Display Name</label>
                      <input className="admin-input" value={cat.label} onChange={e => updCat(i, 'label', e.target.value)} placeholder="e.g. Cartoon" />
                    </div>
                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <label className="field-label">ID (used internally)</label>
                      <input className="admin-input" value={cat.id} onChange={e => updCat(i, 'id', e.target.value)} placeholder="e.g. cartoon" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TEMPLATES TAB ──────────────────────────────── */}
          {tab === 'templates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div className="admin-section-title">Templates</div>
                  <div className="admin-section-sub">Click ✏️ Edit on any template to modify it. Add new templates with the button.</div>
                </div>
                <button className="btn-primary" onClick={addTpl}><Plus size={16} /> Add Template</button>
              </div>

              {/* Group by category */}
              {cats.map(cat => {
                const catTpls = tpls.filter(t => t.categoryId === cat.id);
                return (
                  <div key={cat.id} style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', borderBottom: '1px solid #1e1e2e', paddingBottom: '0.6rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{cat.emoji}</span>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{cat.label}</span>
                      <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>({catTpls.length} templates)</span>
                    </div>
                    {catTpls.length === 0 && (
                      <div style={{ color: '#4b5563', fontSize: '0.85rem', padding: '0.75rem 1rem', background: '#0e0e18', borderRadius: 8 }}>
                        No templates in this category yet.
                      </div>
                    )}
                    {catTpls.map((tpl) => {
                      const globalIdx = tpls.indexOf(tpl);
                      const isEditing = editingTpl === tpl.id;
                      return (
                        <div key={tpl.id} style={{ background: '#0e0e18', border: `1px solid ${isEditing ? '#7c3aed' : '#1e1e2e'}`, borderRadius: 10, marginBottom: '0.6rem', overflow: 'hidden', transition: 'border 0.2s' }}>

                          {/* Collapsed Row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem' }}>
                            {tpl.bg
                              ? <img src={tpl.bg} style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid #1e1e2e' }} alt="" />
                              : <div style={{ width: 56, height: 40, background: '#1e1e2e', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{tpl.emoji}</div>
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{tpl.emoji} {tpl.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {tpl.bg ? tpl.bg : 'No background set'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                              <button
                                className="btn-ghost"
                                onClick={() => setEditingTpl(isEditing ? null : tpl.id)}
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              >
                                {isEditing ? <><Check size={13} /> Done</> : <><Edit3 size={13} /> Edit</>}
                              </button>
                              <button className="btn-danger" onClick={() => { delTpl(globalIdx); if (isEditing) setEditingTpl(null); }} style={{ padding: '0.4rem 0.6rem' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Edit Panel */}
                          {isEditing && (
                            <div style={{ borderTop: '1px solid #1e1e2e', padding: '1rem', background: '#111118' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '1rem', alignItems: 'start' }}>

                                {/* BG Upload */}
                                <div>
                                  <label className="field-label">Background Image</label>
                                  {tpl.bg ? (
                                    <div style={{ position: 'relative' }}>
                                      <img src={tpl.bg} className="bg-preview" alt="bg" />
                                      <button onClick={() => updTpl(globalIdx, 'bg', '')} style={{ position: 'absolute', top: 4, right: 4, background: '#dc2626', border: 'none', borderRadius: 4, padding: 3, cursor: 'pointer', display: 'flex' }}>
                                        <X size={12} color="#fff" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="upload-zone" style={{ height: 90, fontSize: '0.75rem', borderRadius: 8 }}>
                                      <UploadCloud size={18} />
                                      <span>Upload</span>
                                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadBg(e.target.files[0], globalIdx)} />
                                    </label>
                                  )}
                                  <input className="admin-input" value={tpl.bg || ''} onChange={e => updTpl(globalIdx, 'bg', e.target.value)} placeholder="Or paste URL…" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }} />
                                </div>

                                {/* Fields */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                  <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label className="field-label">Template Name</label>
                                    <input className="admin-input" value={tpl.name} onChange={e => updTpl(globalIdx, 'name', e.target.value)} />
                                  </div>
                                  <div className="field-group" style={{ marginBottom: 0 }}>
                                    <label className="field-label">Emoji</label>
                                    <input className="admin-input" value={tpl.emoji} onChange={e => updTpl(globalIdx, 'emoji', e.target.value)} />
                                  </div>
                                  <div className="field-group" style={{ marginBottom: 0, gridColumn: '1/-1' }}>
                                    <label className="field-label">Category</label>
                                    <select className="admin-select" value={tpl.categoryId} onChange={e => updTpl(globalIdx, 'categoryId', e.target.value)}>
                                      {cats.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '0.5rem' }}>
                                <button className="btn-ghost" onClick={() => setEditingTpl(null)} style={{ fontSize: '0.8rem' }}>
                                  Cancel
                                </button>
                                <button className="btn-primary" onClick={() => { saveAll(); setEditingTpl(null); }} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                                  <Save size={14} /> Save &amp; Publish
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Uncategorized */}
              {(() => {
                const uncatTpls = tpls.filter(t => !cats.find(c => c.id === t.categoryId));
                if (uncatTpls.length === 0) return null;
                return (
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: '0.5rem' }}>⚠️ Uncategorized ({uncatTpls.length})</div>
                    {uncatTpls.map(tpl => {
                      const gi = tpls.indexOf(tpl);
                      return (
                        <div key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0e0e18', border: '1px solid #991b1b', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1 }}><span style={{ color: '#e2e8f0' }}>{tpl.emoji} {tpl.name}</span><br /><span style={{ color: '#4b5563', fontSize: '0.72rem' }}>category id: {tpl.categoryId}</span></div>
                          <button className="btn-danger" onClick={() => delTpl(gi)}><Trash2 size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
